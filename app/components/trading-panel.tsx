'use client'

import { useState, useMemo, useTransition } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { executeTrade } from '../actions/trade'

interface SerializedOutcome {
    id: number
    marketId: number
    name: string
    sharesOutstanding: number
}

interface UserPosition {
    outcomeId: number
    shares: number
}

interface Props {
    selectedOutcome: SerializedOutcome | null
    selectedIndex: number | null
    q: number[]
    b: number
    prices: number[]
    marketStatus: string
    balance: number
    userPositions: UserPosition[]
}

function C(q: number[], b: number): number {
    const m = Math.max(...q);

    return m + b * Math.log(q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0));
}


export default function TradingPanel({ selectedOutcome, selectedIndex, q, b, prices, marketStatus, balance, userPositions }: Props) {
    const [side, setSide] = useState<'buy' | 'sell'>('buy')
    const [sharesInput, setSharesInput] = useState('')

    const currentShares = selectedOutcome
        ? (userPositions.find((p) => p.outcomeId === selectedOutcome.id)?.shares ?? 0)
        : 0;
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const isOpen = marketStatus === 'OPEN'
    const shares = parseInt(sharesInput, 10)
    const validShares = Number.isInteger(shares) && shares > 0

    const preview = useMemo(() => {
        if (selectedIndex === null || !validShares) return null
        const q_new = [...q]
        q_new[selectedIndex] += side === 'buy' ? shares : -shares
        const amount =
            side === 'buy'
                ? C(q_new, b) - C(q, b)
                : C(q, b) - C(q_new, b)
        console.log(`Paying ${amount}`)
        return { amount, avgPrice: amount / shares }
    }, [selectedIndex, shares, side, q, b, validShares])

    const clearFeedback = () => { setError(null); setSuccessMsg(null) }

    const handleSideChange = (s: 'buy' | 'sell') => {
        setSide(s)
        clearFeedback()
    }

    const handleTrade = () => {
        if (!selectedOutcome || !validShares) return
        clearFeedback()

        startTransition(async () => {
            const result = await executeTrade(selectedOutcome.marketId, selectedOutcome.id, shares, side)
            if (result.success) {
                setSuccessMsg(
                    `${side === 'buy' ? 'Bought' : 'Sold'} ${shares} share${shares !== 1 ? 's' : ''} of "${selectedOutcome.name}"`
                )
                setSharesInput('')
            } else {
                setError(result.error ?? 'Trade failed')
            }
        })
    }

    const currentPrice = selectedIndex !== null ? prices[selectedIndex] : null

    return (
        <div className="bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">Trade</p>

            <div className="flex rounded-md bg-zinc-100 p-1 mb-5 gap-1">
                {(['buy', 'sell'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => handleSideChange(s)}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${side === s
                            ? s === 'buy'
                                ? 'bg-white shadow-sm text-emerald-600'
                                : 'bg-white shadow-sm text-rose-500'
                            : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                    >
                        {s === 'buy' ? 'Buy' : 'Sell'}
                    </button>
                ))}
            </div>

            <div className="mb-4">
                <p className="text-xs font-medium text-zinc-400 uppercase mb-1.5">Outcome</p>
                {selectedOutcome ? (
                    <div className="flex items-center justify-between border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                        <span className="text-sm font-semibold text-zinc-900 truncate mr-2">
                            {selectedOutcome.name}
                        </span>
                        <span className="text-sm text-zinc-500 tabular-nums shrink-0">
                            {currentPrice !== null ? `\$${(currentPrice * 100).toFixed(2)}` : '—'}
                        </span>
                    </div>
                ) : (
                    <div className="border border-dashed border-zinc-200 px-3 py-4 text-center">
                        <p className="text-sm text-zinc-400">Select an outcome on the left</p>
                    </div>
                )}
            </div>

            <div className="mb-4">
                <p className="text-xs font-medium text-zinc-400 uppercase mb-1.5">Shares</p>
                <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={sharesInput}
                    onChange={(e) => { setSharesInput(e.target.value); clearFeedback() }}
                    placeholder="Enter a whole number"
                    disabled={!selectedOutcome || !isOpen}
                    className="w-full border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
            </div>

            {preview && (
                <div className="mb-4 bg-zinc-50 border border-zinc-100 divide-y divide-zinc-100 text-sm overflow-hidden">
                    {side === 'sell' && (
                        <div className={`flex justify-between px-3 py-2 ${currentShares - shares >= 0 ? 'text-zinc-500' : 'text-rose-500'}`}>
                            <span>Shares remaining</span>
                            <span className="tabular-nums">
                                {currentShares - shares}
                            </span>
                        </div>
                    )}

                    {side === 'buy' && (
                        <>
                            <div className="flex justify-between px-3 py-2 text-zinc-500">
                                <span>Max payout</span>
                                <span className="tabular-nums text-emerald-600">${(shares * 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-3 py-2 text-zinc-500">
                                <span>1% Transaction Fee</span>
                                <span className="tabular-nums text-emerald-600">${(preview.amount * 100 * 0.01).toFixed(2)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between px-3 py-2.5 font-semibold text-zinc-900 bg-white">
                        <span>{side === 'buy' ? 'Total cost' : 'You receive'}</span>
                        <span className={`tabular-nums ${side === 'sell' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {side === 'sell' ? (`\$${(preview.amount * 100).toFixed(2)}`) : `\$${(preview.amount * 100 * 1.01).toFixed(2)}`}
                        </span>
                    </div>
                    <div className="flex justify-between px-3 py-2.5 font-semibold text-zinc-900 bg-white">
                        <span>New balance</span>
                        <span className={`tabular-nums ${side === 'sell' ? 'text-emerald-600' : ''}`}>
                            {side === 'sell' ? `\$${(balance + preview.amount * 100).toFixed(2)}` : `\$${(balance - preview.amount * 100 * 1.01).toFixed(2)}`}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-3 flex items-start gap-2 bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {successMsg && (
                <div className="mb-3 flex items-start gap-2 bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <button
                onClick={handleTrade}
                disabled={!selectedOutcome || !validShares || !isOpen || isPending}
                className={`w-full py-2.5 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                    ${side === 'buy'
                        ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
                        : 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white'
                    }`}
            >
                {isPending
                    ? 'Processing…'
                    : validShares
                        ? `${side === 'buy' ? 'Buy' : 'Sell'} ${shares} Share${shares !== 1 ? 's' : ''}`
                        : side === 'buy' ? 'Buy Shares' : 'Sell Shares'
                }
            </button>

            {!isOpen && (
                <p className="mt-3 text-xs text-zinc-400 text-center">
                    {marketStatus === 'RESOLVED' ? 'This market is resolved' : 'This market is closed'}
                </p>
            )}
        </div>
    )
}