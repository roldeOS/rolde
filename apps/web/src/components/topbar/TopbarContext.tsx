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
  allergies: { substance: string; reaction: string; severity: string }[];
  alerts: { title: string; priority: string }[];
  /** Snapshot (Roland 2026-07-01): PMH + current meds in the name-drop sheet. */
  problems: { title: string; status: string }[];
  medications: { drug: string; dose: string | null; frequency: string | null }[];
} | null;

/**
 * The consultation workspace LAYOUT (Roland 2026-07-01, APPROVALS §4.2 — user-
 * controlled, NO auto-resize; supersedes the Consult/Document/Review presets).
 * `col` = the left column's share of the width; `split` = the top cards' share
 * of the height (ONE split applied to both columns — visually symmetric).
 */
export type WorkspaceLayout = { col: number; split: number };
export type SavedLayout = WorkspaceLayout & { name: string };
/** "Default" = the locked balanced 50/50 (Roland 2026-07-01). */
export const DEFAULT_LAYOUT: WorkspaceLayout = { col: 0.5, split: 0.5 };

const clamp = (n: number) => Math.min(0.8, Math.max(0.2, n));
const sane = (l: WorkspaceLayout): WorkspaceLayout => ({ col: clamp(l.col), split: clamp(l.split) });

const Ctx = createContext<{
  patient: TopbarPatient;
  setPatient: (p: TopbarPatient) => void;
  layout: WorkspaceLayout;
  setLayout: (l: WorkspaceLayout) => void;
  layouts: SavedLayout[];
  saveLayout: (name: string) => void;
  removeLayout: (name: string) => void;
}>({
  patient: null,
  setPatient: () => {},
  layout: DEFAULT_LAYOUT,
  setLayout: () => {},
  layouts: [],
  saveLayout: () => {},
  removeLayout: () => {},
});

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<TopbarPatient>(null);
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
    () => ({ patient, setPatient, layout, setLayout, layouts, saveLayout, removeLayout }),
    [patient, layout, setLayout, layouts, saveLayout, removeLayout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTopbar = () => useContext(Ctx);

/**
 * Rendered by the patient page (a server component) to publish the current
 * patient into the global topbar — identity chip, allergy zone, address island.
 * Also records the visit in "recents". Clears on unmount.
 */
export function TopbarPatientSync({ patient }: { patient: TopbarPatient }) {
  const { setPatient } = useTopbar();
  const key = patient ? JSON.stringify(patient) : "";
  useEffect(() => {
    setPatient(patient);
    if (patient) {
      pushRecent({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        meta: `${patient.age}y · ${patient.sex}`,
      });
    }
    return () => setPatient(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
