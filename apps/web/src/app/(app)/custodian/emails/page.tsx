import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { ReseedButton } from "./ReseedButton";

/**
 * Custodian → Content → Emails. Lists the platform email templates (RLS lets a
 * Custodian read the `tenant_id IS NULL` rows). Read-only for now; the per-
 * template content editor + live preview lands in the next slice. "Re-seed From
 * Code" rebuilds them from the canonical `emails/seed.ts`.
 */
export default async function CustodianEmailsPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("email_templates")
    .select("slug, name, description, category, subject, is_active")
    .is("tenant_id", null)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="w-full space-y-8 p-6 lg:p-8">
      <PageHeaderRow
        icon={MailCheck}
        tone="neutral"
        title="Email Templates"
        explainer={{
          label: "Email Templates",
          description:
            "The platform emails RolDe OS sends — password resets, invites, notices. Edit the wording here; re-seed from code to reset a template to its canonical version.",
        }}
      />

      <ReseedButton />

      <div className="grid gap-4 sm:grid-cols-2">
        {(templates ?? []).map((t) => (
          <Link
            key={t.slug}
            href={`/custodian/emails/${t.slug}`}
            className="block rounded-xl bg-card p-5 shadow-float transition-shadow hover:shadow-raised"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-base font-semibold tracking-tight">{t.name}</h3>
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                {t.category}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Subject:</span> {t.subject}
            </p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">{t.slug}</p>
          </Link>
        ))}
        {(!templates || templates.length === 0) && (
          <p className="text-sm text-muted-foreground">
            No templates yet — use Re-seed From Code above.
          </p>
        )}
      </div>
    </div>
  );
}
