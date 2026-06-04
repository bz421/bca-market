'use server'

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export type AcceptMarketInput = {
    marketId: number;
    title: string;
    description: string;
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

    await prisma.$transaction([
        prisma.market.update({
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
        }),
        prisma.outcome.deleteMany({
            where: { marketId: input.marketId },
        }),
        prisma.outcome.createMany({
            data: outcomes.map((name) => ({
                marketId: input.marketId,
                name,
                sharesOutstanding: 0,
            })),
        }),
    ]);

    revalidatePath(`/markets/${input.marketId}`);
    revalidatePath("/");
}