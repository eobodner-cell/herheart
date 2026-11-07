"use client";
// Small cards HerHeart attaches to chat replies, so connected apps, blood
// pressure, medications and community appear inside the conversation.
import { dateLabel, medication, series } from "@/lib/patient";
import { evaluate, healthyNormal } from "@/lib/rules";
import { DEMO_DAY, type DemoCard } from "@/lib/demo";
import { readStored, useMeds } from "@/lib/store";
import s from "./ChatCards.module.css";

const NAMES: Record<string, string> = {
  "apple-health": "Apple Health",
  oura: "Oura",
  "withings-bp": "Withings BP",
  "nhs-app": "NHS App",
  fitbit: "Fitbit",
  whoop: "Whoop",
  garmin: "Garmin",
  strava: "Strava",
  myfitnesspal: "MyFitnessPal",
  zoe: "ZOE",
  dexcom: "Dexcom",
  "freestyle-libre": "FreeStyle Libre",
  "flo-clue": "Flo / Clue",
};

function Apps() {
  const saved = readStored<Record<string, boolean>>("connections");
  const ids = saved ? Object.keys(saved).filter((k) => saved[k]) : ["apple-health", "oura", "withings-bp", "nhs-app"];
  return (
    <div className={s.card}>
      <p className={s.title}>Synced just now</p>
      <ul className={s.apps}>
        {ids.map((id) => (
          <li key={id}>
            <i aria-hidden /> {NAMES[id] ?? id}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bp() {
  const n = healthyNormal();
  const now = evaluate(DEMO_DAY).metrics;
  const pre = series.slice(medication.startDay - 7, medication.startDay);
  const preSys = Math.round(pre.reduce((a, d) => a + d.sys, 0) / pre.length);
  const preDia = Math.round(pre.reduce((a, d) => a + d.dia, 0) / pre.length);
  const from = DEMO_DAY - 20;
  const vals = series.slice(from, DEMO_DAY + 1).map((d) => d.sys);
  const lo = Math.min(...vals, n.sys) - 2, hi = Math.max(...vals) + 2;
  const W = 220, H = 56;
  const x = (i: number) => (i / (vals.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const med = medication.startDay - from;
  return (
    <div className={s.card}>
      <p className={s.title}>Home blood pressure · 7-day average</p>
      <div className={s.bpRow}>
        <div>
          <small>Week before</small>
          <b>{preSys}/{preDia}</b>
        </div>
        <span className={s.arrow} aria-hidden>→</span>
        <div>
          <small>This week</small>
          <b className={s.now}>{now.sys}/{now.dia}</b>
        </div>
        <div className={s.normal}>
          <small>Your normal</small>
          <b>{n.sys}/{n.dia}</b>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 12}`} className={s.spark} role="img" aria-label="Systolic blood pressure, last 3 weeks">
        <line x1={0} x2={W} y1={y(n.sys)} y2={y(n.sys)} className={s.base} />
        <line x1={x(med)} x2={x(med)} y1={0} y2={H} className={s.med} />
        <text x={x(med) + 3} y={9} className={s.note}>ramipril</text>
        <path d={path} className={s.line} />
        <text x={0} y={H + 11} className={s.note}>{dateLabel(from)}</text>
        <text x={W} y={H + 11} textAnchor="end" className={s.note}>{dateLabel(DEMO_DAY)}</text>
      </svg>
    </div>
  );
}

function Meds() {
  const [meds] = useMeds();
  return (
    <div className={s.card}>
      <p className={s.title}>Your medications</p>
      <ul className={s.meds}>
        {meds.map((m) => (
          <li key={m.id}>
            <i aria-hidden />
            <span>
              <b>{m.name} {m.dose}</b>
              <small>{m.timesPerDay === 1 ? "Once a day" : `${m.timesPerDay}× a day`}</small>
            </span>
          </li>
        ))}
      </ul>
      <span className={s.add}>+ Add a medication</span>
    </div>
  );
}

function Together() {
  return (
    <div className={s.card}>
      <div className={s.group}>
        <span className={s.avatars} aria-hidden>
          <i>MT</i><i>JR</i><i>SK</i>
        </span>
        <span>
          <b>Living with hypertension</b>
          <small>3,413 members · you&apos;re in</small>
        </span>
      </div>
      <div className={s.challenge}>
        <span>
          <b>Cut saturated fat together</b>
          <small>Heart Sisters · day 9 of 30 · 80% of goal days</small>
        </span>
        <div className={s.bar}><i style={{ width: "30%" }} /></div>
      </div>
    </div>
  );
}

export default function ChatCard({ card }: { card: DemoCard }) {
  if (card === "apps") return <Apps />;
  if (card === "bp") return <Bp />;
  if (card === "meds") return <Meds />;
  return <Together />;
}
