import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { ClinicEmailSetup } from "./ClinicEmailSetup";

/**
 * Settings → Email Templates (Caretaker). The clinic→patient operational emails,
 * per-clinic and Caretaker-edited. Lists the clinic's templates (RLS scopes to
 * their clinic); offers a one-tap setup from the defaults if the clinic has none.
 */
export default async function ClinicEmailsPage() {
  const { allowed, ctx } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("email");
  if (!sec) notFound();

  const tenantId = ctx?.membership?.tenant_id ?? null;
  let templates: {
    slug: string;
    name: string;
    description: string | null;
    subject: string;
    category: string;
  }[] = [];
  if (tenantId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("email_templates")
      .select("slug, name, description, subject, category")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });
    templates = data ?? [];
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
        actions={
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All Settings
          </Link>
        }
      />

      {!tenantId ? (
        <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-float">
          These are per-clinic patient emails. As a Custodian you don&apos;t have a clinic —
          the platform emails live in{" "}
          <Link href="/custodian/emails" className="font-medium text-foreground underline">
            Platform → Email Templates
          </Link>
          .
        </div>
      ) : templates.length === 0 ? (
        <ClinicEmailSetup />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <Link
              key={t.slug}
              href={`/settings/email/${t.slug}`}
              className="block rounded-xl bg-card p-5 shadow-float transition-shadow hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-base font-semibold tracking-tight">{t.name}</h3>
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                  {t.category}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Subject:</span> {t.subject}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
