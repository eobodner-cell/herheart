"use client";
// Connected apps: toggle data sources on/off, grouped into Connected / Available.
// Demo only — connecting loads sample data; real sync would go through the Terra API.
import { useEffect, useRef, useState } from "react";
import { useStored } from "@/lib/store";
import styles from "./Connect.module.css";

type Source = {
  id: string;
  name: string;
  provides: string;
  mono: string; // short monogram for the tile (no logos / emoji)
  tint: string; // tile background
  ink: string; // tile text colour
};

const SOURCES: Source[] = [
  { id: "apple-health", name: "Apple Health", provides: "Steps · heart rate · sleep", mono: "AH", tint: "#fdeef3", ink: "#c81e52" },
  { id: "fitbit", name: "Fitbit", provides: "Steps · resting heart rate", mono: "Fb", tint: "#e6f6f3", ink: "#0f766e" },
  { id: "whoop", name: "Whoop", provides: "Strain · recovery · HRV", mono: "Wh", tint: "#f0eeed", ink: "#3a3330" },
  { id: "oura", name: "Oura", provides: "Sleep · HRV · temperature", mono: "Ou", tint: "#f1ecfe", ink: "#6d28d9" },
  { id: "garmin", name: "Garmin", provides: "Activity · VO2 max", mono: "Ga", tint: "#e8f0fd", ink: "#1d4ed8" },
  { id: "strava", name: "Strava", provides: "Workouts · training load", mono: "St", tint: "#fdf0e6", ink: "#c2410c" },
  { id: "myfitnesspal", name: "MyFitnessPal", provides: "Food · salt · calories", mono: "MF", tint: "#e7f3fb", ink: "#0369a1" },
  { id: "zoe", name: "ZOE", provides: "Diet quality · gut health", mono: "Zo", tint: "#fcebf4", ink: "#be185d" },
  { id: "dexcom", name: "Dexcom", provides: "Glucose", mono: "Dx", tint: "#e9f7ee", ink: "#15803d" },
  { id: "libre", name: "FreeStyle Libre", provides: "Glucose", mono: "FL", tint: "#fbf5df", ink: "#a16207" },
  { id: "withings-bp", name: "Withings BP", provides: "Home blood pressure", mono: "Wi", tint: "#eef1f5", ink: "#334155" },
  { id: "flo-clue", name: "Flo / Clue", provides: "Cycle phase", mono: "FC", tint: "#f8ebfb", ink: "#a21caf" },
  { id: "nhs-app", name: "NHS App (GP record)", provides: "Diagnoses · medication · cholesterol", mono: "NHS", tint: "#e8eefc", ink: "#1e40af" },
];

const DEFAULT_CONNECTIONS: Record<string, boolean> = {
  "apple-health": true,
  oura: true,
  "withings-bp": true,
  "nhs-app": true,
};

const CONNECT_MS = 700;
const toggleId = (id: string) => `connect-toggle-${id}`;

export default function Connect({ onBack }: { onBack?: () => void }) {
  const [connections, setConnections] = useStored<Record<string, boolean>>("connections", DEFAULT_CONNECTIONS);
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastToggled = useRef<string | null>(null);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  // A row moves between "Connected" and "Available" when toggled, which remounts
  // its switch; put keyboard focus back on it so it isn't lost.
  useEffect(() => {
    const id = lastToggled.current;
    if (!id) return;
    const active = document.activeElement;
    if (!active || active === document.body) document.getElementById(toggleId(id))?.focus();
  }, [connections]);

  function toggle(id: string) {
    lastToggled.current = id;
    const pending = timers.current.get(id);
    if (pending) {
      // Tapped again while connecting: cancel.
      clearTimeout(pending);
      timers.current.delete(id);
      setConnecting((c) => ({ ...c, [id]: false }));
      return;
    }
    if (connections[id]) {
      setConnections((c) => ({ ...c, [id]: false }));
      return;
    }
    setConnecting((c) => ({ ...c, [id]: true }));
    const t = setTimeout(() => {
      timers.current.delete(id);
      setConnecting((c) => ({ ...c, [id]: false }));
      setConnections((c) => ({ ...c, [id]: true }));
    }, CONNECT_MS);
    timers.current.set(id, t);
  }

  const connected = SOURCES.filter((s) => connections[s.id]);
  const available = SOURCES.filter((s) => !connections[s.id]);
  const pct = Math.round((connected.length / SOURCES.length) * 100);

  function renderRow(s: Source) {
    const on = !!connections[s.id];
    const busy = !!connecting[s.id];
    const statusId = `connect-status-${s.id}`;
    return (
      <li key={s.id} className={styles.row}>
        <span className={styles.tile} style={{ background: s.tint, color: s.ink }} aria-hidden="true">
          {s.mono}
        </span>
        <div className={styles.text}>
          <span className={styles.name}>{s.name}</span>
          <span className={styles.provides}>{s.provides}</span>
          <span
            id={statusId}
            className={`${styles.status} ${busy ? styles.statusBusy : on ? styles.statusOn : styles.visuallyHidden}`}
            aria-live="polite"
          >
            {busy ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Connecting…
              </>
            ) : on ? (
              "Connected · synced just now"
            ) : (
              "Not connected"
            )}
          </span>
        </div>
        <button
          id={toggleId(s.id)}
          type="button"
          className={`${styles.switch} ${busy ? styles.switchBusy : ""}`}
          aria-pressed={on || busy}
          aria-label={`Connect ${s.name}`}
          aria-describedby={statusId}
          aria-busy={busy || undefined}
          onClick={() => toggle(s.id)}
        >
          <span className={styles.knob} aria-hidden="true" />
        </button>
      </li>
    );
  }

  return (
    <div className={styles.screen}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack}>
          <span className={styles.backChevron} aria-hidden="true" />
          Back
        </button>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>Connected apps</h1>
        <p className={styles.sub}>The more you connect, the sharper your heart insights.</p>
        <div className={styles.progress}>
          <p className={styles.count} aria-live="polite">
            {connected.length} of {SOURCES.length} connected
          </p>
          <div
            className={styles.meter}
            role="progressbar"
            aria-label="Apps connected"
            aria-valuemin={0}
            aria-valuemax={SOURCES.length}
            aria-valuenow={connected.length}
          >
            <span className={styles.meterFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="connect-on-label">
        <h2 id="connect-on-label" className={styles.sectionLabel}>
          Connected
        </h2>
        {connected.length ? (
          <ul className={styles.card}>{connected.map(renderRow)}</ul>
        ) : (
          <p className={`${styles.card} ${styles.empty}`}>Nothing connected yet.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="connect-off-label">
        <h2 id="connect-off-label" className={styles.sectionLabel}>
          Available
        </h2>
        {available.length ? (
          <ul className={styles.card}>{available.map(renderRow)}</ul>
        ) : (
          <p className={`${styles.card} ${styles.empty}`}>Everything is connected.</p>
        )}
      </section>

      <p className={styles.footnote}>Demo: connections load sample data. Real sync via Terra API.</p>
    </div>
  );
}
