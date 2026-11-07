# HerHeart: features, data and the road to prediction

Status as of the OX1 × Hack-Nation demo, 7 Nov 2026. ✅ built and working · 🟡 partly built · 🔜 roadmap.

## 1. Features and where they live

**Architecture today:** a Next.js web app shown as a phone with a bottom bar: Home · Meds · Talk · Community · Challenges. The **front end** is the React screens in `src/screens/`. The **logic layer** (`src/lib`) is plain TypeScript. The **back end** is one Next.js server route plus the ElevenLabs voice agent in the cloud. There's no database yet: Amara's health data is seeded in code, and what she adds (medications, posts, joins, connections) is saved in the browser.

This reflects the team's feature decisions: 8 front-end features kept, everything marked Don't want removed (kept in `_archive/`, not deleted).

### Front end (what she sees)

| Feature | Status | File |
|---|---|---|
| Phone shell with bottom bar inside the phone (Home · Meds · Talk · Community · Challenges) | ✅ | `src/app/app/shell.tsx` |
| Connect your apps: 13 sources with toggles, 4 connected by default | ✅ (demo toggles) | `src/screens/Connect.tsx` |
| Female-specific risk profile, plus GP-record values | ✅ | `src/screens/Home.tsx` |
| Heart score ring with trajectory | ✅ | `Home.tsx` |
| Trends vs her normal: resting HR, HRV, home BP, sleep; 8-week chart with "started ramipril" marker | ✅ | `Home.tsx` |
| Add a medication: suggestions, dose, times a day, start date, demo photo-of-the-box | ✅ | `src/screens/Meds.tsx` |
| Talk to HerHeart: animated heart that glows with voice, transcript, type-a-question | ✅ (live voice: test in Chrome) | `src/screens/Talk.tsx`, `src/components/HeartAvatar.tsx` |
| Community: 6 groups, pinned guidelines, posts, replies, "This helped", report, new post | ✅ (demo posts) | `src/screens/Community.tsx` |
| Team challenges & badges: active team challenge, streak, 30-day grid, badges, fair leaderboard, join more | ✅ (demo data) | `src/screens/Challenges.tsx` |

### Logic layer

| Feature | Status | File |
|---|---|---|
| Personal baseline: her own recent normal, not a population average | ✅ | `src/lib/rules.ts` |
| Heart score (illustrative, not a clinical score) | ✅ | `rules.ts` |
| Context builder: today's facts and 100-day history for the voice agent | ✅ | `rules.ts` |
| Saved demo state: medications, posts, joins, connections (localStorage) | ✅ | `src/lib/store.ts` |
| Cycle & menopause-aware advice | 🔜 | |
| Statistical outlier flags | 🔜 | |
| Predictive risk model | 🔜 (see section 3) | |

### Back end (server and cloud)

| Feature | Status | File |
|---|---|---|
| Voice token route: the ElevenLabs key never reaches the browser | ✅ | `src/app/api/el-token/route.ts` |
| ElevenLabs voice agent: Claude Sonnet, 1.15× speech, knows her profile, medications and history; one tool (`show_metric`) | ✅ | `agents/herheart.md`, `scripts/setup-agent.ts` |
| Database with per-user access rules (e.g. Supabase) | 🔜 | |
| Wearable sync via an aggregator (e.g. Terra API) | 🔜 | |
| Apple Health / Health Connect (needs a native app) | 🔜 | |
| More agent tools, saved conversation summaries | 🔜 | |
| AI moderation for community posts | 🔜 | |
| Consent log, de-identified research export | 🔜 | |

### Removed in the rebuild

Scripted one-minute story · pre-rendered voices · Today's action · alert cards and proactive nudges · GP summary · Taken/Skip and adherence strip · medication response rule · 999 banner and red-flag rules · "supports, not replaces, your doctor" line · presenter panel. Code is in `_archive/`.

---

## 2. What data we can collect

