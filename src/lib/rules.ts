// Deterministic rules engine. The LLM never decides whether something is
// safe: these rules decide WHEN HerHeart speaks and WHAT level of action applies.
// The voice agent only explains the result in plain language.
// Thresholds are demo values drawn from public guidance (e.g. NICE NG136
// home-BP threshold 135/85) and need clinical review before real use.
import { dateLabel, GP_DAY, medication, series, symptoms, type Day } from "./patient";

export type Level = "good" | "watch" | "gp" | "urgent";
export type Flag = { id: string; level: Level; title: string; detail: string };

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const range = (from: number, to: number) =>
  series.slice(Math.max(0, from), Math.max(0, to + 1));
const mean = (days: Day[], k: keyof Day) => avg(days.map((d) => d[k]));

export function evaluate(day: number) {
  const last7 = range(day - 6, day);
  // Personal baseline: the 4 weeks ending 2 weeks ago. Her own normal,
  // not a population (male-skewed) average.
  const base = range(day - 41, day - 14);
  const rhr = mean(last7, "rhr");
  const rhrBase = mean(base, "rhr");
  const hrv = mean(last7, "hrv");
  const hrvBase = mean(base, "hrv");
  const sys = Math.round(mean(last7, "sys"));
  const dia = Math.round(mean(last7, "dia"));
  // Systolic variability (SD of home readings): a QRISK3 input.
  const sysMean = mean(last7, "sys");
  const sysSD = Math.round(Math.sqrt(avg(last7.map((d) => (d.sys - sysMean) ** 2))));
  const onMed = day >= medication.startDay;
  const flags: Flag[] = [];

  const hrvDrop = Math.round(((hrvBase - hrv) / hrvBase) * 100);
  if (!onMed && rhr - rhrBase >= 5 && hrvDrop >= 15)
    flags.push({
      id: "baseline_shift",
      level: "watch",
      title: "Your baseline has shifted",
      detail: `Resting HR ${Math.round(rhr)} bpm vs your normal ${Math.round(rhrBase)} · HRV down ${hrvDrop}% for 10+ days`,
    });

  if (sys >= 180 || dia >= 120)
    flags.push({
      id: "bp_severe",
      level: "urgent",
      title: "Very high blood pressure",
      detail: `Home average ${sys}/${dia}. Contact your GP or NHS 111 today.`,
    });
  else if (!onMed && (sys >= 135 || dia >= 85))
    flags.push({
      id: "bp_gp",
      level: "gp",
      title: "Book a GP blood pressure review",
      detail: `7-day home average ${sys}/${dia} (home threshold 135/85)`,
    });

  if (onMed) {
    const pre = range(medication.startDay - 7, medication.startDay - 1);
    const preSys = Math.round(mean(pre, "sys"));
    const preDia = Math.round(mean(pre, "dia"));
    const taken = Array.from({ length: Math.min(14, day - medication.startDay + 1) }, (_, i) => day - i)
      .map((d) => !medication.missed.includes(d));
    const adherence = Math.round((taken.filter(Boolean).length / taken.length) * 100);
    const atTarget = sys < 135 && dia < 85;
    flags.push({
      id: "med_response",
      level: day - medication.startDay < 10 ? "watch" : atTarget ? "good" : "watch",
      title: atTarget ? "Your medication is working" : "Medication: still adjusting",
      detail: `Home BP ${preSys}/${preDia} → ${sys}/${dia} since starting ${medication.name} · ${adherence}% doses logged`,
    });
  }

  const recent = symptoms.filter((s) => s.day <= day && s.day > day - 14);
  const trajectory: "improving" | "stable" | "needs attention" = flags.some((f) =>
    ["watch", "gp", "urgent"].includes(f.level),
  )
    ? flags.some((f) => f.id === "med_response")
      ? "improving"
      : "needs attention"
    : onMed
      ? "improving"
      : "stable";

  return {
    day,
    flags,
    trajectory,
    onMed,
    metrics: {
      rhr: Math.round(rhr),
      rhrBase: Math.round(rhrBase),
      hrv: Math.round(hrv),
      hrvBase: Math.round(hrvBase),
      sys,
      dia,
      sysSD,
      sleep: +mean(last7, "sleep").toFixed(1),
      steps: Math.round(mean(last7, "steps")),
    },
    symptoms: recent,
  };
}
export type Evaluation = ReturnType<typeof evaluate>;

// Illustrative 0–100 score: starts high and loses points for drift from HER
// baseline and raised home BP. Not a clinical risk score.
export function heartScore(e: Evaluation) {
  const m = e.metrics;
  const s =
    92 -
    Math.max(0, m.rhr - m.rhrBase) * 2.5 -
    Math.max(0, ((m.hrvBase - m.hrv) / m.hrvBase) * 60) -
    Math.max(0, m.sys - 125) * 1.2 -
    Math.max(0, 7 - m.sleep) * 6;
  return Math.round(Math.min(98, Math.max(35, s)));
}


