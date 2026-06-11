import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/app/components/sign-out-button";

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

function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
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

    const { q, cost, prices } = getMarketState(market.outcomes, market.liquidity);

    const trades = await prisma.trade.findMany({
        where: { marketId },
        orderBy: { createdAt: "asc" },
        select: { outcomeId: true, shares: true, createdAt: true },
    });

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
                                {formatDate(market.closeTime)}
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

                            {market.status === "OPEN" && session?.user.admin && (
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
                />
            </section>
        </main>
    </div>
    );
}