"use client";
// Community: peer-support groups and a moderated forum.
// Seeded groups/posts/replies are demo content (tagged "demo" in the UI).
// Her joins, posts, replies, reactions and reports persist via useStored.
import { useId, useState } from "react";
import { useStored, ME } from "@/lib/store";
import s from "./Community.module.css";

type GroupId = "worried" | "hypertension" | "heart-attack" | "af" | "menopause" | "pregnancy";

type Group = { id: GroupId; name: string; chip: string; blurb: string; members: number };

const GROUPS: Group[] = [
  { id: "worried", name: "Worried about my risk", chip: "My risk", blurb: "Family history, past pregnancy complications, or just unsure where you stand.", members: 2184 },
  { id: "hypertension", name: "Living with hypertension", chip: "Hypertension", blurb: "Readings, medications, side effects and small wins.", members: 3412 },
  { id: "heart-attack", name: "After a heart attack", chip: "After a heart attack", blurb: "Recovery, rehab and getting your confidence back.", members: 1027 },
  { id: "af", name: "AF (atrial fibrillation)", chip: "AF", blurb: "Living with an irregular heartbeat and its treatments.", members: 846 },
  { id: "menopause", name: "Perimenopause & menopause", chip: "Menopause", blurb: "How hormonal changes affect your heart, sleep and mood.", members: 2958 },
  { id: "pregnancy", name: "Pregnancy & heart health", chip: "Pregnancy", blurb: "Before, during and after pregnancy, including preeclampsia.", members: 731 },
];
const groupById = (id: GroupId) => GROUPS.find((g) => g.id === id) ?? GROUPS[0];

type Reply = { id: string; author: string; avatar: string; body: string; ago?: string; at?: number; demo?: boolean };

type Post = {
  id: string;
  group: GroupId;
  author: string;
  avatar: string;
  title: string;
  body: string;
  helped: number; // base count from other members (excludes her own reaction)
  ago?: string; // seed posts: fixed label
  at?: number; // her posts: timestamp (ms)
  demo?: boolean;
  replies: Reply[];
};

