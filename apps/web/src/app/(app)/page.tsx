import Link from "next/link";
import { Users, UserPlus } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";
import { TYPE } from "@/lib/typography";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * The clinic dashboard — calm by construction (Bible 4.2 §6.1): a time-aware
 * greeting, ONE focal card, a quiet quick-actions row. No counters, no badges,
 * no noise. (Today's appointments replace the recent-patients card when the
 * calendar module lands.)
 */
export default async function Home() {
  const ctx = await getSessionContext();
  const name = ctx?.membership?.display_name ?? ctx?.user.email ?? "there";

  const supabase = await createClient();
  const { data: patients, count } = await supabase
    .from("patients")
    .select("id, first_name, last_name, date_of_birth", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <h1 className={TYPE.display}>
        {greeting()}, {name}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You have {count ?? 0} registered patients.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardHeaderRow
            icon={Users}
            tone="brand"
            title="Patients"
            count={count ?? 0}
            description="Most recently registered"
          />
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {(patients ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-hover"
              >
                <span className="text-sm font-medium">
                  {p.last_name}, {p.first_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.date_of_birth).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Quick actions
        </span>
        <Link href="/patients/new">
          <Button variant="outline" size="sm">
            <UserPlus /> New patient
          </Button>
        </Link>
        <Link href="/patients">
          <Button variant="ghost" size="sm">
            All patients
          </Button>
        </Link>
      </div>
    </div>
  );
}
