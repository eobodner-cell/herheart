"use client";
// Plays a line: the pre-rendered ElevenLabs clip if it exists, otherwise the
// browser's own voice, otherwise a timed pause. Only one line plays at a time.
import { SPEAKERS, spoken, type Line } from "./story";

let manifest: Record<string, string> | null = null;
let stopCurrent: (() => void) | null = null;

async function clips() {
  if (manifest) return manifest;
  try {
    const r = await fetch("/story/manifest.json", { cache: "no-store" });
    manifest = r.ok ? await r.json() : {};
  } catch {
    manifest = {};
  }
  return manifest!;
}

export function stopSpeaking() {
  stopCurrent?.();
  stopCurrent = null;
}

export async function playLine(line: Line, onAudio?: (el: HTMLAudioElement) => void): Promise<void> {
  stopSpeaking();
  const m = await clips();
  const text = spoken(line.text);
  const rate = SPEAKERS[line.speaker].rate ?? 1;
  if (m[line.id]) {
    const a = new Audio(`/story/${line.id}.mp3`);
    a.playbackRate = rate;
    onAudio?.(a);
    return new Promise((resolve) => {
      stopCurrent = () => {
        a.pause();
        resolve();
      };
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
  }
  if (typeof speechSynthesis !== "undefined") {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      const pick: Record<string, RegExp> = {
        narrator: /Daniel|Google UK English Male|Arthur/i,
        hera: /Serena|Kate|Google UK English Female|Martha|Samantha/i,
        amara: /Samantha|Karen|Moira|Tessa|Google US English/i,
      };
      u.voice = voices.find((v) => pick[line.speaker].test(v.name)) ?? voices[0] ?? null;
      u.rate = 1.02 * rate;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      stopCurrent = () => {
        speechSynthesis.cancel();
        resolve();
      };
      speechSynthesis.speak(u);
    });
  }
  return new Promise((r) => setTimeout(r, text.split(" ").length * 330));
}
