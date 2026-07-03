"use client";

import { useState } from "react";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { createPatient } from "@/app/(app)/patients/actions";
import {
  asCountry,
  dobOk,
  emailOk,
  phoneOk,
  phoneHint,
  phoneMaxLen,
  sanitisePhone,
  nationalIdOk,
  nationalIdLabel,
  nationalIdHint,
} from "@/lib/validation";



/**
 * New-patient form (Roland 2026-06-11): controlled, with LIVE validation — each
 * field shows its green-tick squircle the moment it's valid. Submits through the
 * createPatient server action; the RolDe number auto-assigns on the server.
 */
export function NewPatientForm({ country: countryProp = "GB" }: { country?: string }) {
  const country = asCountry(countryProp);
  const [v, setV] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex_at_birth: "",
    phone_mobile: "",
    email: "",
    national_health_id: "",
  });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  // Country-aware (the clinic's country, Settings → Clinic Profile) — the
  // same shared rules the Profile overlay uses (2026-07-03).
  const ok = {
    first_name: v.first_name.trim().length >= 1,
    last_name: v.last_name.trim().length >= 1,
    date_of_birth: dobOk(v.date_of_birth),
    sex_at_birth: !!v.sex_at_birth,
    phone_mobile: phoneOk(v.phone_mobile, country),
    email: emailOk(v.email),
    national_health_id: v.national_health_id === "" || nationalIdOk(v.national_health_id, country),
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
          maxLength={phoneMaxLen(country)}
          onChange={(e) =>
            setV((s) => ({ ...s, phone_mobile: sanitisePhone(e.target.value) }))
          }
          valid={ok.phone_mobile}
          placeholder={phoneHint(country)}
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

      <Field label={nationalIdLabel(country)} htmlFor="national_health_id" hint={`(optional) ${nationalIdHint(country)}`}>
        <Input
          id="national_health_id"
          name="national_health_id"
          inputMode="numeric"
          value={v.national_health_id}
          onChange={set("national_health_id")}
          valid={v.national_health_id !== "" && ok.national_health_id}
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
