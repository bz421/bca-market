import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, Bell, BarChart3, PlusCircle } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddMarketButton from "./add-market-button";
import { getNormalizedStatus } from "@/lib/market-status";

type SideNavProps = {
  currentMarketId?: number;
};

function statusDot(status: string) {
  if (status === "OPEN") return "bg-emerald-500";
  if (status === "CLOSED") return "bg-zinc-400";
  if (status === "PENDING") return "bg-amber-500";
  if (status === "RESOLVED") return "bg-blue-500";
  return "bg-zinc-400";
}

export default async function SideNav({ currentMarketId }: SideNavProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const dbMarkets = await prisma.market.findMany({
    where: {
      OR: [
        { status: { not: "RESOLVED" } },
        { resolvedAt: { gte: sevenDaysAgo } },
      ],
    },
    orderBy: [{ closeTime: "asc" }, { createdAt: "desc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      creatorId: true,
      closeTime: true,
    },
  });

  const markets = dbMarkets.map((market) => ({
    ...market,
    status: getNormalizedStatus(market.status, market.closeTime),
  }));

  const visibleMarkets = markets.filter((market) => {
    if (market.status !== "PENDING") return true;
    if (user?.admin) return true;
    return user?.id === String(market.creatorId);
  });

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-3xl xl:flex">
      <div className="px-2 pb-0">
        <Link href="/" className="block">
        </Link>
      </div>

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
          <Bell className="h-4 w-4" />
          Notifications
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
                className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
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
    </aside>
  );
}