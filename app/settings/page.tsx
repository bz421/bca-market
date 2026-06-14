import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TopNav from "@/app/components/top-nav";
import SideNav from "@/app/components/side-nav"

import MarkNofificationsRead from '@/app/components/mark-notifications-read';
import { TrendingUp, TrendingDown, CheckCircle2, AlertCircle, CircleX, ArrowBigUp, ArrowBigDown } from "lucide-react";

function formatRelativeTime(value: Date): string {
    const diff = Date.now() - value.getTime();
    const diffMins = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/signin");
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);


    const [notifications, pendingMarkets] = await Promise.all([
        prisma.notification.findMany({
            where: {
                user: { email: session.user.email! },
                createdAt: { gte: fiveDaysAgo }
            },
            orderBy: { createdAt: 'desc' },
        }),
        session.user.admin ? prisma.market.findMany({
            where: { status: 'PENDING' },
            include: { creator: true },
            orderBy: [{ closeTime: 'asc' }, { createdAt: 'desc' }]
        })
            : Promise.resolve([])
    ])

    const hasUnread = notifications.some(n => !n.read);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-zinc-50">
            <TopNav />
            <MarkNofificationsRead hasUnread={hasUnread} />

            <main className="mx-auto grid w-full grid-cols-1 gap-6 px-6 py-8 xl:grid-cols-[260px_minmax(0,1fr)]">
                <SideNav unreadCount={unreadCount} />
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
                    <header className="flex items-center justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm">
                        <div>
                            <h1 className="mt-1 text-3xl font-semibold text-zinc-950">
                                Your Settings
                            </h1>
                            <p className="mt-2 text-zinc-600">
                                Logged in as {session.user?.email}
                            </p>
                        </div>
                    </header>

                    <section>
                        <div>
                            <h1 className="text-3xl font-semibold text-zinc-950 mb-2">
                                Notifications
                            </h1>
                            {hasUnread && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">{unreadCount} new</span>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
                                No notifications in the last 5 days.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`flex items-start gap-3.5 rounded-2xl bg-white p-4 shadow-sm transition
                                        ${!n.read ? 'ring-1 ring-zinc-200' : ''}`}
                                    >
                                        <div className={`mt-0.5 shrink-0 rounded-lg p-1.5
                                        ${n.type === 'TRADE_BUY'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : n.type === 'TRADE_SELL'
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : n.type === 'MARKET_APPROVED'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : n.type === 'MARKET_REJECTED'
                                                            ? 'bg-red-100 text-red-600'
                                                            : n.type === 'RESOLUTION'
                                                                ? n.resolutionType === 'WIN'
                                                                    ? 'bg-emerald-100 text-emerald-600'
                                                                    : n.resolutionType === 'LOSS'
                                                                        ? 'bg-red-100 text-red-600'
                                                                        : 'bg-gray-100 text-gray-600'
                                                                : 'bg-gray-100 text-gray-600'
                                            }`}

                                        >
                                            {n.type === 'TRADE_BUY'
                                                ? <ArrowBigUp className="h-3.5 w-3.5" />
                                                : n.type === 'TRADE_SELL'
                                                    ? <ArrowBigDown className="h-3.5 w-3.5" />
                                                    : n.type === 'MARKET_APPROVED'
                                                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                        : n.type === 'MARKET_REJECTED'
                                                            ? <CircleX className="h-3.5 w-3.5" />
                                                            : n.type === 'RESOLUTION'
                                                                ? n.resolutionType === 'WIN'
                                                                    ? <TrendingUp className="h-3.5 w-3.5" />
                                                                    : n.resolutionType === 'LOSS'
                                                                        ? <TrendingDown className="h-3.5 w-3.5" />
                                                                        : <AlertCircle className="h-3.5 w-3.5" />
                                                                : <AlertCircle className="h-3.5 w-3.5" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-zinc-900">{n.title}</p>
                                                <span className="shrink-0 text-xs text-zinc-400" suppressHydrationWarning>
                                                    {formatRelativeTime(n.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-zinc-600">{n.body}</p>
                                        </div>

                                        {!n.read && (
                                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {session?.user.admin && (<div className="mt-6">
                        <h1 className="text-3xl font-semibold text-zinc-950">
                            Pending Markets
                        </h1>
                    </div>)}
                    {session?.user.admin && (
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {pendingMarkets.map((market) => (
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
                                    <dd><LocalDateTime date={market.closeTime} /></dd>
                                </div>
                            </dl> */}
                                </Link>
                            ))}
                        </section>
                    )
                    }
                </div>
            </main>
        </div>
    )
}