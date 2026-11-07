"use client";
// Medications: the list Amara takes plus an inline "Add a medication" sheet.
// Shares the list with the voice agent through useMeds() (localStorage key "meds").
// Deliberately no reminders / taken-skip / adherence / side effects.
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { COMMON_DRUGS, useMeds, type Medication } from "@/lib/store";
import styles from "./Meds.module.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_TIMES = ["08:00", "20:00", "13:00", "17:00"];
const FREQ_LABEL = ["", "Once a day", "Twice a day", "3 times a day", "4 times a day"];

// "2026-09-11" -> "11 Sep 2026" without Intl or timezone shifts (same on server and client).
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const defaultTimes = (n: number) => DEFAULT_TIMES.slice(0, n).sort();

function summary(med: Medication): string {
  const freq = FREQ_LABEL[med.timesPerDay] ?? `${med.timesPerDay} times a day`;
  return [freq, med.times.join(", "), `since ${formatDate(med.startDate)}`].filter(Boolean).join(" · ");
}

type Draft = {
  name: string;
  dose: string;
  timesPerDay: number;
  times: string[];
  startDate: string;
  prescribedBy: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  dose: "",
  timesPerDay: 1,
  times: defaultTimes(1),
  startDate: todayIso(),
  prescribedBy: "",
});

type Errors = { name?: string; dose?: string };

