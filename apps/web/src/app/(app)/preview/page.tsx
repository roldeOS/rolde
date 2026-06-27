import { TriangleAlert } from "lucide-react";
import { NoticeBar } from "@/components/ui/NoticeBar";

/**
 * /preview — a private, unlisted reference page (not in the nav) for seeing our shared
 * interaction patterns live. Right now: the Non-Blocking Modal (`NoticeBar`). A full
 * 4-card record fills the space; the bar sits BELOW the cards (it doesn't overlay them).
 * Demo content only — no real patient data. Safe to delete once the pattern has a real home.
 */
function Card({ title }: { title: string }) {
  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-2xl bg-card p-4 shadow-float">
      <p className="text-sm font-semibold">{title}</p>
      <div className="h-2.5 w-4/5 rounded bg-muted" />
      <div className="h-2.5 w-11/12 rounded bg-muted" />
      <div className="h-2.5 w-2/3 rounded bg-muted" />
    </div>
  );
}

export default function PreviewPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-6 lg:px-8">
        <h1 className="text-lg font-semibold">Pattern preview — Non-Blocking Modal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All four record cards stay in place and fully usable; the amber bar sits on the bottom
          edge <span className="font-medium">below</span> them — it doesn&apos;t overlay or cover a
          card. Click <span className="font-medium">Review</span> or the{" "}
          <span className="font-medium">×</span> to try it.
        </p>
      </div>

      <div className="min-h-0 flex-1 p-6 lg:p-8">
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-3">
          <Card title="Clinical notes" />
          <Card title="Orders" />
          <Card title="Medications" />
          <Card title="Results" />
        </div>
      </div>

      <NoticeBar
        icon={<TriangleAlert className="size-3.5" />}
        action={
          <button className="shrink-0 rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-hover">
            Review
          </button>
        }
      >
        This patient has <span className="font-medium">2 unsigned results</span> awaiting review.
      </NoticeBar>
    </div>
  );
}
