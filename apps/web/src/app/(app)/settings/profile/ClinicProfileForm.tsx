"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export type ClinicProfile = {
  name: string;
  legal_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  ico_registration: string | null;
  his_registration: string | null;
  cqc_registration: string | null;
};

/**
 * Settings → Clinic Profile (Caretaker, Bible 4.3 §5). The clinic's identity,
 * contact details and regulator registrations — the fields that appear across
 * RolDe, invoices and letters. Saves through the column-scoped clinic-profile
 * route; the clinic itself comes from the session server-side.
 */
export function ClinicProfileForm({ profile }: { profile: ClinicProfile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name,
    legal_name: profile.legal_name,
    contact_email: profile.contact_email ?? "",
    contact_phone: profile.contact_phone ?? "",
    address_line1: profile.address_line1 ?? "",
    address_line2: profile.address_line2 ?? "",
    city: profile.city ?? "",
    postcode: profile.postcode ?? "",
    ico_registration: profile.ico_registration ?? "",
    his_registration: profile.his_registration ?? "",
    cqc_registration: profile.cqc_registration ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const canSave = form.name.trim() !== "" && form.legal_name.trim() !== "";

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/clinic-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(data.error ?? "Couldn’t save your changes.");
      }
    } catch {
      setError("Couldn’t save your changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Identity */}
      <section className="space-y-4 rounded-xl bg-card p-6 shadow-float">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic Name" htmlFor="name" required hint="Shown across RolDe OS">
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={form.name.trim() === ""}
            />
          </Field>
          <Field label="Legal Name" htmlFor="legal_name" required hint="On invoices & letters">
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => set("legal_name", e.target.value)}
              error={form.legal_name.trim() === ""}
            />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4 rounded-xl bg-card p-6 shadow-float">
        <h2 className="font-heading text-sm font-semibold tracking-tight">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="contact_email">
            <Input
              id="contact_email"
              type="email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="hello@yourclinic.co.uk"
            />
          </Field>
          <Field label="Phone" htmlFor="contact_phone">
            <Input
              id="contact_phone"
              value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="020 7946 0000"
            />
          </Field>
        </div>
        <Field label="Address Line 1" htmlFor="address_line1">
          <Input
            id="address_line1"
            value={form.address_line1}
            onChange={(e) => set("address_line1", e.target.value)}
          />
        </Field>
        <Field label="Address Line 2" htmlFor="address_line2">
          <Input
            id="address_line2"
            value={form.address_line2}
            onChange={(e) => set("address_line2", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City / Town" htmlFor="city">
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input
              id="postcode"
              value={form.postcode}
              onChange={(e) => set("postcode", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* Registrations */}
      <section className="space-y-4 rounded-xl bg-card p-6 shadow-float">
        <div>
          <h2 className="font-heading text-sm font-semibold tracking-tight">Registrations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your data-protection and regulator numbers — printed where compliance requires.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ICO" htmlFor="ico_registration" hint="Data protection">
            <Input
              id="ico_registration"
              value={form.ico_registration}
              onChange={(e) => set("ico_registration", e.target.value)}
              placeholder="ZA000000"
            />
          </Field>
          <Field label="CQC" htmlFor="cqc_registration" hint="England">
            <Input
              id="cqc_registration"
              value={form.cqc_registration}
              onChange={(e) => set("cqc_registration", e.target.value)}
            />
          </Field>
          <Field label="HIS" htmlFor="his_registration" hint="Scotland">
            <Input
              id="his_registration"
              value={form.his_registration}
              onChange={(e) => set("his_registration", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || !canSave}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="text-xs text-success">Saved</span>}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}
