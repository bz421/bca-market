import Link from "next/link";
import { Home, Bell, BellDot, BarChart3 } from "lucide-react";
import AddMarketButton from "./add-market-button";
// import { Market } from "../generated/prisma/browser";

import PodiumCopy from './podium-copy'; // TODO: change once lucide-react updates with podium icon
import styles from './settings-button.module.css';

function statusDot(status: string) {
    if (status === "OPEN") return "bg-emerald-500";
    if (status === "CLOSED") return "bg-zinc-400";
    if (status === "PENDING") return "bg-amber-500";
    if (status === "RESOLVED") return "bg-blue-500";
    return "bg-zinc-400";
}

type Market = {
    id: number;
    title: string;  
    status: string;
}

export default function SideNavContent({visibleMarkets, currentMarketId, unreadCount}: {visibleMarkets: Market[], currentMarketId?: number, unreadCount: number}) {
    return (
        <>
            <nav className="space-y-1 border-y border-zinc-100 py-0">
                <Link
                    href="/"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                    <Home className="h-4 w-4" />
                    Home
                </Link>

                <Link
                    href="/portfolio"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                    <BarChart3 className="h-4 w-4" />
                    Portfolio
                </Link>

                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                >
                    {unreadCount > 0 ? <BellDot className={`h-4 w-4 ${styles['red-dot-bell']}`} /> : <Bell className="h-4 w-4" />}
                    Notifications
                </Link>

                <Link 
                    href="/leaderboard"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950">
                    <PodiumCopy className="h-4 w-4" />
                    Leaderboard
                </Link>

                <AddMarketButton variant="nav" />
            </nav>

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <div className="mb-2 flex items-center justify-between px-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                        Markets
                    </p>
                    <span className="text-xs text-zinc-400">{visibleMarkets.length}</span>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                    {visibleMarkets.map((market) => {
                        const active = currentMarketId === market.id;

                        return (
                            <Link
                                key={market.id}
                                href={`/markets/${market.id}`}
                                className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active
                                    ? "bg-white text-black"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                                    }`}
                            >
                                <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusDot(
                                        market.status
                                    )}`}
                                />
                                <span className="line-clamp-2 font-medium leading-snug">
                                    {market.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    )
}