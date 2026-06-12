import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import AcceptButton from "@/app/components/accept-button";
import RejectButton from "@/app/components/reject-button";
import ResolveButton from "@/app/components/resolve-button";

import MarketClient from '@/app/components/market-client';

import { Clock } from 'lucide-react';

import { buildPriceHistory } from "@/lib/market-history";
import MarketChart from "@/app/components/market-chart";
import RefundButton from "@/app/components/refund-button";
import SideNav from "@/app/components/side-nav"
import TopNav from "@/app/components/top-nav";
import LocalDateTime from "@/app/components/local-date-time";
import { getNormalizedStatus } from "@/lib/market-status";

function formatMoney(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function statusClass(status: string) {
    switch (status) {
        case "OPEN":
            return "bg-emerald-100 text-emerald-700";
        case "PENDING":
            return "bg-amber-100 text-amber-700";
        case "CLOSED":
            return "bg-zinc-200 text-zinc-700";
        case "RESOLVED":
            return "bg-blue-100 text-blue-700";
        default:
            return "bg-zinc-100 text-zinc-700";
    }
}

function C(q: number[], b: number): number {
    const m = Math.max(...q);

    return m + b * Math.log(q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0));
}

function p(q: number[], b: number): number[] {
    const m = Math.max(...q);
    const denominator = q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0);

    return q.map(q_i => Math.exp((q_i - m) / b) / denominator);
}

function getMarketState(
    outcomes: { sharesOutstanding: number }[],
    b: number
) {
    const q = outcomes.map(outcome => outcome.sharesOutstanding);

    return {
        q: q,
        cost: C(q, b),
        prices: p(q, b)
    }
}


