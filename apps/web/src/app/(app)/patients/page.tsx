import { createClient } from "@/lib/supabase/server";
import { PatientsTable, type PatientRow } from "@/components/patients/PatientsTable";
import { requireModuleAccess } from "@/lib/auth";

export default async function PatientsPage() {
  await requireModuleAccess("patients");
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select(
      "id, patient_number, first_name, last_name, date_of_birth, sex_at_birth, phone_mobile, email, status, has_active_alerts, created_at",
    )
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  return <PatientsTable rows={(patients ?? []) as PatientRow[]} />;
}
