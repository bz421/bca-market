'use client'

import { Outcome } from "../generated/prisma/browser";

interface OutcomeDetailsProps {
    id: number
    marketId: number
    name: string
    sharesOutstanding: number
}

export default function OutcomeDetails({ outcome, prices, index, isSelected, onClick }: {
    outcome: OutcomeDetailsProps,
    prices: number[],
    index: number,
    isSelected: boolean,
    onClick: () => void
}
) {
    const price = prices[index]

    return (
        <div
            onClick={onClick}
            className={`rounded-xl border p-4 cursor-pointer select-none transition-all duration-150
                ${isSelected
                    ? 'border-zinc-800 ring-1 ring-zinc-800 bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="font-medium text-zinc-950">{outcome.name}</p>
                <span className="text-xl font-bold text-zinc-700 tabular-nums">
                    {(price * 100).toFixed(0)}%
                </span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-zinc-700 transition-all duration-500"
                    style={{ width: `${(price * 100).toFixed(2)}%` }}
                />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
                {outcome.sharesOutstanding.toString()} shares outstanding
            </p>
        </div>
    )
}