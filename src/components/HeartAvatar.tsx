"use client";
// HerHeart's face: a small animated heart. It beats gently when idle, and
// glows with the live sound level while you talk to it or while it answers.
// Tapping it starts (or ends) voice mode.
import { useEffect, useRef } from "react";

export type AvatarState = "idle" | "connecting" | "listening" | "speaking";

export default function HeartAvatar({
  state,
  level,
  onPress,
  label,
}: {
  state: AvatarState;
  /** Returns the current sound level, 0–1 (mic while listening, voice while speaking). */
  level?: () => number;
  onPress?: () => void;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  // Feed the sound level into a CSS variable every frame, smoothed.
  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const tick = () => {
      const raw = Math.min(1, Math.max(0, levelRef.current?.() ?? 0));
      smooth += (raw - smooth) * 0.25;
      ref.current?.style.setProperty("--level", smooth.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className={`heart-avatar ${state}`}
      onClick={onPress}
      aria-label={label}
      title={label}
    >
      <span className="heart-halo" aria-hidden />
      <svg viewBox="0 0 120 110" aria-hidden className="heart-svg">
        <defs>
          <radialGradient id="heartFill" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ff9fb2" />
            <stop offset="55%" stopColor="#f43f6b" />
            <stop offset="100%" stopColor="#c8174a" />
          </radialGradient>
        </defs>
        <g className="heart-body">
          <path
            d="M60 104 C 22 78, 4 56, 4 34 C 4 16, 18 4, 34 4 C 46 4, 55 11, 60 21 C 65 11, 74 4, 86 4 C 102 4, 116 16, 116 34 C 116 56, 98 78, 60 104 Z"
            fill="url(#heartFill)"
          />
          <ellipse cx="34" cy="24" rx="11" ry="6" fill="#fff" opacity="0.35" transform="rotate(-25 34 24)" />
          <g className="heart-eyes">
            <ellipse cx="44" cy="46" rx="5" ry="6.5" fill="#3b0a1a" />
            <ellipse cx="76" cy="46" rx="5" ry="6.5" fill="#3b0a1a" />
            <circle cx="45.8" cy="43.6" r="1.8" fill="#fff" />
            <circle cx="77.8" cy="43.6" r="1.8" fill="#fff" />
          </g>
          <ellipse cx="34" cy="60" rx="7" ry="4" fill="#ffb3c4" opacity="0.8" />
          <ellipse cx="86" cy="60" rx="7" ry="4" fill="#ffb3c4" opacity="0.8" />
          <path className="heart-smile" d="M50 62 Q 60 71 70 62" stroke="#3b0a1a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <ellipse className="heart-mouth" cx="60" cy="65" rx="7" ry="5" fill="#3b0a1a" />
        </g>
      </svg>
      <span className="heart-label">{label}</span>
    </button>
  );
}
