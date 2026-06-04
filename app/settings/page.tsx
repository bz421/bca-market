import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "../components/sign-out-button";

function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/signin");
    }

    const markets = await prisma.market.findMany({
        include: { creator: true },
        orderBy: [{ closeTime: 'asc' }, { createdAt: 'desc' }]
    });
    return (
        <div className="min-h-screen bg-zinc-50">
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
                <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
                    ← Back to Home
                </Link>
                <header className="flex items-center justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm">
                    <div>
                        <h1 className="mt-1 text-3xl font-semibold text-zinc-950">
                            Your Settings
                        </h1>
                        <p className="mt-2 text-zinc-600">
                            Logged in as {session.user?.email}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 items-center">
                        <SignOutButton />
                    </div>
                </header>
                {session?.user.admin && (<div className="mt-6">
                    <h1 className="text-3xl font-semibold text-zinc-950">
                        Pending Markets
                    </h1>
                </div>)}
                {session?.user.admin && (markets.length === 0 ? (
                    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
                        No markets yet.
                    </section>
                ) : (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {markets.map((market) => market.status === 'PENDING' && (
                            <Link
                                key={market.id}
                                href={`/markets/${market.id}`}
                                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-950 group-hover:text-zinc-700">
                                            {market.title}
                                        </h2>
                                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                                            {market.description}
                                        </p>
                                        <p className="mt-2 text-xs text-zinc-400">
                                            Requested by {market.creator.firstName} {market.creator.lastName}
                                        </p>
                                    </div>
                                </div>

                                {/* <dl className="mt-5 grid gap-3 text-sm text-zinc-600">
                                <div className="flex justify-between gap-3">
                                    <dt>Outcomes</dt>
                                    <dd>{market.outcomes.length}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Liquidity</dt>
                                    <dd>{market.liquidity.toString()}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Closes</dt>
                                    <dd>{formatDate(market.closeTime)}</dd>
                                </div>
                            </dl> */}
                            </Link>
                        ))}
                    </section>
                )
                )}
            </main>
        </div>
    )
}