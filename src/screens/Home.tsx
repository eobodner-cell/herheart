"use client";
// Home: one score, one sentence, four metrics against her own normal.
// Details (full chart, risk profile) open on tap.
import { useState } from "react";
import { clinical, dateLabel, femaleHistory, profile, series, MED_DAY } from "@/lib/patient";
import { evaluate, healthyNormal, heartScore, insight } from "@/lib/rules";
import s from "./Home.module.css";

export type Metric = "rhr" | "hrv" | "bp" | "sleep";
const METRICS: { id: Metric; label: string; unit: string; key: "rhr" | "hrv" | "sys" | "sleep"; higherIsBetter: boolean }[] = [
  { id: "bp", label: "Blood pressure", unit: "mmHg", key: "sys", higherIsBetter: false },
  { id: "rhr", label: "Resting heart rate", unit: "bpm", key: "rhr", higherIsBetter: false },
  { id: "hrv", label: "Heart rate variability", unit: "ms", key: "hrv", higherIsBetter: true },
  { id: "sleep", label: "Sleep", unit: "h", key: "sleep", higherIsBetter: true },
];

function Spark({ day, k }: { day: number; k: "rhr" | "hrv" | "sys" | "sleep" }) {
  const pts = series.slice(Math.max(0, day - 27), day + 1).map((d) => d[k]);
  const lo = Math.min(...pts), hi = Math.max(...pts);
  const W = 64, H = 24;
  const d = pts
    .map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)},${(H - ((v - lo) / (hi - lo || 1)) * H).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.spark} aria-hidden>
      <path d={d} />
    </svg>
  );
}

