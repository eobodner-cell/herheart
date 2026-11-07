// The scripted one-minute story. Every spoken line is pre-rendered to
// /public/story/<id>.mp3 by `npm run story:audio` (ElevenLabs, eleven_v4).
// No live AI calls, so it cannot fail on stage. Without clips the player
// falls back to the browser's voice.
// [audio tags] direct delivery, "..." adds a pause, CAPS add emphasis.
import { ALERT_DAY, LAST_DAY } from "./patient";

export type Speaker = "narrator" | "hera" | "amara";
export const SPEAKERS: Record<
  Speaker,
  { name: string; role: string; voiceId: string; stability: number; rate?: number; color: string }
> = {
  narrator: { name: "Narrator", role: "", voiceId: "Xb7hH8MSUJpSbSDYk0k2", stability: 0.6, color: "#64748b" }, // Alice
  hera: { name: "HerHeart", role: "AI heart companion", voiceId: "EXAVITQu4vr4xnSDxMaL", stability: 0.5, rate: 1.15, color: "#e11d48" }, // Sarah
  amara: { name: "Amara", role: "47 · user", voiceId: "cgSgspJ2msm6clMCkdW9", stability: 0.35, color: "#7c3aed" }, // Jessica
};
export const STORY_MODEL = "eleven_v4_turbo";
export const spoken = (t: string) => t.replace(/\[[^\]]*\]\s*/g, "").replace(/\s+/g, " ").trim();

export type View = "onboard" | "today" | "gp" | "meds";
export type Line = { id: string; speaker: Speaker; text: string };
export type Step =
  | { kind: "card"; title: string; body?: string; line?: Line; hold?: number }
  | { kind: "scene"; view: View; day: number; alert?: boolean }
  | ({ kind: "say" } & Line)
  | { kind: "wait"; ms: number };

const say = (id: string, speaker: Speaker, text: string): Step => ({ kind: "say", id, speaker, text });

export const story: Step[] = [
  {
    kind: "card",
    title: "The #1 killer of women.",
    body: "And most of what medicine knows about it was learned from men.",
    line: {
      id: "n-1",
      speaker: "narrator",
      text: "[clear, pointed] Heart disease is the NUMBER ONE killer of women. [beat] Yet most of what medicine knows about it... was learned from men.",
    },
  },
  { kind: "scene", view: "onboard", day: 40 },
  say("n-2", "narrator", "[warm] Meet Amara. Forty-seven. Preeclampsia in her first pregnancy... and her mum had a heart attack at fifty-eight."),
  say("h-1", "hera", "[warm, calm] Hi Amara. Your pregnancy history matters for your heart... and most apps never ask. I'll watch quietly, and only speak up when something changes."),
  { kind: "scene", view: "today", day: ALERT_DAY, alert: true },
  { kind: "wait", ms: 700 },
  say("h-2", "hera", "[gentle, attentive] Amara... your resting heart rate has crept up for ten days, and your blood pressure is averaging one-thirty-eight over eighty-six. How have you been feeling?"),
  say("a-1", "amara", "[tired, a little dismissive] Honestly? Exhausted. A bit breathless on the stairs. [sigh] I thought it was just menopause."),
  say("h-3", "hera", "[calm, clear] In women, those can be heart symptoms. Please see your GP this week... I've prepared a one-page summary to take with you."),
  { kind: "scene", view: "gp", day: ALERT_DAY },
  say("n-3", "narrator", "[clear] Her GP sees the whole picture, on one page."),
  {
    kind: "card",
    title: "Three weeks later",
    body: "Diagnosed early with high blood pressure · started treatment",
    line: { id: "n-4", speaker: "narrator", text: "[bright] Three weeks later. Diagnosed early... and on treatment." },
    hold: 400,
  },
  { kind: "scene", view: "meds", day: LAST_DAY - 4 },
  say("a-2", "amara", "[hopeful] HerHeart... is my medication actually working?"),
  say("h-4", "hera", "[warm, encouraging] It is. Your home average is down to one-twenty-eight over eighty-one... and you haven't missed a dose this week. Let's keep going."),
  {
    kind: "card",
    title: "HerHeart. Finally understood.",
    line: { id: "n-5", speaker: "narrator", text: "[warm, confident] HerHeart. [beat] Finally... understood." },
    hold: 1500,
  },
];

// Five stage prompts for the live part of the pitch. With a connected agent
// the question goes to ElevenLabs; offline, the pre-rendered answer plays.
// Answers assume the live app is on the "management" day (on medication).
export const presets: { q: string; answer: Line }[] = [
  {
    q: "Why did you flag my heart rate?",
    answer: { id: "f-2", speaker: "hera", text: "[calm, explanatory] A few weeks ago your resting heart rate sat about eight beats above your own normal for ten days, while your heart rate variability dropped. On its own, that's not a diagnosis... but with your pregnancy history, it was worth a GP check." },
  },
  {
    q: "Is my medication working?",
    answer: { id: "f-3", speaker: "hera", text: "[encouraging] Yes. Since you started ramipril, your home average has come down from about one-forty over eighty-seven to one-twenty-eight over eighty-one. That's within the home target. Keep taking it daily." },
  },
  {
    q: "My jaw hurts and I feel sick and sweaty.",
    answer: { id: "f-4", speaker: "hera", text: "[urgent but calm, clear] Amara, jaw pain with nausea and sweating can be a heart attack... in women it often looks exactly like this. Call nine-nine-nine NOW. Don't drive yourself. I'm putting your medication list on screen for the paramedics." },
  },
  {
    q: "What can I do this week to lower my risk?",
    answer: { id: "f-5", speaker: "hera", text: "[warm, practical] Two things this week. Brisk walking for thirty minutes on five days... and keeping salt under six grams a day. Small, steady changes move your numbers the most." },
  },
];


export function allLines(): Line[] {
  const out = new Map<string, Line>();
  for (const s of story) {
    if (s.kind === "say") out.set(s.id, { id: s.id, speaker: s.speaker, text: s.text });
    if (s.kind === "card" && s.line) out.set(s.line.id, s.line);
  }
  for (const p of presets) out.set(p.answer.id, p.answer);
  return [...out.values()];
}
export const lineById = (id: string) => allLines().find((l) => l.id === id);
