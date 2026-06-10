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
  addressLines: string[];
  allergies: { substance: string; reaction: string; severity: string }[];
  alerts: { title: string; priority: string }[];
} | null;

const Ctx = createContext<{
  patient: TopbarPatient;
  setPatient: (p: TopbarPatient) => void;
}>({ patient: null, setPatient: () => {} });

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<TopbarPatient>(null);
  const value = useMemo(() => ({ patient, setPatient }), [patient]);
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
