import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import TopNav from "@/app/components/top-nav";
import SideNav from "@/app/components/side-nav";

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

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default async function LeaderboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/signin');

    const users = await prisma.user.findMany({
        where: {
            id: { not: Number(process.env.TREASURY_ACCOUNT_ID) }
        },
        include: {
            positions: {
                include: {
                    outcome: true,
                    market: {
                        include: {
                            outcomes: true
                        }
                    }
                }
            }
        }
    });

    const leaderboard = users.map((user) => {
        const positionsValue = user.positions.reduce((sum, position) => {
            const currentPrice = outcomePrice(position.market, position.outcome.id);

            return sum + Number(position.shares) * currentPrice;
        }, 0);

        return {
            id: user.id,
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
            email: user.email,
            netWorth: Number(user.money) + positionsValue,
            balance: Number(user.money),
            positionsValue: positionsValue
        }
    }).sort((a, b) => b.netWorth - a.netWorth);

    return (
        <div className="min-h-screen bg-zinc-50">
            <TopNav />

            <main className="mx-auto grid w-full grid-cols-1 gap-6 px-6 py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
                <SideNav />

                <div className="w-full mx-auto">
                    <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Leaderboard</h1>
                    <p className="text-sm text-zinc-500 mb-6">Ordered by net worth (cash balance + position value)</p>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase text-zinc-400">
                                    <th className="pb-2 pr-4 pl-1 w-10">#</th>
                                    <th className="pb-2 pr-6 text-left w-full">Name</th>
                                    {/* <th className="pb-2 pr-6">Email</th> */}
                                    <th className="pb-2 pr-6 w-32">Net Worth</th> 
                                    <th className="pb-2 w-32">Balance</th>
                                    <th className="pb-2 w-20">Position</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {leaderboard.map((user, i) => {
                                    const rank = i + 1;
                                    const isMe = user.id === Number(session?.user.id);
                                    return (
                                        <tr
                                            key={user.id}
                                            className={`group transition-colors ${isMe ? "bg-zinc-100/80" : "hover:bg-zinc-50"}`}
                                        >
                                            <td className="py-3 pr-4 pl-1 font-mono text-zinc-400 text-xs">
                                                {MEDAL[rank] ?? rank}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`font-medium ${isMe ? "text-zinc-950" : "text-zinc-800"}`}>
                                                    {user.name}
                                                </span>
                                                {isMe && (
                                                    <span className="ml-2 text-[10px] font-semibold uppercase text-zinc-400">you</span>
                                                )}
                                            </td>
                                            {/* <td className="py-3 pr-6 text-zinc-500">{user.email}</td> */}
                                            <td className="py-3 pr-6 font-semibold text-zinc-900 tabular-nums">
                                                {fmt(user.netWorth)}
                                            </td>
                                            <td className="py-3 pr-6 text-zinc-500 tabular-nums">
                                                {fmt(user.balance)}
                                            </td>
                                            <td className={`py-3 tabular-nums ${user.positionsValue > 0 ? "text-emerald-600" : "text-zinc-400"}`}>
                                                {fmt(user.positionsValue)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden flex flex-col divide-y divide-zinc-100">
                        {leaderboard.map((user, i) => {
                            const rank = i + 1;
                            const isMe = user.id === Number(session?.user.id);
                            return (
                                <div
                                    key={user.id}
                                    className={`py-3 flex items-start gap-3 ${isMe ? "bg-zinc-100/80 -mx-6 px-6" : ""}`}
                                >
                                    <span className="w-6 shrink-0 text-sm text-zinc-400 font-mono pt-0.5">
                                        {MEDAL[rank] ?? rank}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-medium text-zinc-900 truncate">{user.name}</p>
                                            {isMe && (
                                                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">you</span>
                                            )}
                                        </div>
                                        {/* <p className="text-xs text-zinc-400 truncate">{user.email}</p> */}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-semibold text-zinc-900 tabular-nums">{fmt(user.netWorth)}</p>
                                        <p className="text-xs text-zinc-400 tabular-nums">
                                            {fmt(user.balance)} + <span className={user.positionsValue > 0 ? "text-emerald-600" : ""}>{fmt(user.positionsValue)}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}