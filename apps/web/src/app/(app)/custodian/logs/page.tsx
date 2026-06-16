import { ScrollText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { cn } from "@/lib/utils";

/**
 * Custodian → Email Log. Every transactional send is recorded in
 * `transactional_emails` (RLS lets a Custodian see all of them); this surfaces
 * the newest 100 with delivery status. The rendered HTML is snapshotted on each
 * row, so a per-send replay view can come later.
 */
const STATUS_STYLE: Record<string, string> = {
  sent: "bg-success/12 text-success",
  failed: "bg-destructive/12 text-destructive",
  queued: "bg-warning/12 text-warning",
};

export default async function CustodianLogsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("transactional_emails")
    .select("id, created_at, to_email, subject, template_slug, status, source")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={ScrollText}
        tone="neutral"
        title="Email Log"
        explainer={{
          label: "Email Log",
          description:
            "Every email RolDe has sent — auth, invites, clinic emails — with its delivery status. Newest 100.",
        }}
      />
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
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
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
  );
}
