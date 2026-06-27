import { Info } from "lucide-react";
import { NoticeBar } from "@/components/ui/NoticeBar";

/**
 * /preview — a private, unlisted reference page (not in the nav) for seeing our shared
 * interaction patterns live. Right now: the Non-Blocking Modal (`NoticeBar`). Demo
 * content only — no real patient data. Safe to delete once each pattern has a real home.
 */
export default function PreviewPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-6 lg:p-8">
        <h1 className="text-lg font-semibold">Pattern preview — Non-Blocking Modal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A slim, dismissible bar on the bottom edge. The content above stays fully usable and
          isn&apos;t pushed down — non-blocking, but unmissable. The light tier opposite the
          Blocking Modal (the frosted break-glass gate). Click <span className="font-medium">Review</span>{" "}
          or the <span className="font-medium">×</span> to try it.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-float">
            <p className="text-sm font-semibold">Clinical notes</p>
            <div className="h-2.5 w-4/5 rounded bg-muted" />
            <div className="h-2.5 w-11/12 rounded bg-muted" />
            <div className="h-2.5 w-2/3 rounded bg-muted" />
          </div>
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-float">
            <p className="text-sm font-semibold">Orders</p>
            <div className="h-2.5 w-3/4 rounded bg-muted" />
            <div className="h-2.5 w-5/6 rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <NoticeBar
          icon={<Info className="size-3.5" />}
          tone="info"
          action={
            <button className="shrink-0 rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-hover">
              Review
            </button>
          }
        >
          This patient has <span className="font-medium">2 unsigned results</span> awaiting review.
        </NoticeBar>
      </div>
    </div>
  );
}
