import { SlidersHorizontal } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CounterCard } from "@/components/ui/SectionHubGrid";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_DOCS } from "@/lib/legal";
import { CONTROL_HUB } from "../sections";

/**
 * Control (Bible 4.8 §16, W1.5.2) — the Custodian's equivalent of a clinic's
 * Settings: one destination gathering every platform lever they own (legal docs,
 * the email system, fellow Custodians). Mindate Counter cards (URDS §8.1): each
 * shows its live count. The /custodian layout gates to Custodians.
 */
export default async function ControlHubPage() {
  const supabase = await createClient();
  const [emails, custodians] = await Promise.all([
    supabase.from("email_templates").select("id", { count: "exact", head: true }).is("tenant_id", null),
    supabase.from("custodian_users").select("user_id", { count: "exact", head: true }),
  ]);
  const values: Record<string, { value: number; valueSub: string }> = {
    legal: { value: LEGAL_DOCS.length, valueSub: "documents" },
    emails: { value: emails.count ?? 0, valueSub: "templates" },
    custodians: { value: custodians.count ?? 0, valueSub: "custodians" },
  };

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={SlidersHorizontal}
        tone="neutral"
        title="Control"
        explainer={{
          label: "Control",
          description:
            "Everything you edit for the clinics under you — the legal and clinical-safety documents, the email templates, and your fellow Custodians.",
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CONTROL_HUB.map((s) => (
          <CounterCard
            key={s.key}
            href={s.href}
            section={{
              key: s.key,
              title: s.label,
              blurb: s.blurb,
              icon: s.icon,
              tone: s.tone,
              status: s.status,
              ...values[s.key],
            }}
          />
        ))}
      </div>
    </div>
  );
}
