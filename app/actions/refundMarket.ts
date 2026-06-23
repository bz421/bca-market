'use server'

import { prisma } from "@/lib/prisma";
import { Market, NotificationType, ResolutionType, MarketStatus } from '../generated/prisma/client';
import { inngest } from "@/lib/inngest";
import { Prisma } from "@/app/generated/prisma/client";

export async function refundMarket(market: Market) {
    const refundsByUser = await prisma.$transaction(async (tx) => {
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

        await Promise.all(Array.from(refundsByUser.entries()).map(([userId, refundAmount]) =>
            tx.user.update({
                where: { id: userId },
                data: {
                    money: { increment: refundAmount }
                }
            })
        ))

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
            refunds: Array.from(refundsByUser.entries()).map(([userId, amount]) => ({ userId, amount: amount.toNumber() }))
        }
    })

}