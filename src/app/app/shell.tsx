"use client";
// The HerHeart phone app: one phone mockup with its bottom bar inside.
// The voice session lives here so it keeps running when she switches tabs.
import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AvatarState } from "@/components/HeartAvatar";
import { clinical, femaleHistory, LAST_DAY, profile } from "@/lib/patient";
import { agentContext, evaluate, historyContext } from "@/lib/rules";
import { readStored, useMeds } from "@/lib/store";
import { DEMO, DEMO_DAY, DEMO_VOICES, PAUSE_MS, captionText, type DemoLine } from "@/lib/demo";
import Home, { type Metric } from "@/screens/Home";
import Talk, { type Msg } from "@/screens/Talk";
import Meds from "@/screens/Meds";
import Community from "@/screens/Community";
import Challenges from "@/screens/Challenges";
import Connect from "@/screens/Connect";
import s from "./shell.module.css";

type Tab = "home" | "talk" | "meds" | "community" | "challenges";

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Home", icon: icon(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />) },
  { id: "meds", label: "Meds", icon: icon(<><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)" /><path d="M9.5 9.5l5 5" /></>) },
  { id: "talk", label: "Talk", icon: icon(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />) },
  { id: "community", label: "Community", icon: icon(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2.5 1.5-4.5 4-4.5s3 1.5 3 3" /></>) },
  { id: "challenges", label: "Challenges", icon: icon(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" /></>) },
];

// Count connected sources whatever shape the Connect screen stores.
function countConnected(v: unknown): number {
  if (Array.isArray(v)) return v.filter((x) => (typeof x === "object" && x ? (x as { connected?: boolean }).connected : !!x)).length;
  if (v && typeof v === "object") return Object.values(v).filter(Boolean).length;
  return 4;
}

export default function Shell() {
  const [tab, setTab] = useState<Tab>("home");
  const [day, setDay] = useState(LAST_DAY); // the app's "today"; the demo moves it
  const [demoLine, setDemoLine] = useState<DemoLine | null>(null);
  const [demoOn, setDemoOn] = useState(false);
  const demoRun = useRef(0);
  const demoAudio = useRef<HTMLAudioElement | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [metric, setMetric] = useState<Metric>("bp");
  const [log, setLog] = useState<Msg[]>([]);
  const [error, setError] = useState("");
  const [meds] = useMeds();
  const [connections, setConnections] = useState<unknown>(null);
  // Read-only: re-read the saved connections whenever Connect closes.
  useEffect(() => {
    if (!connectOpen) setConnections(readStored<unknown>("connections"));
  }, [connectOpen]);
  const screen = useRef<HTMLDivElement>(null);

  const voice = useConversation({
    onMessage: (m) => setLog((l) => [...l.slice(-40), { who: m.source === "user" ? "you" : "hera", text: m.message }]),
    onError: (e) => setError(String(e)),
  });
  const live = voice.status === "connected";

  useConversationClientTool("show_metric", ({ metric }: Record<string, unknown>) => {
    const m = String(metric) as Metric;
    if (!["rhr", "hrv", "bp", "sleep"].includes(m)) return "Unknown metric. Use rhr, hrv, bp or sleep.";
    setMetric(m);
    setConnectOpen(false);
    setTab("home");
    return `Showing ${m} on her Home screen.`;
  });

  // Keep the agent's view of her medications current.
  useEffect(() => {
    if (live) voice.sendContextualUpdate(`Her current medications: ${medsText()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meds, live]);

  useEffect(() => {
    screen.current?.scrollTo({ top: 0 });
  }, [tab, connectOpen]);

  function medsText() {
    return meds.length
      ? meds.map((m) => `${m.name} ${m.dose}, ${m.timesPerDay}× a day, since ${m.startDate}`).join("; ")
      : "none";
  }

  async function connect() {
    setError("");
    try {
      const r = await fetch("/api/el-token");
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      voice.startSession({
        conversationToken: b.token,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: profile.name,
          user_profile: `${profile.name}, ${profile.age}. Female-specific history: ${femaleHistory.map((h) => `${h.item}: ${h.value}`).join("; ")}. ${clinical.familyHistory}. GP record: total cholesterol ${clinical.totalChol}, HDL ${clinical.hdl} mmol/L, HbA1c ${clinical.hba1c} mmol/mol, BMI ${clinical.bmi}, eGFR ${clinical.egfr}, smoking ${clinical.smoking}, diabetes ${clinical.diabetes}. Medications: ${medsText()}.`,
          today_context: agentContext(evaluate(day)),
          health_history: historyContext(day),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect");
    }
  }

  // 1-minute scripted demo: a conversation with HerHeart on the Talk screen.
  // One shared audio player, so two voices can never play at once; pressing
  // Demo again stops it.
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  function player() {
    if (!demoAudio.current) demoAudio.current = new Audio();
    return demoAudio.current;
  }
  function stopDemo() {
    demoRun.current++;
    const a = demoAudio.current;
    if (a) {
      a.pause();
      a.onended = null;
      a.onerror = null;
    }
    setDemoLine(null);
    setDemoOn(false);
    setDay(LAST_DAY);
  }
  async function playDemo() {
    if (demoOn) return stopDemo();
    if (live) voice.endSession();
    stopDemo();
    const run = demoRun.current;
    setDemoOn(true);
    const alive = () => demoRun.current === run;
    setDay(DEMO_DAY);
    setConnectOpen(false);
    setTab("talk");
    setLog([]);
    await sleep(500);
    for (const line of DEMO) {
      if (!alive()) return;
      setDemoLine(line);
      setLog((l) => [...l, { who: line.who, text: captionText(line.text), card: line.card }]);
      const a = player();
      a.pause();
      a.src = `/demo/${line.id}.mp3`;
      a.playbackRate = DEMO_VOICES[line.who].rate;
      await new Promise<void>((resolve) => {
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
      });
      if (!alive()) return;
      setDemoLine(null);
      await sleep(PAUSE_MS);
    }
    if (alive()) stopDemo();
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "d") (demoOn ? stopDemo() : playDemo());
      if (e.key === "Escape" && demoOn) stopDemo();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const avatarState: AvatarState = demoLine
    ? demoLine.who === "hera"
      ? "speaking"
      : "listening"
    : voice.isSpeaking ? "speaking" : live ? "listening" : voice.status === "connecting" ? "connecting" : "idle";
  const level = () => {
    if (demoLine && demoAudio.current && !demoAudio.current.paused) return 0.3 + 0.35 * Math.abs(Math.sin(performance.now() / 120));
    if (voice.status !== "connected") return 0;
    try {
      return voice.isSpeaking ? voice.getOutputVolume() * 1.6 : voice.getInputVolume() * 2.2;
    } catch {
      return 0;
    }
  };

  return (
    <main className={s.stage}>
      <div className={s.phone}>
        <div className={s.status}>
          <span>9:41</span>
          <span className={s.island} />
          {live ? (
            <span className={s.liveDot}>● Voice on</span>
          ) : (
            <button type="button" className={s.demoBtn} onClick={() => (demoOn ? stopDemo() : playDemo())}>
              {demoOn ? "■ Stop" : "▶ Demo"}
            </button>
          )}
        </div>

        <div className={s.screen} ref={screen} data-screen>
          {tab === "home" &&
            (connectOpen ? (
              <Connect onBack={() => setConnectOpen(false)} />
            ) : (
              <Home day={day} metric={metric} onMetric={setMetric} onConnect={() => setConnectOpen(true)} connectedCount={countConnected(connections)} />
            ))}
          {tab === "talk" && (
            <Talk
              state={avatarState}
              level={level}
              live={live}
              log={log}
              error={error}
              onPress={() => (live ? voice.endSession() : voice.status === "connecting" ? undefined : connect())}
              onSend={(t) => {
                setLog((l) => [...l, { who: "you", text: t }]);
                voice.sendUserMessage(t);
              }}
            />
          )}
          {tab === "meds" && <Meds />}
          {tab === "community" && <Community />}
          {tab === "challenges" && <Challenges />}
        </div>

        <nav className={s.nav} aria-label="HerHeart">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${s.tab} ${t.id === "talk" ? s.talkTab : ""} ${tab === t.id ? s.on : ""} ${t.id === "talk" && avatarState !== "idle" ? s.glow : ""}`}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => {
                setTab(t.id);
                if (t.id === "home") setConnectOpen(false);
              }}
            >
              <span className={s.ico}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
