'use client'
import Link from 'next/link';
import { ChartLine } from 'lucide-react'

export default function PortfolioButton() {
    return (
        <Link href='/portfolio' className='text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1'>
            <ChartLine className='h-5 w-5 text-zinc-500' />
        </Link>
    )
}