"use client";

import { useMemo, useState } from "react";
import { UsersRound, Pill } from "lucide-react";
import { TableShell, type SortOption, type FilterField } from "@/components/ui/table/TableShell";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { DENSITY_CLASSES } from "@/components/ui/table/TableDensityToggle";
import { type CardIconTone } from "@/components/ui/CardIcon";
import { ROLES } from "@/lib/roles";
import { accessWindowBadge } from "@/lib/accessWindow";
import { cn } from "@/lib/utils";
import { InviteTeammate } from "./InviteTeammate";
import { EditMember, type EditableMember } from "./EditMember";

/**
 * Users & Roles — the clinic's staff roster as a URDS table (the first RolDe
 * port of the mindate TableShell/DataTable standard). Filter (role · status ·
 * joined window), sort, freeze, density and CSV/PDF export all come from the
 * shared shell; this file only declares the columns + the clinic-specific cells.
 */

export interface StaffMember {
  id: string;
  user_id: string;
  display_name: string;
  designation: string | null;
  preferred_name: string | null;
  job_title: string | null;
  role: string;
  prescribing_rights: boolean;
  license_type: string | null;
  license_number: string | null;
  status: string;
  access_starts_at: string | null;
  access_ends_at: string | null;
  last_login_at: string | null;
  created_at: string;
  email: string | null;
}

const ROLE_BY_KEY: Record<string, (typeof ROLES)[number]> = Object.fromEntries(ROLES.map((r) => [r.key, r]));

// tone → calm pill classes (static literals so Tailwind keeps them at build).
const TONE_PILL: Record<CardIconTone, string> = {
  critical: "bg-critical/12 text-critical",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/12 text-success",
  info: "bg-info/12 text-info",
  accent: "bg-accent/20 text-accent",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-info/12 text-info",
};

// Warm, parchment-friendly avatar palette (never cold blues).
const AVATAR_TINTS = [
  "from-[#c4895c] to-[#a96b41]",
  "from-[#8fa06b] to-[#71834f]",
  "from-[#c9a45c] to-[#ad8740]",
  "from-[#bd6f60] to-[#9c5246]",
  "from-[#a88598] to-[#8a677b]",
  "from-[#6f8f8a] to-[#577471]",
];

