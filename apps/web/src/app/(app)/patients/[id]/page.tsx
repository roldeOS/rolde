import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-full flex-col">
      {/* Top strip — always-visible patient context (Bible 4.2 §3.2) */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/patients"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Patients
            </Link>
            <span className="h-4 w-px bg-border" />
            <span className="font-heading text-lg font-semibold tracking-tight">
              {patient.first_name} {patient.last_name}
            </span>
            <span className="text-sm text-muted-foreground">
              {fmtDob(patient.date_of_birth)} · {age(patient.date_of_birth)}y ·{" "}
              <span className="capitalize">{patient.sex_at_birth}</span>
            </span>
          </div>
          {patient.nhs_number && (
            <span className="font-mono text-xs text-muted-foreground">
              NHS {patient.nhs_number}
            </span>
          )}
        </div>
      </header>

      {/* Feed — oldest top, newest bottom (Bible 4.2 §3.4) */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-3 p-6">
          {!entries || entries.length === 0 ? (
            <p className="rounded-xl bg-card p-10 text-center text-muted-foreground shadow-float">
              No entries yet. The next note you save will appear here.
            </p>
          ) : (
            entries.map((e) => {
              const text = (e.payload as { text?: string } | null)?.text ?? "";
              return (
                <article
                  key={e.id}
                  className="rounded-xl bg-card p-4 shadow-float"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium capitalize">
                      {e.entry_type.replace(/_/g, " ")}
                    </span>
                    <span>{fmtTime(e.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
                    {text}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {authorOf.get(e.created_by ?? "") ?? "—"}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Note composer — server action; resilient without client JS */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-4">
        <form
          action={saveNote}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <input type="hidden" name="patient_id" value={patient.id} />
          <textarea
            name="text"
            required
            rows={2}
            placeholder={`Note for ${patient.first_name}…`}
            className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <Button type="submit" size="lg">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
