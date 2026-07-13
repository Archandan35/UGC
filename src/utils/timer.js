/**
 * timer.js — Pure helpers for formatting and converting time values used
 * by the exam engine and result screens.
 */
export function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, "0")}m ${String(r).padStart(2, "0")}s`
    : `${String(m).padStart(2, "0")}m ${String(r).padStart(2, "0")}s`;
}

export function minutesToSeconds(min) { return Math.max(0, Number(min) || 0) * 60; }
