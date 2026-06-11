'use client'
import Link from 'next/link';
import { ChartLine } from 'lucide-react'

export default function PortfolioButton() {
    return (
        <Link href='/portfolio' className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm transition hover:scale-105 hover:bg-zinc-100">
            <ChartLine className='h-5 w-5 text-zinc-500' />
        </Link>
    )
}