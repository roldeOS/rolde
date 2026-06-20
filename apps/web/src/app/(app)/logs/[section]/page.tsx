import { notFound } from "next/navigation";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getLogSection } from "../sections";
import { getLogsAccess, LogsRestricted } from "../access";

/**
 * Logs section scaffold. Renders an honest "coming next" page for any registered
 * log stream whose module isn't built yet. When a log ships, add a STATIC segment
 * (e.g. `logs/access/page.tsx`) — it overrides this dynamic route for that key —
 * and flip its `status` to "ready".
 */
export default async function LogSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sec = getLogSection(section);
  if (!sec) notFound();

  const { allowed } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;

  return (
    <div className="w-full space-y-4 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />

      <div className="rounded-xl bg-card p-8 shadow-float">
        <p className="py-6 text-center text-sm text-muted-foreground">
          This log is specified in {sec.source} and arrives in a coming build pass. The events
          are being recorded; this is where you&apos;ll review them.
        </p>
      </div>
    </div>
  );
}
