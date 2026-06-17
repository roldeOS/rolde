import { notFound } from "next/navigation";
import { UserCog } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSessionContext } from "@/lib/auth";
import { CustodianSettings } from "./CustodianSettings";

/**
 * Custodian → Settings (W1.5.2). The Custodian's OWN profile + account — the
 * personal levers, distinct from "Control" (the platform levers). A Custodian has
 * no clinic, so this is where their name / title / avatar / security live.
 */
export default async function CustodianSettingsPage() {
  const ctx = await getSessionContext();
  if (!ctx?.isCustodian) notFound();
  const c = ctx.custodian;

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={UserCog}
        tone="neutral"
        title="Settings"
        explainer={{
          label: "Settings",
          description:
            "Your own Custodian profile and account — the personal levers, separate from the platform Controls.",
        }}
      />
      <CustodianSettings
        initial={{ displayName: c?.display_name ?? "", title: c?.title ?? "" }}
      />
    </div>
  );
}
