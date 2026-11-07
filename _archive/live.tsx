"use client";
// The live product. The rules engine watches the data; when a rule fires, the
// app cues HerHeart to speak first (proactive, not a chatbot). Presenter keys:
//   ← / →  move one day   ·  shift+← / →  move a week
//   1–4    ask a stage question   ·  A  jump to alert day   ·  M  management day
import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useEffect, useRef, useState } from "react";
import Dashboard, { type Metric } from "@/components/Dashboard";
import { ALERT_DAY, LAST_DAY, clinical, femaleHistory, profile } from "@/lib/patient";
import { agentContext, checkSymptom, evaluate, historyContext } from "@/lib/rules";
import HeartAvatar, { type AvatarState } from "@/components/HeartAvatar";
import { playLine, stopSpeaking } from "@/lib/speak";
import { lineById, presets, spoken, type View } from "@/lib/story";

type Msg = { who: "hera" | "you" | "system"; text: string };

export default function Live() {
  const [day, setDay] = useState(ALERT_DAY - 4);
  const [view, setView] = useState<View>("today");
  const [metric, setMetric] = useState<Metric>("rhr");
  const [urgent, setUrgent] = useState<string | null>(null);
  const [log, setLog] = useState<Msg[]>([]);
  const [offlineSpeaking, setOfflineSpeaking] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [error, setError] = useState("");
  const seen = useRef(new Set<string>());
  const add = (m: Msg) => setLog((l) => [...l.slice(-30), m]);

  const voice = useConversation({
    onMessage: (m) => add({ who: m.source === "user" ? "you" : "hera", text: m.message }),
    onError: (e) => setError(String(e)),
  });
  const live = voice.status === "connected";
  const e = evaluate(day);

  // Client tools the agent can call (registered in scripts/setup-agent.ts).
  useConversationClientTool("show_metric", ({ metric }: Record<string, unknown>) => {
    const m = String(metric) as Metric;
    if (!["rhr", "hrv", "bp", "sleep"].includes(m)) return "Unknown metric. Use rhr, hrv, bp or sleep.";
    setView("today");
    setMetric(m);
    return `Showing ${m}.`;
  });
  useConversationClientTool("open_gp_summary", () => {
    setView("gp");
    return "The GP summary is on screen.";
  });
  useConversationClientTool("check_symptom", ({ description }: Record<string, unknown>) => {
    const r = checkSymptom(String(description ?? ""));
    if (r.urgent) setUrgent(r.message);
    return JSON.stringify(r);
  });

  // Rule-driven proactive nudges.
  useEffect(() => {
    if (live) voice.sendContextualUpdate(`${agentContext(e)}\n\nHistory up to today:\n${historyContext(day)}`);
    const fired = e.flags.filter((f) => !seen.current.has(f.id) && f.level !== "good");
    for (const f of fired) {
      seen.current.add(f.id);
      add({ who: "system", text: `Rule fired · ${f.title} · ${f.detail}` });
    }
    // One proactive nudge per change, even when several rules fire together.
    const nudge = fired.filter((f) => f.id === "baseline_shift" || f.id === "bp_gp");
    if (nudge.length) {
      if (live)
        voice.sendUserMessage(
          `[APP CUE] Rules fired: ${nudge.map((f) => `${f.id}: ${f.detail}`).join(" | ")}. Speak first: tell ${profile.name} what changed in under 40 words using only these numbers, then ask how she has been feeling.`,
        );
      else if (!seen.current.has("offline-alert")) {
        seen.current.add("offline-alert");
        speakOffline("h-2");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, live]);

  async function speakOffline(id: string) {
    const line = lineById(id);
    if (!line) return;
    add({ who: "hera", text: spoken(line.text) });
    setOfflineSpeaking(true);
    await playLine(line);
    setOfflineSpeaking(false);
  }

  function ask(i: number) {
    const p = presets[i];
    if (!p) return;
    if (p.answer.id === "f-4") setUrgent(checkSymptom(p.q).message);
    if (p.answer.id === "f-3") setView("meds");
    if (live) {
      add({ who: "you", text: p.q });
      voice.sendUserMessage(p.q);
    } else {
      add({ who: "you", text: p.q });
      speakOffline(p.answer.id);
    }
  }

  function logSymptom() {
    if (!symptom.trim()) return;
    const r = checkSymptom(symptom);
    add({ who: "you", text: `Symptom: ${symptom}` });
    add({ who: "system", text: r.message });
    if (r.urgent) setUrgent(r.message);
    if (live)
      voice.sendUserMessage(
        `[APP CUE] Symptom logged: "${symptom}". Deterministic screen result: ${r.urgent ? "URGENT - tell her to call 999 now" : r.message}. Respond in under 30 words.`,
      );
    setSymptom("");
  }

  async function connect() {
    setError("");
    try {
      const r = await fetch("/api/el-token");
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      stopSpeaking();
      voice.startSession({
        conversationToken: b.token,
        connectionType: "webrtc",
        dynamicVariables: {
          user_name: profile.name,
          user_profile: `${profile.name}, ${profile.age}. Female-specific history: ${femaleHistory.map((h) => `${h.item}: ${h.value}`).join("; ")}. ${clinical.familyHistory}. GP record: total cholesterol ${clinical.totalChol}, HDL ${clinical.hdl} mmol/L, HbA1c ${clinical.hba1c} mmol/mol, BMI ${clinical.bmi}, eGFR ${clinical.egfr}, smoking ${clinical.smoking}, diabetes ${clinical.diabetes}.`,
          today_context: agentContext(e),
          health_history: historyContext(day),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect");
    }
  }

  // Avatar: glows with the mic while she talks, with HerHeart's voice while it answers.
  const avatarState: AvatarState =
    voice.isSpeaking || offlineSpeaking ? "speaking" : live ? "listening" : voice.status === "connecting" ? "connecting" : "idle";
  const avatarLevel = () => {
    if (offlineSpeaking) return 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 140));
    if (voice.status !== "connected") return 0;
    try {
      return voice.isSpeaking ? voice.getOutputVolume() * 1.6 : voice.getInputVolume() * 2.2;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const key = (k: KeyboardEvent) => {
      if ((k.target as HTMLElement)?.tagName === "INPUT") return;
      const step = k.shiftKey ? 7 : 1;
      if (k.key === "ArrowRight") setDay((d) => Math.min(LAST_DAY, d + step));
      if (k.key === "ArrowLeft") setDay((d) => Math.max(14, d - step));
      if (/^[1-9]$/.test(k.key) && Number(k.key) <= presets.length) ask(Number(k.key) - 1);
      if (k.key.toLowerCase() === "a") setDay(ALERT_DAY);
      if (k.key.toLowerCase() === "m") {
        setDay(LAST_DAY - 4);
        setView("meds");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  return (
    <main className="live">
      <section className="live-phone">
        <Dashboard
          view={view}
          day={day}
          metric={metric}
          onMetric={(m) => {
            setMetric(m);
            setView("today");
          }}
          urgent={urgent}
          speaking={voice.isSpeaking || offlineSpeaking}
        />
        <div className="tabs">
          {(["onboard", "today", "gp", "meds"] as View[]).map((v) => (
            <button key={v} className={v === view ? "sel" : ""} onClick={() => setView(v)}>
              {v === "onboard" ? "Sources" : v === "gp" ? "GP summary" : v === "meds" ? "Medication" : "Today"}
            </button>
          ))}
        </div>
      </section>

      <section className="live-side">
        <header>
          <a href="/" className="brand">HerHeart</a>
          <span className={`status ${live ? "on" : ""}`}>{live ? "Voice on · ask about any day in her data" : voice.status === "connecting" ? "Connecting…" : `Voice off · keys 1–${presets.length} play scripted answers`}</span>
        </header>
        <HeartAvatar
          state={avatarState}
          level={avatarLevel}
          onPress={() => (live ? voice.endSession() : voice.status === "connecting" ? undefined : connect())}
          label={
            avatarState === "speaking"
              ? "HerHeart is speaking"
              : avatarState === "listening"
                ? "Listening… tap to end"
                : avatarState === "connecting"
                  ? "Connecting…"
                  : "Tap to talk to HerHeart"
          }
        />
        {error && <p className="error">{error}</p>}

        <div className="timeline">
          <label>
            Simulated day: <b>{day}</b>
            <input type="range" min={14} max={LAST_DAY} value={day} onChange={(x) => setDay(+x.target.value)} />
          </label>
          <div className="jump">
            <button onClick={() => setDay(ALERT_DAY - 4)}>Baseline</button>
            <button onClick={() => setDay(ALERT_DAY)}>Drift detected</button>
            <button onClick={() => { setDay(LAST_DAY - 4); setView("meds"); }}>On treatment</button>
          </div>
        </div>

        <div className="presets">
          {presets.map((p, i) => (
            <button key={p.q} onClick={() => ask(i)}>
              <kbd>{i + 1}</kbd> {p.q}
            </button>
          ))}
        </div>

        <form className="symptom" onSubmit={(x) => { x.preventDefault(); logSymptom(); }}>
          <input value={symptom} onChange={(x) => setSymptom(x.target.value)} placeholder="Log a symptom, e.g. tired and breathless" />
          <button type="submit">Log</button>
        </form>
        {urgent && <button className="clear" onClick={() => setUrgent(null)}>Clear emergency banner</button>}

        <ol className="log" aria-live="polite">
          {[...log].reverse().map((m, i) => (
            <li key={i} className={m.who}>
              <b>{m.who === "hera" ? "HerHeart" : m.who === "you" ? profile.name : "Rules engine"}</b> {m.text}
            </li>
          ))}
        </ol>
        <p className="keys">Keys: ←/→ day · shift = week · A alert · M treatment · 1–{presets.length} questions</p>
      </section>
    </main>
  );
}
