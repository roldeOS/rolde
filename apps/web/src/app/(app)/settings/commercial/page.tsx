import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { CommercialSettingsForm, type CommercialSettings } from "./CommercialSettingsForm";

/**
 * Settings → Commercial Settings (Caretaker, W1.1.16). Static segment overriding
 * the `commercial` scaffold. The clinic's MONEY POLICY — VAT, deposits, a
 * redeemable consultation credit, discount codes — all toggle-first. These
 * switches gate the conditional fields in Services v2, the booking widget and
 * billing. Money is held as integer pence; rates as basis points.
 */
const DEFAULTS: CommercialSettings = {
  vat_enabled: false,
  vat_rate_bps: 2000,
  deposit_enabled: false,
  deposit_default_pence: 0,
  consult_credit_enabled: false,
  consult_credit_pence: 5000,
  consult_credit_label: "Consultation Credit",
  discount_codes_enabled: false,
};

export default async function CommercialPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("commercial");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let initial = DEFAULTS;
  if (tenantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clinic_commercial_settings")
      .select(
        "vat_enabled, vat_rate_bps, deposit_enabled, deposit_default_pence, consult_credit_enabled, consult_credit_pence, consult_credit_label, discount_codes_enabled",
      )
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (data) initial = data;
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          Commercial settings are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <CommercialSettingsForm initial={initial} />
      )}
    </div>
  );
}
