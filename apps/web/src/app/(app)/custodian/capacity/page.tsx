import { HardDrive, ImageIcon, TrendingUp, FileCheck2, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeaderRow } from "@/components/ui/PageHeaderRow";
import { StatTile } from "@/components/ui/StatTile";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { Meter, type MeterTone } from "@/components/ui/Meter";

/**
 * Custodian → Capacity (Photo tool M3, Roland "Go for Milestone 3", 2026-07-22).
 * The platform owner's storage read: how much the photo store weighs across
 * every clinic, and the honest cue for WHEN to move object storage to Cloudflare
 * R2 (zero egress — the win at scale). Figures come from a Custodian-only RPC
 * (`photo_capacity_overview`) that reads the true footprint from storage.objects
 * — master + thumbnail bytes, including bytes we still hold after a soft-delete.
 * The /custodian layout gates this surface to Custodians.
 */
export const dynamic = "force-dynamic";

// The storage line at which we plan the R2 move. A planning cue, not a hard cap
// — tune it as the platform grows (Supabase Pro includes 100 GB; egress is the
// real cost driver at scale, which is exactly what R2 removes).
const COMFORT_GB = 50;

type TenantRow = { tenant_id: string; name: string; bytes: number; objects: number };
type Overview = {
  total_bytes: number;
  objects: number;
  thumbs: number;
  masters: number;
  bytes_this_month: number;
  live_photos: number;
  tenants: TenantRow[];
};

function formatBytes(n: number): string {
  if (!n || n < 1) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v.toFixed(i === 0 || v >= 100 ? 0 : 1)} ${units[i]}`;
}

export default async function CapacityPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("photo_capacity_overview");
  const o: Overview = (data as unknown as Overview) ?? {
    total_bytes: 0,
    objects: 0,
    thumbs: 0,
    masters: 0,
    bytes_this_month: 0,
    live_photos: 0,
    tenants: [],
  };

  const comfortBytes = COMFORT_GB * 1024 ** 3;
  const pct = comfortBytes ? Math.min(100, Math.round((o.total_bytes / comfortBytes) * 100)) : 0;
  const tone: CardIconTone = pct >= 85 ? "critical" : pct >= 60 ? "warning" : "success";
  const cue =
    pct >= 85
      ? "Time to move object storage to Cloudflare R2."
      : pct >= 60
        ? "Start planning the move to Cloudflare R2."
        : "Plenty of headroom.";

  return (
    <div className="w-full space-y-6 p-6 lg:p-8">
      <PageHeaderRow
        icon={HardDrive}
        tone="teal"
        title="Capacity"
        explainer={{
          label: "Capacity",
          description:
            "How much photo storage the whole platform is using, across every clinic — and the cue for when to move object storage to Cloudflare R2 (zero egress) as you grow. Figures are the true footprint (masters + thumbnails), including bytes we still hold after a photo is deleted.",
        }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={HardDrive}
          tone="teal"
          label="Photo Storage"
          value={formatBytes(o.total_bytes)}
          sub="Masters + thumbnails"
        />
        <StatTile
          icon={ImageIcon}
          tone="info"
          label="Objects Stored"
          value={o.objects.toLocaleString()}
          sub={`${o.masters.toLocaleString()} photos · ${o.thumbs.toLocaleString()} thumbnails`}
        />
        <StatTile
          icon={TrendingUp}
          tone="success"
          label="Added This Month"
          value={formatBytes(o.bytes_this_month)}
          sub="New photo bytes"
        />
        <StatTile
          icon={FileCheck2}
          tone="brand"
          label="Live Photos"
          value={o.live_photos.toLocaleString()}
          sub="Attached to notes"
        />
      </div>

      {/* Headroom — the R2 trigger, with a visual meter (URDS Meter). */}
      <div className="rounded-2xl bg-card p-6 shadow-float">
        <div className="flex items-start gap-4">
          <CardIcon icon={Cloud} tone={tone} variant="badge" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Headroom</h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatBytes(o.total_bytes)} of ~{COMFORT_GB} GB comfort line
              </span>
            </div>
            <Meter
              value={pct}
              tone={tone as MeterTone}
              label={`Photo storage: ${pct}% of the ${COMFORT_GB} GB comfort line`}
              className="mt-3"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              You&rsquo;re at{" "}
              <span className="font-semibold tabular-nums text-foreground">{pct}%</span> of the
              comfort line. {cue}
            </p>
          </div>
        </div>
      </div>

      {/* Storage by clinic */}
      <div className="rounded-2xl bg-card p-6 shadow-float">
        <h2 className="text-lg font-semibold tracking-tight">Storage By Clinic</h2>
        {o.tenants.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No photos stored yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Clinic</th>
                  <th className="pb-2 pr-4 text-right font-semibold">Objects</th>
                  <th className="pb-2 text-right font-semibold">Storage</th>
                </tr>
              </thead>
              <tbody>
                {o.tenants.map((t) => (
                  <tr key={t.tenant_id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{t.name}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                      {Number(t.objects).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatBytes(Number(t.bytes))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* The plan — the strategic context behind the number. */}
      <div className="rounded-2xl bg-muted/40 p-6">
        <h2 className="text-base font-semibold tracking-tight">The Plan</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            Photo bytes live in a private Supabase Storage bucket behind an abstraction, so moving
            the object store to <span className="font-medium text-foreground">Cloudflare R2</span>{" "}
            (zero egress) later is a config change, not a rewrite.
          </li>
          <li>
            Deleting a photo keeps its bytes (a clinical image is a record). Truly abandoned uploads
            are swept nightly, and reclaiming <em>their</em> bytes rides this same object-storage
            workstream.
          </li>
          <li>
            Bandwidth (egress) isn&rsquo;t metered yet — it arrives with the R2 move, where it&rsquo;s
            free. Until then, storage size and its growth are the capacity signal.
          </li>
        </ul>
      </div>
    </div>
  );
}
