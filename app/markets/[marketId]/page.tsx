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

    return (
        <div className="min-h-screen bg-zinc-50">
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-bold text-zinc-900">
                        BCA Market
                    </h1>
                    <SignOutButton />
                </div>
                {/* <div> */}
                <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
                    <div>
                        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
                            ← Back to markets
                        </Link>
                        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">
                            {market.title}
                        </h1>
                        <p className="mt-2 max-w-3xl text-zinc-600">
                            {market.description}
                        </p>
                        <p className="mt-2 text-sm text-zinc-400 flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                            {formatDate(market.closeTime)}
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                        <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(market.status)}`}
                        >
                            {market.status}
                        </span>
                        {market.status === 'PENDING' && session?.user.admin && (
                            <AcceptButton
                                market={{
                                    ...market,
                                    marketCreatorId: market.creator.id,
                                }}
                            />
                        )}
                        {market.status === 'PENDING' && session?.user.admin && (
                            <RejectButton market={market} />
                        )}
                        {market.status === 'OPEN' && session?.user.admin && (
                            <ResolveButton market={market} />
                        )}
                    </div>
                </header>

                <MarketClient 
                    outcomes={market.outcomes.map(o => ({
                        id: o.id,
                        marketId: o.marketId,
                        name: o.name,
                        sharesOutstanding: o.sharesOutstanding
                    }))}
                    liquidity={market.liquidity}
                    marketStatus={market.status}
                    balance={Number(session?.user.money)}
                />
                {/* </div> */}
            </main>
        </div>
    );
}