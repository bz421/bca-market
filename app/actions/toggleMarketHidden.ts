"use server"

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function toggleMarketHidden(marketId: number, hidden: boolean) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
        throw new Error("Unauthorized");
    }

    await prisma.market.update({
        where: { id: marketId },
        data: { hidden }
    });

    revalidatePath("/");
    revalidatePath(`/markets/${marketId}`);
}