"use client";

import { useState } from "react";
import { Scale, History, Check } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { LegalDocBody } from "@/components/LegalDocBody";
import { LEGAL_DOCS, STATUS_PILL, STATUS_LABEL } from "@/lib/legal";
import { cn } from "@/lib/utils";

/**
 * Legal & Safety — the in-app, versioned home for every policy / safety document
 * (Roland 2026-06-11). One card hosts the selected document (title on top, body
 * below); the right rail is its VERSION HISTORY (current + every superseded copy,
 * newest first). Documents come from the shared `@/lib/legal` source, which also
 * feeds the PUBLIC `/policy/[slug]` pages linked from the login footer (W0.2).
 *
 * Content is SCAFFOLD — the real wording is drafted with legal counsel before
 * go-live (APPROVALS §8.2 / Bible 4.2 §D.8). Structure + versioning are real.
 */

export default function LegalPage() {
  const [docKey, setDocKey] = useState(LEGAL_DOCS[0].key);
  const doc = LEGAL_DOCS.find((d) => d.key === docKey) ?? LEGAL_DOCS[0];
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
        count={LEGAL_DOCS.length}
        explainer={{
          label: "Legal & Safety",
          description:
            "Every policy and safety document, versioned. Pick a document, then a version on the right to read any historic copy.",
        }}
      />

      {/* Document selector — chips, one per document. */}
      <div className="flex flex-wrap gap-2">
        {LEGAL_DOCS.map((d) => {
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

          <div className="mt-4">
            <LegalDocBody version={version} />
          </div>

          {version.status === "draft" && (
            <p className="mt-6 rounded-lg bg-warning/8 px-3 py-2 text-xs text-warning">
              Working draft — the in-force v1.0 is being finalised and will be
              published here.
            </p>
          )}
        </article>

        {/* Version history — newest first, click to view a historic copy. */}
        <aside className="rounded-xl bg-card p-4 shadow-float">
          <div className="flex items-center gap-2 px-1 pb-2">
            <History className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Version History</span>
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
