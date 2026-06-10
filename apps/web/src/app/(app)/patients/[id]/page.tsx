import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrdersPanel } from "@/components/OrdersPanel";
import { AiPanel } from "@/components/AiPanel";
import { saveNote } from "../actions";

function fmtDob(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function age(d: string) {
  const dob = new Date(d);
  const now = new Date();
  let a = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
  return a;
}
function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Entry families shown in the left feed vs the right orders pane. */
const ORDER_TYPES = new Set([
  "lab_order",
  "lab_result",
  "radiology_order",
  "radiology_result",
  "prescription",
  "photo_set",
  "consent_signed",
  "referral_letter",
  "discharge_summary",
  "sick_note",
  "gp_letter",
]);

/**
 * The consultation screen (Bible 4.2 §3, Roland's four-card layout):
 *   top strip (patient context, always visible)
 *   ┌──────────────────────────┬──────────────────────────┐
 *   │ Clinical record (75%)    │ Investigations + orders   │
 *   │ — feed of entry cards    │ (75%) — tabbed            │
 *   ├──────────────────────────┼──────────────────────────┤
 *   │ Note composer (25%)      │ RolDe panel (25%)         │
 *   └──────────────────────────┴──────────────────────────┘
 */
export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, sex_at_birth, nhs_number")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const { data: entries } = await supabase
    .from("patient_feed_entries")
    .select("id, entry_type, payload, created_at, created_by")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Safety flags — allergies + active alerts for the top strip (Bible 4.2 §3.2:
  // red text with red dot indicator, NEVER hidden).
  const { data: allergies } = await supabase
    .from("patient_allergies")
    .select("id, substance, reaction, severity")
    .eq("patient_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("severity", { ascending: false });

  const { data: alerts } = await supabase
    .from("patient_alerts")
    .select("id, title, priority")
    .eq("patient_id", id)
    .eq("status", "active")
    .order("priority", { ascending: false });

  const { data: members } = await supabase
    .from("tenant_users")
    .select("user_id, display_name");
  const authorOf = new Map(
    (members ?? []).map((m) => [m.user_id, m.display_name]),
  );

  const all = entries ?? [];
  const feedEntries = all.filter((e) => !ORDER_TYPES.has(e.entry_type));
  const orderEntries = all.filter((e) => ORDER_TYPES.has(e.entry_type));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top strip — patient context, never scrolls away (Bible 4.2 §3.2) */}
      <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Patients
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="text-lg font-semibold tracking-tight">
            {patient.first_name} {patient.last_name}
          </span>
          <span className="text-sm text-muted-foreground">
            {fmtDob(patient.date_of_birth)} · {age(patient.date_of_birth)}y ·{" "}
            <span className="capitalize">{patient.sex_at_birth}</span>
          </span>

          {/* Critical flags — never hidden (Bible 4.2 §3.2) */}
          {(allergies?.length ?? 0) > 0 && (
            <span
              className="flex items-center gap-1.5 text-sm font-medium text-critical"
              title={allergies!
                .map((a) => `${a.substance} — ${a.reaction} (${a.severity.replace(/_/g, " ")})`)
                .join("; ")}
            >
              <span className="size-2 shrink-0 rounded-full bg-critical" />
              {allergies!.map((a) => a.substance).join(" · ")}
            </span>
          )}
          {(alerts ?? []).map((al) => (
            <span
              key={al.id}
              className={
                al.priority === "critical"
                  ? "rounded-full bg-critical/10 px-2 py-0.5 text-xs font-medium text-critical"
                  : al.priority === "warning"
                    ? "rounded-full bg-warning/12 px-2 py-0.5 text-xs font-medium text-warning"
                    : "rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info"
              }
            >
              {al.title}
            </span>
          ))}
        </div>
        {patient.nhs_number && (
          <span className="font-mono text-xs text-muted-foreground">
            NHS {patient.nhs_number}
          </span>
        )}
      </header>

      {/* The four cards */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Top-left (75%) — the clinical record: a card of cards */}
          <section className="flex min-h-0 flex-[3] flex-col rounded-xl bg-card shadow-float">
            <div className="shrink-0 border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold">Clinical record</span>
              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                {feedEntries.length} entries
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
              {feedEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No entries yet. The next note you save appears here.
                </p>
              ) : (
                feedEntries.map((e) => {
                  const text =
                    (e.payload as { text?: string } | null)?.text ?? "";
                  return (
                    <article
                      key={e.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium capitalize">
                          {e.entry_type.replace(/_/g, " ")}
                        </span>
                        <span>{fmtTime(e.created_at)}</span>
                      </div>
                      <p className="mt-1.5 text-sm whitespace-pre-wrap">
                        {text}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {authorOf.get(e.created_by ?? "") ?? "—"}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Bottom-left (25%) — the note composer card */}
          <section className="flex min-h-0 flex-[1] flex-col rounded-xl bg-card shadow-float">
            <form
              action={saveNote}
              className="flex h-full flex-col gap-2 p-4"
            >
              <input type="hidden" name="patient_id" value={patient.id} />
              <textarea
                name="text"
                required
                placeholder={`Note for ${patient.first_name}…`}
                className="min-h-0 w-full flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="flex shrink-0 justify-end">
                <Button type="submit">Save</Button>
              </div>
            </form>
          </section>
        </div>

        {/* Right column */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Top-right (75%) — investigations + orders, tabbed */}
          <section className="flex min-h-0 flex-[3] flex-col rounded-xl bg-card pt-2.5 shadow-float">
            <OrdersPanel entries={orderEntries} />
          </section>

          {/* Bottom-right (25%) — the RolDe panel */}
          <section className="flex min-h-0 flex-[1] flex-col rounded-xl bg-card pt-2.5 pb-3 shadow-float">
            <AiPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
