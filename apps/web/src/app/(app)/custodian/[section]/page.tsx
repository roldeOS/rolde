import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getControlSection } from "../sections";

/**
 * Custodian "Control" section scaffold (Bible 4.8 §16). Renders an honest
 * "coming next" page for any registered Control surface whose real module isn't
 * built yet. When one ships, add a STATIC segment (e.g.
 * `custodian/clinics/page.tsx`) — it overrides this dynamic route — and flip its
 * `status` to "ready". The /custodian layout already gates to Custodians only.
 */
export default async function ControlSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sec = getControlSection(section);
  if (!sec) notFound();

  return (
    <div className="w-full space-y-4 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.label}
        explainer={{ label: sec.label, description: sec.blurb }}
        actions={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Overview
          </Link>
        }
      />

      <div className="rounded-xl bg-card p-8 shadow-float">
        <p className="py-6 text-center text-sm text-muted-foreground">
          {sec.blurb} This Control surface arrives in a coming build pass — nothing to
          configure yet.
        </p>
      </div>
    </div>
  );
}