const SEED_POSTS: Post[] = [
  {
    id: "seed-amlodipine",
    group: "hypertension",
    author: "MaggieT",
    avatar: "MT",
    title: "Ankle swelling on amlodipine - did it settle for anyone?",
    body: "I started amlodipine 5 mg about three weeks ago. My readings are better, but by the evening my ankles are puffy and my shoes feel tight. It goes down overnight. Did anyone else get this? Did it settle, or did you end up talking to your GP about a different option? I don't want to just stop taking it.",
    helped: 14,
    ago: "2h",
    demo: true,
    replies: [
      { id: "r1", author: "SunnyRuth", avatar: "SR", ago: "1h", demo: true, body: "Same thing happened to me in the first month. I mentioned it at my review and my GP changed the dose and timing. Definitely worth raising rather than stopping on your own." },
      { id: "r2", author: "Priya_K", avatar: "PK", ago: "45m", demo: true, body: "Putting my feet up in the evening helped a bit while I waited for my appointment. Hope it settles for you." },
    ],
  },
  {
    id: "seed-bp-down",
    group: "hypertension",
    author: "Priya_K",
    avatar: "PK",
    title: "Small win: 162/98 down to 134/84",
    body: "Three months ago my readings were in the 160s and I was scared. Tablets, a lot less salt (reading labels became a hobby), and walking at lunch most days. This week's home average was 134/84. Not at target yet but it's moving. If you're at the start, it does get less overwhelming.",
    helped: 31,
    ago: "5h",
    demo: true,
    replies: [
      { id: "r1", author: "Jo-in-Leeds", avatar: "JL", ago: "4h", demo: true, body: "This is so encouraging. Which labels surprised you most?" },
      { id: "r2", author: "Priya_K", avatar: "PK", ago: "3h", demo: true, body: "Bread and breakfast cereal! I had no idea how much salt was in them." },
      { id: "r3", author: "Carol_63", avatar: "C6", ago: "2h", demo: true, body: "Well done. Lunchtime walks were a big one for me too." },
    ],
  },
  {
    id: "seed-palpitations",
    group: "menopause",
    author: "Jo-in-Leeds",
    avatar: "JL",
    title: "Palpitations at night - perimenopause or something else?",
    body: "I'm 49 and my periods have gone irregular. A few nights a week I wake up with my heart pounding or fluttering, sometimes with a hot flush. It passes after a few minutes but it frightens me. Has anyone had this checked? I'm never sure if it's 'just hormones' or something I should push about.",
    helped: 18,
    ago: "Yesterday",
    demo: true,
    replies: [
      { id: "r1", author: "LindaB", avatar: "LB", ago: "Yesterday", demo: true, body: "I had the same and felt silly asking, but my GP arranged an ECG and a heart monitor for a few days. Mine turned out to be hormonal, but I was glad it was checked properly." },
      { id: "r2", author: "Beth_W", avatar: "BW", ago: "20h", demo: true, body: "Keeping a note of when it happens (time, how long, what you were doing) really helped my appointment. Push for it - you deserve answers." },
    ],
  },
  {
    id: "seed-preeclampsia",
    group: "worried",
    author: "Ngozi_E",
    avatar: "NE",
    title: "Had preeclampsia 12 years ago - does that still matter now?",
    body: "I only recently read that preeclampsia can be linked to heart problems later in life. Nobody mentioned it at the time and I'm now 46. Has anyone raised this with their doctor? What did they check? I'd like to go in prepared rather than anxious.",
    helped: 22,
    ago: "Yesterday",
    demo: true,
    replies: [
      { id: "r1", author: "LindaB", avatar: "LB", ago: "Yesterday", demo: true, body: "I raised it and my GP said it's something they now ask about. I had a blood pressure check and blood tests for cholesterol and sugar. Writing my pregnancy history down beforehand helped." },
    ],
  },
  {
    id: "seed-one-year",
    group: "heart-attack",
    author: "Carol_63",
    avatar: "C6",
    title: "One year since my heart attack - what helped me",
    body: "A year ago today I was in the coronary care unit. Cardiac rehab was the turning point: the exercise sessions, but mostly being in a room with people who understood. I still get anxious with chest twinges, but much less. Sending love to anyone in the early weeks.",
    helped: 40,
    ago: "2d",
    demo: true,
    replies: [
      { id: "r1", author: "Aisha.M", avatar: "AM", ago: "2d", demo: true, body: "Happy heart-iversary. Thank you for sharing this." },
    ],
  },
  {
    id: "seed-af",
    group: "af",
    author: "Beth_W",
    avatar: "BW",
    title: "Newly diagnosed with AF and feeling anxious",
    body: "Diagnosed last week after a smartwatch alert sent me to the GP. I've been started on a blood thinner and I keep reading frightening things online. How did you cope in the first few weeks? Any questions you wish you'd asked?",
    helped: 12,
    ago: "3d",
    demo: true,
    replies: [
      { id: "r1", author: "SunnyRuth", avatar: "SR", ago: "3d", demo: true, body: "Step away from the forums at 2am (except this one!). I asked for a written plan for what to do if it flares up, and that helped me feel more in control." },
    ],
  },
  {
    id: "seed-pregnancy",
    group: "pregnancy",
    author: "Aisha.M",
    avatar: "AM",
    title: "Keeping up BP checks after a high-risk pregnancy",
    body: "My little one is 8 months old. I had high blood pressure in pregnancy and was told to keep an eye on it, but life with a baby means I forget. What's worked for others to keep checking?",
    helped: 9,
    ago: "4d",
    demo: true,
    replies: [
      { id: "r1", author: "Ngozi_E", avatar: "NE", ago: "4d", demo: true, body: "I tied it to something I already did every day: BP check before my first cup of tea on Sunday mornings." },
    ],
  },
];