// Compact text the voice agent receives as context (dynamic variable /
// contextual update). Facts only; the agent must not add numbers.
export function agentContext(e: Evaluation) {
  const m = e.metrics;
  return [
    `Day ${e.day}. Trajectory: ${e.trajectory}. ${e.onMed ? `On ${medication.name} ${medication.dose}.` : "No cardiovascular medication."}`,
    `7-day averages: resting HR ${m.rhr} bpm (her baseline ${m.rhrBase}), HRV ${m.hrv} ms (baseline ${m.hrvBase}), home BP ${m.sys}/${m.dia} (systolic variability ${m.sysSD} mmHg), sleep ${m.sleep} h, steps ${m.steps}.`,
    e.flags.length
      ? `Active rule flags: ${e.flags.map((f) => `[${f.level}] ${f.title}: ${f.detail}`).join(" | ")}`
      : "No active rule flags.",
    e.symptoms.length ? `Recent symptoms: ${e.symptoms.map((s) => s.text).join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Her whole demo timeline in compact form, so the voice agent can answer
// questions about any week ("how was my sleep in August?", "when did I start
// ramipril?"). Facts only, computed from the same seeded data.
export function historyContext(upToDay: number = series.length - 1) {
  const rows: string[] = [];
  for (let start = 0; start <= upToDay; start += 7) {
    const days = series.slice(start, Math.min(start + 7, upToDay + 1));
    if (!days.length) break;
    const a = (k: keyof Day) => avg(days.map((d) => d[k]));
    rows.push(
      `${dateLabel(days[0].day)}–${dateLabel(days[days.length - 1].day)}: resting HR ${Math.round(a("rhr"))} bpm, HRV ${Math.round(a("hrv"))} ms, home BP ${Math.round(a("sys"))}/${Math.round(a("dia"))}, sleep ${a("sleep").toFixed(1)} h, steps ${Math.round(a("steps"))}`,
    );
  }
  const events = [
    ...symptoms.filter((s) => s.day <= upToDay).map((s) => `${dateLabel(s.day)}: logged symptom "${s.text}"`),
    ...(upToDay >= GP_DAY ? [`${dateLabel(GP_DAY)}: GP visit, diagnosed with high blood pressure`] : []),
    ...(upToDay >= medication.startDay ? [`${dateLabel(medication.startDay)}: started ${medication.name} ${medication.dose}`] : []),
    ...medication.missed.filter((d) => d <= upToDay).map((d) => `${dateLabel(d)}: missed a ${medication.name} dose`),
  ];
  return `Weekly averages (oldest first):\n${rows.join("\n")}\nEvents:\n${events.join("\n") || "none yet"}`;
}

// Her healthy personal normal: the first 8 weeks, before the drift. Home
// compares today against this (a rolling window would absorb the drift).
export function healthyNormal() {
  const days = series.slice(0, 56);
  const m = (k: keyof Day) => avg(days.map((d) => d[k]));
  return {
    rhr: Math.round(m("rhr")),
    hrv: Math.round(m("hrv")),
    sys: Math.round(m("sys")),
    dia: Math.round(m("dia")),
    sleep: +m("sleep").toFixed(1),
  };
}

// One plain-English sentence for the top of Home (Oura-style daily insight).
export function insight(e: Evaluation) {
  const n = healthyNormal();
  const m = e.metrics;
  // First weeks on medication: say it has started to work, honestly.
  if (e.onMed && e.day - medication.startDay < 21) {
    const pre = range(medication.startDay - 7, medication.startDay - 1);
    const preSys = Math.round(mean(pre, "sys"));
    const preDia = Math.round(mean(pre, "dia"));
    if (m.sys < preSys)
      return `Your blood pressure has started to come down since you began ${medication.name}: ${m.sys}/${m.dia} this week, from ${preSys}/${preDia} the week before.`;
  }
  if (e.onMed && m.sys < 135 && m.dia < 85)
    return `Your blood pressure has come down to ${m.sys}/${m.dia} since you started ${medication.name}, close to your normal of ${n.sys}/${n.dia}.`;
  if (m.rhr - n.rhr >= 5) return `Your resting heart rate is ${m.rhr - n.rhr} beats above your normal this week. Take it gently.`;
  if (m.sys >= 135) return `Your blood pressure has averaged ${m.sys}/${m.dia} this week, above your normal of ${n.sys}/${n.dia}.`;
  return "Your heart numbers are close to your normal this week.";
}
