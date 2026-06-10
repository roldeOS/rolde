import { notFound } from "next/navigation";
import { FileText, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { OrdersPanel } from "@/components/OrdersPanel";
import { AiPanel } from "@/components/AiPanel";
import { TopbarPatientSync } from "@/components/topbar/TopbarContext";
import { saveNote } from "../actions";

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

/** A clinical note's title + colour follows the AUTHOR's role (Roland 2026-06-10). */
function noteKind(role: string | undefined): { label: string; tone: CardIconTone } {
  if (role === "nurse") return { label: "Nurse Note", tone: "success" };
  if (role === "chemist") return { label: "Pharmacy Note", tone: "warning" };
  if (role === "cunnere") return { label: "Lab Note", tone: "info" };
  if (["caretaker", "clinician", "locum", "custodian"].includes(role ?? ""))
    return { label: "Clinician Note", tone: "info" };
  return { label: "Note", tone: "neutral" };
}
const TONE_BADGE: Record<CardIconTone, string> = {
  critical: "bg-critical/10 text-critical",
  warning: "bg-warning/12 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  neutral: "bg-slate-500/10 text-slate-600",
  brand: "bg-foreground/8 text-foreground",
};

/** Entry families shown in the left feed vs the right orders pane. */
const ORDER_TYPES = new Set([
  "lab_order", "lab_result", "radiology_order", "radiology_result",
  "prescription", "photo_set", "consent_signed", "referral_letter",
  "discharge_summary", "sick_note", "gp_letter",
]);

/**
 * The consultation screen (Bible 4.2 §3, Roland's four-card layout). Patient
 * identity + safety flags now live in the GLOBAL topbar (published via
 * TopbarPatientSync), freeing this whole area for the four cards:
 *   ┌── Clinical Notes (75%) ──┬── Investigations + Orders (75%) ──┐
 *   ├── New note (25%) ────────┼── RolDe says… (25%) ──────────────┤
 *   └──────────────────────────┴───────────────────────────────────┘
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
    .select(
      "id, first_name, last_name, date_of_birth, sex_at_birth, nhs_number, address_line1, address_line2, city, postcode",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const { data: entries } = await supabase
    .from("patient_feed_entries")
    .select("id, entry_type, payload, created_at, created_by, updated_at")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Safety flags (Bible 4.2 §3.2) — surfaced in the topbar's red zone.
  const { data: allergies } = await supabase
    .from("patient_allergies")
    .select("substance, reaction, severity")
    .eq("patient_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("severity", { ascending: false });

  const { data: alerts } = await supabase
    .from("patient_alerts")
    .select("title, priority")
    .eq("patient_id", id)
    .eq("status", "active")
    .order("priority", { ascending: false });

  const { data: members } = await supabase
    .from("tenant_users")
    .select("user_id, display_name, role");
  const authorOf = new Map(
    (members ?? []).map((m) => [m.user_id, { name: m.display_name, role: m.role }]),
  );

  const all = entries ?? [];
  const feedEntries = all.filter((e) => !ORDER_TYPES.has(e.entry_type));
  const orderEntries = all.filter((e) => ORDER_TYPES.has(e.entry_type));

  const addressLines = [
    patient.address_line1,
    patient.address_line2,
    [patient.city, patient.postcode].filter(Boolean).join(" "),
  ].filter((l): l is string => Boolean(l && l.trim()));

  return (
    <div className="flex h-full min-h-0 flex-col p-4 pt-2">
      {/* Publish identity + safety flags + address into the global topbar. */}
      <TopbarPatientSync
        patient={{
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          dob: patient.date_of_birth,
          age: age(patient.date_of_birth),
          sex: patient.sex_at_birth,
          nhs: patient.nhs_number,
          addressLines,
          allergies: (allergies ?? []).map((a) => ({
            substance: a.substance,
            reaction: a.reaction,
            severity: a.severity,
          })),
          alerts: (alerts ?? []).map((al) => ({
            title: al.title,
            priority: al.priority,
          })),
        }}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Top-left — Clinical Notes: a card of note cards */}
          <section className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-xl bg-card shadow-float">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
              <CardIcon icon={FileText} tone="info" variant="badge" size="sm" />
              <span className="text-sm font-semibold">Clinical Notes</span>
              <span className="rounded-full bg-info/10 px-1.5 text-xs font-medium text-info tabular-nums">
                {feedEntries.length}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
              {feedEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No notes yet. The next one you save appears here.
                </p>
              ) : (
                feedEntries.map((e) => {
                  const text = (e.payload as { text?: string } | null)?.text ?? "";
                  const author = authorOf.get(e.created_by ?? "");
                  const kind =
                    e.entry_type === "clinical_note"
                      ? noteKind(author?.role)
                      : { label: e.entry_type.replace(/_/g, " "), tone: "neutral" as CardIconTone };
                  return (
                    <article
                      key={e.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TONE_BADGE[kind.tone]}`}
                        >
                          {kind.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fmtTime(e.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{text}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {author?.name ?? "—"}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Bottom-left — the note composer */}
          <section className="flex min-h-0 flex-[1] flex-col overflow-hidden rounded-xl bg-card shadow-float">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
              <CardIcon icon={PenLine} tone="brand" variant="badge" size="sm" />
              <span className="text-sm font-semibold">New note</span>
            </div>
            <form action={saveNote} className="flex min-h-0 flex-1 flex-col gap-2 p-4">
              <input type="hidden" name="patient_id" value={patient.id} />
              <textarea
                name="text"
                required
                placeholder={`Note for ${patient.first_name}…`}
                className="min-h-0 w-full flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="flex shrink-0 justify-end">
                <Button type="submit">Save note</Button>
              </div>
            </form>
          </section>
        </div>

        {/* Right column */}
        <div className="flex min-h-0 flex-col gap-3">
          <section className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-xl bg-card pt-2.5 shadow-float">
            <OrdersPanel entries={orderEntries} />
          </section>
          <section className="flex min-h-0 flex-[1] flex-col overflow-hidden rounded-xl bg-card pt-2.5 pb-3 shadow-float">
            <AiPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
