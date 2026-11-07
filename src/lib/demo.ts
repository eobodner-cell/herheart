// The 1-minute demo: Amara, one week into ramipril, talks to HerHeart on the
// Talk screen. Other features appear as cards inside the chat.
// Voices are pre-rendered to /public/demo/<id>.mp3 by `npm run demo:audio`
// (ElevenLabs eleven_v4). [audio tags] direct delivery and are stripped
// from the on-screen captions. Numbers match the seeded data on DEMO_DAY.
import { MED_DAY } from "./patient";

// Cards HerHeart attaches to its chat replies, so other app features appear
// inside the conversation instead of switching screens.
export type DemoCard = "apps" | "bp" | "meds" | "together";
export type DemoLine = { id: string; who: "you" | "hera"; text: string; card?: DemoCard };

export const DEMO_DAY = MED_DAY + 7; // one week on ramipril (18 Sep)
export const DEMO_VOICES = {
  you: { voiceId: "cgSgspJ2msm6clMCkdW9", stability: 0.35, rate: 1.05 }, // Jessica: Amara
  hera: { voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.5, rate: 1.15 }, // Sarah: same as the live agent
} as const;
export const DEMO_MODEL = "eleven_v4_turbo";
export const PAUSE_MS = 300;

export const DEMO: DemoLine[] = [
  { id: "d1", who: "you", text: "[curious, a little worried] I've been taking ramipril for a week now. Has it been changing my blood pressure?" },
  { id: "d1b", who: "hera", card: "apps", text: "[warm] Let me check. Your Withings cuff, Apple Watch and GP record are all synced." },
  { id: "d2", who: "hera", card: "bp", text: "[warm, clear] It has, a little. The week before, you averaged one-forty over eighty-seven. This week, one-thirty-seven. [reassuring] A good start... the full effect usually takes two to four weeks." },
  { id: "d3", who: "you", text: "[hesitant] So it's normal that it's not lower yet?" },
  { id: "d4", who: "hera", text: "[calm] Completely. I compare you with your OWN normal, one-twenty-five over seventy-nine... so we'll see exactly when you get there." },
  { id: "d5", who: "you", text: "[matter-of-fact] My GP also mentioned a statin." },
  { id: "d6", who: "hera", card: "meds", text: "[helpful] Add it here, and I'll track how both work for you." },
  { id: "d7", who: "you", text: "[softly] Is anyone else going through this?" },
  { id: "d8", who: "hera", card: "together", text: "[warm, upbeat] Over three thousand women in Living with hypertension. And your team, Heart Sisters, is on day nine of the saturated-fat challenge." },
];

export const captionText = (t: string) => t.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim();
