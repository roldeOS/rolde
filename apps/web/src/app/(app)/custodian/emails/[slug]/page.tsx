import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { EmailEditor } from "./EmailEditor";

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
      <Link
        href="/custodian/emails"
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
      <EmailEditor template={template} />
    </div>
  );
}
