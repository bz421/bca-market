import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "../components/sign-out-button";
import LocalDateTime from "@/app/components/local-date-time";
import { getNormalizedStatus } from "@/lib/market-status";

import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Portfolio' }

function formatStringToCurrency(value: string): string {
    const num = Number(value);
    if (Number.isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmt(n: number) {
    return formatStringToCurrency(n.toFixed(6));
}

function pnlClass(n: number) {
    return n > 0 ? "text-emerald-600" : n < 0 ? "text-rose-600" : "text-zinc-600";
}

function p(q: number[], b: number): number[] {
    const m = Math.max(...q);
    const d = q.reduce((s, q_i) => s + Math.exp((q_i - m) / b), 0);
    return q.map((q_i) => Math.exp((q_i - m) / b) / d);
}

function outcomePrice(
    market: { liquidity: number; status: string; resolvedOutcomeId: number | null; outcomes: { id: number; sharesOutstanding: number }[] },
    outcomeId: number
) {
    if (market.status === "RESOLVED") return market.resolvedOutcomeId === outcomeId ? 100 : 0;
    const outcomes = market.outcomes;
    const i = outcomes.findIndex((o) => o.id === outcomeId);
    if (i === -1) return 0;
    return p(outcomes.map((o) => o.sharesOutstanding), market.liquidity)[i] * 100;
}

export default async function PortfolioPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/auth/signin");
    const userId = Number(session.user.id);

    const [dbPositions, dbTrades, user] = await Promise.all([
        prisma.position.findMany({
            where: { userId },
            include: { market: { include: { outcomes: { orderBy: { name: "asc" } } } }, outcome: true },
            orderBy: { updatedAt: "desc" },
        }),
        prisma.trade.findMany({
            where: { userId },
            include: { market: true, outcome: true },
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const positions = dbPositions.map(pos => ({
        ...pos,
        market: {
            ...pos.market,
            status: getNormalizedStatus(pos.market.status, pos.market.closeTime)
        }
    }));

    const trades = dbTrades.map(t => ({
        ...t,
        market: {
            ...t.market,
            status: getNormalizedStatus(t.market.status, t.market.closeTime)
        }
    }));

    const enriched = positions.map((pos) => {
        const shares = Number(pos.shares);
        const avgCost = Number(pos.avgCost);
        const realizedPnl = Number(pos.realizedPnl);
        const currentPrice = outcomePrice(pos.market, pos.outcomeId);
        const currentValue = shares * currentPrice;
        const unrealizedPnl = shares > 0 ? currentValue - shares * avgCost : 0;
        return { ...pos, shares, avgCost, realizedPnl, currentPrice, currentValue, unrealizedPnl, totalPnl: realizedPnl + unrealizedPnl };
    });

    const open = enriched.filter((p) => p.market.status === "OPEN" || p.market.status === "CLOSED");
    const resolved = enriched.filter((p) => p.market.status === "RESOLVED");
    const positionsValue = open.reduce((s, p) => s + p.currentValue, 0);
    const totalPnl = enriched.reduce((s, p) => s + p.totalPnl, 0);
    const hasResolved = trades.some((t) => Number(t.shares) < 0) || resolved.some((p) => p.realizedPnl !== 0);
    const biggestWin = hasResolved ? Math.max(0, ...enriched.map((p) => p.realizedPnl)) : null;
    const balance = Number(user?.money ?? session.user.money ?? 0);

    return (
        <div className="min-h-screen bg-zinc-50">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
                <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">← Back to Home</Link>
                <header className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-semibold text-zinc-950">Your Portfolio</h1>
                            <p className="mt-2 text-zinc-600">Logged in as {session.user.email}</p>
                        </div>
                        <SignOutButton />
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Balance</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">${fmt(balance)}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Positions Value</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">${fmt(positionsValue)}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Total P/L</p>
                            <p className={`mt-1 text-2xl font-semibold tabular-nums ${pnlClass(totalPnl)}`}>{totalPnl >= 0 ? "+" : "-"}${fmt(Math.abs(totalPnl))}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Biggest Win</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{biggestWin === null ? "N/A" : `$${fmt(biggestWin)}`}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Predictions</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{trades.length}</p>
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-950">Recent Activity</h2>
                    {trades.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No activity yet.</p>
                    ) : (
                        <div className="mt-4 divide-y divide-zinc-100 max-h-[60vh] overflow-y-auto">
                            {trades.slice(0, 15).map((t) => {
                                const shares = Number(t.shares);
                                const cost = Math.abs(Number(t.cost));
                                const side = shares > 0 ? "Buy" : "Sell";
                                return (
                                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                                        <div>
                                            <p className="font-medium text-zinc-900">{t.market.title}</p>
                                            <p className="text-zinc-500">{side} {Math.abs(shares).toFixed(2)} {t.outcome.name} @ ${fmt(Number(t.price))}</p>
                                        </div>
                                        <div className="text-right text-zinc-500">
                                            <p className="tabular-nums font-medium text-zinc-900">${fmt(cost)}</p>
                                            <p><LocalDateTime date={t.createdAt} /></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-950">Active Positions</h2>
                    {open.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No open positions.</p>
                    ) : (
                        <div className="mt-4 divide-y divide-zinc-100 max-h-[50vh] overflow-y-auto">
                            {open.map((p) => (
                                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                                    <div>
                                        <Link href={`/markets/${p.marketId}`} className="font-medium text-zinc-900 hover:text-zinc-600">{p.market.title}</Link>
                                        <p className="text-zinc-500">{p.outcome.name} - {p.shares.toFixed(2)} shares</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-right tabular-nums">
                                        <div><p className="text-xs text-zinc-400">Price</p><p className="text-black">${fmt(p.currentPrice)}</p></div>
                                        <div><p className="text-xs text-zinc-400">Value</p><p className="text-black">${fmt(p.currentValue)}</p></div>
                                        <div><p className="text-xs text-zinc-400">P/L</p><p className={pnlClass(p.totalPnl)}>{p.totalPnl >= 0 ? "+" : "-"}${fmt(Math.abs(p.totalPnl))}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-950">Resolved Positions</h2>
                    {resolved.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No resolved positions.</p>
                    ) : (
                        <div className="mt-4 divide-y divide-zinc-100 max-h-[60vh] overflow-y-auto">
                            {resolved.map((p) => (
                                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                                    <div>
                                        <Link href={`/markets/${p.marketId}`} className="font-medium text-zinc-900 hover:text-zinc-600">{p.market.title}</Link>
                                        <p className="text-zinc-500">{p.outcome.name} - {p.market.status}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-right tabular-nums">
                                        <div><p className="text-xs text-zinc-400">Avg Cost</p><p className="text-black">${fmt(p.avgCost)}</p></div>
                                        <div><p className="text-xs text-zinc-400">Realized P/L</p><p className={pnlClass(p.realizedPnl)}>{p.realizedPnl >= 0 ? "+" : "-"}${fmt(Math.abs(p.realizedPnl))}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