| Data | Source | Frequency | In the demo |
|---|---|---|---|
| Resting heart rate | Apple Watch, Fitbit, Garmin, Whoop, Oura | daily | ✅ seeded |
| Heart rate variability (HRV) | Apple Watch, Whoop, Oura, Garmin | daily | ✅ seeded |
| Sleep duration (and stages) | Oura, Whoop, Apple Watch | nightly | ✅ seeded |
| Steps, active minutes | any wearable, Strava | daily | ✅ seeded |
| Home blood pressure | Withings and other connected cuffs | 1–2× daily | ✅ seeded |
| Irregular-rhythm (AF) notifications | Apple Watch, Fitbit, Withings | event | 🔜 |
| Glucose | Dexcom, FreeStyle Libre (CGM) | continuous | 🔜 |
| Nutrition: salt, saturated fat | MyFitnessPal, ZOE (via Apple Health) | per meal | 🟡 used by the saturated-fat challenge (demo) |
| Cycle phase, pregnancy | Flo, Clue | daily | 🔜 |
| Diagnoses, cholesterol, HbA1c, BMI, eGFR | GP record (NHS App) | on change | ✅ seeded |
| **Female-specific history**: preeclampsia, gestational diabetes, preterm birth, age at menopause, PCOS, autoimmune disease (lupus, RA), migraine | onboarding questions (one-off) | once, then on change | ✅ all 8 answered (risk profile) |
| Family history of early heart disease | onboarding | once | ✅ seeded |
| Symptoms (fatigue, breathlessness, palpitations, jaw/back pain) | she tells HerHeart, by voice or text | as they happen | 🔜 not saved yet |
| Medications (name, dose, schedule, start date) | she adds them, or GP record | on change | ✅ Add a medication |
| Mood, stress | voice check-ins | daily | 🔜 |

**The rule:** she shouldn't have to type much. Almost everything arrives automatically. The only manual inputs are a one-off history and adding a medication.

### Evidence check: are we collecting the right things?

Checked against the AHA 2023 scientific statement on cardiovascular risk in women, the ACC/AHA 2019 prevention guideline, and the inputs of the two validated risk scores: **QRISK3** (used by NICE and the NHS) and **AHA PREVENT** (sex-specific).

