import Link from "next/link";
import { UserPlus, Hash } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardHeaderRow } from "@/components/ui/CardHeaderRow";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { createPatient } from "../actions";

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
            title="New patient"
            description="Just the essentials to register — the record fills in from here."
          />
        </CardHeader>
        <CardContent>
          <form action={createPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" htmlFor="first_name" required>
                <Input id="first_name" name="first_name" required autoComplete="off" />
              </Field>
              <Field label="Last name" htmlFor="last_name" required>
                <Input id="last_name" name="last_name" required autoComplete="off" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth" htmlFor="date_of_birth" required>
                <Input id="date_of_birth" name="date_of_birth" type="date" required />
              </Field>
              <Field label="Sex at birth" htmlFor="sex_at_birth" required>
                <Select id="sex_at_birth" name="sex_at_birth" required defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="unknown">Unknown</option>
                </Select>
              </Field>
            </div>

            <Field label="Mobile" htmlFor="phone_mobile" required>
              <Input
                id="phone_mobile"
                name="phone_mobile"
                type="tel"
                inputMode="tel"
                required
                placeholder="07700 900000"
              />
            </Field>

            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
              />
            </Field>

            <Field label="NHS number" htmlFor="nhs_number" hint="(optional)">
              <Input
                id="nhs_number"
                name="nhs_number"
                inputMode="numeric"
                placeholder="000 000 0000"
              />
            </Field>

            <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Hash className="size-3.5 shrink-0" />
              A RolDe patient number is assigned automatically on registration.
            </p>

            <Button type="submit" size="lg" className="w-full">
              Register patient
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
