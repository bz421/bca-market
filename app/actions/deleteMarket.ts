'use server'

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Market, NotificationType } from '../generated/prisma/client';

import { inngest } from '@/lib/inngest';

export async function deleteMarket(market: Market) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin || !session.user.id) {
        throw new Error("Unauthorized");
    }

    await prisma.$transaction(async (tx) => {
        const dbMarket = await tx.market.findUnique({
            where: { id: market.id }
        });

        if (!dbMarket) {
            throw new Error("Market not found");
        }

        if (dbMarket.status !== 'PENDING') {
            throw new Error("Only pending markets can be deleted");
        }

        const admins = await tx.user.findMany({
            where: {
                OR: [
                    { id: market.creatorId },
                    { admin: true }
                ]
            }
        })

        await tx.market.delete({
            where: { id: market.id }
        });

        await tx.notification.createMany({
            data:
                admins.map(user => ({
                    userId: user.id,
                    type: NotificationType.MARKET_REJECTED,
                    title: 'Market Rejected',
                    body:  `${user.admin? 'The' : 'Your'} market "${market.title}" has been rejected and will not be open for trading.`
                }))
        })
    })

    const result = await inngest.send({
        name: 'market/rejected',
        data: {
            marketId: market.id,
            title: market.title,
            creatorId: market.creatorId,
            creatorName: ''
        }
    })

    console.log(`Inngest result: ${JSON.stringify(result)}`)
}