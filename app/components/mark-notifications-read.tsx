'use client'

import { useEffect, useRef } from 'react';
import { markNotificationsRead } from '@/app/actions/notification';

export default function MarkNotificationRead({ hasUnread }: { hasUnread: boolean }) {
    const fired = useRef(false);

    useEffect(() => {
        if (!hasUnread || fired.current) return;
        fired.current = true;
        markNotificationsRead();
    }, [hasUnread])

    return null
}

