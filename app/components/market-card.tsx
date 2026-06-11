"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

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
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "RESOLVED") return "bg-blue-100 text-blue-700";
  return "bg-zinc-100 text-zinc-700";
}

export default function MarketCard({ market }: MarketCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
  const visibleOutcomes = expanded ? sortedOutcomes : sortedOutcomes.slice(0, 4);
  const hasMore = sortedOutcomes.length > 4 || market.title.length > 60;

  return (
    <article
      className={`group flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl ${
        expanded ? "min-h-[420px]" : "h-[420px]"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/markets/${market.id}`} className="min-w-0 flex-1">
          <h2
            className={`text-xl font-bold text-zinc-950 group-hover:text-sky-700 ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {market.title}
          </h2>
        </Link>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
            market.status
          )}`}
        >
          {market.status}
        </span>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-hidden">
        {visibleOutcomes.map((outcome) => (
          <div key={outcome.id}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-zinc-700">
                {outcome.name}
              </span>
              <span className="font-bold text-zinc-950">
                {(outcome.price * 100).toFixed(0)}%
              </span>
            </div>

            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-sky-500 transition-all"
                style={{ width: `${outcome.price * 100}%` }}
              />
            </div>
          </div>
        ))}

        {!expanded && sortedOutcomes.length > 4 && (
          <p className="text-xs font-medium text-zinc-400">
            +{sortedOutcomes.length - 4} more outcomes
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
        <p className="text-xs text-zinc-400">
          Closes {formatDate(market.closeTime)}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={`/markets/${market.id}`}
            className="text-sm font-semibold text-sky-600 group-hover:text-sky-700"
          >
            View
          </Link>

          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
              aria-label={expanded ? "Collapse card" : "Expand card"}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}