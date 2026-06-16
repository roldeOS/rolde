import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { NewPatientForm } from "@/components/patients/NewPatientForm";

/**
 * New patient — registration with the regulatory MINIMUM only (Roland 2026-06-11;
 * GMC/CQC/NHS PDS): name, DOB, sex, mobile, email — all required. The rest of the
 * demographic record is filled later. The RolDe patient number auto-assigns.
 */
export default function NewPatientPage() {
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
          <NewPatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