function timeAgo(ms: number): string {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d`;
}
const when = (x: { ago?: string; at?: number }) => x.ago ?? (x.at ? timeAgo(x.at) : "");

const AVATAR_TONES = [s.toneRose, s.toneViolet, s.toneGood, s.toneWatch];
function Avatar({ initials, me, small }: { initials: string; me?: boolean; small?: boolean }) {
  const sum = [...initials].reduce((n, c) => n + c.charCodeAt(0), 0);
  const tone = me ? s.toneMe : AVATAR_TONES[sum % AVATAR_TONES.length];
  return (
    <span className={`${s.avatar} ${small ? s.avatarSm : ""} ${tone}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function DemoTag() {
  return <span className={s.demo}>demo</span>;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ dir = "right" }: { dir?: "right" | "left" | "down" }) {
  const d = dir === "left" ? "M15 5l-7 7 7 7" : dir === "down" ? "M5 9l7 7 7-7" : "M9 5l7 7-7 7";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The app scrolls inside a [data-screen] container, not the window.
function scrollScreenTop() {
  if (typeof document === "undefined") return;
  const el = document.querySelector("[data-screen]");
  if (el) el.scrollTo({ top: 0 });
  else window.scrollTo({ top: 0 });
}

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={s.back} onClick={onClick}>
      <Chevron dir="left" />
      {label}
    </button>
  );
}

type View = { kind: "list" } | { kind: "post"; id: string } | { kind: "new" };
type Filter = "all" | GroupId;
type Tab = "posts" | "groups";

