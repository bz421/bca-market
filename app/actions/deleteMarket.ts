'use server'

import { prisma } from "@/lib/prisma";
import { Market, NotificationType } from '../generated/prisma/client';

export async function deleteMarket(market: Market) {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { id: market.creatorId },
                { admin: true }
            ]
        }
    })

    await prisma.$transaction(async (tx) => {
        await prisma.market.delete({
            where: { id: market.id }
        });

        await tx.notification.createMany({
            data:
                users.map(user => ({
                    userId: user.id,
                    type: NotificationType.MARKET_REJECTED,
                    title: 'Market Rejected',
                    body:  `${user.admin? 'The' : 'Your'} market "${market.title}" has been rejected and will not be open for trading.`
                }))
        })
    })
}