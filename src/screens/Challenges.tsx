"use client";
// Challenges: gamified team challenges. Team members, other teams and the
// active challenge's history are demo data (tagged "demo" in the UI).
// Joining extra challenges persists via useStored.
import { useState } from "react";
import { useStored, ME } from "@/lib/store";
import s from "./Challenges.module.css";

// ---- Active team challenge (demo) ----
const CHALLENGE = {
  title: "Cut saturated fat together",
  goal: "Under 20 g saturated fat a day",
  totalDays: 30,
  today: 9,
  team: "Heart Sisters",
};

// Her days 1..today: true = goal hit, false = missed. Filled from MyFitnessPal.
const MY_DAYS: boolean[] = [true, false, true, true, true, true, true, true, true];

function currentStreak(days: boolean[]) {
  let n = 0;
  for (let i = days.length - 1; i >= 0 && days[i]; i--) n++;
  return n;
}

type Member = { name: string; avatar: string; hit: number; me?: boolean; demo?: boolean };
const MEMBERS: Member[] = [
  { name: ME.displayName, avatar: ME.avatar, hit: MY_DAYS.filter(Boolean).length, me: true },
  { name: "Rosa_M", avatar: "RM", hit: 9, demo: true },
  { name: "Ana_P", avatar: "AP", hit: 8, demo: true },
  { name: "Kemi.A", avatar: "KA", hit: 7, demo: true },
  { name: "LizzieB", avatar: "LB", hit: 6, demo: true },
  { name: "JudeR", avatar: "JR", hit: 5, demo: true },
];

const pct = (hit: number, of: number) => (of === 0 ? 0 : Math.round((hit / of) * 100));
const TEAM_PCT = pct(
  MEMBERS.reduce((n, m) => n + m.hit, 0),
  MEMBERS.length * CHALLENGE.today,
);

const LEADERBOARD = [
  { team: "Salt Busters", pct: 86, members: 5 },
  { team: CHALLENGE.team, pct: TEAM_PCT, members: MEMBERS.length, mine: true },
  { team: "Walk & Talk", pct: 77, members: 6 },
  { team: "Steady Beats", pct: 71, members: 4 },
  { team: "Morning Movers", pct: 64, members: 6 },
].sort((a, b) => b.pct - a.pct);
const MY_RANK = LEADERBOARD.findIndex((t) => t.mine) + 1;

// ---- Badges ----
type BadgeId = "first-week" | "halfway" | "finisher" | "team-player";
const BADGES: { id: BadgeId; name: string; earned: boolean; note: string }[] = [
  { id: "first-week", name: "First week", earned: true, note: "Earned" },
  { id: "halfway", name: "Halfway", earned: false, note: "Day 15" },
  { id: "finisher", name: "Finisher", earned: false, note: "Day 30" },
  { id: "team-player", name: "Team player", earned: true, note: "Earned" },
];

// ---- More challenges ----
type Mode = "solo" | "team";
type ChallengeId = "steps" | "sleep" | "meds";
const MORE: { id: ChallengeId; title: string; days: number; source: string; blurb: string; teamName: string }[] = [
  {
    id: "steps",
    title: "7,000 steps a day",
    days: 14,
    source: "from step data",
    blurb: "Regular walking helps lower blood pressure. Every step counts toward the day.",
    teamName: "Step Sisters",
  },
  {
    id: "sleep",
    title: "Lights out by 11",
    days: 21,
    source: "from sleep data",
    blurb: "A steady bedtime supports blood pressure and can ease perimenopause night waking.",
    teamName: "Early Nights Club",
  },
  {
    id: "meds",
    title: "Never miss a dose",
    days: 30,
    source: "from medication logs",
    blurb: "Taking ramipril at the same time each day keeps your blood pressure steadier.",
    teamName: "Dose Buddies",
  },
];

