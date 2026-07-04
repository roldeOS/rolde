import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { CourierSettingsForm, type CourierSettings } from "./CourierSettingsForm";
import { AddressBook, type AddressEntry } from "./AddressBook";

/**
 * Settings → RolDe Courier (Caretaker, C2). Two halves: the clinic's SENDING
 * POLICY (secure-link default · typo guard · countersign · delegated sending ·
 * quiet hours · chase window — C3/C5 read these at send/chase time) and the
 * ADDRESS BOOK Courier delivers to (GP practices · pharmacies · labs ·
 * hospitals — the per-patient care team stays the "send to GP" default).
 */
const DEFAULTS: CourierSettings = {
  secure_link_default: true,
  typo_guard: true,
  countersign_required: false,
  delegated_sending: false,
  quiet_hours_enabled: false,
  quiet_start: "20:00",
  quiet_end: "08:00",
  chase_after_days: 7,
};

export default async function CourierPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("courier");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let initial = DEFAULTS;
  let entries: AddressEntry[] = [];
  let country = "GB";
  if (tenantId) {
    const supabase = await createClient();
    const [{ data: settings }, { data: book }, { data: tenant }] = await Promise.all([
      supabase
        .from("clinic_courier_settings")
        .select(
          "secure_link_default, typo_guard, countersign_required, delegated_sending, quiet_hours_enabled, quiet_start, quiet_end, chase_after_days",
        )
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      supabase
        .from("clinic_address_book")
        .select(
          "id, kind, name, contact_name, email, phone, address_line1, address_line2, city, postcode, notes",
        )
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("kind")
        .order("name"),
      supabase.from("tenants").select("country").eq("id", tenantId).maybeSingle(),
    ]);
    initial = settings ?? DEFAULTS;
    entries = book ?? [];
    if (tenant?.country) country = tenant.country;
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
          Courier settings are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <CourierSettingsForm initial={initial} />
          <AddressBook entries={entries} country={country} />
        </div>
      )}
    </div>
  );
}
