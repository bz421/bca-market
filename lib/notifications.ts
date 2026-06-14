import { prisma } from '@/lib/prisma';

export async function getUnreadNotifCount(email: string) {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

    return await prisma.notification.count({
        where: {
            user: { email: email },
            read: false,
            createdAt: { gte: fiveDaysAgo },
        },
    })
}