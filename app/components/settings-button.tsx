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
        <Link href='/settings' className='text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1'>
            {unreadCount > 0 ? (
                <BellDot className={styles['red-dot-bell']} />
            ) : (
                <Bell className='h-5 w-5 text-zinc-500' />
            )}
        </Link>
    )
}