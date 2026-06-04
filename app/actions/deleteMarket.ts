'use server'

import { prisma } from "@/lib/prisma";

export async function deleteMarket(marketId: number) {
    await prisma.market.delete({
        where: { id: marketId }
    });
}