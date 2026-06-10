import Link from "next/link";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

export default async function PatientsPage() {
  const ctx = await getSessionContext();
  const clinic = ctx?.membership?.tenants?.name ?? "Your clinic";

  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth, sex_at_birth, email, phone_mobile")
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-muted hover:underline">
            ← {clinic}
          </Link>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
            Patients
          </h1>
          <p className="text-sm text-muted">{patients?.length ?? 0} patients</p>
        </div>
        <Link
          href="/patients/new"
          className="flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + New patient
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        {patients && patients.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-muted">
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Date of birth</th>
                <th className="p-3 font-semibold">Sex</th>
                <th className="p-3 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/patients/${p.id}`}
                      className="hover:underline"
                    >
                      {p.last_name}, {p.first_name}
                    </Link>
                  </td>
                  <td className="p-3 tabular-nums">
                    {fmtDob(p.date_of_birth)}{" "}
                    <span className="text-muted">({age(p.date_of_birth)}y)</span>
                  </td>
                  <td className="p-3 capitalize">{p.sex_at_birth}</td>
                  <td className="p-3 text-muted">
                    {p.email ?? p.phone_mobile ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-10 text-center text-muted">
            No patients yet. The next one you add appears here.
          </p>
        )}
      </div>
    </main>
  );
}
