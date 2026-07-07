'use server'

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { NotificationType } from '../generated/prisma/client';
import { Prisma } from "@/app/generated/prisma/client";


function C(q: number[], b: number): number {
    const m = Math.max(...q);

    return m + b * Math.log(q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0));
}

export async function executeTrade(
    marketId: number,
    outcomeId: number,
    shares: number,
    side: "buy" | "sell"
): Promise<{ success: boolean; error?: string }> {
    if (!Number.isInteger(shares) || shares <= 0 || shares > 1000) throw new Error('Invalid share amount');
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return { success: false, error: "User not authenticated" };
        }

        // transaction to ensure trade atomicity (cannot be partially executed)
        const notifContext = await prisma.$transaction(async (tx) => {
            const [user, market, position] = await Promise.all([
                tx.user.findUnique({ where: { email: session.user.email! } }),
                tx.market.findUnique({
                    where: { id: marketId },
                    include: { outcomes: {orderBy: { name: 'asc' } } } // ensure alpha order
                }),
                tx.position.findUnique({
                    where: {userId_outcomeId: { userId: 0, outcomeId }} // dummy userId to avoid type error, will be updated after we get the real user
                })
            ])

            if (!user) throw new Error(`User ${session.user.email} not found`);
            if (!market) throw new Error(`Market ${marketId} not found`);
            const isClosed = market.status === 'CLOSED' || (market.status === 'OPEN' && market.closeTime <= new Date());
            if (market.status !== 'OPEN' || isClosed) {
                throw new Error("Market is not open for trading");
            }

            const outcomeIndex = market.outcomes.findIndex(o => o.id === outcomeId);
            if (outcomeIndex === -1) throw new Error('Outcome not found in market');

            const userPosition = await tx.position.findUnique({
                where: { userId_outcomeId: { userId: user.id, outcomeId } }
            })

            const currentShares = new Prisma.Decimal(userPosition?.shares ?? 0);
            const currentAvgCost = new Prisma.Decimal(userPosition?.avgCost ?? 0);
            const currentRealizedPnl = new Prisma.Decimal(userPosition?.realizedPnl ?? 0);
            const decShares = new Prisma.Decimal(shares);

            // stop short-selling for now
            if (side === 'sell' && decShares.gt(currentShares)) {
                throw new Error('Insufficient shares to sell');
            }

            const b = market.liquidity;
            const q = market.outcomes.map(o => o.sharesOutstanding);
            const q_new = [...q];
            q_new[outcomeIndex] += side === 'buy' ? shares : -shares;
            if (q_new[outcomeIndex] < 0) {
                throw new Error('Cannot reduce shares below zero'); 
            }

            const tradeCost = side === 'buy' ? Math.max((C(q_new, b) - C(q, b)) * 100, 0.01) : (C(q, b) - C(q_new, b)) * 100;
            const decTradeCost = new Prisma.Decimal(tradeCost);
            const decTransactionFee = side === 'buy' ? Prisma.Decimal.max(decTradeCost.mul(0.03), 0.01) : new Prisma.Decimal(0);
            const decTotalCost = decTradeCost.plus(decTransactionFee);

            const decAvgPrice = decTradeCost.div(decShares);
            
            if (side === 'buy' && new Prisma.Decimal(user.money).lt(decTotalCost)) {
                throw new Error('Insufficient funds to buy shares');
            }

            let newShares: Prisma.Decimal;
            let newAvgCost: Prisma.Decimal;
            let newRealizedPnl: Prisma.Decimal;

            if (side === 'buy') {
                newShares = currentShares.plus(decShares);
                newAvgCost = currentAvgCost.mul(currentShares).plus(decTradeCost).div(newShares);
                newRealizedPnl = currentRealizedPnl; // buying does not realize PnL
            }
            else {
                newShares = currentShares.minus(decShares);
                newAvgCost = newShares.gt(0) ? currentAvgCost : new Prisma.Decimal(0); // if we sold all shares, reset avg cost to 0
                newRealizedPnl = currentRealizedPnl.plus(decTradeCost.minus(currentAvgCost.mul(decShares))); 
            }

            await Promise.all([
                tx.user.update({
                    where: { id: user.id },
                    data: {
                        money: side === 'buy' ? { decrement: decTotalCost } : { increment: decTotalCost }
                    }
                }),

                tx.outcome.update({
                    where: { id: outcomeId },
                    data: {
                        sharesOutstanding:  side === 'buy' ? { increment: shares } : { decrement: shares }
                    }
                }),

                // exchange with treasury
                tx.user.update({
                    where: { id: Number(process.env.TREASURY_ACCOUNT_ID) },
                    data: {
                        money: side === 'buy' ? { increment: decTotalCost } : { decrement: decTotalCost }
                    }
                }),

                tx.position.upsert({
                    where: { userId_outcomeId: { userId: user.id, outcomeId } },
                    create: {
                        userId: user.id,
                        marketId,
                        outcomeId,
                        shares: newShares,
                        avgCost: newAvgCost,
                        realizedPnl: newRealizedPnl
                    },
                    update: {
                        shares: newShares,
                        avgCost: newAvgCost,
                        realizedPnl: newRealizedPnl
                    }
                }),

                tx.trade.create({
                    data: {
                        userId: user.id,
                        marketId: marketId,
                        outcomeId: outcomeId,
                        shares: side === 'buy' ? decShares : decShares.negated(),
                        price: decAvgPrice,
                        cost: side === 'buy' ? decTradeCost : decTradeCost.negated()
                    }
                })
            ]);

            return {
                userId: user.id,
                firstName: user.firstName ?? 'User',
                marketTitle: market.title,
                outcomeName: market.outcomes[outcomeIndex].name,
                totalCost: decTotalCost.toNumber(),
                shares,
                side
            }
        })

        const admins = await prisma.user.findMany({ 
            where: { admin: true },
            select: { id: true } 
        });

        await prisma.notification.createMany({
            data: [
                {
                    userId: notifContext.userId,
                    type: notifContext.side === 'buy' ? NotificationType.TRADE_BUY : NotificationType.TRADE_SELL,
                    title: notifContext.side === 'buy' ? 'Shares Purchased' : 'Shares Sold',
                    body: `You ${notifContext.side === 'buy' ? 'bought' : 'sold'} ${notifContext.shares} shares of "${notifContext.outcomeName}" in market "${notifContext.marketTitle}" for a total of $${notifContext.totalCost.toFixed(2)}.`
                },
                ...admins
                    .filter(admin => admin.id !== notifContext.userId)
                    .map(admin => ({
                        userId: admin.id,
                        type: notifContext.side === 'buy' ? NotificationType.TRADE_BUY : NotificationType.TRADE_SELL,
                        title: notifContext.side === 'buy' ? 'New buy' : 'New sell', 
                        body: `${notifContext.firstName} ${notifContext.side === 'buy' ? 'purchased' : 'sold'} ${notifContext.shares} shares of "${notifContext.outcomeName}" in market "${notifContext.marketTitle}".`
                    }))
            ]
        })

        revalidatePath(`/markets/${marketId}`);
        return { success: true };
    }
    catch (err) {
        console.error("Error executing trade:", err);
        return { success: false, error: err instanceof Error? err.message : 'Trade failed: Unknown error' };
    }
}