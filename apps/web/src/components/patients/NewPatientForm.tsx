"use client";

import { useState } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { createPatient } from "@/app/(app)/patients/actions";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * New-patient form (Roland 2026-06-11): controlled, with LIVE validation — each
 * field shows its green-tick squircle the moment it's valid. Submits through the
 * createPatient server action; the RolDe number auto-assigns on the server.
 */
export function NewPatientForm() {
  const [v, setV] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex_at_birth: "",
    phone_mobile: "",
    email: "",
    nhs_number: "",
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const ok = {
    first_name: v.first_name.trim().length >= 1,
    last_name: v.last_name.trim().length >= 1,
    date_of_birth: !!v.date_of_birth && new Date(v.date_of_birth) < new Date(),
    sex_at_birth: !!v.sex_at_birth,
    phone_mobile: v.phone_mobile.replace(/\D/g, "").length >= 7,
    email: EMAIL.test(v.email),
    nhs_number: v.nhs_number === "" || v.nhs_number.replace(/\D/g, "").length === 10,
  };

  return (
    <form action={createPatient} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" htmlFor="first_name" required>
          <Input
            id="first_name"
            name="first_name"
            value={v.first_name}
            onChange={set("first_name")}
            valid={ok.first_name}
            autoComplete="off"
          />
        </Field>
        <Field label="Last Name" htmlFor="last_name" required>
          <Input
            id="last_name"
            name="last_name"
            value={v.last_name}
            onChange={set("last_name")}
            valid={ok.last_name}
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date Of Birth" htmlFor="date_of_birth" required>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={v.date_of_birth}
            onChange={set("date_of_birth")}
            valid={ok.date_of_birth}
          />
        </Field>
        <Field label="Sex At Birth" htmlFor="sex_at_birth" required>
          <Select
            id="sex_at_birth"
            name="sex_at_birth"
            value={v.sex_at_birth}
            onChange={(value) => setV((s) => ({ ...s, sex_at_birth: value }))}
            valid={ok.sex_at_birth}
          >
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
          value={v.phone_mobile}
          onChange={set("phone_mobile")}
          valid={ok.phone_mobile}
          placeholder="07700 900000"
        />
      </Field>

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          value={v.email}
          onChange={set("email")}
          valid={ok.email}
          placeholder="name@example.com"
        />
      </Field>

      <Field label="NHS Number" htmlFor="nhs_number" hint="(optional)">
        <Input
          id="nhs_number"
          name="nhs_number"
          inputMode="numeric"
          value={v.nhs_number}
          onChange={set("nhs_number")}
          valid={v.nhs_number !== "" && ok.nhs_number}
          placeholder="000 000 0000"
        />
      </Field>

      <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <Hash className="size-3.5 shrink-0" />
        A RolDe OS patient number is assigned automatically on registration.
      </p>

      <Button type="submit" size="lg" className="w-full">
        Register Patient
      </Button>
    </form>
  );
}
