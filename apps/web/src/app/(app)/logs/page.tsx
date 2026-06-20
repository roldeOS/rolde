import { ScrollText } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { LOG_GROUPS, LOG_SECTIONS } from "./sections";
import { getLogsAccess, LogsRestricted } from "./access";

/**
 * Logs Hub — the Caretaker's audit shelf (Bible 4.1 §5.4 / 4.3 §5.12; URDS §9.5).
 * A grouped grid of log cards on the shared SectionHubGrid. Settings is where you
 * CONFIGURE the clinic; Logs is where you REVIEW what happened — two jobs, two
 * homes. Each card lights up as its stream is built.
 */
export default async function LogsHubPage() {
  const { allowed } = await getLogsAccess();
  if (!allowed) return <LogsRestricted />;

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "Your clinic's audit shelf — a calm record of what happened. Everyone's actions are logged; only you (the Caretaker) review them here.",
        }}
      />
      <SectionHubGrid groups={LOG_GROUPS} sections={LOG_SECTIONS} baseHref="/logs" />
    </div>
  );
}
