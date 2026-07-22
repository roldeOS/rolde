import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { PatientPortalForm } from "./PatientPortalForm";

/**
 * Settings → Patient Portal (P1, Roland 2026-07-22). The Caretaker's control for
 * the patient-facing record: switch it on per clinic and choose how patients get
 * access (invite-only for GP-style verification, open sign-up for private clinics
 * like Doc For Skin / Doc For Drivers). Gated to Caretakers (UI + RLS).
 */
export default async function PatientPortalPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("patient-portal");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let enabled = false;
  let mode = "invite_only";
  if (tenantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("portal_enabled, portal_registration")
      .eq("id", tenantId)
      .single();
    enabled = data?.portal_enabled ?? false;
    mode = data?.portal_registration ?? "invite_only";
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />
      <PatientPortalForm initialEnabled={enabled} initialMode={mode} />
    </div>
  );
}
