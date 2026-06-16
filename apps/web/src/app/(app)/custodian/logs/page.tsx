import { ScrollText, Eye, MousePointerClick, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { CardIcon } from "@/components/ui/CardIcon";
import { cn } from "@/lib/utils";

/**
 * Custodian → Logs. The platform's record of what happened. Email delivery is the
 * first log here (from `transactional_emails`, RLS-visible to Custodians); audit,
 * access and error logs will join it as their own sections.
 */
const STATUS_STYLE: Record<string, string> = {
  queued: "bg-warning/12 text-warning",
  sent: "bg-info/12 text-info",
  delivered: "bg-success/12 text-success",
  delayed: "bg-warning/12 text-warning",
  failed: "bg-destructive/12 text-destructive",
  bounced: "bg-destructive/12 text-destructive",
  complained: "bg-destructive/12 text-destructive",
};

export default async function CustodianLogsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("transactional_emails")
    .select("id, created_at, to_email, subject, template_slug, status, source, opened_at, clicked_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Logs"
        explainer={{
          label: "Logs",
          description:
            "What RolDe OS recorded. Email delivery is here first — audit, access and error logs will join it as their own sections.",
        }}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <CardIcon icon={Mail} tone="info" variant="badge" size="sm" />
          <h2 className="font-heading text-sm font-semibold tracking-tight">Email Delivery</h2>
          <span className="text-xs text-muted-foreground">Newest 100</span>
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
                <th className="px-4 py-3 font-medium">Activity</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => (
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
                          <span
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                            title="Opened"
                          >
                            <Eye className="size-3.5" /> Opened
                          </span>
                        )}
                        {r.clicked_at && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-success"
                            title="Clicked"
                          >
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
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No emails sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
