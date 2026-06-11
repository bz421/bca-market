import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { Settings, Bell, BellDot } from 'lucide-react';
import Link from 'next/link';

import styles from './settings-button.module.css';

export default async function SettingsButton() {
    const session = await getServerSession(authOptions);
    let unreadCount = 0
    if (session?.user?.email) {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        unreadCount = await prisma.notification.count({
            where: {
                user: { email: session.user.email },
                read: false,
                createdAt: { gte: fiveDaysAgo },
            },
        })
    }
    return (
        <Link
            href="/settings"
            aria-label="Notifications and settings"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm transition hover:scale-105 hover:bg-zinc-100 hover:text-zinc-950"
            >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
            </Link>
    )
}