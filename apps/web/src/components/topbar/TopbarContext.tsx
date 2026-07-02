"use client";

import {
  createContext,
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

export type WorkspaceView = "consult" | "document" | "review";

const Ctx = createContext<{
  patient: TopbarPatient;
  setPatient: (p: TopbarPatient) => void;
  view: WorkspaceView;
  setView: (v: WorkspaceView) => void;
}>({
  patient: null,
  setPatient: () => {},
  view: "consult",
  setView: () => {},
});

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<TopbarPatient>(null);
  const [view, setViewState] = useState<WorkspaceView>("consult");

  useEffect(() => {
    const v = localStorage.getItem("rolde:view");
    if (v === "consult" || v === "document" || v === "review") setViewState(v);
  }, []);
  const setView = (v: WorkspaceView) => {
    setViewState(v);
    localStorage.setItem("rolde:view", v);
  };

  const value = useMemo(
    () => ({ patient, setPatient, view, setView }),
    [patient, view],
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
