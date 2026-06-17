import { notFound } from "next/navigation";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSection } from "../sections";
import { getSettingsAccess, SettingsRestricted } from "../access";

/**
 * Settings section scaffold (Bible 4.8 §15.6). Renders an honest "coming next"
 * page for any registered section whose real module isn't built yet. When a
 * section ships, add a STATIC segment (e.g. `settings/ward-map/page.tsx`) — it
 * overrides this dynamic route for that key — and flip its `status` to "ready".
 */
export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sec = getSection(section);
  if (!sec) notFound();

  const { allowed } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;

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
          This section is specified in {sec.source} and arrives in a coming build
          pass. Nothing to configure yet.
        </p>
      </div>
    </div>
  );
}
