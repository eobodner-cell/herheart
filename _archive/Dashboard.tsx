"use client";
// The phone UI. One component for the scripted story and the live app, so
// what judges see in the story is exactly what the product does.
import { clinical, dateLabel, femaleHistory, medication, profile, series, MED_DAY } from "@/lib/patient";
import { useState } from "react";
import { evaluate, heartScore, todayActions, type Flag } from "@/lib/rules";
import type { View } from "@/lib/story";

export type Metric = "rhr" | "hrv" | "bp" | "sleep";
const METRICS: Record<Metric, { label: string; unit: string }> = {
  rhr: { label: "Resting HR", unit: "bpm" },
  hrv: { label: "HRV", unit: "ms" },
  bp: { label: "Home BP", unit: "mmHg" },
  sleep: { label: "Sleep", unit: "h" },
};

function Chart({ day, metric }: { day: number; metric: Metric }) {
  const from = Math.max(0, day - 41);
  const pts = series.slice(from, day + 1);
  const val = (d: (typeof pts)[number]) => (metric === "bp" ? d.sys : d[metric]);
  const vals = pts.map(val);
  const lo = Math.min(...vals) * 0.96;
  const hi = Math.max(...vals) * 1.04;
  const W = 300, H = 110;
  const x = (i: number) => (i / Math.max(1, pts.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const path = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const e = evaluate(day);
  const baseline = metric === "rhr" ? e.metrics.rhrBase : metric === "hrv" ? e.metrics.hrvBase : metric === "bp" ? 135 : null;
  const medIdx = MED_DAY - from;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="chart" role="img" aria-label={`${METRICS[metric].label}, last six weeks`}>
      {baseline != null && (
        <>
          <line x1={0} x2={W} y1={y(baseline)} y2={y(baseline)} className="chart-base" />
          <text x={W - 2} y={y(baseline) - 4} textAnchor="end" className="chart-note">
            {metric === "bp" ? "home threshold 135" : "your normal"}
          </text>
        </>
      )}
      {medIdx > 0 && medIdx < pts.length && (
        <>
          <line x1={x(medIdx)} x2={x(medIdx)} y1={0} y2={H} className="chart-med" />
          <text x={x(medIdx) + 4} y={12} className="chart-note">{medication.name}</text>
        </>
      )}
      <path d={path} className="chart-line" />
      <circle cx={x(pts.length - 1)} cy={y(vals[vals.length - 1])} r={4} className="chart-dot" />
      <text x={0} y={H + 15} className="chart-note">{dateLabel(from)}</text>
      <text x={W} y={H + 15} textAnchor="end" className="chart-note">{dateLabel(day)}</text>
    </svg>
  );
}

function FlagCard({ f }: { f: Flag }) {
  return (
    <div className={`flag flag-${f.level}`}>
      <b>{f.title}</b>
      <span>{f.detail}</span>
    </div>
  );
}

export default function Dashboard({
  view,
  day,
  metric = "rhr",
  alert,
  speaking,
  connected = profile.sources.length,
  urgent,
  onMetric,
}: {
  view: View;
  day: number;
  metric?: Metric;
  alert?: boolean;
  speaking?: boolean;
  connected?: number;
  urgent?: string | null;
  onMetric?: (m: Metric) => void;
}) {
  const e = evaluate(day);
  const m = e.metrics;
  const value: Record<Metric, string> = {
    rhr: `${m.rhr}`,
    hrv: `${m.hrv}`,
    bp: `${m.sys}/${m.dia}`,
    sleep: `${m.sleep}`,
  };
  const shownMetric: Metric = view === "meds" ? "bp" : metric;
  const score = heartScore(e);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [dose, setDose] = useState<"taken" | "skipped" | null>(null);
  return (
    <div className="phone">
      <div className="phone-top">
        <span>{dateLabel(day)}</span>
        <span className={`orb ${speaking ? "speaking" : ""}`} aria-label={speaking ? "HerHeart is speaking" : "HerHeart"} />
      </div>

      {urgent && (
        <div className="urgent" role="alert">
          <b>Call 999 now</b>
          <span>{urgent}</span>
          <small>Medication: {e.onMed ? `${medication.name} ${medication.dose}` : "none"}</small>
        </div>
      )}

      {view === "onboard" && (
        <div className="pane">
          <h3>Hi {profile.name}. Let&apos;s connect your data.</h3>
          <ul className="sources">
            {profile.sources.map((s, i) => (
              <li key={s.id} className={i < connected ? "on" : ""}>
                <span>
                  <b>{s.name}</b>
                  <small>{s.gives}</small>
                </span>
                <span className="tick">{i < connected ? "Connected" : "Connect"}</span>
              </li>
            ))}
          </ul>
          <h4>What generic apps never ask</h4>
          <div className="chips">
            {profile.context.map((c) => (
              <span key={c.label} className={`chip chip-${c.kind}`}>{c.label}</span>
            ))}
          </div>
        </div>
      )}

      {(view === "today" || view === "meds") && (
        <div className="pane">
          <div className="traj">
            <svg viewBox="0 0 44 44" className="ring" role="img" aria-label={`Heart score ${score} of 100`}>
              <circle cx="22" cy="22" r="18" className="ring-bg" />
              <circle cx="22" cy="22" r="18" className="ring-fg" strokeDasharray={`${(score / 100) * 113} 113`} />
              <text x="22" y="26" textAnchor="middle">{score}</text>
            </svg>
            <span>
              Heart score
              <br />
              <b className={`traj-${e.trajectory.replace(" ", "-")}`}>{e.trajectory}</b>
            </span>
          </div>
          {alert !== false &&
            e.flags
              .filter((f) => (view === "meds" ? f.id === "med_response" : true))
              .map((f) => <FlagCard key={f.id} f={f} />)}
          {view === "today" && (
            <div className="actions">
              <h4>Today&apos;s action</h4>
              {todayActions(e).map((a) => (
                <label key={a.id} className={`action ${done[a.id] ? "done" : ""}`}>
                  <input type="checkbox" checked={!!done[a.id]} onChange={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))} />
                  <span>
                    <b><em className={`cat cat-${a.cat}`}>{a.cat}</em> {a.title}</b>
                    <small>{a.why}</small>
                  </span>
                </label>
              ))}
            </div>
          )}
          {view === "meds" && (
            <div className="med">
              <div className="dose-today">
                <span>
                  <b>{medication.name}</b> {medication.dose}
                  <small>Today · 08:00</small>
                </span>
                {dose ? (
                  <em className={`dose-${dose}`}>{dose === "taken" ? "✓ Taken" : "Skipped"}</em>
                ) : (
                  <span className="dose-btns">
                    <button type="button" className="primary" onClick={() => setDose("taken")}>Taken</button>
                    <button type="button" onClick={() => setDose("skipped")}>Skip</button>
                  </span>
                )}
              </div>
              <div className="doses" aria-label="Last 14 doses">
                {Array.from({ length: 14 }, (_, i) => day - 13 + i).map((d) => (
                  <i key={d} className={d < MED_DAY ? "pre" : medication.missed.includes(d) ? "miss" : "ok"} />
                ))}
              </div>
            </div>
          )}
          <div className="metrics">
            {(Object.keys(METRICS) as Metric[]).map((k) => (
              <button
                key={k}
                className={k === shownMetric ? "sel" : ""}
                onClick={() => onMetric?.(k)}
                type="button"
              >
                <small>{METRICS[k].label}</small>
                <b>{value[k]}</b>
                <small>{METRICS[k].unit} · 7-day</small>
              </button>
            ))}
          </div>
          <Chart day={day} metric={shownMetric} />
          <p className="disclaimer">HerHeart supports, not replaces, your doctor.</p>
        </div>
      )}

      {view === "gp" && (
        <div className="pane gp">
          <h3>Summary for your GP</h3>
          <small>{dateLabel(day - 13)} – {dateLabel(day)} · generated by HerHeart · not a diagnosis</small>
          <dl>
            <dt>Home BP (7-day avg)</dt>
            <dd>{m.sys}/{m.dia} mmHg</dd>
            <dt>Resting HR</dt>
            <dd>{m.rhr} bpm (her baseline {m.rhrBase})</dd>
            <dt>HRV</dt>
            <dd>{m.hrv} ms (baseline {m.hrvBase})</dd>
            <dt>Symptoms logged</dt>
            <dd>{e.symptoms.map((s) => s.text).join(" · ") || "none"}</dd>
            <dt>BP variability</dt>
            <dd>{m.sysSD} mmHg (SD of home systolic)</dd>
            <dt>Female-specific history</dt>
            <dd>{femaleHistory.filter((h) => h.risk).map((h) => `${h.item}: ${h.value}`).join(" · ")}</dd>
            <dt>Family history</dt>
            <dd>{clinical.familyHistory}</dd>
            <dt>From GP record</dt>
            <dd>
              Chol/HDL {(clinical.totalChol / clinical.hdl).toFixed(1)} · HbA1c {clinical.hba1c} · BMI {clinical.bmi} · eGFR {clinical.egfr} · smoking: {clinical.smoking.toLowerCase()}
            </dd>
            <dt>Medication</dt>
            <dd>{e.onMed ? `${medication.name} ${medication.dose}` : "none"}</dd>
          </dl>
          <p className="ask">Suggested question: “Could this be high blood pressure, given my preeclampsia history?”</p>
          <p className="disclaimer">HerHeart supports, not replaces, your doctor.</p>
        </div>
      )}
    </div>
  );
}
