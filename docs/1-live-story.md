# HerHeart: the live story

**One woman, her heart, one app.** This is the walkthrough to show on stage: Amara's story first, then each tab in the order to demo it, with what she sees, what she does, and what happens underneath. All data is synthetic; numbers are what the app shows on its "today", 8 Oct 2026.

## Meet Amara

| | |
|---|---|
| **Who** | Amara, 47 |
| **Why her heart is at risk** | Preeclampsia in her first pregnancy (2009) · perimenopause · migraine with aura · her mother had a heart attack at 58 |
| **What she uses** | Apple Health · Oura Ring · Withings BP cuff · NHS App (GP record) |
| **What happened** | Over the summer her resting heart rate crept up, her HRV fell and her home blood pressure rose. She put the tiredness down to menopause. In September her GP diagnosed high blood pressure, and she has taken **ramipril 2.5 mg** since 11 Sep. |
| **Her problem** | Four apps, ten graphs, and none of them know her pregnancy history doubles her later heart risk. She wants one place that explains her heart in plain words, and women who understand. |

---

## 1. Home: "How is my heart, compared with me?"

**On screen:**
- **Heart score 88**, trajectory **Improving**, "compared with your own normal, not a population average".
- **Trends vs your normal:** tiles for resting HR (65), HRV (41), home BP (128/80) and sleep (7 h). Tap **Home BP** and the 8-week chart tells her story: the line climbs through August, a purple marker shows **started ramipril**, and the line falls back towards the dashed "your normal" line.
- **Your risk profile:** the factors that apply to her, highlighted: *preeclampsia (2009)*, *migraine with aura*, *mother: heart attack at 58*. "Show all 8 questions" reveals the ones answered No (gestational diabetes, PCOS, lupus…). Below: cholesterol ratio 4.0, HbA1c 38, BMI 27.4, eGFR 92 from her GP record.
- **4 apps connected ›** opens **Connect your apps**: 13 sources (Fitbit, Whoop, Garmin, Dexcom, Flo/Clue…), each with a toggle that shows *Connecting…* then *Connected · synced just now*.

**Underneath:** her baseline is calculated from her own history, and her risk profile holds the inputs of the two validated risk calculators (QRISK3 in the UK, PREVENT in the US) plus the female-specific factors from the AHA's 2023 statement.

---

## 2. Talk: "Just ask your heart"

**On screen:** a pink animated heart that beats and blinks. Below it: *"Ask about your heart"* with example questions.

**She taps the heart.** Rings pulse while it connects, then it greets her:
> "Hi Amara. What would you like to know about your heart?"

**She asks:** *"Has my blood pressure come down since I started ramipril?"*
The heart glows as she speaks, then its mouth moves as it answers, quoting her own numbers from before and after 11 Sep, and puts the BP chart on her Home screen.

**Other good questions:** *"How was my sleep in August?"* · *"Why does preeclampsia matter for my heart?"* · *"What's one thing I can do this week?"*

**Underneath:** an ElevenLabs voice agent running on Claude, speaking at 1.15×. When the session starts it receives her profile, her medications, today's numbers and her full 100-day history as weekly averages and events. It only quotes those numbers, never diagnoses, and never advises changing medication.

---

## 3. Meds: "Everything I take, in one place"

**On screen:** her ramipril card: 2.5 mg, once a day at 08:00, since 11 Sep 2026, prescribed by her GP.

**She taps Add a medication** and adds *Atorvastatin 20 mg*, once a day. The name field suggests common heart medications as she types. She could also snap a photo of the box instead (demo: it fills in the name and dose for her to check).

**Underneath:** the list is shared with Talk, so HerHeart immediately knows about the new medication.

---

## 4. Community: "Women who get it"

**On screen:** six groups: *Worried about my risk*, *Living with hypertension*, *After a heart attack*, *AF*, *Perimenopause & menopause*, *Pregnancy & heart health*. She's already in two. Below: pinned community guidelines and posts from other women (labelled demo), e.g. someone sharing that their blood pressure came down, someone asking about ankle swelling on amlodipine.

**She opens a post**, taps **This helped**, and adds a reply. Everything is under her display name **HeartfulA**, never her real name.

**Underneath:** heart disease is still seen as a man's disease, and women living with it often feel alone. Peer support keeps people coming back to the app.

---

## 5. Challenges: "Small wins, together"

**On screen:** team challenge **Cut saturated fat together**, under 20 g a day, **day 9 of 30**:
- Team *Heart Sisters* (6 members) at **80%** of goal days hit
- Her **7-day streak** and her 30-day grid, filled automatically from MyFitnessPal
- Badges: *First week* and *Team player* earned; *Halfway* and *Finisher* still locked
- Weekly leaderboard ranked by **% of goal days**, so it's fair across abilities; her team is **#2**

**More challenges** to join solo or as a team: *7,000 steps a day*, *Lights out by 11*, *Never miss a dose*.

---

## How to run it on stage (about 90 seconds)

| Step | Do |
|---|---|
| 1 | Open http://127.0.0.1:3100 in Chrome, headphones on |
| 2 | **Home:** point at the heart score, tap **Home BP**, show the ramipril marker, scroll to the risk profile |
| 3 | **Talk:** tap the heart, allow the microphone, ask *"Has my blood pressure come down since I started ramipril?"* |
| 4 | **Meds:** add *Atorvastatin 20 mg* |
| 5 | **Community:** open a post, tap **This helped** |
| 6 | **Challenges:** show day 9 of 30, the streak and the leaderboard |

**If the Wi-Fi or voice fails:** every tab except Talk works offline. Talk shows the example questions, so you can describe what HerHeart would answer.

**Closing line:** *"HerHeart. Her heart, finally understood."*
