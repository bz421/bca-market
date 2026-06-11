'use server'

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

import { NotificationType } from '../generated/prisma/client';

export type AcceptMarketInput = {
    marketId: number;
    title: string;
    description: string;
    creatorId: number;
    liquidity: number;
    outcomes: string[];
    closeTime: string;
};

export async function acceptMarket(input: AcceptMarketInput) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const title = input.title.trim();
    const description = input.description.trim();
    const outcomes = input.outcomes
        .map((outcome) => outcome.trim())
        .filter(Boolean);
    const closeTime = new Date(input.closeTime);

    if (!title || !description || !Number.isInteger(input.liquidity) || outcomes.length === 0 || Number.isNaN(closeTime.getTime())) {
        throw new Error("Invalid approval request");
    }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { id: input.creatorId },
                { admin: true }
            ]
        }
    })

    const notifContext = await prisma.$transaction(async (tx) => {
        const updatedMarket = await tx.market.update({
            where: { id: input.marketId },
            data: {
                title,
                description,
                liquidity: input.liquidity,
                closeTime,
                status: 'OPEN',
                approvedById: Number(session.user.id),
                approvedAt: new Date(),
            },
            include: { creator: true }
        });

        await tx.outcome.deleteMany({
            where: { marketId: input.marketId },
        });

        await tx.outcome.createMany({
            data: outcomes.map((name) => ({
                marketId: input.marketId,
                name,
                sharesOutstanding: 0,
            })),
        }),

        await tx.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                type: NotificationType.MARKET_APPROVED,
                title: 'Market Approved',
                body: `${user.admin ? 'The' : 'Your'} market "${title}" has been approved and is now open for trading.`
            }))
        });

        return updatedMarket;
    });

    revalidatePath(`/markets/${input.marketId}`);
    revalidatePath("/");
}