// import Link from "next/link";
import { getServerSession } from "next-auth";
// import { Home, Bell, BarChart3, PlusCircle } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// import AddMarketButton from "./add-market-button";
import { getNormalizedStatus } from "@/lib/market-status";
import SideNavContent from "./side-nav-content";

type SideNavProps = {
  currentMarketId?: number;
  unreadCount: number;
};

function statusDot(status: string) {
  if (status === "OPEN") return "bg-emerald-500";
  if (status === "CLOSED") return "bg-zinc-400";
  if (status === "PENDING") return "bg-amber-500";
  if (status === "RESOLVED") return "bg-blue-500";
  return "bg-zinc-400";
}

export default async function SideNav({ currentMarketId, unreadCount }: SideNavProps) {
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
      <SideNavContent visibleMarkets={visibleMarkets} currentMarketId={currentMarketId} unreadCount={unreadCount} />
    </aside>
  );
}