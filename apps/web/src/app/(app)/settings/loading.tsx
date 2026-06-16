/**
 * Settings hub skeleton (APPROVALS §3.9) — shaped like the grouped card grid so
 * the page doesn't reflow when the real content lands.
 */
export default function SettingsLoading() {
  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <div className="skeleton h-8 w-40 rounded-lg" />
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="space-y-3">
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card p-5 shadow-float">
                <div className="skeleton h-7 w-7 rounded-md" />
                <div className="skeleton mt-3 h-4 w-28 rounded-md" />
                <div className="skeleton mt-2 h-3 w-full rounded-md" />
                <div className="skeleton mt-1.5 h-3 w-2/3 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
