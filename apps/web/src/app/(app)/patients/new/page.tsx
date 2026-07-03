import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { NewPatientForm } from "@/components/patients/NewPatientForm";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";

/**
 * New patient — registration with the regulatory MINIMUM only (Roland 2026-06-11;
 * GMC/CQC/NHS PDS): name, DOB, sex, mobile, email — all required. The rest of the
 * demographic record is filled later. The RolDe patient number auto-assigns.
 */
export default async function NewPatientPage() {
  // The clinic's country drives phone-format validation (2026-07-03).
  const ctx = await getSessionContext();
  let country = "GB";
  if (ctx?.membership?.tenant_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("country")
      .eq("id", ctx.membership.tenant_id)
      .maybeSingle();
    if (data?.country) country = data.country;
  }
  return (
    <div className="mx-auto w-full max-w-md p-8">
      <Link
        href="/patients"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Patients
      </Link>

      <Card className="mt-3">
        <CardHeader>
          <CardHeaderRow
            icon={UserPlus}
            tone="brand"
            title="New Patient"
            description="Just the essentials to register — the record fills in from here."
          />
        </CardHeader>
        <CardContent>
          <NewPatientForm country={country} />
        </CardContent>
      </Card>
    </div>
  );
}
