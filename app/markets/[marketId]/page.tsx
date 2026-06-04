import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/app/components/sign-out-button";

import AcceptButton from "@/app/components/accept-button";
import RejectButton from "@/app/components/reject-button";

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

    return (
        <div className="min-h-screen bg-zinc-50">
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-bold text-zinc-900">
                        BCA Market
                    </h1>
                    <SignOutButton />
                </div>
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
                            <AcceptButton />
                        )}
                        {market.status === 'PENDING' && session?.user.admin && (
                            <RejectButton market={market} />
                        )}
                    </div>
                </header>

                <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-zinc-950">Outcomes</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {market.outcomes.map((outcome) => (
                            <div
                                key={outcome.id}
                                className="rounded-xl border border-zinc-200 p-4"
                            >
                                <p className="font-medium text-zinc-950">{outcome.name}</p>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Shares outstanding: {outcome.sharesOutstanding.toString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {market.outcomes.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-500">No outcomes yet.</p>
                    ) : null}
                </section>
            </main>
        </div>
    );
}