export default function Community() {
  const [joined, setJoined] = useStored<GroupId[]>("community-joined", ["hypertension", "menopause"]);
  const [myPosts, setMyPosts] = useStored<Post[]>("community-posts", []);
  const [myReplies, setMyReplies] = useStored<Record<string, Reply[]>>("community-replies", {});
  const [helped, setHelped] = useStored<string[]>("community-helped", []);
  const [reported, setReported] = useStored<string[]>("community-reported", []);

  const [view, setView] = useState<View>({ kind: "list" });
  const [tab, setTab] = useState<Tab>("posts");
  const [filter, setFilter] = useState<Filter>("all");
  const [rulesOpen, setRulesOpen] = useState(false);

  const allPosts = [...myPosts, ...SEED_POSTS];
  const repliesFor = (p: Post) => [...p.replies, ...(myReplies[p.id] ?? [])];
  const helpedCount = (p: Post) => p.helped + (helped.includes(p.id) ? 1 : 0);

  const toggleJoin = (id: GroupId) =>
    setJoined((cur) => (cur.includes(id) ? cur.filter((g) => g !== id) : [...cur, id]));
  const toggleHelped = (id: string) =>
    setHelped((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const report = (id: string) => setReported((cur) => (cur.includes(id) ? cur : [...cur, id]));

  const go = (v: View) => {
    setView(v);
    scrollScreenTop();
  };
  const openPost = (id: string) => go({ kind: "post", id });
  const backToList = () => go({ kind: "list" });

  if (view.kind === "new") {
    return (
      <NewPostForm
        defaultGroup={filter !== "all" ? filter : joined[0] ?? "hypertension"}
        onCancel={backToList}
        onSubmit={(group, title, body) => {
          const post: Post = {
            id: `me-${Date.now()}`,
            group,
            author: ME.displayName,
            avatar: ME.avatar,
            title,
            body,
            helped: 0,
            at: Date.now(),
            replies: [],
          };
          setMyPosts((cur) => [post, ...cur]);
          setFilter("all");
          setTab("posts");
          openPost(post.id);
        }}
      />
    );
  }

  if (view.kind === "post") {
    const post = allPosts.find((p) => p.id === view.id);
    if (!post) {
      return (
        <div className={s.screen}>
          <BackButton label="Community" onClick={backToList} />
          <p className={s.muted}>This post is no longer available.</p>
        </div>
      );
    }
    return (
      <PostDetail
        post={post}
        replies={repliesFor(post)}
        helpedCount={helpedCount(post)}
        isHelped={helped.includes(post.id)}
        isReported={reported.includes(post.id)}
        onBack={backToList}
        onHelped={() => toggleHelped(post.id)}
        onReport={() => report(post.id)}
        onReply={(body) =>
          setMyReplies((cur) => ({
            ...cur,
            [post.id]: [
              ...(cur[post.id] ?? []),
              { id: `me-${Date.now()}`, author: ME.displayName, avatar: ME.avatar, body, at: Date.now() },
            ],
          }))
        }
      />
    );
  }

  const visible = filter === "all" ? allPosts : allPosts.filter((p) => p.group === filter);

  return (
    <div className={s.screen}>
      <header className={s.header}>
        <div className={s.headText}>
          <h1 className={s.title}>Community</h1>
          <p className={s.subtitle}>
            You appear as <strong>{ME.displayName}</strong>
          </p>
        </div>
        <button type="button" className={s.iconBtn} aria-label="New post" onClick={() => go({ kind: "new" })}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className={s.segmented} role="group" aria-label="Show">
        <button type="button" className={tab === "posts" ? s.segOn : s.seg} aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>
          Posts
        </button>
        <button type="button" className={tab === "groups" ? s.segOn : s.seg} aria-pressed={tab === "groups"} onClick={() => setTab("groups")}>
          Groups
        </button>
      </div>

      {tab === "groups" ? (
        <section aria-labelledby="groups-h" className={s.section}>
          <div className={s.sectionHead}>
            <h2 id="groups-h" className={s.label}>
              Groups
            </h2>
            <span className={s.labelAside}>{joined.length} joined</span>
          </div>
          <ul className={s.listCard}>
            {GROUPS.map((g) => {
              const isJoined = joined.includes(g.id);
              return (
                <li key={g.id} className={s.groupRow}>
                  <div className={s.groupText}>
                    <h3 className={s.groupName}>{g.name}</h3>
                    <p className={s.groupBlurb}>{g.blurb}</p>
                    <p className={s.groupMeta}>
                      {(g.members + (isJoined ? 1 : 0)).toLocaleString("en-GB")} members <DemoTag />
                    </p>
                  </div>
                  <button
                    type="button"
                    className={isJoined ? s.joinedPill : s.joinPill}
                    aria-pressed={isJoined}
                    aria-label={`${isJoined ? "Leave" : "Join"} ${g.name}`}
                    onClick={() => toggleJoin(g.id)}
                  >
                    {isJoined ? (
                      <>
                        <CheckIcon />
                        Joined
                      </>
                    ) : (
                      "Join"
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section aria-label="Posts" className={s.section}>
          <div className={s.chips} role="group" aria-label="Filter posts by group">
            <button type="button" className={filter === "all" ? s.chipOn : s.chip} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All
            </button>
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={filter === g.id ? s.chipOn : s.chip}
                aria-pressed={filter === g.id}
                onClick={() => setFilter(g.id)}
              >
                {g.chip}
              </button>
            ))}
          </div>

          <div className={s.rulesCard}>
            <button
              type="button"
              className={s.rulesToggle}
              aria-expanded={rulesOpen}
              aria-controls="community-rules"
              onClick={() => setRulesOpen((o) => !o)}
            >
              <span className={s.pin} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M9 3h6l-1 6 4 4H6l4-4-1-6zM12 13v8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </span>
              <span className={s.rulesTitle}>Community guidelines</span>
              <span className={`${s.rulesChevron} ${rulesOpen ? s.rulesChevronOpen : ""}`}>
                <Chevron />
              </span>
            </button>
            {rulesOpen && (
              <ul id="community-rules" className={s.rules}>
                <li>
                  <strong>Be kind.</strong> Everyone here is somewhere on a hard road.
                </li>
                <li>
                  <strong>Share experience, not instructions.</strong> No medical advice presented as fact. Never change or stop a medicine because of a post; talk to your clinician.
                </li>
                <li>
                  <strong>No selling.</strong> No products, supplements or referral links.
                </li>
                <li>
                  <strong>Stay anonymous.</strong> Use your display name and avoid details that identify you.
                </li>
              </ul>
            )}
          </div>

          {visible.length === 0 ? (
            <div className={s.empty}>
              <p>No posts in {groupById(filter as GroupId).name} yet.</p>
              <button type="button" className={s.primary} onClick={() => go({ kind: "new" })}>
                Start the conversation
              </button>
            </div>
          ) : (
            <ul className={s.postList}>
              {visible.map((p) => {
                const isMine = p.author === ME.displayName && !p.demo;
                const isHelped = helped.includes(p.id);
                const n = repliesFor(p).length;
                return (
                  <li key={p.id} className={s.postCard}>
                    <div className={s.byline}>
                      <Avatar initials={p.avatar} me={isMine} small />
                      <span className={s.metaLine}>
                        <span className={s.author}>{isMine ? "You" : p.author}</span>
                        {" · "}
                        {groupById(p.group).chip}
                        {" · "}
                        {when(p)}
                      </span>
                      {p.demo && <DemoTag />}
                    </div>
                    <button type="button" className={s.postOpen} onClick={() => openPost(p.id)}>
                      <span className={s.postTitle}>{p.title}</span>
                      <span className={s.excerpt}>{p.body}</span>
                    </button>
                    <div className={s.footer}>
                      <button
                        type="button"
                        className={isHelped ? s.quietOn : s.quiet}
                        aria-pressed={isHelped}
                        aria-label={`This helped, ${helpedCount(p)}`}
                        onClick={() => toggleHelped(p.id)}
                      >
                        <HeartIcon filled={isHelped} />
                        {helpedCount(p)} helped
                      </button>
                      <span className={s.dotSep} aria-hidden="true">
                        ·
                      </span>
                      <button type="button" className={s.quiet} onClick={() => openPost(p.id)}>
                        {n} {n === 1 ? "reply" : "replies"}
                      </button>
                      {reported.includes(p.id) && <span className={s.reportedTag}>Reported</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function PostDetail({
  post,
  replies,
  helpedCount,
  isHelped,
  isReported,
  onBack,
  onHelped,
  onReport,
  onReply,
}: {
  post: Post;
  replies: Reply[];
  helpedCount: number;
  isHelped: boolean;
  isReported: boolean;
  onBack: () => void;
  onHelped: () => void;
  onReport: () => void;
  onReply: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const replyId = useId();
  const errId = useId();
  const isMine = post.author === ME.displayName && !post.demo;

  return (
    <div className={s.screen}>
      <BackButton label="Community" onClick={onBack} />

      <article className={s.detail}>
        <p className={s.groupLabel}>{groupById(post.group).name}</p>
        <h1 className={s.detailTitle}>{post.title}</h1>
        <div className={s.byline}>
          <Avatar initials={post.avatar} me={isMine} small />
          <span className={s.metaLine}>
            <span className={s.author}>{isMine ? `${post.author} (you)` : post.author}</span>
            {" · "}
            {when(post)}
          </span>
          {post.demo && <DemoTag />}
        </div>
        <p className={s.body}>{post.body}</p>
        <div className={s.detailActions}>
          <button type="button" className={isHelped ? s.helpedOn : s.helped} aria-pressed={isHelped} onClick={onHelped}>
            <HeartIcon filled={isHelped} />
            This helped · {helpedCount}
          </button>
          {!isMine && (
            <button type="button" className={s.report} onClick={onReport} disabled={isReported}>
              {isReported ? "Reported" : "Report"}
            </button>
          )}
        </div>
        {isReported && (
          <p className={s.confirm} role="status">
            Thanks. Our moderators will review this post.
          </p>
        )}
      </article>

      <section aria-labelledby="replies-h" className={s.section}>
        <h2 id="replies-h" className={s.label}>
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h2>
        {replies.length > 0 && (
          <ul className={s.listCard}>
            {replies.map((r) => {
              const mine = r.author === ME.displayName && !r.demo;
              return (
                <li key={r.id} className={s.replyRow}>
                  <div className={s.byline}>
                    <Avatar initials={r.avatar} me={mine} small />
                    <span className={s.metaLine}>
                      <span className={s.author}>{mine ? `${r.author} (you)` : r.author}</span>
                      {" · "}
                      {when(r)}
                    </span>
                    {r.demo && <DemoTag />}
                  </div>
                  <p className={s.replyBody}>{r.body}</p>
                </li>
              );
            })}
          </ul>
        )}

        <form
          className={s.composer}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) {
              setError("Write a reply before posting.");
              return;
            }
            onReply(text);
            setDraft("");
            setError("");
          }}
        >
          <label htmlFor={replyId} className={s.fieldLabel}>
            Reply as {ME.displayName}
          </label>
          <textarea
            id={replyId}
            className={s.textarea}
            rows={3}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            placeholder="Share your experience kindly"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
          />
          {error && (
            <p id={errId} className={s.error} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className={`${s.primary} ${s.alignEnd}`}>
            Reply
          </button>
        </form>
      </section>
    </div>
  );
}

function NewPostForm({
  defaultGroup,
  onCancel,
  onSubmit,
}: {
  defaultGroup: GroupId;
  onCancel: () => void;
  onSubmit: (group: GroupId, title: string, body: string) => void;
}) {
  const [group, setGroup] = useState<GroupId>(defaultGroup);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const ids = { group: useId(), title: useId(), body: useId(), titleErr: useId(), bodyErr: useId() };

  const titleErr = tried && !title.trim() ? "Add a title." : "";
  const bodyErr = tried && !body.trim() ? "Write a few words for your post." : "";

  return (
    <div className={s.screen}>
      <BackButton label="Cancel" onClick={onCancel} />
      <header>
        <h1 className={s.title}>New post</h1>
        <p className={s.subtitle}>
          Posting as <strong>{ME.displayName}</strong>. Avoid details that could identify you.
        </p>
      </header>

      <form
        className={s.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (!title.trim() || !body.trim()) return;
          onSubmit(group, title.trim(), body.trim());
        }}
      >
        <div className={s.field}>
          <label htmlFor={ids.group} className={s.fieldLabel}>
            Group
          </label>
          <select id={ids.group} className={s.select} value={group} onChange={(e) => setGroup(e.target.value as GroupId)}>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className={s.field}>
          <label htmlFor={ids.title} className={s.fieldLabel}>
            Title
          </label>
          <input
            id={ids.title}
            className={s.input}
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Anyone else feel tired on ramipril?"
            aria-invalid={titleErr ? true : undefined}
            aria-describedby={titleErr ? ids.titleErr : undefined}
          />
          {titleErr && (
            <p id={ids.titleErr} className={s.error}>
              {titleErr}
            </p>
          )}
        </div>

        <div className={s.field}>
          <label htmlFor={ids.body} className={s.fieldLabel}>
            Your post
          </label>
          <textarea
            id={ids.body}
            className={s.textarea}
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share what's on your mind. Others will reply with their own experience."
            aria-invalid={bodyErr ? true : undefined}
            aria-describedby={bodyErr ? ids.bodyErr : undefined}
          />
          {bodyErr && (
            <p id={ids.bodyErr} className={s.error}>
              {bodyErr}
            </p>
          )}
        </div>

        <p className={s.hint}>Replies are personal experience, not medical advice. Check anything important with your GP or care team.</p>

        <button type="submit" className={`${s.primary} ${s.full}`}>
          Post
        </button>
      </form>
    </div>
  );
}
