import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: members } = await supabase
    .from("tenant_users")
    .select("user_id, display_name");
  const authorOf = new Map(
    (members ?? []).map((m) => [m.user_id, m.display_name]),
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Top strip — always-visible patient context */}
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/patients" className="text-sm text-muted hover:underline">
              ← Patients
            </Link>
            <span className="h-4 w-px bg-border" />
            <span className="font-serif text-lg font-semibold tracking-tight">
              {patient.first_name} {patient.last_name}
            </span>
            <span className="text-sm text-muted">
              {fmtDob(patient.date_of_birth)} · {age(patient.date_of_birth)}y ·{" "}
              <span className="capitalize">{patient.sex_at_birth}</span>
            </span>
          </div>
          {patient.nhs_number && (
            <span className="font-mono text-xs text-muted">
              NHS {patient.nhs_number}
            </span>
          )}
        </div>
      </header>

      {/* Feed — oldest top, newest bottom (Bible 4.2 §3.4) */}
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-3 p-6">
        {!entries || entries.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
            No entries yet. The next note you save appears here.
          </p>
        ) : (
          entries.map((e) => {
            const text = (e.payload as { text?: string } | null)?.text ?? "";
            return (
              <article
                key={e.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-medium capitalize">
                    {e.entry_type.replace(/_/g, " ")}
                  </span>
                  <span>{fmtTime(e.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                  {text}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {authorOf.get(e.created_by ?? "") ?? "—"}
                </p>
              </article>
            );
          })
        )}
      </div>

      {/* Note composer — server action; works without client JS */}
      <div className="border-t border-border bg-surface px-6 py-4">
        <form action={saveNote} className="mx-auto flex max-w-3xl items-end gap-3">
          <input type="hidden" name="patient_id" value={patient.id} />
          <textarea
            name="text"
            required
            rows={2}
            placeholder={`Note for ${patient.first_name}…`}
            className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/15"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-foreground px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
