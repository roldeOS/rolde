import { notFound } from "next/navigation";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { getSettingsAccess, SettingsRestricted } from "../access";
import { getSection } from "../sections";
import { listPhotoProtocols } from "./actions";
import { PhotoProtocolsManager } from "./PhotoProtocolsManager";

/**
 * Settings → Photo Protocols (Caretaker; multi-angle Step B, Roland 2026-07-22).
 * The clinic defines its named angle-sets — "Full Face · 5-view", a 10-shot
 * sweep, whatever it shoots — and they drive the capture grid + before/after
 * pairing. Caretaker-gated (UI + RLS).
 */
export default async function PhotoProtocolsPage() {
  const { allowed } = await getSettingsAccess();
  if (!allowed) return <SettingsRestricted />;
  const sec = getSection("photo-protocols");
  if (!sec) notFound();
  const protocols = await listPhotoProtocols();

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={sec.icon}
        tone={sec.tone}
        title={sec.title}
        explainer={{ label: sec.title, description: sec.blurb }}
      />
      <PhotoProtocolsManager initial={protocols} />
    </div>
  );
}
