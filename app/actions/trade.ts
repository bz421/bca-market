'use server'

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";


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
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return { success: false, error: "User not authenticated" };
        }

        // transaction to ensure trade atomicity (cannot be partially executed)
        await prisma.$transaction(async (tx) => {
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
            if (market.status !== 'OPEN') throw new Error("Market is not open for trading");

            const outcomeIndex = market.outcomes.findIndex(o => o.id === outcomeId);
            if (outcomeIndex === -1) throw new Error('Outcome not found in market');

            const userPosition = await tx.position.findUnique({
                where: { userId_outcomeId: { userId: user.id, outcomeId } }
            })

            const currentShares = Number(userPosition?.shares ?? 0);
            const currentAvgCost = Number(userPosition?.avgCost ?? 0);
            const currentRealizedPnl = Number(userPosition?.realizedPnl ?? 0);

            // stop short-selling for now
            if (side === 'sell' && shares > currentShares) {
                throw new Error('Insufficient shares to sell');
            }

            const b = market.liquidity;
            const q = market.outcomes.map(o => o.sharesOutstanding);
            const q_new = [...q];
            q_new[outcomeIndex] += side === 'buy' ? shares : -shares;

            const tradeCost = side === 'buy' ? (C(q_new, b) - C(q, b)) * 100 : (C(q, b) - C(q_new, b)) * 100;

            const avgPrice = tradeCost / shares;
            
            if (side === 'buy' && Number(user.money) < tradeCost) {
                throw new Error('Insufficient funds to buy shares');
            }

            let newShares: number;
            let newAvgCost: number;
            let newRealizedPnl: number;

            if (side === 'buy') {
                newShares = currentShares + shares;
                newAvgCost = (currentAvgCost * currentShares + tradeCost) / newShares;
                newRealizedPnl = currentRealizedPnl; // buying does not realize PnL
            }
            else {
                newShares = currentShares - shares;
                newAvgCost = currentShares > 0 ? currentAvgCost : 0; // if we sold all shares, reset avg cost to 0
                newRealizedPnl = currentRealizedPnl + (tradeCost - currentAvgCost * shares); 
            }

            await Promise.all([
                tx.user.update({
                    where: { id: user.id },
                    data: {
                        money: side === 'buy' ? { decrement: tradeCost } : { increment: tradeCost }
                    }
                }),

                tx.outcome.update({
                    where: { id: outcomeId },
                    data: {
                        sharesOutstanding:  side === 'buy' ? { increment: shares } : { decrement: shares }
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
                        shares: side === 'buy' ? shares : -shares,
                        price: avgPrice,
                        cost: side === 'buy' ? tradeCost : -tradeCost
                    }
                })
            ])
        })

        revalidatePath(`/markets/${marketId}`);
        return { success: true };
    }
    catch (err) {
        console.error("Error executing trade:", err);
        return { success: false, error: err instanceof Error? err.message : 'Trade failed: Unknown error' };
    }
}