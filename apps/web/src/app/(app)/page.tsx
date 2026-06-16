import Link from "next/link";
import { Users, TriangleAlert, FileText, CalendarPlus, Building2, UserRoundCheck } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { StatTile } from "@/components/ui/StatTile";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function monthStartISO() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString();
}

/**
 * Overview — the at-a-glance check-in (mindate ancestry, Roland 2026-06-11):
 * a warm greeting, a row of REAL stat tiles (never faked), then a list.
 * A Custodian gets the PLATFORM overview (Control → Overview, W1.5.2 Chunk 2);
 * everyone else gets their clinic's. Tiles for systems not built yet
 * (escalations, errors, storage, health) are omitted, not invented.
 */
export default async function Home() {
  const ctx = await getSessionContext();
  const name =
    ctx?.membership?.display_name ?? ctx?.custodian?.display_name ?? ctx?.user.email ?? "there";
  const custodianOnly = !!ctx?.isCustodian && !ctx?.membership;
  const supabase = await createClient();

  // ─────────────────────────────── Custodian: the platform God-View ──────────
  if (custodianOnly) {
    const [clinicsQ, patientsQ, staffQ, notesQ, newClinicsQ, clinicRowsQ, patientTenantsQ] =
      await Promise.all([
        supabase.from("tenants").select("*", { count: "exact", head: true }),
        supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("tenant_users").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("patient_feed_entries").select("*", { count: "exact", head: true }).eq("entry_type", "clinical_note").is("deleted_at", null),
        supabase.from("tenants").select("*", { count: "exact", head: true }).gte("created_at", monthStartISO()),
        supabase.from("tenants").select("id, name, slug, status").order("created_at", { ascending: true }),
        supabase.from("patients").select("tenant_id").is("deleted_at", null),
      ]);

    const clinics = clinicRowsQ.data ?? [];
    const perClinic = (patientTenantsQ.data ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.tenant_id] = (acc[p.tenant_id] ?? 0) + 1;
      return acc;
    }, {});
    const newThisMonth = newClinicsQ.count ?? 0;

    return (
      <div className="w-full space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your platform today.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            icon={Building2}
            tone="brand"
            label="Clinics"
            value={clinicsQ.count ?? 0}
            sub={newThisMonth ? `+${newThisMonth} this month` : undefined}
            href="/custodian/clinics"
          />
          <StatTile icon={Users} tone="info" label="Patients" value={patientsQ.count ?? 0} />
          <StatTile icon={UserRoundCheck} tone="success" label="Active Staff" value={staffQ.count ?? 0} />
          <StatTile icon={FileText} tone="neutral" label="Clinical Notes" value={notesQ.count ?? 0} />
        </div>

        <Card>
          <CardHeader>
            <CardHeaderRow
              icon={Building2}
              tone="info"
              title="Clinics"
              rightSlot={
                <Link
                  href="/custodian/clinics"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  View All
                </Link>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {clinics.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No clinics yet.</p>
              ) : (
                clinics.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                        {c.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {perClinic[c.id] ?? 0} {(perClinic[c.id] ?? 0) === 1 ? "patient" : "patients"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────── Clinic operator: the clinic ──────────
  const clinic = ctx?.membership?.tenants?.name ?? "your clinic";
  const monthStart = monthStartISO();

  const [totalQ, monthQ, alertsQ, notesQ, recentQ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", monthStart),
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("has_active_alerts", true),
    supabase.from("patient_feed_entries").select("*", { count: "exact", head: true }).eq("entry_type", "clinical_note").is("deleted_at", null),
    supabase.from("patients").select("id, first_name, last_name, date_of_birth, patient_number").is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
  ]);

  const recent = recentQ.data ?? [];

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s {clinic} today.</p>
      </div>

      {/* Stat tiles — real metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} tone="brand" label="Patients" value={totalQ.count ?? 0} href="/patients" />
        <StatTile icon={CalendarPlus} tone="success" label="New This Month" value={monthQ.count ?? 0} />
        <StatTile icon={TriangleAlert} tone="critical" label="Needs Attention" value={alertsQ.count ?? 0} sub="Active Alerts" href="/patients" />
        <StatTile icon={FileText} tone="info" label="Clinical Notes" value={notesQ.count ?? 0} />
      </div>

      {/* Recently registered */}
      <div>
        <Card>
          <CardHeader>
            <CardHeaderRow
              icon={Users}
              tone="info"
              title="Recently Registered"
              rightSlot={
                <Link href="/patients/new" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  + New Patient
                </Link>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {recent.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No patients yet.</p>
              ) : (
                recent.map((p) => (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-hover"
                  >
                    <span className="text-sm font-medium">
                      {p.last_name}, {p.first_name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{p.patient_number}</span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
