import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { EmailEditor } from "@/components/email/EmailEditor";
import { getSettingsAccess, SettingsRestricted } from "../../access";

/** Edit one of the caller's clinic email templates (Caretaker). */
export default async function ClinicEmailTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const tenantId = ctx?.membership?.tenant_id;
  if (!tenantId) notFound();

  const { slug } = await params;
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("email_templates")
    .select(
      "slug, name, description, subject, preheader, headline, paragraphs, cta_label, cta_url, footer_note, is_active, variables",
    )
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();

  if (!template) notFound();

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <Link
        href="/settings/email"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Email Templates
      </Link>
      <PageHeaderRow
        icon={MailCheck}
        tone="neutral"
        title={template.name}
        explainer={{ label: template.name, description: template.description ?? "" }}
      />
      <EmailEditor template={template} saveUrl={`/api/settings/clinic-emails/${template.slug}`} />
    </div>
  );
}
