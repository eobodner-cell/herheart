# HerHeart

**A heart-health companion app built for women.** HerHeart brings the data women already wear (Apple Health, Oura, a BP cuff, the GP record) together with the female-specific history most heart apps never ask about: preeclampsia, menopause, migraine, family history. It compares her numbers with *her own* normal, lets her talk to an animated heart about her data, and connects her with women on the same journey.

The demo user is **Amara, 47**: preeclampsia in her first pregnancy, perimenopausal, migraine with aura, mother had a heart attack at 58. Her blood pressure drifted up over the summer, she was diagnosed with high blood pressure, and she has taken ramipril since 11 Sep 2026. All data is synthetic.

## Run

```sh
npm install
npm run dev          # http://127.0.0.1:3100
```

Open it in Chrome. On a laptop it shows as a phone mockup; on a phone it fills the screen. For the voice conversation:

```sh
cp .env.example .env.local   # add ELEVENLABS_API_KEY (starts with sk_)
npm run setup:agent          # creates or updates the HerHeart voice agent, saves its ID to .env.local
```

Restart `npm run dev` after editing `.env.local`. Everything except talking to the heart works without a key.

## The app

Five tabs in the bottom bar, inside the phone:

| Tab | What she can do |
|---|---|
| **Home** | See her **heart score** (0–100) and trajectory; check **trends against her own normal** for resting heart rate, HRV, home blood pressure and sleep over 8 weeks; read her **risk profile** (female-specific history plus cholesterol, HbA1c, BMI and eGFR from her GP record). "Apps connected ›" opens **Connect your apps**: 13 sources with on/off toggles. |
| **Meds** | See her medications and **add a medication**: name with suggestions, dose, times a day, start date, prescriber, or a demo "snap a photo of the box". |
| **Talk** | Tap the **animated heart** to start a voice conversation. It glows with her voice and its replies. She can also type once voice is on. |
| **Community** | Join groups (e.g. *Living with hypertension*, *Perimenopause & menopause*), read and write posts under a display name, reply, mark "This helped", report. |
| **Challenges** | Team challenge *Cut saturated fat together* (day 9 of 30): team progress, her streak, a 30-day grid, badges, a leaderboard ranked by % of goal days. Three more challenges to join solo or as a team. |

Demo posts, members and challenges are labelled "demo". New posts, medications, joins and connections are saved in the browser (localStorage); there's no server database yet.

## How it works

| Layer | File | Job |
|---|---|---|
| Phone shell and bottom bar | `src/app/app/shell.tsx` | Tabs, phone frame, and the voice session (it keeps running when she switches tabs) |
| Screens | `src/screens/` | `Home`, `Talk`, `Meds`, `Connect`, `Community`, `Challenges` |
| Heart avatar | `src/components/HeartAvatar.tsx` | The animated heart; its glow follows live microphone and voice volume |
| Seeded persona | `src/lib/patient.ts` | 100 days of resting HR, HRV, sleep, steps and home BP; female-specific history; GP-record values |
| Baseline and score | `src/lib/rules.ts` | Her personal baseline, the heart score (illustrative, not clinical), and the facts the voice agent may use |
| Saved demo state | `src/lib/store.ts` | Medications, posts, joins and connections in localStorage |
| Voice agent | `agents/herheart.md`, `scripts/setup-agent.ts` | ElevenLabs Conversational AI, Claude Sonnet, 1.15× speech. Gets her profile, medications, today's data and 100-day history. One tool: `show_metric` puts a chart on Home |
| Voice token | `src/app/api/el-token/route.ts` | Issues a short-lived token so the API key never reaches the browser |

## Demo (about 90 seconds)

1. **Home:** heart score 88, *Improving*. Tap **Home BP**: the chart shows her blood pressure rising over the summer, the "started ramipril" marker, and the fall back towards her normal.
2. Scroll to **Your risk profile**: preeclampsia, migraine with aura, family history, and her GP-record values.
3. **Talk:** tap the heart and ask *"Has my blood pressure come down since I started ramipril?"* or *"How was my sleep in August?"*
4. **Meds:** **Add a medication**, e.g. *Atorvastatin 20 mg*, once a day. HerHeart now knows about it in Talk.
5. **Community:** open a post in *Living with hypertension* and tap **This helped**.
6. **Challenges:** *Cut saturated fat together*: day 9 of 30, 7-day streak, team at 80%, second on the leaderboard.

## Scope and safety

- HerHeart explains her data; it **never diagnoses**, never gives a risk percentage, and never advises changing medication. It points her to her GP for anything clinical.
- Emergency handling (a 999 banner and red-flag symptom rules) was removed from the app by decision. The Community guidelines still ask people to call 999 rather than post about chest pain or stroke signs.
- Thresholds and the heart score are demo values and need clinical review before real use.

## Archived

Features cut in the rebuild (the scripted one-minute story, pre-rendered voices, GP summary, alerts, Today's action, Taken/Skip, adherence strip, 999 banner, presenter panel) are kept in `_archive/`, excluded from the build.

## More

- [docs/1-live-story.md](docs/1-live-story.md): the app walkthrough, screen by screen
- [docs/2-features-data-prediction.md](docs/2-features-data-prediction.md): features by layer, the data we collect with its evidence, and what prediction needs
