import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ServicesManager, type CommercialContext } from "./ServicesManager";

/**
 * Settings → Services & Pricing (Caretaker, W1.1.8 v2). Static segment overriding
 * the `services` scaffold. The clinic's treatments + prices — grouped by category,
 * each with an optional code, and (when the matching switch is on in Commercial
 * Settings) a per-service VAT and deposit. The catalogue the booking widget +
 * billing read. Money is held as integer pence. (Course / membership service types
 * arrive with the Memberships & Packages module, W1.1.10, where they're managed.)
 */
export default async function ServicesPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("services");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let services: Awaited<ReturnType<typeof loadServices>> = [];
  let commercial: CommercialContext = {
    vat_enabled: false,
    vat_rate_bps: 2000,
    deposit_enabled: false,
    deposit_default_pence: 0,
  };
  if (tenantId) {
    [services, commercial] = await Promise.all([
      loadServices(tenantId),
      loadCommercial(tenantId),
    ]);
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
          Services are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <ServicesManager initial={services} commercial={commercial} />
      )}
    </div>
  );
}

async function loadServices(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_services")
    .select(
      "id, name, description, category, code, price_pence, duration_minutes, vat_exempt, deposit_pence, active",
    )
    .eq("tenant_id", tenantId)
    .order("category", { ascending: true, nullsFirst: false })
    .order("sort", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

async function loadCommercial(tenantId: string): Promise<CommercialContext> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_commercial_settings")
    .select("vat_enabled, vat_rate_bps, deposit_enabled, deposit_default_pence")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (
    data ?? {
      vat_enabled: false,
      vat_rate_bps: 2000,
      deposit_enabled: false,
      deposit_default_pence: 0,
    }
  );
}
