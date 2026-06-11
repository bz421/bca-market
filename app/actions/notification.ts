'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markNotificationsRead() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return;

    await prisma.notification.updateMany({
        where: { user: { email: session.user.email }, read: false },
        data: { read: true },
    })

    revalidatePath('/settings')
    revalidatePath('/')
}