function Chart({ day, metric }: { day: number; metric: Metric }) {
  const n = healthyNormal();
  const k = METRICS.find((m) => m.id === metric)!.key;
  const from = Math.max(0, day - 55);
  const vals = series.slice(from, day + 1).map((d) => d[k]);
  const baseline = k === "sys" ? n.sys : n[k];
  const lo = Math.min(...vals, baseline) * 0.96;
  const hi = Math.max(...vals, baseline) * 1.04;
  const W = 320, H = 110;
  const x = (i: number) => (i / Math.max(1, vals.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const line = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const medIdx = MED_DAY - from;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className={s.chart} role="img" aria-label="Last 8 weeks against your normal">
      <path d={`${line} L${W},${H} L0,${H} Z`} className={s.area} />
      <line x1={0} x2={W} y1={y(baseline)} y2={y(baseline)} className={s.base} />
      <text x={W} y={y(baseline) - 5} textAnchor="end" className={s.note}>your normal</text>
      {medIdx > 0 && medIdx < vals.length && (
        <>
          <line x1={x(medIdx)} x2={x(medIdx)} y1={0} y2={H} className={s.med} />
          <text x={x(medIdx) + 4} y={10} className={s.note}>ramipril</text>
        </>
      )}
      <path d={line} className={s.line} />
      <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r={4} className={s.dot} />
      <text x={0} y={H + 15} className={s.note}>{dateLabel(from)}</text>
      <text x={W} y={H + 15} textAnchor="end" className={s.note}>{dateLabel(day)}</text>
    </svg>
  );
}

export default function Home({
  day,
  metric,
  onMetric,
  onConnect,
  connectedCount,
}: {
  day: number;
  metric: Metric;
  onMetric: (m: Metric) => void;
  onConnect: () => void;
  connectedCount: number;
}) {
  const e = evaluate(day);
  const m = e.metrics;
  const n = healthyNormal();
  const score = heartScore(e);
  const [open, setOpen] = useState<Metric | null>(metric);
  const [riskOpen, setRiskOpen] = useState(false);
  const risks = femaleHistory.filter((h) => h.risk);

  const value = (id: Metric) => (id === "bp" ? `${m.sys}/${m.dia}` : id === "rhr" ? `${m.rhr}` : id === "hrv" ? `${m.hrv}` : `${m.sleep}`);
  const delta = (id: Metric) => {
    const cur = id === "bp" ? m.sys : id === "rhr" ? m.rhr : id === "hrv" ? m.hrv : m.sleep;
    const base = id === "bp" ? n.sys : n[id];
    const diff = +(cur - base).toFixed(1);
    const good = METRICS.find((x) => x.id === id)!.higherIsBetter ? diff >= 0 : diff <= 0;
    const near = Math.abs(diff) <= (id === "sleep" ? 0.3 : 3);
    return { diff, tone: near ? "near" : good ? "good" : "off", text: near ? "near your normal" : `${diff > 0 ? "+" : ""}${diff} vs normal` };
  };

  return (
    <div className={s.home}>
      <header className={s.top}>
        <div>
          <p className={s.date}>{dateLabel(day)}</p>
          <h1>Hi {profile.name}</h1>
        </div>
        <button type="button" className={s.apps} onClick={onConnect} aria-label={`${connectedCount} apps connected. Manage connected apps`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
          </svg>
          <span>{connectedCount}</span>
        </button>
      </header>

      <section className={s.hero} aria-label="Heart score">
        <div className={s.ringWrap}>
          <svg viewBox="0 0 120 120" className={s.ring} aria-hidden>
            <circle cx="60" cy="60" r="52" className={s.ringBg} />
            <circle cx="60" cy="60" r="52" className={s.ringFg} strokeDasharray={`${(score / 100) * 326.7} 326.7`} />
          </svg>
          <div className={s.score}>
            <b>{score}</b>
            <span>Heart score</span>
          </div>
        </div>
        <p className={s.trend} data-t={e.trajectory}>{e.trajectory}</p>
        <p className={s.insight}>{insight(e)}</p>
      </section>

      <section id="trends">
        <h2 className={s.label}>Vs your normal</h2>
        <ul className={s.list}>
          {METRICS.map((x) => {
            const d = delta(x.id);
            const isOpen = open === x.id;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  className={s.row}
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : x.id);
                    if (!isOpen) onMetric(x.id);
                  }}
                >
                  <span className={s.rowMain}>
                    <span className={s.rowLabel}>{x.label}</span>
                    <span className={s.rowValue}>
                      {value(x.id)} <small>{x.unit}</small>
                    </span>
                    <span className={`${s.delta} ${s[d.tone]}`}>{d.text}</span>
                  </span>
                  <Spark day={day} k={x.key} />
                  <span className={s.chev} aria-hidden>{isOpen ? "⌃" : "›"}</span>
                </button>
                {isOpen && (
                  <div className={s.detail}>
                    <Chart day={day} metric={x.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className={s.label}>Your risk profile</h2>
        <div className={s.list}>
          <button type="button" className={s.row} aria-expanded={riskOpen} onClick={() => setRiskOpen(!riskOpen)}>
            <span className={s.rowMain}>
              <span className={s.rowValue}>{risks.length + 1} factors raise your risk</span>
              <span className={s.rowLabel}>Female-specific history most heart apps never ask about</span>
            </span>
            <span className={s.chev} aria-hidden>{riskOpen ? "⌃" : "›"}</span>
          </button>
          {riskOpen && (
            <div className={s.detail}>
              <ul className={s.risks}>
                {risks.map((h) => (
                  <li key={h.item}>
                    <span>{h.item}</span>
                    <b>{h.value}</b>
                  </li>
                ))}
                <li>
                  <span>Family history</span>
                  <b>Mother: heart attack at 58</b>
                </li>
              </ul>
              <p className={s.subLabel}>Also checked: {femaleHistory.filter((h) => !h.risk).map((h) => h.item.toLowerCase()).join(", ")}</p>
              <dl className={s.clinical}>
                <div><dt>Chol/HDL</dt><dd>{(clinical.totalChol / clinical.hdl).toFixed(1)}</dd></div>
                <div><dt>HbA1c</dt><dd>{clinical.hba1c}</dd></div>
                <div><dt>BMI</dt><dd>{clinical.bmi}</dd></div>
                <div><dt>eGFR</dt><dd>{clinical.egfr}</dd></div>
              </dl>
              <p className={s.subLabel}>From your GP record</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
