// Seeded demo persona: 100 days of wearable + home-BP data for one woman who
// moves along the cardiovascular spectrum: healthy baseline → drift (days
// 58–67) → GP visit (day 71) → treatment (day 72+) → recovery.
// Deterministic, so every demo run looks identical.

export const DAYS = 100;
export const ALERT_DAY = 69; // the rules engine first flags the drift here
export const GP_DAY = 71;
export const MED_DAY = 72;
export const LAST_DAY = DAYS - 1;

// What we collect, and why. Every item maps to published evidence:
// - Female-specific factors: AHA 2023 scientific statement on CVD risk in
//   women; ACC/AHA 2019 risk enhancers (preeclampsia, premature menopause).
// - Clinical inputs of the validated risk scores: QRISK3 (UK/NICE) and
//   AHA PREVENT (sex-specific): BP, cholesterol/HDL, HbA1c, BMI, eGFR,
//   smoking, diabetes, family history, migraine, SLE, RA, SBP variability.
// - Wearable signals (early-warning, not yet validated as predictors in
//   women): resting HR (WHI cohort: predicts coronary events in women),
//   HRV, sleep, steps, home BP.
export type HistoryItem = { item: string; value: string; risk: boolean; source: string };
export const femaleHistory: HistoryItem[] = [
  { item: "Preeclampsia / pregnancy high BP", value: "Yes · first pregnancy, 2009", risk: true, source: "AHA 2023 · ACC/AHA risk enhancer" },
  { item: "Gestational diabetes", value: "No", risk: false, source: "AHA 2023" },
  { item: "Preterm birth", value: "No", risk: false, source: "AHA 2023" },
  { item: "Menopause", value: "Perimenopause at 47 (not early)", risk: false, source: "Early menopause <45 is a risk enhancer" },
  { item: "PCOS", value: "No", risk: false, source: "AHA 2023" },
  { item: "Lupus (SLE) / rheumatoid arthritis", value: "No", risk: false, source: "QRISK3" },
  { item: "Migraine", value: "Yes, with aura", risk: true, source: "QRISK3" },
  { item: "Hormone therapy / combined pill", value: "None", risk: false, source: "AHA 2023" },
];
export const clinical = {
  // From the GP record (NHS Health Check, 2026). Inputs to QRISK3 / PREVENT.
  totalChol: 5.6, // mmol/L
  hdl: 1.4, // mmol/L
  hba1c: 38, // mmol/mol (diabetes ≥48)
  bmi: 27.4,
  egfr: 92, // mL/min/1.73m²
  smoking: "Never",
  diabetes: "No",
  familyHistory: "Mother: heart attack at 58 (first-degree relative under 60)",
};

export const profile = {
  name: "Amara",
  age: 47,
  // Chips shown on screen: the risk factors that apply to her.
  context: [
    { label: "Preeclampsia (2009)", kind: "female" },
    { label: "Perimenopause", kind: "female" },
    { label: "Migraine with aura", kind: "clinical" },
    { label: "Mother: heart attack at 58", kind: "family" },
    { label: "Cholesterol ratio 4.0", kind: "clinical" },
    { label: "Never smoked", kind: "lifestyle" },
  ],
  sources: [
    { id: "apple", name: "Apple Watch", gives: "Resting HR · HRV · activity" },
    { id: "oura", name: "Oura Ring", gives: "Sleep · temperature" },
    { id: "withings", name: "Withings BP cuff", gives: "Home blood pressure" },
    { id: "nhs", name: "NHS App (GP record)", gives: "Diagnoses · medication" },
  ],
} as const;

export const medication = {
  name: "Ramipril",
  dose: "2.5 mg once daily",
  for: "High blood pressure",
  startDay: MED_DAY,
  missed: [80], // logged adherence: one missed dose
};

export const symptoms = [
  { day: 63, text: "Unusually tired all day" },
  { day: 66, text: "Breathless on the stairs" },
];

export type Day = {
  day: number;
  rhr: number; // resting heart rate, bpm
  hrv: number; // ms (RMSSD)
  sleep: number; // hours
  steps: number;
  sys: number; // home BP, mmHg
  dia: number;
};

// Piecewise-linear curve through [day, value] points.
function curve(points: [number, number][], d: number) {
  for (let i = 1; i < points.length; i++) {
    const [d0, v0] = points[i - 1];
    const [d1, v1] = points[i];
    if (d <= d1) return v0 + ((v1 - v0) * (d - d0)) / Math.max(1, d1 - d0);
  }
  return points[points.length - 1][1];
}
// Repeatable noise in [-0.5, 0.5].
function noise(d: number, k: number) {
  const x = Math.sin(d * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}
const shape = (base: number, drift: number, after: number): [number, number][] => [
  [0, base],
  [58, base],
  [67, drift],
  [MED_DAY, drift],
  [92, after],
  [LAST_DAY, after],
];

export const series: Day[] = Array.from({ length: DAYS }, (_, d) => ({
  day: d,
  rhr: Math.round(curve(shape(63, 71, 65), d) + noise(d, 1) * 3),
  hrv: Math.round(curve(shape(42, 33, 40), d) + noise(d, 2) * 6),
  sleep: +(curve(shape(7.1, 6.3, 7.0), d) + noise(d, 3) * 0.8).toFixed(1),
  steps: Math.round(curve(shape(8200, 5400, 7600), d) + noise(d, 4) * 2400),
  sys: Math.round(curve(shape(125, 139, 128), d) + noise(d, 5) * 6),
  dia: Math.round(curve(shape(79, 88, 80), d) + noise(d, 6) * 4),
}));

export const dateLabel = (d: number) => {
  const t = new Date(2026, 6, 1); // demo timeline starts 1 July 2026
  t.setDate(t.getDate() + d);
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
