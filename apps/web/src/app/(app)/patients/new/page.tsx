import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";
import { createPatient } from "../actions";

const inputClass =
  "mt-1 h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
const labelClass = "block text-xs font-medium text-muted-foreground";

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
            title="New patient"
            description="Registration — minimal details to start the record"
          />
        </CardHeader>
        <CardContent>
          <form action={createPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className={labelClass}>
                  First name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="last_name" className={labelClass}>
                  Last name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="date_of_birth" className={labelClass}>
                Date of birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="sex_at_birth" className={labelClass}>
                Sex at birth
              </label>
              <select
                id="sex_at_birth"
                name="sex_at_birth"
                required
                className={inputClass}
              >
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="font-normal">(optional)</span>
              </label>
              <input id="email" name="email" type="email" className={inputClass} />
            </div>

            <div>
              <label htmlFor="phone_mobile" className={labelClass}>
                Mobile <span className="font-normal">(optional)</span>
              </label>
              <input id="phone_mobile" name="phone_mobile" className={inputClass} />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Add patient
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
