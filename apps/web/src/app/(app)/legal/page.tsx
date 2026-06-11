"use client";

import { useState } from "react";
import {
  Scale,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HeartPulse,
  Mic,
  History,
  Check,
} from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * Legal & Safety — the single home for every policy / safety document (Roland
 * 2026-06-11). One card hosts the selected document (title on top, body below);
 * the right rail is its VERSION HISTORY — the current version plus every
 * superseded one, organised newest-first. Pick a document on the left, pick a
 * version on the right.
 *
 * Content here is SCAFFOLD/placeholder — the real wording is drafted with legal
 * counsel before go-live (APPROVALS §8.2 / Bible 4.2 §D.8). The structure,
 * routing and versioning UI are real so the documents drop straight in.
 */

type Version = {
  v: string;
  date: string;
  status: "current" | "superseded" | "draft";
  body: string;
};

type Doc = {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  summary: string;
  versions: Version[];
};

const DOCS: Doc[] = [
  {
    key: "privacy",
    title: "Privacy Policy & Data-Processing Notice",
    icon: ShieldCheck,
    tone: "info",
    summary:
      "How RolDe processes personal and special-category health data under UK GDPR & DPA 2018.",
    versions: [
      {
        v: "Draft 0.1",
        date: "2026-06-11",
        status: "draft",
        body: "Lawful basis, special-category condition (Art. 9 — health/social care), retention schedule, data-subject rights, sub-processors (Supabase, hosting), international transfers. To be finalised with counsel before go-live.",
      },
    ],
  },
  {
    key: "terms",
    title: "Terms of Service",
    icon: FileText,
    tone: "neutral",
    summary: "The agreement governing each clinic's use of RolDe.",
    versions: [
      {
        v: "Draft 0.1",
        date: "2026-06-11",
        status: "draft",
        body: "Licence, acceptable use, clinic vs RolDe responsibilities, availability, liability, termination. Pending counsel review.",
      },
    ],
  },
  {
    key: "disclaimer",
    title: "Clinical Disclaimer",
    icon: AlertTriangle,
    tone: "warning",
    summary:
      "RolDe is decision-support — it never replaces clinician judgement.",
    versions: [
      {
        v: "Draft 0.1",
        date: "2026-06-11",
        status: "draft",
        body: "RolDe drafts; the clinician authorises. Nothing is sent or actioned without explicit clinician sign-off (Bible 4.0/4.6). The clinician remains responsible for all clinical decisions.",
      },
    ],
  },
  {
    key: "safety",
    title: "Clinical Safety Statement",
    icon: HeartPulse,
    tone: "critical",
    summary:
      "Clinical risk management for health IT (England: DCB0129 / DCB0160).",
    versions: [
      {
        v: "Draft 0.1",
        date: "2026-06-11",
        status: "draft",
        body: "Manufacturer clinical risk management (DCB0129) + deploying-organisation duties (DCB0160). Names a Clinical Safety Officer, hazard log, and the clinical safety case. Required before any clinical go-live.",
      },
    ],
  },
  {
    key: "consent",
    title: "Ambient-Capture Consent",
    icon: Mic,
    tone: "success",
    summary:
      "Patient consent + a visible indicator before any dictation / ambient listening.",
    versions: [
      {
        v: "Draft 0.1",
        date: "2026-06-11",
        status: "draft",
        body: "An explicit, LOGGED patient consent gate before RolDe AI records or listens (Bible 4.7), a visible 'listening' indicator while active, and easy withdrawal. No capture without it.",
      },
    ],
  },
];

const STATUS_PILL: Record<Version["status"], string> = {
  current: "bg-success/12 text-success",
  superseded: "bg-muted text-muted-foreground",
  draft: "bg-warning/12 text-warning",
};

const STATUS_LABEL: Record<Version["status"], string> = {
  current: "Current",
  superseded: "Superseded",
  draft: "Draft",
};

export default function LegalPage() {
  const [docKey, setDocKey] = useState(DOCS[0].key);
  const doc = DOCS.find((d) => d.key === docKey) ?? DOCS[0];
  const [versionIndex, setVersionIndex] = useState(0);
  const version = doc.versions[versionIndex] ?? doc.versions[0];

  function pickDoc(key: string) {
    setDocKey(key);
    setVersionIndex(0);
  }

  return (
    <div className="w-full space-y-4 p-6 lg:p-8">
      <PageHeaderRow
        icon={Scale}
        tone="neutral"
        title="Legal & Safety"
        count={DOCS.length}
        explainer={{
          label: "Legal & Safety",
          description:
            "Every policy and safety document, versioned. Pick a document, then a version on the right to read any historic copy.",
        }}
      />

      {/* Document selector — chips, one per document. */}
      <div className="flex flex-wrap gap-2">
        {DOCS.map((d) => {
          const on = d.key === docKey;
          return (
            <button
              key={d.key}
              onClick={() => pickDoc(d.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "bg-card text-foreground shadow-float"
                  : "text-foreground/70 hover:bg-hover hover:text-foreground",
              )}
            >
              <CardIcon icon={d.icon} tone={d.tone} variant="badge" size="sm" />
              <span className="hidden sm:inline">{d.title}</span>
            </button>
          );
        })}
      </div>

      {/* The document card (title + body) with the version-history rail right. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <article className="rounded-xl bg-card p-6 shadow-float lg:p-8">
          <div className="flex items-start gap-3">
            <CardIcon icon={doc.icon} tone={doc.tone} variant="badge" size="md" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight">{doc.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{doc.summary}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-medium",
                STATUS_PILL[version.status],
              )}
            >
              {STATUS_LABEL[version.status]}
            </span>
            <span className="font-medium text-foreground">{version.v}</span>
            <span aria-hidden>·</span>
            <span>Effective {version.date}</span>
          </div>

          <div className="mt-4 text-sm leading-relaxed text-foreground/90">
            {version.body}
          </div>

          <p className="mt-6 rounded-lg bg-warning/8 px-3 py-2 text-xs text-warning">
            Scaffold copy — final wording is drafted with legal counsel before
            go-live (APPROVALS §8.2).
          </p>
        </article>

        {/* Version history — newest first, click to view a historic copy. */}
        <aside className="rounded-xl bg-card p-4 shadow-float">
          <div className="flex items-center gap-2 px-1 pb-2">
            <History className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Version history</span>
          </div>
          <div className="space-y-1">
            {doc.versions.map((vv, i) => {
              const active = i === versionIndex;
              return (
                <button
                  key={vv.v}
                  onClick={() => setVersionIndex(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    active ? "bg-hover" : "hover:bg-hover",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{vv.v}</span>
                    <span className="text-xs text-muted-foreground">
                      {vv.date}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        STATUS_PILL[vv.status],
                      )}
                    >
                      {STATUS_LABEL[vv.status]}
                    </span>
                    {active && <Check className="size-3.5 text-muted-foreground" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-2 text-[10px] leading-snug text-muted-foreground">
            Superseded versions are kept for audit — clinics can always read the
            policy that applied on a given date.
          </p>
        </aside>
      </div>
    </div>
  );
}
