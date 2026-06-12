'use client'

import { Outcome } from "../generated/prisma/browser";
import { CircleCheckBig } from 'lucide-react';

interface OutcomeDetailsProps {
    id: number
    marketId: number
    name: string
    sharesOutstanding: number
}

const COLORS = ['#38bdf8', '#6366f1', '#eab308', '#f97316', '#a855f7', '#22c55e'];

export default function OutcomeDetails({
    outcome,
    prices,
    index,
    isSelected,
    isResolved,
    isWinner,
    onClick
}: {
    outcome: OutcomeDetailsProps,
    prices: number[],
    index: number,
    isSelected: boolean,
    isResolved: boolean,
    isWinner: boolean,
    onClick: () => void
}
) {
    const price = prices[index]

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border p-4 cursor-pointer select-none transition-all duration-150
                ${isWinner
                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                    : isResolved
                        ? 'border-zinc-200 opacity-60'
                        : isSelected
                            ? 'border-zinc-800 ring-1 ring-zinc-800 bg-zinc-50'
                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    {isWinner && <CircleCheckBig className="h-5 w-5 text-emerald-600 shrink-0" />}
                    <p className={`font-medium truncate ${isWinner ? 'text-emerald-900 font-semibold' : 'text-zinc-950'}`}>
                        {outcome.name}
                    </p>
                </div>
                <span className={`text-xl font-bold tabular-nums ${isWinner ? 'text-emerald-700' : 'text-zinc-700'}`}>
                    {(price * 100).toFixed(0)}%
                </span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${(price * 100).toFixed(2)}%`,
                        backgroundColor: isWinner ? '#10b981' : isResolved ? '#d4d4d8' : COLORS[index % COLORS.length],
                    }}
                />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
                {outcome.sharesOutstanding.toString()} shares outstanding
            </p>
        </div>
    )
}