'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { NotificationType, ResolutionType } from '../generated/prisma/client';

export async function resolveMarket(input: { marketId: number, winningOutcomeId: number }): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin || !session.user.id) throw new Error("Unauthorized");

    const treasuryId = Number(process.env.TREASURY_ACCOUNT_ID);
    if (!treasuryId) throw new Error("Treasury user ID not configured");

    const admins = await prisma.user.findMany({
        where: { admin: true }
    });
    
    const resolveContext = await prisma.$transaction(async (tx) => {

        const market = await tx.market.findUnique({
            where: { id: input.marketId },
            include: { outcomes: true }
        })

        if (!market) throw new Error(`Market ${input.marketId} not found`);
        if (market.status !== 'OPEN' && market.status !== 'CLOSED') {
            throw new Error("Market is not open or closed");
        }

        const winningOutcome = market.outcomes.find(o => o.id === input.winningOutcomeId);
        if (!winningOutcome) throw new Error("Winning outcome not found in market");

        const allPositions = await tx.position.findMany({
            where: { marketId: input.marketId, shares: { gt: 0 } },
        })

        const winners = allPositions.filter(p => p.outcomeId === input.winningOutcomeId);
        const losers = allPositions.filter(p => p.outcomeId !== input.winningOutcomeId);

        const totalPayout = winners.reduce((sum, p) => sum + Number(p.shares) * 100, 0);

        // flatten winners and losers
        const winnerUpdates = winners.flatMap(p => {
            const payout = Number(p.shares) * 100;
            const pnlDelta = payout - Number(p.avgCost) * Number(p.shares);
            return [
                tx.user.update({
                    where: { id: p.userId },
                    data: { money: { increment: payout } }
                }),
                tx.position.update({
                    where: { id: p.id },
                    data: { shares: 0, realizedPnl: { increment: pnlDelta } }
                })
            ]
        })

        const loserUpdates = losers.flatMap(p => {
            tx.position.update({
                where: { id: p.id },
                data: { shares: 0, realizedPnl: { decrement: Number(p.avgCost) * Number(p.shares) } }
            })
        })

        await Promise.all([
            tx.market.update({
                where: { id: input.marketId },
                data: {
                    status: 'RESOLVED',
                    resolvedOutcomeId: input.winningOutcomeId,
                    resolvedById: Number(session.user.id),
                    resolvedAt: new Date(),
                }
            }),

            tx.user.update({
                where: { id: treasuryId },
                data: { money: { decrement: totalPayout } }
            }),

            ...winnerUpdates,
            ...loserUpdates
        ])

        return {
            marketTitle: market.title,
            winningOutcomeName: winningOutcome.name,
            positions: allPositions.map(p => ({
                userId: p.userId,
                shares: Number(p.shares),
                outcomeName: market.outcomes.find(o => o.id === p.outcomeId)?.name ?? "Unknown",
                isWinner: p.outcomeId === input.winningOutcomeId,
                payout: p.outcomeId === input.winningOutcomeId ? Number(p.shares) * 100 : 0,
            }))
        }
    })

    await prisma.notification.createMany({
        data: 
            admins.map(admin => ({
                userId: admin.id,
                type: NotificationType.RESOLUTION,
                title: `Market Resolved: ${resolveContext.marketTitle}`,
                body: `The market "${resolveContext.marketTitle}" has been resolved to: "${resolveContext.winningOutcomeName}".`
            }))
    })

    if (resolveContext.positions.length > 0) {
        await prisma.notification.createMany({
            data: resolveContext.positions.map(p => ({
                userId: p.userId,
                type: NotificationType.RESOLUTION,
                resolutionType: p.isWinner ? ResolutionType.WIN : ResolutionType.LOSS,
                title: `Market Resolved: ${resolveContext.marketTitle}`,
                body: p.isWinner ? `Congratulations! Your outcome "${p.outcomeName}" won. You received $${p.payout.toFixed(2)}.`
                    : `Unfortunately, your outcome "${p.outcomeName}" lost. Better luck next time!`
            }))
        })
    }

    revalidatePath(`/markets/${input.marketId}`);
    revalidatePath("/");
}
