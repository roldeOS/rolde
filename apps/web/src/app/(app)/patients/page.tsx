import { createClient } from "@/lib/supabase/server";
import { PatientsTable, type PatientRow } from "@/components/patients/PatientsTable";

export default async function PatientsPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("patients")
    .select(
      "id, patient_number, first_name, last_name, date_of_birth, sex_at_birth, phone_mobile, email, has_active_alerts",
    )
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  return <PatientsTable rows={(patients ?? []) as PatientRow[]} />;
}
