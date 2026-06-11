import Link from "next/link";
import { Users, TriangleAlert, FileText, CalendarPlus } from "lucide-react";
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

/**
 * Overview — the clinic's at-a-glance check-in (mindate Overview ancestry,
 * Roland 2026-06-11): a warm greeting, a row of stat tiles (REAL metrics only),
 * then "Recently registered" + "Needs attention". Tiles for modules we haven't
 * built yet aren't faked — we show what we actually have.
 */
export default async function Home() {
  const ctx = await getSessionContext();
  const name = ctx?.membership?.display_name ?? ctx?.user.email ?? "there";
  const clinic = ctx?.membership?.tenants?.name ?? "your clinic";
  const supabase = await createClient();

  const monthStart = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1).toISOString();
  })();

  const [totalQ, monthQ, alertsQ, notesQ, recentQ, attentionQ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null).gte("created_at", monthStart),
    supabase.from("patients").select("*", { count: "exact", head: true }).is("deleted_at", null).eq("has_active_alerts", true),
    supabase.from("patient_feed_entries").select("*", { count: "exact", head: true }).eq("entry_type", "clinical_note").is("deleted_at", null),
    supabase.from("patients").select("id, first_name, last_name, date_of_birth, patient_number").is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("patients").select("id, first_name, last_name, patient_number").is("deleted_at", null).eq("has_active_alerts", true).limit(6),
  ]);

  const recent = recentQ.data ?? [];
  const attention = attentionQ.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s {clinic} today.
        </p>
      </div>

      {/* Stat tiles — real metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} tone="brand" label="Patients" value={totalQ.count ?? 0} href="/patients" />
        <StatTile icon={CalendarPlus} tone="success" label="New this month" value={monthQ.count ?? 0} />
        <StatTile icon={TriangleAlert} tone="critical" label="Needs attention" value={alertsQ.count ?? 0} sub="active alerts" href="/patients" />
        <StatTile icon={FileText} tone="info" label="Clinical notes" value={notesQ.count ?? 0} />
      </div>

      {/* Recently registered + Needs attention */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardHeaderRow
              icon={Users}
              tone="info"
              title="Recently registered"
              rightSlot={
                <Link href="/patients/new" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  + New patient
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
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.patient_number}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderRow icon={TriangleAlert} tone="critical" title="Needs attention" count={attention.length} />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/50">
              {attention.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No active alerts. All clear.
                </p>
              ) : (
                attention.map((p) => (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-hover"
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <TriangleAlert className="size-3.5 text-critical" />
                      {p.last_name}, {p.first_name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.patient_number}
                    </span>
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