export default function Meds() {
  const [meds, setMeds] = useMeds();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const doseRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Free the object URL for the photo thumbnail when it changes or on unmount.
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    if (adding) nameRef.current?.focus();
  }, [adding]);

  function openForm() {
    setDraft(emptyDraft());
    setErrors({});
    setPhotoUrl(null);
    setJustAdded(null);
    setAdding(true);
  }

  function closeForm() {
    setAdding(false);
    setErrors({});
    setPhotoUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    requestAnimationFrame(() => addBtnRef.current?.focus());
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (key === "name" || key === "dose") {
      const k = key as keyof Errors;
      if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    }
  }

  function setCount(n: number) {
    setDraft((d) => ({ ...d, timesPerDay: n, times: defaultTimes(n) }));
  }

  function setTime(i: number, value: string) {
    setDraft((d) => {
      const times = [...d.times];
      times[i] = value;
      return { ...d, times };
    });
  }

  function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    // Demo: pretend we read the label on the box.
    setDraft((d) => ({ ...d, name: "Amlodipine", dose: "5 mg" }));
    setErrors({});
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    const dose = draft.dose.trim();
    const next: Errors = {};
    if (!name) next.name = "Please enter the medication name.";
    if (!dose) next.dose = "Please enter the dose, for example 5 mg.";
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.dose) return doseRef.current?.focus();

    const med: Medication = {
      id: crypto.randomUUID(),
      name,
      dose,
      timesPerDay: draft.timesPerDay,
      times: draft.times.slice(0, draft.timesPerDay).map((t) => t || "08:00").sort(),
      startDate: draft.startDate || todayIso(),
      prescribedBy: draft.prescribedBy.trim(),
    };
    setMeds((list) => [...list, med]);
    setJustAdded(med.name);
    closeForm();
  }

  function toggleRow(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
    setConfirmId(null);
  }

  function remove(id: string) {
    setMeds((list) => list.filter((m) => m.id !== id));
    setConfirmId(null);
    setOpenId(null);
  }

  const err = (k: keyof Errors) => `${uid}-${k}-error`;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Medications</h1>
        <button
          ref={addBtnRef}
          type="button"
          className={`${styles.iconBtn} ${adding ? styles.iconBtnOpen : ""}`}
          onClick={adding ? closeForm : openForm}
          aria-label={adding ? "Close add medication" : "Add a medication"}
          aria-expanded={adding}
          aria-controls={`${uid}-form`}
        >
          <span className={styles.plus} aria-hidden="true" />
        </button>
      </header>

      {justAdded && !adding && (
        <p className={styles.toast} role="status">
          {justAdded} added
        </p>
      )}

      {adding && (
        <form
          id={`${uid}-form`}
          className={styles.sheet}
          onSubmit={onSubmit}
          noValidate
          aria-labelledby={`${uid}-formtitle`}
        >
          <h2 id={`${uid}-formtitle`} className={styles.sheetTitle}>
            Add a medication
          </h2>

          <div className={styles.photo}>
            <label htmlFor={`${uid}-photo`} className={styles.photoRow}>
              <span className={styles.cameraIcon} aria-hidden="true" />
              <span className={styles.photoText}>Snap a photo of the box</span>
              <span className={styles.chevron} aria-hidden="true" />
            </label>
            <input
              ref={fileRef}
              id={`${uid}-photo`}
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.visuallyHidden}
              onChange={onPhoto}
            />
            {photoUrl && (
              <div className={styles.photoResult}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Photo of the medication box" className={styles.thumb} />
                <p className={styles.photoNote} role="status">
                  Read from photo (demo) — check before saving
                </p>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-name`} className={styles.label}>
              Name
            </label>
            <input
              ref={nameRef}
              id={`${uid}-name`}
              className={styles.input}
              list={`${uid}-drugs`}
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Amlodipine"
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? err("name") : undefined}
            />
            <datalist id={`${uid}-drugs`}>
              {COMMON_DRUGS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            {errors.name && (
              <p id={err("name")} className={styles.error}>
                {errors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-dose`} className={styles.label}>
              Dose
            </label>
            <input
              ref={doseRef}
              id={`${uid}-dose`}
              className={styles.input}
              value={draft.dose}
              onChange={(e) => update("dose", e.target.value)}
              placeholder="e.g. 5 mg"
              autoComplete="off"
              aria-invalid={!!errors.dose}
              aria-describedby={errors.dose ? err("dose") : undefined}
            />
            {errors.dose && (
              <p id={err("dose")} className={styles.error}>
                {errors.dose}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-count`} className={styles.label}>
              Times per day
            </label>
            <select
              id={`${uid}-count`}
              className={styles.input}
              value={draft.timesPerDay}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{draft.timesPerDay === 1 ? "Time" : "Times"}</legend>
            <div className={styles.timeGrid}>
              {draft.times.map((t, i) => (
                <div key={i} className={styles.timeField}>
                  <label htmlFor={`${uid}-time-${i}`} className={styles.visuallyHidden}>
                    Dose {i + 1} time
                  </label>
                  <input
                    id={`${uid}-time-${i}`}
                    type="time"
                    className={styles.input}
                    value={t}
                    onChange={(e) => setTime(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div className={styles.field}>
            <label htmlFor={`${uid}-start`} className={styles.label}>
              Started
            </label>
            <input
              id={`${uid}-start`}
              type="date"
              className={styles.input}
              value={draft.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </div>

          <div className={styles.sheetActions}>
            <button type="submit" className={styles.primaryBtn}>
              Save
            </button>
            <button type="button" className={styles.textBtn} onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <section aria-labelledby={`${uid}-listlabel`} className={styles.section}>
        <h2 id={`${uid}-listlabel`} className={styles.sectionLabel}>
          Taking now
        </h2>
        {meds.length === 0 ? (
          <p className={`${styles.card} ${styles.empty}`}>No medications yet. Tap + to add one.</p>
        ) : (
          <ul className={styles.card}>
            {meds.map((m) => {
              const open = openId === m.id;
              const detailsId = `${uid}-details-${m.id}`;
              return (
                <li key={m.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => toggleRow(m.id)}
                    aria-expanded={open}
                    aria-controls={detailsId}
                  >
                    <span className={styles.pill} aria-hidden="true" />
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>
                        <span className={styles.medName}>{m.name}</span>{" "}
                        <span className={styles.dose}>{m.dose}</span>
                        {m.demo && <span className={styles.demoTag}>demo</span>}
                      </span>
                      <span className={styles.rowMeta}>{summary(m)}</span>
                    </span>
                    {!m.demo && <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true" />}
                  </button>

                  {open && !m.demo && (
                    <div id={detailsId} className={styles.details}>
                      {!m.demo &&
                        (confirmId === m.id ? (
                          <div className={styles.confirm} role="group" aria-label={`Remove ${m.name}?`}>
                            <span className={styles.confirmText}>Remove?</span>
                            <button type="button" className={styles.dangerBtn} onClick={() => remove(m.id)}>
                              Yes
                            </button>
                            <button type="button" className={styles.textBtn} onClick={() => setConfirmId(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => setConfirmId(m.id)}
                            aria-label={`Remove ${m.name}`}
                          >
                            Remove
                          </button>
                        ))}
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
