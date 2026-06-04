'use server'

import { prisma } from '@/lib/prisma';

export async function acceptMarket(marketId: number) {
    await prisma.market.update({
        where: { id: marketId },
        data: { status: 'OPEN' }
    })
}