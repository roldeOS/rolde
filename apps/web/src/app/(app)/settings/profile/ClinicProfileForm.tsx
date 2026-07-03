"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Trash2, TriangleAlert } from "lucide-react";
import { Field, Input } from "@/components/ui/form";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { describeSave, diffFields } from "@/lib/changeDescriber";
import { CLINIC_PROFILE_FIELDS } from "@/lib/auditFields";
import { Select } from "@/components/ui/Select";
import { COUNTRIES, asCountry } from "@/lib/validation";
import { cn } from "@/lib/utils";

export type ClinicProfile = {
  name: string;
  legal_name: string;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  ico_registration: string | null;
  his_registration: string | null;
  cqc_registration: string | null;
  logo_svg: string | null;
  logo_svg_dark: string | null;
  logo_png: string | null;
};

/** Rasterise an SVG → PNG data-URL in the browser (canvas), so the PDF Kit can
 *  render the logo without a server-side image lib. 2× for crispness. */
function svgToPng(svg: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const w = Math.round((img.naturalWidth || 600) * scale);
      const h = Math.round((img.naturalHeight || 200) * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      try {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  });
}

/**
 * Settings → Clinic Profile (Caretaker, Bible 4.3 §5). The clinic's identity,
 * contact details and regulator registrations — the fields that appear across
 * RolDe, invoices and letters. Saves through the column-scoped clinic-profile
 * route; the clinic itself comes from the session server-side.
 */
