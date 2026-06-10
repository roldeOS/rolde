/**
 * The ambient AI panel (Bible 4.2 §5) — the bottom-right quadrant. "RolDe"
 * wordmark header + status dot + the direct-query input. Until the self-hosted
 * AI server (Gemma, Bible 4.7) comes online, the panel states that plainly —
 * graceful degradation per Bible 4.1 §6.4. Never branded "AI" in clinical copy;
 * suggestions arrive as "RolDe says…" cards.
 */
export function AiPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 pb-2">
        {/* The RolDe wordmark — serif allowed here only. */}
        <span className="font-wordmark text-sm font-semibold tracking-tight">
          RolDe
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-border" />
          Offline
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <p className="text-center text-xs text-muted-foreground">
          RolDe&apos;s clinical suggestions appear here once the AI server is
          connected. Clinical work continues as normal without it.
        </p>
      </div>
      <div className="shrink-0 px-4 pb-1">
        <input
          disabled
          placeholder="Ask RolDe anything…"
          className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
