import Link from "next/link";
import {
  ScrollText,
  Eye,
  MousePointerClick,
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

const STATUS_STYLE: Record<string, string> = {
  queued: "bg-warning/12 text-warning",
  sent: "bg-info/12 text-info",
  delivered: "bg-success/12 text-success",
  delayed: "bg-warning/12 text-warning",
  failed: "bg-destructive/12 text-destructive",
  bounced: "bg-destructive/12 text-destructive",
  complained: "bg-destructive/12 text-destructive",
};

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
    opened_at: string | null;
    clicked_at: string | null;
  }> = [];
  if (active.key === "email") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transactional_emails")
      .select("id, created_at, to_email, subject, template_slug, status, opened_at, clicked_at")
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
        <div className="overflow-x-auto rounded-xl bg-card shadow-float">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Activity</th>
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
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                        STATUS_STYLE[r.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.opened_at || r.clicked_at ? (
                      <div className="flex items-center gap-2.5">
                        {r.opened_at && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Opened">
                            <Eye className="size-3.5" /> Opened
                          </span>
                        )}
                        {r.clicked_at && (
                          <span className="inline-flex items-center gap-1 text-xs text-success" title="Clicked">
                            <MousePointerClick className="size-3.5" /> Clicked
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No emails sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
