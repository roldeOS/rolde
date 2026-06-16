import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { CONTROL_HUB } from "../sections";

/**
 * Control (Bible 4.8 §16, W1.5.2) — the Custodian's equivalent of a clinic's
 * Settings: one destination gathering every platform lever they own (legal docs,
 * the email system, fellow Custodians). The /custodian layout gates to Custodians.
 */
export default function ControlHubPage() {
  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={SlidersHorizontal}
        tone="neutral"
        title="Control"
        explainer={{
          label: "Control",
          description:
            "Everything you edit for the clinics under you — the legal and clinical-safety documents, the email templates, and your fellow Custodians.",
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTROL_HUB.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className="block rounded-xl bg-card p-5 shadow-float transition-shadow hover:shadow-raised"
          >
            <div className="flex items-start justify-between gap-2">
              <CardIcon icon={s.icon} tone={s.tone} variant="badge" size="md" />
              {s.status === "soon" && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              )}
            </div>
            <h3 className="mt-3 font-heading text-base font-semibold tracking-tight">{s.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
