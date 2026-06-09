'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function closeMarket(input: { marketId: number, winningOutcomeId: number }) : Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin || !session.user.id)  throw new Error("Unauthorized");

    const treasuryId = Number(process.env.TREASURY_ACCOUNT_ID);
    if (!treasuryId) throw new Error("Treasury user ID not configured");

    await prisma.$transaction(async (tx) => {
        const market = await tx.market.findUnique({
            where: { id: input.marketId },
            include: { outcomes: true }
        })

        if (!market) throw new Error(`Market ${input.marketId} not found`);
        if (market.status !== 'OPEN') throw new Error("Market is not open");

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
    })

    revalidatePath(`/markets/${input.marketId}`);
    revalidatePath("/");
}