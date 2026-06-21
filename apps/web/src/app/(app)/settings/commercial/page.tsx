import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { taxNameForCountry } from "@/lib/tax";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { CommercialSettingsForm, type CommercialSettings } from "./CommercialSettingsForm";

/**
 * Settings → Commercial Settings (Caretaker, W1.1.16). Static segment overriding
 * the `commercial` scaffold. The clinic's MONEY POLICY — tax, deposits, a
 * redeemable consultation credit, discount codes — all toggle-first. These
 * switches gate the conditional fields in Services v2, the booking widget and
 * billing. Money is held as integer pence; the tax rate as basis points. Tax is
 * global (Tax v2): name/rate/registration/inclusive are the clinic's own.
 */
const defaults = (taxName: string): CommercialSettings => ({
  tax_enabled: false,
  tax_rate_bps: 2000,
  tax_name: taxName,
  tax_registration: null,
  tax_inclusive: false,
  deposit_enabled: false,
  deposit_default_pence: 0,
  consult_credit_enabled: false,
  consult_credit_pence: 5000,
  consult_credit_label: "Consultation Credit",
  discount_codes_enabled: false,
});

export default async function CommercialPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("commercial");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let initial = defaults("VAT");
  if (tenantId) {
    const supabase = await createClient();
    const [{ data }, { data: tenant }] = await Promise.all([
      supabase
        .from("clinic_commercial_settings")
        .select(
          "tax_enabled, tax_rate_bps, tax_name, tax_registration, tax_inclusive, deposit_enabled, deposit_default_pence, consult_credit_enabled, consult_credit_pence, consult_credit_label, discount_codes_enabled",
        )
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      supabase.from("tenants").select("country").eq("id", tenantId).maybeSingle(),
    ]);
    // No row yet → suggest the tax name from the clinic's country (they can edit it).
    initial = data ?? defaults(taxNameForCountry(tenant?.country));
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
