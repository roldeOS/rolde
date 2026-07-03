"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { pushRecent } from "@/lib/recents";

/** A next-of-kin / personal contact row (the Profile overlay, W1.2). */
export type PatientContact = {
  id: string;
  name: string;
  relationship: string;
  role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};
/** A care-team doctor (GP & others — the Courier's per-patient address hooks). */
export type PatientCareProvider = {
  id: string;
  name: string;
  role: string | null;
  organisation: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  isGp: boolean;
  notes: string | null;
};

export type TopbarPatient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  sex: string;
  nhs: string | null;
  phone: string | null;
  email: string | null;
  addressLines: string[];
  /** Raw address parts — the Profile overlay's Details form edits these. */
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    postcode: string | null;
  };
  /** Rows carry ids so the Profile overlay's editors can act on them. */
  allergies: {
    id: string;
    substance: string;
    reaction: string;
    severity: string;
    notes: string | null;
  }[];
  alerts: { title: string; priority: string }[];
  /** Snapshot (Roland 2026-07-01): PMH + current meds in the name-drop sheet. */
  problems: {
    id: string;
    title: string;
    status: string;
    onsetDate: string | null;
    notes: string | null;
  }[];
  medications: {
    id: string;
    drug: string;
    dose: string | null;
    frequency: string | null;
    route: string | null;
    notes: string | null;
  }[];
  /** The Profile overlay (W1.2): NOK/personal contacts + the care team. */
  contacts: PatientContact[];
  careTeam: PatientCareProvider[];
} | null;

/**
 * The consultation workspace LAYOUT (Roland 2026-07-01/03, APPROVALS §4.2 —
 * user-controlled, NO auto-resize; supersedes the Consult/Document/Review
 * presets). `col` = the left column's share of the width; `split` = the top
 * cards' share of the height (ONE split for both columns — symmetric);
 * `hidden` = the cards this user has toggled OFF in the Layouts menu (Roland
 * 2026-07-03 — a layout also remembers WHICH cards it shows; Scribe is always on).
 */
export type WorkspaceCard = "notes" | "workup" | "ai";
export type WorkspaceLayout = { col: number; split: number; hidden: WorkspaceCard[] };
export type SavedLayout = WorkspaceLayout & { name: string };
/** "Default" (Roland 2026-07-03): columns 50/50 · rows 80/20 · all cards on. */
export const DEFAULT_LAYOUT: WorkspaceLayout = { col: 0.5, split: 0.8, hidden: [] };

const clamp = (n: number) => Math.min(0.85, Math.max(0.15, n));
const CARDS: WorkspaceCard[] = ["notes", "workup", "ai"];
const sane = (l: Partial<WorkspaceLayout>): WorkspaceLayout => ({
  col: clamp(typeof l.col === "number" ? l.col : DEFAULT_LAYOUT.col),
  split: clamp(typeof l.split === "number" ? l.split : DEFAULT_LAYOUT.split),
  hidden: Array.isArray(l.hidden) ? l.hidden.filter((c): c is WorkspaceCard => CARDS.includes(c as WorkspaceCard)) : [],
});

const Ctx = createContext<{
  patient: TopbarPatient;
  setPatient: (p: TopbarPatient) => void;
  /** Break-glass (W1.2): the record is gated pending justification — the
   *  island shows identity + allergies ONLY, and the Profile overlay stays
   *  shut, until the gate clears this. */
  recordLocked: boolean;
  setRecordLocked: (locked: boolean) => void;
  layout: WorkspaceLayout;
  setLayout: (l: WorkspaceLayout) => void;
  layouts: SavedLayout[];
  saveLayout: (name: string) => void;
  removeLayout: (name: string) => void;
}>({
  patient: null,
  setPatient: () => {},
  recordLocked: false,
  setRecordLocked: () => {},
  layout: DEFAULT_LAYOUT,
  setLayout: () => {},
  layouts: [],
  saveLayout: () => {},
  removeLayout: () => {},
});

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<TopbarPatient>(null);
  const [recordLocked, setRecordLocked] = useState(false);
  // The live layout + the user's NAMED layouts — persisted per user on this
  // device (the same rail the old view preset used). The layout only ever
  // changes on a deliberate act: drag, pick from the Layouts menu, or reset.
  const [layout, setLayoutState] = useState<WorkspaceLayout>(DEFAULT_LAYOUT);
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);

  useEffect(() => {
    try {
      const l = localStorage.getItem("rolde:layout");
      if (l) setLayoutState(sane(JSON.parse(l)));
      const ls = localStorage.getItem("rolde:layouts");
      if (ls) setLayouts(JSON.parse(ls));
    } catch {
      /* corrupted prefs → calm defaults */
    }
    localStorage.removeItem("rolde:view"); // the retired preset key
  }, []);

  const setLayout = useCallback((l: WorkspaceLayout) => {
    const s = sane(l);
    setLayoutState(s);
    localStorage.setItem("rolde:layout", JSON.stringify(s));
  }, []);

  const saveLayout = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 40);
      if (!trimmed) return;
      setLayouts((prev) => {
        const next = [
          ...prev.filter((x) => x.name.toLowerCase() !== trimmed.toLowerCase()),
          { name: trimmed, ...sane(layout) },
        ];
        localStorage.setItem("rolde:layouts", JSON.stringify(next));
        return next;
      });
    },
    [layout],
  );

  const removeLayout = useCallback((name: string) => {
    setLayouts((prev) => {
      const next = prev.filter((x) => x.name !== name);
      localStorage.setItem("rolde:layouts", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      patient,
      setPatient,
      recordLocked,
      setRecordLocked,
      layout,
      setLayout,
      layouts,
      saveLayout,
      removeLayout,
    }),
    [patient, recordLocked, layout, setLayout, layouts, saveLayout, removeLayout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTopbar = () => useContext(Ctx);

/**
 * Rendered by the patient page (a server component) to publish the current
 * patient into the global topbar — identity chip, allergy zone, address island.
 * Also records the visit in "recents". Clears on unmount.
 */
export function TopbarPatientSync({
  patient,
  locked = false,
}: {
  patient: TopbarPatient;
  /** true while the break-glass gate awaits justification (W1.2) — the island
   *  restricts itself to identity + allergies until the gate clears it. */
  locked?: boolean;
}) {
  const { setPatient, setRecordLocked } = useTopbar();
  const key = patient ? JSON.stringify(patient) : "";
  useEffect(() => {
    setPatient(patient);
    setRecordLocked(locked);
    if (patient) {
      pushRecent({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        meta: `${patient.age}y · ${patient.sex}`,
      });
    }
    return () => {
      setPatient(null);
      setRecordLocked(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, locked]);
  return null;
}
