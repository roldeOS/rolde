/**
 * Instant page skeleton (Roland 2026-06-11). The (app) layout (sidebar + topbar)
 * persists across navigation; this fills the {children} slot the MOMENT a nav is
 * clicked, so the app feels snappy instead of blocking on the server fetch.
 * Generic shell — a header row + a tile band + a list card.
 */
export default function AppLoading() {
  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-64 rounded-lg" />
        <div className="skeleton h-4 w-40 rounded-md" />
      </div>

      {/* Tile band */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-float">
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton mt-4 h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      {/* List card */}
      <div className="rounded-xl bg-card p-5 shadow-float">
        <div className="skeleton h-5 w-44 rounded-md" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="skeleton h-4 w-48 rounded-md" />
              <div className="skeleton h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
