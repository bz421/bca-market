"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import LocalDateTime from "./local-date-time";

import { CircleCheckBig } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/app/components/ui/context-menu";

import toggleMarketHidden from "@/app/actions/toggleMarketHidden";

type Outcome = {
  id: number;
  name: string;
  price: number;
};

type MarketCardProps = {
  market: {
    id: number;
    title: string;
    status: string;
    closeTime: string;
    outcomes: Outcome[];
    resolvedOutcomeId?: number | null;
    hidden: boolean;
  };
};

function statusClass(status: string) {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
  if (status === "CLOSED") return "bg-zinc-200 text-zinc-700";
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "RESOLVED") return "bg-blue-100 text-blue-700";
  return "bg-zinc-100 text-zinc-700";
}

export default function MarketCard({ market, isAdmin }: MarketCardProps & { isAdmin?: boolean }) {

  const [expanded, setExpanded] = useState(false);

  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
  const visibleOutcomes = expanded ? sortedOutcomes : sortedOutcomes.slice(0, 3);
  const hasMore = sortedOutcomes.length > 4 || market.title.length > 60;

  const card = (
    <Link href={`/markets/${market.id}`} className={`min-w-0 flex-1 ${market.hidden ? "opacity-50" : ""}`}>
      <article
        className={`group flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            className={`text-xl font-bold text-zinc-950 group-hover:text-sky-700 ${expanded ? "" : "line-clamp-3"
              }`}
          >
            {market.title}
          </h2>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
              market.status
            )}`}
          >
            {market.status}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {visibleOutcomes.map((outcome) => {
            const isResolved = market.status === "RESOLVED";
            const isWinner = isResolved && outcome.id === market.resolvedOutcomeId;
            return (
              <div key={outcome.id} className={isResolved && !isWinner ? "opacity-60" : ""}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 truncate font-medium text-zinc-700">
                    {isWinner && (
                      <CircleCheckBig className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span className={isWinner ? "text-emerald-700 font-semibold truncate" : "truncate"}>
                      {outcome.name}
                    </span>
                  </span>
                  <span className={`font-bold ${isWinner ? "text-emerald-700" : "text-zinc-950"}`}>
                    {(outcome.price * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-100">
                  <div
                    className={`h-2 rounded-full transition-all ${isWinner ? "bg-emerald-500" : isResolved ? "bg-zinc-300" : "bg-sky-500"
                      }`}
                    style={{ width: `${outcome.price * 100}%` }}
                  />
                </div>
              </div>
            );
          })}

          {!expanded && sortedOutcomes.length > 3 && (
            <p className="text-xs font-medium text-zinc-400">
              +{sortedOutcomes.length - 3} more outcomes
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-400">
            Closes <LocalDateTime date={market.closeTime} options={{ month: "short", day: "numeric" }} />
          </p>

          <div className="flex items-center gap-3">

            {hasMore && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setExpanded((v) => !v)
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 cursor-pointer"
                aria-label={expanded ? "Collapse card" : "Expand card"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""
                    }`}
                />
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  )

  if (!isAdmin) return card;

  return (
    <ContextMenu>
      <ContextMenuTrigger render={card} />


      <ContextMenuContent>
        <ContextMenuItem onClick={async (e) => {
          e.preventDefault();
          await toggleMarketHidden(market.id, !market.hidden);
        }}>
          {market.hidden ? "Unhide" : "Hide"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}