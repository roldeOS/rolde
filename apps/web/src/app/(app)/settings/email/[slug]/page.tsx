import { notFound } from "next/navigation";
import { MailCheck } from "lucide-react";
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