// ---- Icons ----
function BadgeIcon({ id }: { id: BadgeId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {id === "first-week" && <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" {...common} />}
      {id === "halfway" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
        </>
      )}
      {id === "finisher" && <path d="M6 21V4M6 4h11l-2 4 2 4H6" {...common} />}
      {id === "team-player" && (
        <>
          <circle cx="9" cy="8.5" r="3" {...common} />
          <circle cx="16.5" cy="9.5" r="2.5" {...common} />
          <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.5 14.3c.6-.2 1.3-.3 2-.3 2.2 0 3.8 1.5 4.3 4" {...common} />
        </>
      )}
    </svg>
  );
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg className={`${s.chev} ${open ? s.chevOpen : ""}`} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DemoTag = () => <span className={s.demo}>demo</span>;

function Ring({ value }: { value: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={s.ring} role="img" aria-label={`Team has hit ${v}% of goal days so far`}>
      <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
        <circle cx="52" cy="52" r={r} className={s.ringTrack} />
        <circle
          cx="52"
          cy="52"
          r={r}
          className={s.ringFill}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <span className={s.ringText} aria-hidden="true">
        <span className={s.ringValue}>{v}%</span>
        <span className={s.ringLabel}>team</span>
      </span>
    </div>
  );
}

function Bar({ value, label, me }: { value: number; label: string; me?: boolean }) {
  return (
    <div className={s.bar} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className={`${s.barFill} ${me ? s.barMe : ""}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function Challenges() {
  const [joined, setJoined] = useStored<Partial<Record<ChallengeId, Mode>>>("challenges-joined", {});
  const [teamOpen, setTeamOpen] = useState(false);
  const [choosing, setChoosing] = useState<ChallengeId | null>(null);

  const streak = currentStreak(MY_DAYS);
  const myHit = MY_DAYS.filter(Boolean).length;
  const join = (id: ChallengeId, mode: Mode) => {
    setJoined((cur) => ({ ...cur, [id]: mode }));
    setChoosing(null);
  };
  const leave = (id: ChallengeId) =>
    setJoined((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });

  const mine = MORE.filter((c) => joined[c.id]);
  const available = MORE.filter((c) => !joined[c.id]);

  return (
    <div className={s.screen}>
      <h1 className={s.title}>Challenges</h1>

      {/* Active team challenge */}
      <section className={s.hero} aria-labelledby="active-h">
        <div className={s.heroMain}>
          <Ring value={TEAM_PCT} />
          <div className={s.heroText}>
            <p className={s.eyebrow}>Team challenge</p>
            <h2 id="active-h" className={s.heroTitle}>
              {CHALLENGE.title}
            </h2>
            <p className={s.heroSub}>
              Day {CHALLENGE.today} of {CHALLENGE.totalDays} · under 20 g a day
            </p>
            <p className={s.heroSub}>
              {CHALLENGE.team} · {MEMBERS.length} members <DemoTag />
            </p>
          </div>
        </div>

        <dl className={s.stats}>
          <div className={s.stat}>
            <dt className={s.statLabel}>Day streak</dt>
            <dd className={s.statValue}>{streak}</dd>
          </div>
          <div className={s.stat}>
            <dt className={s.statLabel}>Your goal days</dt>
            <dd className={s.statValue}>{pct(myHit, CHALLENGE.today)}%</dd>
          </div>
          <div className={s.stat}>
            <dt className={s.statLabel}>Team rank</dt>
            <dd className={s.statValue}>#{MY_RANK}</dd>
          </div>
        </dl>

        <button type="button" className={s.toggle} aria-expanded={teamOpen} aria-controls="team-members" onClick={() => setTeamOpen((o) => !o)}>
          {teamOpen ? "Hide team" : "See team"}
          <Chevron open={teamOpen} />
        </button>
        {teamOpen && (
          <ul id="team-members" className={s.members}>
            {MEMBERS.map((m) => {
              const p = pct(m.hit, CHALLENGE.today);
              return (
                <li key={m.name} className={s.member}>
                  <span className={`${s.avatar} ${m.me ? s.avatarMe : ""}`} aria-hidden="true">
                    {m.avatar}
                  </span>
                  <div className={s.memberMain}>
                    <div className={s.rowBetween}>
                      <span className={s.memberName}>
                        {m.me ? "You" : m.name} {m.demo && <DemoTag />}
                      </span>
                      <span className={s.memberPct}>{p}%</span>
                    </div>
                    <Bar value={p} me={m.me} label={`${m.me ? "Your" : `${m.name}'s`} goal days hit`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Her 30 days */}
      <section className={s.section} aria-labelledby="days-h">
        <div className={s.sectionHead}>
          <h2 id="days-h" className={s.label}>
            Your 30 days
          </h2>
          <span className={s.labelAside}>
            {myHit} of {CHALLENGE.today} hit
          </span>
        </div>
        <div className={s.card}>
          <ol className={s.grid} aria-label="Your daily progress">
            {Array.from({ length: CHALLENGE.totalDays }, (_, i) => {
              const day = i + 1;
              const past = day <= MY_DAYS.length;
              const hit = past && MY_DAYS[i];
              const state = !past ? "upcoming" : hit ? "goal hit" : "missed";
              const cls = !past ? s.dotUpcoming : hit ? s.dotHit : s.dotMissed;
              return (
                <li key={day} className={s.cell}>
                  <span className={`${s.dot} ${cls} ${day === CHALLENGE.today ? s.dotToday : ""}`} aria-hidden="true" />
                  <span className={s.srOnly}>
                    Day {day}: {state}
                    {day === CHALLENGE.today ? " (today)" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className={s.legend} aria-hidden="true">
            <span>
              <i className={`${s.dot} ${s.dotHit}`} /> Hit
            </span>
            <span>
              <i className={`${s.dot} ${s.dotMissed}`} /> Missed
            </span>
            <span>
              <i className={`${s.dot} ${s.dotUpcoming}`} /> Upcoming
            </span>
          </div>
          <p className={s.source}>Filled automatically from MyFitnessPal.</p>
        </div>
      </section>

      {/* Badges */}
      <section className={s.section} aria-labelledby="badges-h">
        <h2 id="badges-h" className={`${s.label} ${s.labelPad}`}>
          Badges
        </h2>
        <ul className={s.badges}>
          {BADGES.map((b) => (
            <li key={b.id} className={`${s.badge} ${b.earned ? s.badgeEarned : s.badgeLocked}`}>
              <span className={s.badgeIcon}>
                <BadgeIcon id={b.id} />
              </span>
              <span className={s.badgeName}>{b.name}</span>
              <span className={s.badgeNote}>{b.earned ? b.note : `Locked · ${b.note}`}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Leaderboard */}
      <section className={s.section} aria-labelledby="board-h">
        <div className={s.sectionHead}>
          <h2 id="board-h" className={s.label}>
            This week
          </h2>
          <DemoTag />
        </div>
        <ol className={s.listCard}>
          {LEADERBOARD.map((t, i) => (
            <li key={t.team} className={`${s.boardRow} ${t.mine ? s.boardMine : ""}`} aria-current={t.mine ? "true" : undefined}>
              <span className={s.rank}>{i + 1}</span>
              <span className={s.boardTeam}>
                {t.team}
                {t.mine && <span className={s.youTag}>Your team</span>}
              </span>
              <span className={s.boardPct}>{t.pct}%</span>
            </li>
          ))}
        </ol>
        <p className={s.note}>Ranked by % of goal days hit, not raw numbers, so it&apos;s fair across abilities.</p>
      </section>

      {/* Your challenges (joined) */}
      {mine.length > 0 && (
        <section className={s.section} aria-labelledby="yours-h">
          <h2 id="yours-h" className={`${s.label} ${s.labelPad}`}>
            Your challenges
          </h2>
          <ul className={s.listCard}>
            {mine.map((c) => {
              const mode = joined[c.id];
              return (
                <li key={c.id} className={s.row}>
                  <div className={s.rowText}>
                    <h3 className={s.rowTitle}>{c.title}</h3>
                    <p className={s.rowMeta}>
                      {mode === "team" ? `Team ${c.teamName}` : "Solo"} · starts tomorrow · {c.days} days
                    </p>
                  </div>
                  <button type="button" className={s.quiet} onClick={() => leave(c.id)} aria-label={`Leave ${c.title}`}>
                    Leave
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* More challenges */}
      <section className={s.section} aria-labelledby="more-h">
        <h2 id="more-h" className={`${s.label} ${s.labelPad}`}>
          More challenges
        </h2>
        {available.length === 0 ? (
          <p className={s.note}>You&apos;ve joined every challenge. Nice work.</p>
        ) : (
          <ul className={s.listCard}>
            {available.map((c) => {
              const open = choosing === c.id;
              return (
                <li key={c.id} className={s.rowWrap}>
                  <div className={s.row}>
                    <div className={s.rowText}>
                      <h3 className={s.rowTitle}>{c.title}</h3>
                      <p className={s.rowMeta}>
                        {c.days} days · {c.source}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={open ? s.pillMuted : s.pill}
                      aria-expanded={open}
                      aria-controls={`join-${c.id}`}
                      aria-label={open ? `Cancel joining ${c.title}` : `Join ${c.title}`}
                      onClick={() => setChoosing(open ? null : c.id)}
                    >
                      {open ? "Cancel" : "Join"}
                    </button>
                  </div>
                  {open && (
                    <div id={`join-${c.id}`} className={s.choice}>
                      <p className={s.choiceBlurb}>{c.blurb}</p>
                      <div className={s.choiceBtns} role="group" aria-label={`How to join ${c.title}`}>
                        <button type="button" className={s.choiceBtn} onClick={() => join(c.id, "solo")}>
                          Solo
                        </button>
                        <button type="button" className={s.choiceBtnPrimary} onClick={() => join(c.id, "team")}>
                          With a team
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
