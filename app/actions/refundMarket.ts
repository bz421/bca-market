'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Market, NotificationType, ResolutionType, MarketStatus } from '../generated/prisma/client';
import { inngest } from "@/lib/inngest";
import { Prisma } from "@/app/generated/prisma/client";

export async function refundMarket(market: Market, message?: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const treasuryId = Number(process.env.TREASURY_ACCOUNT_ID);
    if (!treasuryId) {
        throw new Error("Treasury user ID not configured");
    }

    const refundsByUser = await prisma.$transaction(async (tx) => {
        const dbMarket = await tx.market.findUnique({
            where: { id: market.id }
        });

        if (!dbMarket) {
            throw new Error("Market not found");
        }

        if (dbMarket.status !== 'OPEN' && dbMarket.status !== 'CLOSED') {
            throw new Error("Market must be open or closed to be refunded");
        }

        const admins = await tx.user.findMany({
            where: { admin: true }
        })

        const positions = await tx.position.findMany({
            where: {
                marketId: market.id,
                shares: { gt: 0 }
            },
            include: { outcome: true }
        })

        const refundsByUser = new Map<number, Prisma.Decimal>();

        for (const position of positions) {
            const decShares = new Prisma.Decimal(position.shares);
            const decAvgCost = new Prisma.Decimal(position.avgCost);
            const refund = decShares.mul(decAvgCost);
            refundsByUser.set(position.userId, (refundsByUser.get(position.userId) ?? new Prisma.Decimal(0)).plus(refund));
        }

        const decTotalRefund = Array.from(refundsByUser.values()).reduce(
            (sum, r) => sum.plus(r),
            new Prisma.Decimal(0)
        );

        // refund users
        await Promise.all(Array.from(refundsByUser.entries()).map(([userId, refundAmount]) =>
            tx.user.update({
                where: { id: userId },
                data: {
                    money: { increment: refundAmount }
                }
            })
        ))

        // deduct from treasury
        await tx.user.update({
            where: { id: treasuryId },
            data: {
                money: { decrement: decTotalRefund }
            }
        })

        await tx.market.update({
            where: { id: market.id },
            data: {
                status: MarketStatus.RESOLVED,
                resolvedAt: new Date(),
            }
        })

        await tx.notification.createMany({
            data: [...Array.from(refundsByUser.entries()).map(([userId, refundAmount]) => ({
                userId,
                type: NotificationType.RESOLUTION,
                resolutionType: ResolutionType.REFUND,
                title: `Market Refunded: ${market.title}`,
                body: `The market "${market.title}" has been refunded. $${refundAmount.toFixed(2)} has been returned to your account.`
            })
            ),
            ...admins.map(admin => ({
                userId: admin.id,
                type: NotificationType.RESOLUTION,
                title: `Market Refunded: ${market.title}`,
                body: `The market "${market.title}" has been refunded.`
            }))
            ]
        })

        return refundsByUser;
    })

    await inngest.send({
        name: 'market/refunded',
        data: {
            marketId: market.id,
            title: market.title,
            refunds: Array.from(refundsByUser.entries()).map(([userId, amount]) => ({ userId, amount: amount.toNumber() })),
            message: message
        }
    })

}