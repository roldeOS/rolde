import { notFound } from "next/navigation";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { EmailEditor } from "@/components/email/EmailEditor";

/** Edit one platform email template (Custodian). 404 if the slug doesn't exist. */
export default async function EmailTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("email_templates")
    .select(
      "slug, name, description, subject, preheader, headline, paragraphs, cta_label, cta_url, footer_note, is_active, variables",
    )
    .is("tenant_id", null)
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
      <EmailEditor template={template} saveUrl={`/api/admin/email-templates/${template.slug}`} />
    </div>
  );
}
