'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveMarket } from "@/app/actions/resolveMarket";
import { Outcome } from "../generated/prisma/browser"

import { X } from 'lucide-react'


export default function ResolveButton({ market }: {
    market: {
        id: number,
        title: string,
        outcomes: Outcome[]
    }
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [winningOutcomeId, setWinningOutcomeId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResolve = async () => {
        if (!winningOutcomeId) return
        setError(null);
        setIsSubmitting(true);

        try {
            await resolveMarket({ marketId: market.id, winningOutcomeId });
            setOpen(false);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occured");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleOpen = () => {
        setWinningOutcomeId(null);
        setError(null);
        setOpen(true);
    }



    return (
        <>
            <button
                type="button"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 cursor-pointer"
                onClick={handleOpen}
            >
                Resolve
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
                >
                    <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">

                        <div className="flex items-start justify-between p-6 pb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-900">Resolve Market</h2>
                                <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{market.title}</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="ml-4 shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                            >
                                <X className="h-4 w-4 cursor-pointer" />
                            </button>
                        </div>

                        <div className="px-6 pb-6 flex flex-col gap-4">

                            <div>
                                <p className="text-xs font-medium text-zinc-400 uppercase mb-2">
                                    Winning Outcome
                                </p>
                                <div className="flex flex-col gap-2">
                                    {market.outcomes.map(outcome => {
                                        const selected = winningOutcomeId === outcome.id
                                        return (
                                            <label
                                                key={outcome.id}
                                                className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 cursor-pointer transition-all select-none
                                                    ${selected
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <input
                                                        type="radio"
                                                        name="winning-outcome"
                                                        value={outcome.id}
                                                        checked={selected}
                                                        onChange={() => setWinningOutcomeId(outcome.id)}
                                                        className="accent-blue-600 shrink-0"
                                                    />
                                                    <span className="text-sm font-medium text-zinc-900 truncate">
                                                        {outcome.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-zinc-400 shrink-0 tabular-nums">
                                                    {outcome.sharesOutstanding} shares
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            {winningOutcomeId !== null && (() => {
                                const outcome = market.outcomes.find(o => o.id === winningOutcomeId)!
                                const totalPayout = outcome.sharesOutstanding * 100
                                return (
                                    <div className="bg-blue-50 border border-blue-100 divide-y divide-blue-100 text-sm overflow-hidden">
                                        <div className="flex justify-between px-3 py-2 text-blue-700">
                                            <span>Winning shares</span>
                                            <span className="tabular-nums font-medium">
                                                {outcome.sharesOutstanding}
                                            </span>
                                        </div>
                                        <div className="flex justify-between px-3 py-2.5 bg-white text-zinc-900 font-semibold">
                                            <span>Total treasury debit</span>
                                            <span className="tabular-nums">{totalPayout.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )
                            })()}

                            {error && (
                                <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-700">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setOpen(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolve}
                                    disabled={winningOutcomeId === null || isSubmitting}
                                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                    {isSubmitting ? 'Resolving…' : 'Confirm Resolution'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}