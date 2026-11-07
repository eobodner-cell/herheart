"use client";
// Full-screen scripted story: runs the steps in src/lib/story.ts in order.
import { useEffect, useRef, useState } from "react";
import Dashboard from "./Dashboard";
import { playLine, stopSpeaking } from "@/lib/speak";
import { SPEAKERS, spoken, story, type Line, type View } from "@/lib/story";
import { profile } from "@/lib/patient";

type State = {
  view: View;
  day: number;
  alert: boolean;
  card: { title: string; body?: string } | null;
  caption: Line | null;
  connected: number;
  done: boolean;
};
const initial: State = { view: "onboard", day: 40, alert: false, card: null, caption: null, connected: 0, done: false };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function StoryPlayer({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<State>(initial);
  const run = useRef(0);
  const set = (p: Partial<State>) => setS((v) => ({ ...v, ...p }));

  async function play() {
    const token = ++run.current;
    const alive = () => run.current === token;
    setS(initial);
    for (const step of story) {
      if (!alive()) return;
      if (step.kind === "card") {
        set({ card: { title: step.title, body: step.body }, caption: step.line ?? null });
        if (step.line) await playLine(step.line);
        else await sleep(1800);
        await sleep(step.hold ?? 300);
        if (alive()) set({ card: null, caption: null });
      } else if (step.kind === "scene") {
        set({ view: step.view, day: step.day, alert: !!step.alert });
        if (step.view === "onboard")
          for (let i = 1; i <= profile.sources.length && alive(); i++) {
            await sleep(450);
            set({ connected: i });
          }
        else await sleep(500);
      } else if (step.kind === "say") {
        set({ caption: step });
        await playLine(step);
        await sleep(250);
      } else if (step.kind === "wait") await sleep(step.ms);
    }
    if (alive()) set({ done: true, caption: null });
  }

  useEffect(() => {
    play();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      run.current++;
      stopSpeaking();
      window.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sp = s.caption ? SPEAKERS[s.caption.speaker] : null;
  return (
    <div className="story" role="dialog" aria-label="HerHeart demo story">
      <button className="story-close" onClick={onClose} aria-label="Close demo">✕</button>
      <div className="story-stage">
        <Dashboard
          view={s.view}
          day={s.day}
          alert={s.alert}
          connected={s.connected}
          speaking={s.caption?.speaker === "hera"}
        />
      </div>
      {s.card && (
        <div className="story-card">
          <h2>{s.card.title}</h2>
          {s.card.body && <p>{s.card.body}</p>}
        </div>
      )}
      {s.caption && sp && (
        <div className="caption">
          <span className="who" style={{ background: sp.color }}>
            {sp.name}
            {sp.role && <small> · {sp.role}</small>}
          </span>
          <p>{spoken(s.caption.text)}</p>
        </div>
      )}
      {s.done && (
        <div className="story-end">
          <button onClick={play}>↻ Replay</button>
          <a href="/app">Open the live app →</a>
        </div>
      )}
    </div>
  );
}
