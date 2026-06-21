import { ScrollText } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { SectionHubGrid } from "@/components/ui/SectionHubGrid";
import { CUSTODIAN_LOG_GROUPS, CUSTODIAN_LOG_SECTIONS } from "./sections";

/**
 * Custodian → Logs. The PLATFORM-wide audit shelf, on the SAME SectionHubGrid as
 * the clinic Logs Hub — so the Logs page looks identical for every role (Roland
 * 2026-06-21). Each card opens a platform-wide log (read across all clinics, with
 * a Clinic column). The custodian layout (requireCustodian) gates the whole area.
 */
export default function CustodianLogsHubPage() {
  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "The platform's audit shelf — what happened across every clinic. The same shelves a clinic sees, platform-wide.",
        }}
      />
      <SectionHubGrid groups={CUSTODIAN_LOG_GROUPS} sections={CUSTODIAN_LOG_SECTIONS} baseHref="/custodian/logs" />
    </div>
  );
}
