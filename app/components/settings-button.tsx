'use client'

import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function SettingsButton() {
    return (
        <Link href='/settings' className='text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1'>
            <Settings className='h-5 w-5 text-zinc-500' />
        </Link>
    )
}