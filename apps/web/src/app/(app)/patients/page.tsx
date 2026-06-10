import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";

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
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, date_of_birth, sex_at_birth, email, phone_mobile",
    )
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <Card>
        <CardHeader>
          <CardHeaderRow
            icon={Users}
            tone="brand"
            title="Patients"
            count={patients?.length ?? 0}
            rightSlot={
              <Link href="/patients/new">
                <Button>
                  <UserPlus /> New patient
                </Button>
              </Link>
            }
          />
        </CardHeader>
        <CardContent>
          {patients && patients.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Date of birth</th>
                  <th className="px-2 py-2 font-semibold">Sex</th>
                  <th className="px-2 py-2 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-hover"
                  >
                    <td className="px-2 py-2.5 font-medium">
                      <Link href={`/patients/${p.id}`} className="block">
                        {p.last_name}, {p.first_name}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums">
                      {fmtDob(p.date_of_birth)}{" "}
                      <span className="text-muted-foreground">
                        ({age(p.date_of_birth)}y)
                      </span>
                    </td>
                    <td className="px-2 py-2.5 capitalize">{p.sex_at_birth}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {p.email ?? p.phone_mobile ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-muted-foreground">
              No patients yet. The next one you add appears here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
