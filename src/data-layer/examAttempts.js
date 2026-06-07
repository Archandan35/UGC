/**
 * data-layer/examAttempts.js
 *
 * Exam attempt state persistence — follows the data-layer abstraction pattern.
 * Backed by localStorage (no DB table required for transient attempt state).
 *
 * All pages/hooks MUST use these helpers instead of touching localStorage directly.
 *
 * Persisted shape:
 * {
 *   attemptId        string   — unique ID for this attempt session
 *   examId           string
 *   studentId        string
 *   answers          object   — { [questionId]: selectedIndex }
 *   currentQuestion  number   — zero-based index
 *   visited          object   — { [questionId]: true }
 *   review           object   — { [questionId]: true }
 *   bookmarks        object   — { [questionId]: true }
 *   timePerQuestion  object   — { [questionId]: seconds }
 *   timeLeft         number   — seconds remaining
 *   progress         number   — 0-100 percentage
 *   lastActivity     string   — ISO timestamp
 * }
 */

/** Build the localStorage key for a given exam session. */
export function getAttemptKey(examId, paperId = null, pyqYear = null) {
  return `exam_${examId}_${paperId || "all"}_${pyqYear || "x"}`;
}

/**
 * Check whether a saved (unfinished) attempt exists for a key.
 * Used by the dashboard to decide whether to enable the Resume button.
 */
export function hasAttemptState(key) {
  try {
    return Boolean(localStorage.getItem(key));
  } catch {
    return false;
  }
}

/** Persist the current attempt state. */
export function saveAttemptState(key, state) {
  try {
    const payload = {
      ...state,
      lastActivity: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn("[examAttempts] saveAttemptState failed:", e?.message);
  }
}

/** Load a previously saved attempt state. Returns null when not found. */
export function loadAttemptState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("[examAttempts] loadAttemptState failed:", e?.message);
    return null;
  }
}

/** Remove the attempt state (called after successful submission). */
export function clearAttemptState(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("[examAttempts] clearAttemptState failed:", e?.message);
  }
}

/**
 * Compute progress percentage from answers vs total questions.
 * Returns 0-100.
 */
export function calcProgress(answers, totalQuestions) {
  if (!totalQuestions) return 0;
  return Math.round((Object.keys(answers).length / totalQuestions) * 100);
}
