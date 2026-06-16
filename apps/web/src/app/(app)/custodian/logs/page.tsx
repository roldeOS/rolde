import Link from "next/link";
import {
  ScrollText,
  Mail,
  ClipboardCheck,
  LogIn,
  TriangleAlert,
  Webhook,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * Custodian → Logs. The platform's record of what happened. Email delivery is the
 * first log live; Audit, Access, Errors and Webhooks are scaffolded here as their
 * own tabs and fill in as those systems land (Roland 2026-06-16 "add it all").
 */
const TABS = [
  { key: "email", label: "Email", icon: Mail, ready: true },
  { key: "audit", label: "Audit", icon: ClipboardCheck, ready: false, blurb: "Who changed or viewed what, across every clinic — the clinical-governance trail." },
  { key: "access", label: "Access", icon: LogIn, ready: false, blurb: "Sign-ins, failed attempts and sessions — the security record." },
  { key: "errors", label: "Errors", icon: TriangleAlert, ready: false, blurb: "Crashes and client errors, fed by the self-hosted beacon (W1.6.3)." },
  { key: "webhooks", label: "Webhooks", icon: Webhook, ready: false, blurb: "Incoming events from Resend and payment partners." },
] as const;

// The email lifecycle as a single pill — the furthest-along state a message
// reached (Roland 2026-06-16: a pill that shows everything, not an eye).
type Stage = { label: string; cls: string; note: string };
const STAGE: Record<string, Stage> = {
  queued: { label: "Queued", cls: "bg-muted text-muted-foreground", note: "waiting to send" },
  sent: { label: "Sent", cls: "bg-info/12 text-info", note: "accepted by the mail provider" },
  delivered: { label: "Delivered", cls: "bg-success/12 text-success", note: "reached the inbox" },
  opened: { label: "Opened", cls: "bg-accent/20 text-accent", note: "the recipient opened it" },
  clicked: { label: "Clicked", cls: "bg-foreground/10 text-foreground", note: "a link was clicked" },
  delayed: { label: "Delayed", cls: "bg-warning/12 text-warning", note: "provider is retrying" },
  bounced: { label: "Bounced", cls: "bg-destructive/12 text-destructive", note: "couldn't be delivered" },
  complained: { label: "Complained", cls: "bg-destructive/12 text-destructive", note: "marked as spam" },
  failed: { label: "Failed", cls: "bg-destructive/12 text-destructive", note: "we couldn't send it" },
};
const STAGE_LEGEND = ["sent", "delivered", "opened", "clicked", "bounced"] as const;

function lifecycle(r: {
  status: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}): Stage {
  if (r.status === "failed") return STAGE.failed;
  if (r.status === "bounced") return STAGE.bounced;
  if (r.status === "complained") return STAGE.complained;
  if (r.clicked_at) return STAGE.clicked;
  if (r.opened_at) return STAGE.opened;
  if (r.delivered_at || r.status === "delivered") return STAGE.delivered;
  if (r.status === "delayed") return STAGE.delayed;
  if (r.status === "sent") return STAGE.sent;
  return STAGE.queued;
}

export default async function CustodianLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  let rows: Array<{
    id: string;
    created_at: string;
    to_email: string;
    subject: string;
    template_slug: string;
    status: string;
    delivered_at: string | null;
    opened_at: string | null;
    clicked_at: string | null;
  }> = [];
  if (active.key === "email") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transactional_emails")
      .select("id, created_at, to_email, subject, template_slug, status, delivered_at, opened_at, clicked_at")
      .order("created_at", { ascending: false })
      .limit(100);
    rows = data ?? [];
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "What RolDe OS recorded. Email delivery is live; audit, access, error and webhook logs fill in as those systems land.",
        }}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const on = t.key === active.key;
          return (
            <Link
              key={t.key}
              href={t.key === "email" ? "/custodian/logs" : `/custodian/logs?tab=${t.key}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {!t.ready && (
                <span className="rounded bg-muted px-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {active.key === "email" ? (
        <div className="space-y-3">
          {/* Legend — so any reader knows what each state means. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground">
            {STAGE_LEGEND.map((k, i) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/40">›</span>}
                <span className={cn("rounded px-1.5 py-0.5 font-medium", STAGE[k].cls)}>
                  {STAGE[k].label}
                </span>
              </span>
            ))}
            <span className="text-muted-foreground/70">— hover a pill for what it means</span>
          </div>
          <div className="overflow-x-auto rounded-xl bg-card shadow-float">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">{r.to_email}</td>
                  <td className="max-w-xs truncate px-4 py-3">{r.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {r.template_slug}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const s = lifecycle(r);
                      return (
                        <span
                          className={cn("rounded-md px-2 py-0.5 text-xs font-medium", s.cls)}
                          title={s.note}
                        >
                          {s.label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No emails sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl bg-card p-10 text-center shadow-float">
          <CardIcon icon={active.icon} tone="neutral" variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">{active.label} Log</h2>
            <p className="mt-2 text-sm text-muted-foreground">{"blurb" in active ? active.blurb : ""}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">Coming Next.</p>
          </div>
        </div>
      )}
    </div>
  );
}
