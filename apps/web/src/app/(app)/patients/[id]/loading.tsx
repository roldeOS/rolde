/**
 * Instant skeleton for the consultation (the heaviest page) — the four-card
 * grid appears immediately on navigation while the record streams in.
 */
export default function ConsultationLoading() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 sm:p-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[40vh] flex-col rounded-xl bg-card p-4 shadow-float lg:min-h-0"
        >
          <div className="flex items-center gap-2">
            <div className="skeleton size-7 rounded-md" />
            <div className="skeleton h-4 w-32 rounded-md" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="skeleton h-4 w-full rounded-md" />
            <div className="skeleton h-4 w-5/6 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