export default async function MarketPage({
    params,
}: {
    params: Promise<{ marketId: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin");
    }

    const marketId = await params.then((p) => Number(p.marketId));
    if (!Number.isInteger(marketId)) {
        notFound();
    }

    const market = await prisma.market.findUnique({
        where: { id: marketId },
        include: {
            outcomes: {
                orderBy: { name: "asc" },
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    if (!market) {
        notFound();
    }

    market.status = getNormalizedStatus(market.status, market.closeTime);

    const { q, cost, prices } = getMarketState(market.outcomes, market.liquidity);

    const userPositions = session?.user?.id
        ? await prisma.position.findMany({
              where: {
                  userId: Number(session.user.id),
                  marketId,
              },
              select: {
                  outcomeId: true,
                  shares: true,
              },
          })
        : [];

    const serializedPositions = userPositions.map((pos) => ({
        outcomeId: pos.outcomeId,
        shares: Number(pos.shares),
    }));

    const trades = await prisma.trade.findMany({
        where: { marketId },
        orderBy: { createdAt: "asc" },
        select: { id: true, outcomeId: true, shares: true, cost: true, price: true, createdAt: true, outcome: { select: { name: true,},}, },
    });

    const buyTrades = trades.filter((t) => Number(t.shares) > 0);
const sellTrades = trades.filter((t) => Number(t.shares) < 0);

const totalVolume = trades.reduce(
    (sum, t) => sum + Math.abs(Number(t.cost ?? 0)),
    0
);

const totalBuyShares = buyTrades.reduce(
    (sum, t) => sum + Math.abs(Number(t.shares)),
    0
);

const totalSellShares = sellTrades.reduce(
    (sum, t) => sum + Math.abs(Number(t.shares)),
    0
);

const creatorName =
    `${market.creator.firstName ?? ""} ${market.creator.lastName ?? ""}`.trim() ||
    market.creator.email;

    const chartData = buildPriceHistory(
        market.outcomes,
        market.liquidity,
        trades,
        market.approvedAt ?? market.createdAt,
    );

    return (
    <div className="min-h-screen bg-zinc-50">
        <TopNav />
        <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
            <SideNav currentMarketId={market.id} />

            <section className="flex min-w-0 flex-col gap-6">
                

                <header className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">

                            <h1 className="mt-3 text-3xl font-bold leading-tight text-zinc-950">
                                {market.title}
                            </h1>

                            <p className="mt-2 max-w-3xl text-zinc-600">
                                {market.description}
                            </p>

                            <p className="mt-3 flex items-center text-sm text-zinc-400">
                                <Clock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <LocalDateTime date={market.closeTime} />
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClass(
                                market.status
                                )}`}
                            >
                                {market.status}
                            </span>

                            {market.status === "PENDING" && session?.user.admin && (
                                <AcceptButton
                                market={{
                                    ...market,
                                    marketCreatorId: market.creator.id,
                                }}
                                />
                            )}

                            {market.status === "PENDING" && session?.user.admin && (
                                <RejectButton market={market} />
                            )}

                            {(market.status === "OPEN" || market.status === "CLOSED") && session?.user.admin && (
                                <>
                                <ResolveButton market={market} />
                                <RefundButton market={market} />
                                </>
                            )}
                        </div>
                    </div>
                </header>       

                <section className="rounded-3xl bg-white p-6 shadow-sm">
                    <MarketChart
                        data={chartData}
                        outcomeNames={market.outcomes.map((o) => o.name)}
                    />
                </section>

                <MarketClient
                    outcomes={market.outcomes.map((o) => ({
                        id: o.id,
                        marketId: o.marketId,
                        name: o.name,
                        sharesOutstanding: o.sharesOutstanding,
                    }))}
                    liquidity={market.liquidity}
                    marketStatus={market.status}
                    balance={Number(session?.user.money)}
                    userPositions={serializedPositions}
                    resolvedOutcomeId={market.resolvedOutcomeId}
                />

                <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-zinc-950">
                            Market Details
                        </h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(market.status)}`}>
                            {market.status}
                        </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {session?.user.admin && (
                            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                    Created by
                                </p>
                                <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-snug text-zinc-950">
                                    {creatorName}
                                </p>
                            </div>
                        )}

                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                Created
                            </p>
                            <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-snug text-zinc-950">
                                <LocalDateTime date={market.createdAt} />
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                Closes
                            </p>
                            <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-snug text-zinc-950">
                                <LocalDateTime date={market.closeTime} />
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                Volume
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                                {formatMoney(totalVolume)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                Trades
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                                {trades.length}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                                <span className="font-semibold text-emerald-600">
                                    {buyTrades.length}
                                </span>{" "}
                                buys ·{" "}
                                <span className="font-semibold text-rose-600">
                                    {sellTrades.length}
                                </span>{" "}
                                sells
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                                Outcomes
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-950">
                                {market.outcomes.length}
                            </p>
                            <p className="mt-1 whitespace-normal break-words text-xs text-zinc-500">
                                {totalBuyShares.toFixed(0)} bought · {totalSellShares.toFixed(0)} sold
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-zinc-950">
                            Recent Activity
                        </h2>

                        <p className="text-sm text-zinc-400">
                            Last {Math.min(trades.length, 10)} trades
                        </p>
                    </div>

                    {trades.length === 0 ? (
                        <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
                            No trades yet.
                        </p>
                    ) : (
                        <div className="mt-4 divide-y divide-zinc-100">
                            {[...trades]
                                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                                .slice(0, 10)
                                .map((trade) => {
                                    const shares = Number(trade.shares);
                                    const isBuy = shares > 0;

                                    return (
                                        <div
                                            key={trade.id}
                                            className="flex items-center justify-between gap-4 py-3 text-sm"
                                        >
                                            <div>
                                                <p className="font-semibold text-zinc-950">
                                                    {isBuy ? "Bought" : "Sold"}{" "}
                                                    {Math.abs(shares).toFixed(0)} shares of{" "}
                                                    {trade.outcome.name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-400">
                                                    <LocalDateTime date={trade.createdAt} />
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p
                                                    className={`font-bold ${
                                                        isBuy
                                                            ? "text-emerald-600"
                                                            : "text-rose-600"
                                                    }`}
                                                >
                                                    {isBuy ? "Buy" : "Sell"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-400">
                                                    {formatMoney(Math.abs(Number(trade.cost ?? 0)))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </section>
            </section>
        </main>
    </div>
    );
}