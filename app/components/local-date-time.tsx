"use client";

import { useEffect, useState } from "react";

export default function LocalDateTime({
  date,
  options = {
    dateStyle: "medium",
    timeStyle: "short",
  },
}: {
  date: Date | string | number;
  options?: Intl.DateTimeFormatOptions
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) {
    return null;
  }

  if (!mounted) {
    // render UTC formatted string on server and during initial client render
    const serverOptions = { ...options, timeZone: "UTC" };
    const utcFormatted = new Intl.DateTimeFormat("en-US", serverOptions).format(d) + " UTC";
    return (
      <span className="tabular-nums" suppressHydrationWarning>
        {utcFormatted}
      </span>
    );
  }

  // render browser local timezone formatted string on client after mount
  const localFormatted = new Intl.DateTimeFormat("en-US", options).format(d);
  return (
    <span className="tabular-nums" suppressHydrationWarning>
      {localFormatted}
    </span>
  );
}
