'use client'
import Link from 'next/link';

export default function PortfolioButton() {
    return (
        <Link href='/portfolio' className='text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1'>
            Portfolio
        </Link>
    )
}