export function ClinicProfileForm({ profile }: { profile: ClinicProfile }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();
  const initial = {
    name: profile.name,
    legal_name: profile.legal_name,
    country: asCountry(profile.country),
    contact_email: profile.contact_email ?? "",
    contact_phone: profile.contact_phone ?? "",
    address_line1: profile.address_line1 ?? "",
    address_line2: profile.address_line2 ?? "",
    city: profile.city ?? "",
    postcode: profile.postcode ?? "",
    ico_registration: profile.ico_registration ?? "",
    his_registration: profile.his_registration ?? "",
    cqc_registration: profile.cqc_registration ?? "",
    logo_svg: profile.logo_svg ?? "",
    logo_svg_dark: profile.logo_svg_dark ?? "",
    logo_png: profile.logo_png ?? "",
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Brand logos (SVG) — two variants: light-bg (coloured) + dark-bg (white) ──
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoWarning, setLogoWarning] = useState<string | null>(null);

  function makeLogoHandler(key: "logo_svg" | "logo_svg_dark") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setLogoError(null);
      setLogoWarning(null);
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-picking the same file
      if (!file) return;
      if (!/svg/i.test(file.type) && !/\.svg$/i.test(file.name)) {
        return setLogoError("Please choose an SVG file.");
      }
      if (file.size > 256 * 1024) {
        return setLogoError("That SVG is over 256 KB — please use a smaller logo.");
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        if (!/<svg[\s>]/i.test(text)) return setLogoError("That file doesn't look like an SVG.");
        // Warn (don't block) if the SVG still has LIVE TEXT rather than outlined
        // shapes — the font may be missing when it prints (Roland 2026-06-21).
        if (/<text[\s>]/i.test(text)) {
          setLogoWarning(
            "Heads up — this SVG has live text, not outlines. Convert the text to outlines / shapes in your design tool and re-upload, or the font may be missing when it prints.",
          );
        }
        set(key, text);
        // The light logo also gets rasterised to a PNG here in the browser — the PDF
        // Kit renders that (the lambda can't rasterise SVG). The dark variant isn't
        // used in PDFs, so it needs no PNG.
        if (key === "logo_svg") {
          svgToPng(text).then((png) => {
            if (png) set("logo_png", png);
          });
        }
      };
      reader.onerror = () => setLogoError("Couldn't read that file.");
      reader.readAsText(file);
    };
  }

  // Render the (untrusted) SVG sandboxed as an <img> data-URL — it can't run
  // script or reach the page this way.
  const logoSrc = (svg: string) =>
    svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : null;

  const canSave = form.name.trim() !== "" && form.legal_name.trim() !== "";
  const dirty =
    canSave &&
    (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k] !== initial[k]);

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
        // Precise, conversational save line — names exactly what changed.
        const changes = diffFields(initial, form, CLINIC_PROFILE_FIELDS);
        flashSaved(describeSave(changes, "clinic profile"));
        router.refresh();
      } else {
        setError(data.error ?? "RolDe couldn’t save your changes.");
      }
    } catch {
      setError("RolDe couldn’t save your changes.");
    } finally {
      setSaving(false);
    }
  }

  // Drive the shared save-confirmation bar (§1.12) + the unsaved-work guard.
  usePageActionBar({
    dirty,
    saving,
    onSave: save,
    onDiscard: () => setForm(initial),
    error,
    saveLabel: "Save Changes",
  });

  return (
    // Two columns so the profile fills the width and fits one screen — no scroll
    // to reach Save (Roland 2026-06-18). Identity + Registrations stack on the
    // left; the taller Contact card takes the right.
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5">
        {/* Identity */}
        <section className="space-y-4 rounded-xl bg-card p-5 shadow-float">
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
            {/* Country (Roland 2026-07-03) — drives address/phone/postcode
                validation platform-wide + the tax-name suggestion; the W1.5
                onboarding wizard will pre-fill it from what the client enters. */}
            <Field
              label="Country"
              htmlFor="country"
              hint="Sets address & phone formats across RolDe OS"
            >
              <Select
                id="country"
                value={form.country}
                onChange={(v) => set("country", v)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </section>

        {/* Brand Logo — TWO SVG variants (light-bg + dark-bg); the URDS PDF Kit
            puts the light-bg one top-right on this clinic's PDFs. */}
        <section className="space-y-4 rounded-xl bg-card p-5 shadow-float">
          <div>
            <h2 className="font-heading text-sm font-semibold tracking-tight">Brand Logo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              SVG logos — the light one prints top-right on this clinic&apos;s PDFs, letters and
              invoices; the dark one is for dark surfaces. Best as a wide landscape SVG (about
              3:1, e.g. <span className="font-medium text-foreground">600×200</span>), with any
              text <span className="font-medium text-foreground">converted to outlines</span> so
              fonts can never go missing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: "logo_svg", label: "On Light Backgrounds", hint: "PDFs · Invoices", dark: false },
                { key: "logo_svg_dark", label: "On Dark Backgrounds", hint: "Dark UI · Emails", dark: true },
              ] as const
            ).map(({ key, label, hint, dark }) => {
              const src = logoSrc(form[key]);
              return (
                <div key={key} className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    {label} <span className="font-normal text-muted-foreground">· {hint}</span>
                  </p>
                  <div
                    className={cn(
                      "flex h-16 items-center justify-center rounded-lg border border-border p-2",
                      dark ? "bg-foreground" : "bg-card shadow-raised",
                    )}
                  >
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={`${label} logo`} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className={cn("text-[10px]", dark ? "text-background/60" : "text-muted-foreground")}>
                        No Logo Yet
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`logo-${key}`}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                    >
                      <UploadCloud className="size-3.5 text-muted-foreground" />
                      {src ? "Replace" : "Upload"}
                    </label>
                    {src && (
                      <button
                        type="button"
                        onClick={() => {
                          set(key, "");
                          if (key === "logo_svg") set("logo_png", "");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-critical transition-colors hover:bg-critical/10"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    )}
                    <input
                      id={`logo-${key}`}
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={makeLogoHandler(key)}
                      className="hidden"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {logoError && <p className="text-xs font-medium text-critical">{logoError}</p>}
          {logoWarning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              <span>{logoWarning}</span>
            </div>
          )}
        </section>

        {/* Registrations */}
        <section className="space-y-4 rounded-xl bg-card p-5 shadow-float">
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
      </div>

      {/* Contact */}
      <section className="space-y-4 rounded-xl bg-card p-5 shadow-float">
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
    </div>
  );
}
