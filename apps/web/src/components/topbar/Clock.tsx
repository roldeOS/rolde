"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The topbar clock (Roland 2026-06-16) — a calm, live readout of the date and
 * the time TO THE SECOND. Defaults to the VIEWER's local timezone; once a clinic
 * sets its own timezone (a future Caretaker setting, W1.1.x), pass it in as
 * `timeZone` (an IANA name like "Europe/London") and every seat reads the
 * clinic's wall clock regardless of where the person is sitting.
 *
 * SSR-safe: the server can't know the viewer's clock, so we render a fixed-width
 * blank until mount, then tick every second — no hydration mismatch, no jump.
 * tabular-nums keeps the digits from jittering as the seconds roll.
 */
export function Clock({ timeZone }: { timeZone?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Align the first tick to the next whole second so the seconds flip on the
    // beat rather than drifting, then run once a second.
    const align = setTimeout(() => {
      setNow(new Date());
      intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      clearTimeout(align);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const date = now
    ? new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone,
      }).format(now)
    : " ";
  const time = now
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone,
      }).format(now)
    : " ";

  return (
    <div
      className="hidden items-center gap-1.5 px-1 text-sm tabular-nums md:flex"
      aria-label="Current date and time"
    >
      <span className="text-muted-foreground">{date}</span>
      <span className="text-muted-foreground/40">·</span>
      <span className="min-w-[4.75rem] font-medium text-foreground">{time}</span>
    </div>
  );
}
