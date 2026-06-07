'use client'

import { useState } from 'react'
import OutcomeDetails from './outcome-details'
import TradingPanel from './trading-panel'

interface SerializedOutcome {
    id: number
    marketId: number
    name: string
    sharesOutstanding: number
}

function p(q: number[], b: number): number[] {
    const m = Math.max(...q);
    const denominator = q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0);

    return q.map(q_i => Math.exp((q_i - m) / b) / denominator);
}

interface Props {
    outcomes: SerializedOutcome[]
    liquidity: number
    marketStatus: string
}

export default function MarketClient({ outcomes, liquidity, marketStatus }: Props) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

    const q = outcomes.map((o) => o.sharesOutstanding)
    const prices = p(q, liquidity)

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
            {/* <section className="rounded-2xl bg-white p-6 shadow-sm"> */}
                {/* <h2 className="text-xl font-semibold text-zinc-950">Outcomes</h2> */}
                <div className="flex flex-col gap-4">
                    {outcomes.map((outcome, i) => (
                        <OutcomeDetails
                            key={outcome.id}
                            outcome={outcome}
                            prices={prices}
                            index={i}
                            isSelected={selectedIndex === i}
                            onClick={() => setSelectedIndex((prev) => (prev === i ? null : i))}
                        />
                    ))}
                    {outcomes.length === 0 && (
                        <p className="text-sm text-zinc-500">No outcomes yet.</p>
                    )}
                </div>
            {/* </section> */}

            <div className="md:sticky md:top-6">
                <TradingPanel
                    selectedOutcome={selectedIndex !== null ? outcomes[selectedIndex] : null}
                    selectedIndex={selectedIndex}
                    q={q}
                    b={liquidity}
                    prices={prices}
                    marketStatus={marketStatus}
                />
            </div>
        </div>
    )
}