"use client";
// Demo persistence: state saved in this browser (localStorage) so posts,
// medications and challenge joins survive a reload. No server database yet.
import { useEffect, useState } from "react";

export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`herheart:${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed !== null && parsed !== undefined) setValue(parsed as T);
      }
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(`herheart:${key}`, JSON.stringify(value));
    } catch {}
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

// Medications: shared by the Meds screen (adds them) and Talk (tells the
// voice agent what she takes).
export type Medication = {
  id: string;
  name: string;
  dose: string;
  timesPerDay: number;
  times: string[]; // "08:00"
  startDate: string; // ISO date
  prescribedBy: string;
  demo?: boolean;
};
export const MEDS_KEY = "meds";
export const DEFAULT_MEDS: Medication[] = [
  {
    id: "ramipril",
    name: "Ramipril",
    dose: "2.5 mg",
    timesPerDay: 1,
    times: ["08:00"],
    startDate: "2026-09-11",
    prescribedBy: "Dr Patel (GP)",
    demo: true,
  },
];
export const COMMON_DRUGS = [
  "Amlodipine", "Ramipril", "Losartan", "Bisoprolol", "Atorvastatin", "Rosuvastatin",
  "Aspirin", "Apixaban", "Rivaroxaban", "Metformin", "HRT (estradiol)",
];
export const useMeds = () => useStored<Medication[]>(MEDS_KEY, DEFAULT_MEDS);

// Her community identity: a display name, never her real name.
export const ME = { displayName: "HeartfulA", avatar: "HA" };

// Read a saved value without ever writing it (for summaries like a count).
export function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`herheart:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
