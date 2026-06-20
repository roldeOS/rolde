import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ClinicProfileForm } from "./ClinicProfileForm";

/**
 * Settings → Clinic Profile (Caretaker, Bible 4.3 §5 / W1.1.2). Static segment —
 * overrides the `[section]` scaffold for the `profile` key. The clinic comes from
 * the session; the form saves through the column-scoped clinic-profile route.
 */
export default async function ClinicProfilePage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("profile");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let profile: Awaited<ReturnType<typeof loadProfile>> = null;
  if (tenantId) profile = await loadProfile(tenantId);

  return (
    <div className="w-full space-y-4 p-6 lg:p-6">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          This is a per-clinic profile. As a Custodian you don&apos;t have a clinic of your own —
          open a specific clinic from{" "}
          <Link href="/custodian" className="font-medium text-foreground underline">
            Platform
          </Link>
          .
        </div>
      ) : !profile ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          We couldn&apos;t load your clinic profile just now — refresh and try again.
        </div>
      ) : (
        <ClinicProfileForm profile={profile} />
      )}
    </div>
  );
}

async function loadProfile(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select(
      "name, legal_name, contact_email, contact_phone, address_line1, address_line2, city, postcode, ico_registration, his_registration, cqc_registration, logo_svg, logo_svg_dark, logo_png",
    )
    .eq("id", tenantId)
    .maybeSingle();
  return data;
}