| Data item | Why it matters | Evidence | In the demo dataset |
|---|---|---|---|
| Preeclampsia / pregnancy high BP | Independent risk factor; about 2× later heart disease | AHA 2023; ACC/AHA risk enhancer | ✅ Yes (2009) |
| Gestational diabetes, preterm birth | Adverse pregnancy outcomes raise later risk | AHA 2023 | ✅ Asked (No) |
| Early menopause (before 45) | Risk enhancer | ACC/AHA 2019 | ✅ Asked (perimenopause at 47, not early) |
| PCOS | Linked to higher cardiovascular risk | AHA 2023 | ✅ Asked (No) |
| Lupus, rheumatoid arthritis | Autoimmune disease, more common in women | QRISK3 | ✅ Asked (No) |
| Migraine | Raises risk, especially with aura | QRISK3 | ✅ Yes, with aura |
| Hormone therapy / combined pill | Affects risk | AHA 2023 | ✅ Asked (None) |
| Family history (first-degree relative under 60) | Core risk factor | QRISK3 | ✅ Mother at 58 |
| Systolic BP and BP treatment | The strongest modifiable factor | QRISK3, PREVENT | ✅ Daily home BP |
| **BP variability** (SD of systolic) | Higher variability, higher risk | QRISK3 | ✅ Computed from home readings |
| Cholesterol / HDL ratio | Core input | QRISK3, PREVENT | ✅ 5.6 / 1.4 (GP record) |
| HbA1c / diabetes | Core input | PREVENT, QRISK3 | ✅ 38 mmol/mol, no diabetes |
| BMI | Core input | QRISK3, PREVENT | ✅ 27.4 |
| eGFR (kidney function) | Required in PREVENT | PREVENT | ✅ 92 |
| Smoking | Core input | QRISK3, PREVENT | ✅ Never |
| Resting heart rate | Predicts coronary events in women (Women's Health Initiative, ~129,000 women) | WHI cohort | ✅ Daily, vs her baseline |
| HRV, sleep, steps | Plausible early signals; **not yet validated** as predictors of events in women | Thin evidence | ✅ Daily; used for nudges, not risk scores |
| Ethnicity, deprivation (postcode) | QRISK3 inputs | QRISK3 | ❌ Not collected yet |
| Severe mental illness, steroid tablets, atypical antipsychotics | QRISK3 inputs | QRISK3 | ❌ Not collected yet |
| Fitness (VO2 max) | Strong predictor in general populations | Cohort studies | ❌ Not collected yet (Apple Watch and Garmin estimate it) |

**What this means:** the demo now holds every input for the two validated scores plus the female-specific factors, except ethnicity, deprivation and three medication/mental-health items, which onboarding would ask about. The wearable signals are where HerHeart adds something new. They should drive **nudges**, and only become **risk predictors** once the longitudinal cohort in section 3 validates them in women.

---

## 3. What we need for prediction

Today HerHeart **detects change** with rules. **Predicting** who will develop heart disease, or whose disease will get worse, needs more than that.

### 3.1 The data problem to solve first

You can't train a predictor by comparing women who are already diagnosed with healthy women. After diagnosis, the arteries, blood pressure and medication all change, so the model would learn the *effects* of disease rather than its *early warning signs*.

**What we need is longitudinal data:** women who join while healthy, are followed for months or years, and some of whom are later diagnosed *while using HerHeart*. That gives true before-and-after labels.

### 3.2 Data requirements

| Need | Why | How we get it |
|---|---|---|
| **Outcome labels**: new diagnosis of hypertension, AF, heart attack, heart failure, stroke, with dates | what the model predicts | GP record link (NHS App / GP Connect), plus self-report confirmed by the GP record |
| **Pre-diagnosis wearable history** (6–24 months) | the early signals | continuous wearable sync from day one |
| **Female-specific covariates** | the under-researched predictors and our edge | structured onboarding: pregnancy complications, menopause timing, PCOS, autoimmune disease |
| **Clinical baseline**: cholesterol, HbA1c, BMI, smoking, ethnicity, deprivation | inputs to existing risk scores, used for comparison | GP record and onboarding |
| **Reliable BP** | the strongest single modifiable risk factor | validated cuffs only; wrist estimates flagged as lower quality |
| **Medication and adherence** | to separate treatment effects from the disease itself | GP record plus one-tap logs |
| **Explicit research consent** | special-category health data (UK GDPR) | separate opt-in, default off; de-identified export |
| **Scale** | rare outcomes need many women | rough guide: 10,000+ women followed for 1–2 years for common outcomes like hypertension; more for heart attack or stroke |

### 3.3 Modelling roadmap

| Stage | Method | Needs | Output |
|---|---|---|---|
| **Now (demo)** | fixed rules based on clinical guidance | her own baseline | "something changed, see your GP" |
| **Phase 1** | personal anomaly detection: learn each woman's normal, flag unusual multi-signal drift | 4+ weeks of data per user | fewer false alarms, earlier nudges |
| **Phase 2** | combine an established risk score (QRISK3 in the UK) with wearable trends | GP-record link | a personalised risk trajectory |
| **Phase 3** | a survival model trained on our longitudinal cohort, with female-specific predictors | the cohort in 3.2, plus clinical partners | prediction of new diagnoses, and which risk factors matter most in women |
| **Always** | validate against QRISK3, report performance separately by age, ethnicity and menopause stage | held-out data, independent clinicians | evidence for certification and the NHS |

### 3.4 Regulatory note

Detecting change and suggesting "talk to your GP" can launch as a **wellness** product if it's worded neutrally (no disease names, no clinical thresholds). A model that predicts disease risk or triages symptoms is **software as a medical device**: UKCA / CE, likely Class IIa under EU MDR Rule 11. Our rules are fixed and auditable, and safety decisions are kept out of the AI, which puts us in a good position for that certification.
