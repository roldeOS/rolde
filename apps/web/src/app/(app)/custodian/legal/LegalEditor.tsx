"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Pencil,
  Eye,
  Send,
  Plus,
  Trash2,
  Loader2,
  Check,
  History,
} from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { LegalDocBody } from "@/components/LegalDocBody";
import { LEGAL_DOCS, STATUS_LABEL, STATUS_PILL, type LegalVersion } from "@/lib/legal";
import type { EditorVersion } from "@/lib/legalDb";
import { cn } from "@/lib/utils";

type FormSection = { heading: string; body: string; items: string };
type Form = { version: string; intro: string; sections: FormSection[] };
type Step = "edit" | "preview" | "publish";

/** "1.0" → "1.1"; anything odd → append ".1". */
function bump(v: string): string {
  const m = v.match(/^(\d+)\.(\d+)$/);
  return m ? `${m[1]}.${Number(m[2]) + 1}` : `${v}.1`;
}

function versionToForm(v: EditorVersion | undefined, fallbackVersion: string): Form {
  if (!v) return { version: fallbackVersion, intro: "", sections: [] };
  return {
    version: v.version,
    intro: v.intro,
    sections: v.sections.map((s) => ({
      heading: s.heading,
      body: s.body ?? "",
      items: (s.items ?? []).join("\n"),
    })),
  };
}

function formToSections(form: Form): LegalVersion["sections"] {
  return form.sections.map((s) => ({
    heading: s.heading,
    ...(s.body.trim() ? { body: s.body } : {}),
    ...(s.items.trim()
      ? { items: s.items.split("\n").map((x) => x.trim()).filter(Boolean) }
      : {}),
  }));
}

const STEPS: { key: Step; label: string; icon: typeof Pencil; on: string }[] = [
  { key: "edit", label: "Edit", icon: Pencil, on: "bg-info/12 text-info" },
  { key: "preview", label: "Preview", icon: Eye, on: "bg-accent/20 text-accent" },
  { key: "publish", label: "Publish", icon: Send, on: "bg-success/15 text-success" },
];

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10";

