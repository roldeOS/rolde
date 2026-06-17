import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ServicesManager } from "./ServicesManager";

/**
 * Settings → Services & Pricing (Caretaker, W1.1.8). Static segment overriding
 * the `services` scaffold. The clinic's treatments + prices — the precursor to
 * billing/payments (W4). Money is held as integer pence.
 */
export default async function ServicesPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("services");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let services: Awaited<ReturnType<typeof loadServices>> = [];
  if (tenantId) services = await loadServices(tenantId);

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
        actions={
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All Settings
          </Link>
        }
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          Services are per-clinic. As a Custodian you don&apos;t have a clinic of your own.
        </div>
      ) : (
        <ServicesManager initial={services} />
      )}
    </div>
  );
}

async function loadServices(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_services")
    .select("id, name, description, price_pence, duration_minutes, active")
    .eq("tenant_id", tenantId)
    .order("sort", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}
