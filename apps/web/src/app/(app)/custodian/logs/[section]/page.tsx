import { notFound } from "next/navigation";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getCustodianLogSection } from "../sections";

/**
 * Custodian Logs section scaffold — an honest "coming next" page for any platform
 * log whose stream isn't built yet. A shipped log gets a static segment (e.g.
 * `custodian/logs/activity/page.tsx`) and flips its `status` to "ready". The
 * custodian layout (requireCustodian) gates access.
 */
export default async function CustodianLogSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sec = getCustodianLogSection(section);
  if (!sec) notFound();

  return (
    <div className="w-full space-y-4 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />
      <div className="rounded-xl bg-card p-8 shadow-float">
        <p className="py-6 text-center text-sm text-muted-foreground">
          These events are already being recorded — the platform-wide page to review them here
          lands in a coming build pass.
        </p>
      </div>
    </div>
  );
}