export function LegalEditor({
  versionsByKey,
}: {
  versionsByKey: Record<string, EditorVersion[]>;
}) {
  const router = useRouter();
  const [docKey, setDocKey] = useState(LEGAL_DOCS[0].key);
  const [step, setStep] = useState<Step>("edit");
  const [busy, setBusy] = useState<null | "draft" | "publish">(null);
  const [flash, setFlash] = useState<string | null>(null);

  const versions = versionsByKey[docKey] ?? [];
  const published = versions.find((v) => v.status === "published");
  const draft = versions.find((v) => v.status === "draft");
  const catalog = LEGAL_DOCS.find((d) => d.key === docKey) ?? LEGAL_DOCS[0];

  // The form starts from the existing draft, else a fresh copy of the published
  // version with the next version number suggested.
  const [form, setForm] = useState<Form>(() =>
    draft
      ? versionToForm(draft, "1.0")
      : versionToForm(published, bump(published?.version ?? "1.0")),
  );

  function pickDoc(key: string) {
    const vs = versionsByKey[key] ?? [];
    const d = vs.find((v) => v.status === "draft");
    const p = vs.find((v) => v.status === "published");
    setDocKey(key);
    setStep("edit");
    setFlash(null);
    setForm(d ? versionToForm(d, "1.0") : versionToForm(p, bump(p?.version ?? "1.0")));
  }

  const setForm2 = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const setSection = (i: number, patch: Partial<FormSection>) =>
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  const addSection = () =>
    setForm((f) => ({ ...f, sections: [...f.sections, { heading: "", body: "", items: "" }] }));
  const removeSection = (i: number) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }));

  async function saveDraft(): Promise<boolean> {
    setBusy("draft");
    setFlash(null);
    try {
      const res = await fetch("/api/custodian/legal/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_key: docKey,
          version: form.version.trim(),
          intro: form.intro,
          sections: formToSections(form),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setFlash("Couldn't save the draft.");
        return false;
      }
      setFlash("Draft saved.");
      router.refresh();
      return true;
    } catch {
      setFlash("Couldn't save the draft.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setBusy("publish");
    setFlash(null);
    // Persist the latest edits as the draft, then publish it.
    const saved = await saveDraft();
    if (!saved) {
      setBusy(null);
      return;
    }
    setBusy("publish");
    try {
      const res = await fetch("/api/custodian/legal/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_key: docKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setFlash("Couldn't publish.");
        return;
      }
      setFlash(`Published ${form.version} — it's now in force.`);
      router.refresh();
    } catch {
      setFlash("Couldn't publish.");
    } finally {
      setBusy(null);
    }
  }

  const previewVersion: LegalVersion = {
    v: form.version || "—",
    date: "",
    status: "draft",
    intro: form.intro,
    sections: formToSections(form),
  };

  return (
    <div className="w-full space-y-5 p-6 lg:p-8">
      <PageHeaderRow
        icon={Scale}
        tone="neutral"
        title="Legal & Safety"
        explainer={{
          label: "Legal & Safety Editor",
          description:
            "Draft, preview and publish RolDe's legal documents. Publishing makes a version live everywhere and files the old one under history.",
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr] lg:items-start">
        {/* LEFT — document library */}
        <aside className="space-y-1.5">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documents
          </h2>
          {LEGAL_DOCS.map((d) => {
            const on = d.key === docKey;
            const hasDraft = (versionsByKey[d.key] ?? []).some((v) => v.status === "draft");
            return (
              <button
                key={d.key}
                onClick={() => pickDoc(d.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                  on ? "bg-card shadow-float" : "hover:bg-hover",
                )}
              >
                <CardIcon icon={d.icon} tone={d.tone} variant="badge" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.title}</span>
                </span>
                {hasDraft && (
                  <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning">
                    Draft
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* RIGHT — the flow */}
        <section className="space-y-4">
          <div className="rounded-xl bg-card shadow-float">
            {/* Doc header */}
            <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
              <CardIcon icon={catalog.icon} tone={catalog.tone} variant="badge" size="md" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold tracking-tight">{catalog.title}</h2>
                <p className="text-xs text-muted-foreground">
                  In force:{" "}
                  <span className="font-medium text-foreground">
                    {published ? `${published.version} · ${published.date}` : "none yet"}
                  </span>
                </p>
              </div>
            </div>

            {/* Step tabs */}
            <div className="flex gap-1.5 px-5 pt-4">
              {STEPS.map((s) => {
                const active = s.key === step;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStep(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active ? s.on : "text-muted-foreground hover:bg-hover hover:text-foreground",
                    )}
                  >
                    <s.icon className="size-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Step body */}
            <div className="px-5 py-4">
              {step === "edit" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Version
                      </label>
                      <input
                        className={INPUT}
                        value={form.version}
                        onChange={(e) => setForm2({ version: e.target.value })}
                        placeholder="1.1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Intro
                    </label>
                    <textarea
                      className={cn(INPUT, "min-h-24 resize-y")}
                      value={form.intro}
                      onChange={(e) => setForm2({ intro: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sections
                    </p>
                    {form.sections.map((s, i) => (
                      <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <input
                            className={cn(INPUT, "font-medium")}
                            value={s.heading}
                            onChange={(e) => setSection(i, { heading: e.target.value })}
                            placeholder="Section heading"
                          />
                          <button
                            onClick={() => removeSection(i)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-critical/10 hover:text-critical"
                            aria-label="Remove section"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <textarea
                          className={cn(INPUT, "min-h-20 resize-y")}
                          value={s.body}
                          onChange={(e) => setSection(i, { body: e.target.value })}
                          placeholder="Paragraph (optional)"
                        />
                        <textarea
                          className={cn(INPUT, "min-h-16 resize-y font-mono text-xs")}
                          value={s.items}
                          onChange={(e) => setSection(i, { items: e.target.value })}
                          placeholder="Bullet points — one per line (optional)"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addSection}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                    >
                      <Plus className="size-4" /> Add Section
                    </button>
                  </div>
                </div>
              )}

              {step === "preview" && (
                <article className="rounded-lg bg-background p-5">
                  <h3 className="text-xl font-semibold tracking-tight">{catalog.title}</h3>
                  <p className="mb-4 mt-1 text-sm text-muted-foreground">{catalog.summary}</p>
                  <LegalDocBody version={previewVersion} />
                </article>
              )}

              {step === "publish" && (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Publishing <span className="font-medium text-foreground">{catalog.title}</span>{" "}
                    version <span className="font-medium text-foreground">{form.version}</span> makes
                    it the live policy everywhere — the in-app Legal & Safety page and the public{" "}
                    <span className="font-mono text-xs">/policy</span> page. The current version{" "}
                    {published ? `(${published.version})` : ""} moves to history, kept for audit.
                  </p>
                  <button
                    onClick={publish}
                    disabled={!!busy}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-success/90 disabled:opacity-60"
                  >
                    {busy === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Publish {form.version}
                  </button>
                </div>
              )}
            </div>

            {/* Footer — save draft + flash */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
              <span className="text-xs text-muted-foreground">
                {flash && (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Check className="size-3.5 text-success" /> {flash}
                  </span>
                )}
              </span>
              <button
                onClick={saveDraft}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90 disabled:opacity-60"
              >
                {busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                Save Draft
              </button>
            </div>
          </div>

          {/* Version history */}
          <div className="rounded-xl bg-card p-4 shadow-float">
            <div className="flex items-center gap-2 px-1 pb-2">
              <History className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Version History</span>
            </div>
            <div className="space-y-1">
              {versions.map((v) => {
                const display = v.status === "published" ? "current" : (v.status as LegalVersion["status"]);
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{v.version}</span>
                      <span className="text-xs text-muted-foreground">{v.date}</span>
                    </span>
                    <span
                      className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", STATUS_PILL[display])}
                    >
                      {STATUS_LABEL[display]}
                    </span>
                  </div>
                );
              })}
              {versions.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">No versions yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
