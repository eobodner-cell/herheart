"use client";
// Talk: the heart avatar. Tap it to start or end voice mode.
import { useState } from "react";
import HeartAvatar, { type AvatarState } from "@/components/HeartAvatar";
import s from "./Talk.module.css";

export type Msg = { who: "hera" | "you"; text: string };
const IDEAS = [
  "How was my sleep in August?",
  "Has my blood pressure come down since I started ramipril?",
  "Why does preeclampsia matter for my heart?",
  "What's one thing I can do this week?",
];

export default function Talk({
  state,
  level,
  onPress,
  live,
  log,
  onSend,
  error,
}: {
  state: AvatarState;
  level: () => number;
  onPress: () => void;
  live: boolean;
  log: Msg[];
  onSend: (text: string) => void;
  error: string;
}) {
  const [text, setText] = useState("");
  const label =
    state === "speaking"
      ? "HerHeart is speaking"
      : state === "listening"
        ? "Listening… tap to end"
        : state === "connecting"
          ? "Connecting…"
          : "Tap the heart to talk";
  return (
    <div className={s.talk}>
      <div className={s.stage}>
        <HeartAvatar state={state} level={level} onPress={onPress} label={label} />
        {error && <p className={s.error}>{error}</p>}
      </div>

      {log.length === 0 ? (
        <div className={s.ideas}>
          <h2>Try asking</h2>
          <p>HerHeart knows your last 100 days of data, your history and your medications.</p>
          <ul>
            {IDEAS.map((q) => (
              <li key={q}>“{q}”</li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className={s.log} aria-live="polite">
          {log.map((m, i) => (
            <li key={i} className={m.who === "you" ? s.you : s.hera}>
              {m.text}
            </li>
          ))}
        </ol>
      )}

      <form
        className={s.type}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim() || !live) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <label htmlFor="talk-text" className={s.sr}>Type a question</label>
        <input
          id="talk-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={live ? "Or type a question…" : "Tap the heart first to start"}
          disabled={!live}
        />
        <button type="submit" disabled={!live || !text.trim()}>Send</button>
      </form>
    </div>
  );
}
