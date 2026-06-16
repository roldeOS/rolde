"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, fieldFloat } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Template = {
  slug: string;
  name: string;
  subject: string;
  preheader: string | null;
  headline: string | null;
  paragraphs: string[];
  cta_label: string | null;
  cta_url: string | null;
  footer_note: string | null;
  is_active: boolean;
  variables: string[];
};

/**
 * Custodian email editor — content on the left, a LIVE preview on the right
 * (debounced render through the real React Email pipeline, so it's pixel-true).
 * Body paragraphs are edited as text, one per blank line. The preview follows
 * your system's light/dark setting.
 */
export function EmailEditor({
  template,
  saveUrl,
}: {
  template: Template;
  /** Where Save PATCHes (Custodian platform route, or the Caretaker clinic route). */
  saveUrl: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: template.name,
    subject: template.subject,
    preheader: template.preheader ?? "",
    headline: template.headline ?? "",
    paragraphs: template.paragraphs.join("\n\n"),
    cta_label: template.cta_label ?? "",
    cta_url: template.cta_url ?? "",
    footer_note: template.footer_note ?? "",
    is_active: template.is_active,
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toParagraphs = useCallback(
    () => form.paragraphs.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [form.paragraphs],
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  // Debounced live preview through the real renderer.
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/email-templates/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            preheader: form.preheader,
            headline: form.headline,
            paragraphs: toParagraphs(),
            cta_label: form.cta_label,
            cta_url: form.cta_url,
            footer_note: form.footer_note,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.html) setPreviewHtml(data.html);
      } catch {
        /* preview is best-effort */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form, toParagraphs]);

  async function save() {
    setSaving(true);
    const res = await fetch(saveUrl, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, paragraphs: toParagraphs() }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Field label="Template Name" htmlFor="name">
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Subject" htmlFor="subject">
          <Input id="subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
        </Field>
        <Field label="Preheader" htmlFor="preheader" hint="The grey preview line in the inbox">
          <Input
            id="preheader"
            value={form.preheader}
            onChange={(e) => set("preheader", e.target.value)}
          />
        </Field>
        <Field label="Headline" htmlFor="headline">
          <Input id="headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
        </Field>
        <Field label="Body" htmlFor="paragraphs" hint="One paragraph per blank line">
          <textarea
            id="paragraphs"
            rows={6}
            className={cn(fieldFloat, "h-auto resize-y py-2")}
            value={form.paragraphs}
            onChange={(e) => set("paragraphs", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Button Label" htmlFor="cta_label">
            <Input
              id="cta_label"
              value={form.cta_label}
              onChange={(e) => set("cta_label", e.target.value)}
            />
          </Field>
          <Field label="Button Link" htmlFor="cta_url" hint="Variables OK">
            <Input id="cta_url" value={form.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
          </Field>
        </div>
        <Field label="Footer Note" htmlFor="footer_note">
          <Input
            id="footer_note"
            value={form.footer_note}
            onChange={(e) => set("footer_note", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="size-4 accent-foreground"
          />
          Active — sends are blocked when off
        </label>
        {template.variables.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Variables:{" "}
            <span className="font-mono">
              {template.variables.map((v) => `{{${v}}}`).join("  ")}
            </span>
          </p>
        )}
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          {saved && <span className="text-xs text-success">Saved</span>}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Live Preview</p>
        <iframe
          title="Email Preview"
          srcDoc={previewHtml}
          className="h-[640px] w-full rounded-xl border border-border"
        />
      </div>
    </div>
  );
}