function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function initialsOf(name: string): string {
  return name
    .replace(/^(dr|mr|mrs|ms|miss|nr|prof)\.?\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function lastSeen(iso: string | null, nowMs: number): string {
  if (!iso) return "Never";
  const m = Math.floor((nowMs - Date.parse(iso)) / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function fmtJoined(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" }).format(Date.parse(iso));
}

// Designation + name, without doubling a title the name already carries
// (e.g. designation "Dr" + display_name "Dr Roland …" → "Dr Roland …", not "Dr Dr …").
function fullName(s: StaffMember): string {
  const d = s.designation?.trim();
  if (d && !s.display_name.trim().toLowerCase().startsWith(d.toLowerCase())) return `${d} ${s.display_name}`;
  return s.display_name;
}

function toEditable(s: StaffMember): EditableMember {
  return {
    id: s.id,
    display_name: s.display_name,
    email: s.email,
    role: s.role,
    designation: s.designation,
    preferred_name: s.preferred_name,
    job_title: s.job_title,
    license_type: s.license_type,
    license_number: s.license_number,
    prescribing_rights: s.prescribing_rights,
    access_starts_at: s.access_starts_at,
    access_ends_at: s.access_ends_at,
  };
}

export function UsersTable({
  staff,
  meId,
  nowMs,
  country,
  clinicName,
  title,
  blurb,
}: {
  staff: StaffMember[];
  meId: string | null;
  nowMs: number;
  country: string;
  clinicName: string;
  title: string;
  blurb: string;
}) {
  // Who's running the export — for the PDF's audit footer.
  const exportedBy = staff.find((s) => s.user_id === meId)?.display_name ?? "";
  // Row click opens the editor (Roland 2026-06-21 — rows hover + click to edit,
  // not a buried ⋯). The ⋯ keeps only the secondary actions (reset / pause).
  const [editing, setEditing] = useState<StaffMember | null>(null);

  // Filter options derive from the roster present (only roles in use show up).
  const roleOptions = useMemo(() => {
    const seen = new Set(staff.map((s) => s.role));
    return ROLES.filter((r) => seen.has(r.key)).map((r) => ({
      value: r.key,
      label: r.label,
      count: staff.filter((s) => s.role === r.key).length,
    }));
  }, [staff]);

  const filters: FilterField<StaffMember>[] = [
    { key: "role", label: "Role", options: roleOptions, get: (s) => s.role },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active", count: staff.filter((s) => s.status === "active").length },
        { value: "paused", label: "Paused", count: staff.filter((s) => s.status !== "active").length },
      ],
      get: (s) => (s.status === "active" ? "active" : "paused"),
    },
    { key: "joined", label: "Joined", kind: "daterange", getDate: (s) => s.created_at },
  ];

  const sortOptions: SortOption<StaffMember>[] = [
    { key: "name", label: "Name (A–Z)", compare: (a, b) => a.display_name.localeCompare(b.display_name) },
    { key: "role", label: "Role", compare: (a, b) => (ROLE_BY_KEY[a.role]?.label ?? "").localeCompare(ROLE_BY_KEY[b.role]?.label ?? "") },
    { key: "joined", label: "Joined (Newest)", compare: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) },
    {
      key: "seen",
      label: "Last Seen (Recent)",
      compare: (a, b) => (b.last_login_at ? Date.parse(b.last_login_at) : 0) - (a.last_login_at ? Date.parse(a.last_login_at) : 0),
    },
  ];

  const columns: DataTableColumn<StaffMember>[] = [
    {
      id: "person",
      header: "Person",
      width: "23%",
      wrap: true,
      cell: (s) => {
        const name = fullName(s);
        return (
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white shadow-sm ring-2 ring-white",
                tintFor(s.user_id),
              )}
              aria-hidden
            >
              {initialsOf(s.display_name) || "—"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-foreground">{name}</span>
                {s.user_id === meId && (
                  <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    You
                  </span>
                )}
              </div>
              {s.email && <span className="block truncate text-xs text-muted-foreground">{s.email}</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      width: "10rem",
      cell: (s) => {
        const role = ROLE_BY_KEY[s.role];
        if (!role) return <span className="text-muted-foreground">—</span>;
        return <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium", TONE_PILL[role.tone])}>{role.label}</span>;
      },
    },
    {
      id: "job",
      header: "Job Title",
      width: "14%",
      truncate: true,
      title: (s) => s.job_title || ROLE_BY_KEY[s.role]?.meaning || "",
      cell: (s) => <span className="text-muted-foreground">{s.job_title || ROLE_BY_KEY[s.role]?.meaning || "—"}</span>,
    },
    {
      id: "rx",
      header: "Prescriber",
      width: "7.5rem",
      align: "center",
      cell: (s) =>
        s.prescribing_rights ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-success/12 px-2 py-0.5 text-xs font-medium text-success" title="Caretaker has granted prescribing rights">
            <Pill className="size-3" /> Yes
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        ),
    },
    {
      id: "access",
      header: "Access",
      width: "9rem",
      cell: (s) => {
        if (s.status !== "active") {
          return <span className="inline-block rounded-md bg-critical/12 px-2 py-0.5 text-xs font-medium text-critical">Paused</span>;
        }
        const w = accessWindowBadge(s.access_starts_at, s.access_ends_at, nowMs);
        return <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium", TONE_PILL[w.tone])}>{w.label}</span>;
      },
    },
    {
      id: "seen",
      header: "Last Seen",
      width: "7.5rem",
      cell: (s) => <span className="text-muted-foreground tabular-nums">{lastSeen(s.last_login_at, nowMs)}</span>,
    },
    {
      id: "joined",
      header: "Joined",
      width: "6.5rem",
      cell: (s) => <span className="text-muted-foreground tabular-nums">{fmtJoined(s.created_at)}</span>,
    },
  ];

  const exportColumns = [
    { header: "Name", value: (s: StaffMember) => fullName(s) },
    { header: "Role", value: (s: StaffMember) => ROLE_BY_KEY[s.role]?.label ?? s.role },
    { header: "Job Title", value: (s: StaffMember) => s.job_title || ROLE_BY_KEY[s.role]?.meaning || "" },
    { header: "Email", value: (s: StaffMember) => s.email ?? "" },
    { header: "Prescriber", value: (s: StaffMember) => (s.prescribing_rights ? "Yes" : "No") },
    { header: "Status", value: (s: StaffMember) => (s.status === "active" ? "Active" : "Paused") },
    { header: "Access", value: (s: StaffMember) => accessWindowBadge(s.access_starts_at, s.access_ends_at, nowMs).label },
    { header: "Licence", value: (s: StaffMember) => [s.license_type, s.license_number].filter(Boolean).join(" ") },
    { header: "Joined", value: (s: StaffMember) => fmtJoined(s.created_at) },
    { header: "Last Seen", value: (s: StaffMember) => lastSeen(s.last_login_at, nowMs) },
  ];

  return (
    <>
      <TableShell<StaffMember>
        items={staff}
        storageKey="users-roles"
        label="people"
        header={{ variant: "page", icon: UsersRound, tone: "brand", title, explainer: { label: title, description: blurb } }}
        filters={filters}
        filterTitle="Filter People"
        sortOptions={sortOptions}
        freezeColumns={["Person"]}
        exportColumns={exportColumns}
        exportTitle="Users & Roles"
        exportBrand={{ clinic: clinicName, exportedBy }}
        toolbarTrailing={<InviteTeammate country={country} />}
        defaultPageSize={20}
      >
        {({ rows, startIndex, density, freezeCount }) => (
          <DataTable<StaffMember>
            columns={columns}
            rows={rows}
            rowKey={(s) => s.id}
            density={DENSITY_CLASSES[density]}
            onRowClick={(s) => setEditing(s)}
            rowClassName={(s) => (s.status !== "active" ? "opacity-60" : undefined)}
            minWidth="60rem"
            bare
            freezeCount={freezeCount}
            rowNumbers
            rowNumberStart={startIndex}
            empty="No one matches these filters."
          />
        )}
      </TableShell>

      {/* Row click → edit (the ⋯ holds only reset/pause). One editor, re-seeded
          per member; keyed so its form resets cleanly between people. */}
      {editing && (
        <EditMember
          key={editing.id}
          member={toEditable(editing)}
          country={country}
          open
          isMe={editing.user_id === meId}
          status={editing.status}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
