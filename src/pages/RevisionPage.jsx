import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRevisionPool, saveResult } from "../data-layer";
import TopNavbar from "../components/TopNavbar";

/* ─── Answer letter/index helpers ─────────────────────────── */
const _AMAP = { A: 0, B: 1, C: 2, D: 3 };
function correctIndexOf(q) {
  if (typeof q.correctAnswer === "number") return q.correctAnswer;
  if (typeof q.correctAnswer === "string")
    return _AMAP[q.correctAnswer.trim().toUpperCase()] ?? 0;
  if (typeof q.correct_answer === "number") return q.correct_answer;
  if (typeof q.correct_answer === "string")
    return _AMAP[q.correct_answer.trim().toUpperCase()] ?? 0;
  return 0;
}
function optionLetter(idx) {
  return idx !== undefined && idx !== null ? String.fromCharCode(65 + idx) : "—";
}
function getOptions(q) {
  return (
    q.options ||
    [q.optionA, q.optionB, q.optionC, q.optionD].filter(
      (v) => v !== undefined && v !== null
    )
  );
}

/* ─── Revision status helpers ──────────────────────────────── */
function calcRevisionStatus(originalReason, revisionAnswer, correctIdx) {
  if (revisionAnswer === undefined || revisionAnswer === null) {
    return originalReason === "wrong" ? "wrong" : "skipped";
  }
  return revisionAnswer === correctIdx ? "correct-after-revision" : "still-wrong";
}

/* ─── Palette button class ─────────────────────────────────── */
function paletteBtnClass(q, index, currentIndex, revisionAnswers) {
  const reason = q._reason; // "wrong" | "unattempted"
  const revAns = revisionAnswers[q.id];
  const correctIdx = correctIndexOf(q);
  let cls = "palette-btn";

  if (revAns !== undefined && revAns !== null) {
    // Re-attempted
    if (revAns === correctIdx) cls += " answered"; // green — correct after revision
    else cls += " not-answered";                   // red   — still wrong
  } else {
    // Not yet attempted in revision
    if (reason === "wrong") cls += " not-answered"; // red
    else cls += " revision-palette-skipped";         // yellow — unattempted/skipped
  }

  if (index === currentIndex) cls += " current";
  return cls;
}

export default function RevisionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Data ───────────────────────────────────────────────── */
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  /* ── Revision state ─────────────────────────────────────── */
  // { [questionId]: selectedOptionIndex }
  const [revisionAnswers, setRevisionAnswers] = useState({});

  /* ── Modal ─────────────────────────────────────────────── */
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState(null); // set after finish

  const submittedRef = useRef(false);

  /* ── Load revision pool ─────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const uid = user?.id || user?.uid || null;
        const { questions: qs } = await getRevisionPool(uid, {
          maxResults: 50,
          maxQuestions: 200,
        });
        setQuestions(qs || []);
      } catch (err) {
        console.error("[RevisionPage] load failed:", err);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  /* ── Derived stats (memoized) ───────────────────────────── */
  const stats = useMemo(() => {
    const total = questions.length;
    const wrongCount = questions.filter((q) => q._reason === "wrong").length;
    const skippedCount = questions.filter((q) => q._reason !== "wrong").length;
    let reAttempted = 0, correctAfter = 0, stillWrong = 0;

    questions.forEach((q) => {
      const revAns = revisionAnswers[q.id];
      if (revAns === undefined || revAns === null) return;
      reAttempted++;
      if (revAns === correctIndexOf(q)) correctAfter++;
      else stillWrong++;
    });

    return { total, wrongCount, skippedCount, reAttempted, correctAfter, stillWrong };
  }, [questions, revisionAnswers]);

  /* ── Current question data ──────────────────────────────── */
  const currentQ = questions[currentIdx] || null;
  const options = currentQ ? getOptions(currentQ) : [];
  const correctIdx = currentQ ? correctIndexOf(currentQ) : 0;
  const revisionAnswer = currentQ ? revisionAnswers[currentQ.id] : undefined;
  const originalReason = currentQ?._reason || "wrong";
  const revisionStatus = currentQ
    ? calcRevisionStatus(originalReason, revisionAnswer, correctIdx)
    : null;

  /* ── Select option ──────────────────────────────────────── */
  const selectOption = useCallback(
    (optIdx) => {
      if (!currentQ) return;
      setRevisionAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
    },
    [currentQ]
  );

  /* ── Navigation ─────────────────────────────────────────── */
  const handlePrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);
  const handleNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
  }, [questions.length]);

  /* ── Finish revision ────────────────────────────────────── */
  const handleFinishRevision = useCallback(async () => {
    if (submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const summary = {
      total: stats.total,
      correctAfter: stats.correctAfter,
      stillWrong: stats.stillWrong,
      skippedDuringRevision:
        stats.total - stats.reAttempted,
      accuracy:
        stats.reAttempted > 0
          ? Math.round((stats.correctAfter / stats.reAttempted) * 100)
          : 0,
    };

    // Build result payload via existing saveResult (data-layer, no direct DB)
    try {
      const uid = user?.id || user?.uid || null;
      const resultPayload = {
        examId: "revision",
        examName: "Revision Session",
        examType: "revision",
        score: stats.correctAfter,
        totalMarks: stats.total,
        correct: stats.correctAfter,
        wrong: stats.stillWrong,
        unattempted: stats.total - stats.reAttempted,
        accuracy: summary.accuracy,
        answers: revisionAnswers,
        questions,
        submittedAt: new Date().toISOString(),
      };
      await saveResult(resultPayload, uid);
    } catch (err) {
      console.warn("[RevisionPage] saveResult (non-fatal):", err);
    }

    // Update localStorage — remove questions correctly answered during revision
    try {
      const uid = user?.id || user?.uid || null;
      if (uid) {
        const REVISION_KEY = `revision_pool_${uid}`;
        const raw = localStorage.getItem(REVISION_KEY);
        if (raw) {
          const pool = JSON.parse(raw);
          questions.forEach((q) => {
            const revAns = revisionAnswers[q.id];
            if (revAns !== undefined && revAns === correctIndexOf(q)) {
              delete pool[q.id];
            }
          });
          localStorage.setItem(REVISION_KEY, JSON.stringify(pool));
        }
      }
    } catch (lsErr) {
      console.warn("[RevisionPage] localStorage update failed:", lsErr);
    }

    setSummaryData(summary);
    setShowFinishModal(false);
    setSubmitting(false);
  }, [submitting, stats, questions, revisionAnswers, user]);

  /* ── Loading / Empty states ─────────────────────────────── */
  if (loading) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="revision-empty-state">
          <div className="loading-spinner" />
          <h3>Loading Revision Questions…</h3>
          <p>Fetching your wrong and skipped questions.</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="revision-empty-state">
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <h3>No Questions to Revise!</h3>
          <p>
            You have no wrong or skipped questions. Attempt an exam first, or
            all your previous answers were correct.
          </p>
          <button className="submit-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Summary modal (after finish) ──────────────────────── */
  if (summaryData) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="exam-submit-modal-overlay">
          <div className="exam-submit-modal">
            <div className="exam-submit-modal-icon">📊</div>
            <h3 className="exam-submit-modal-title">Revision Completed</h3>
            <div className="exam-submit-modal-sub">
              <p>
                <strong>Questions Revised:</strong> {summaryData.total}
              </p>
              <p>
                <strong>Corrected Mistakes:</strong> {summaryData.correctAfter}
              </p>
              <p>
                <strong>Still Incorrect:</strong> {summaryData.stillWrong}
              </p>
              <p>
                <strong>Skipped During Revision:</strong>{" "}
                {summaryData.skippedDuringRevision}
              </p>
              <p>
                <strong>Revision Accuracy:</strong> {summaryData.accuracy}%
              </p>
            </div>
            <div
              className="exam-submit-modal-actions"
              style={{ flexDirection: "row", gap: "0.75rem", marginTop: "1.25rem" }}
            >
              <button
                className="exam-submit-modal-btn exam-submit-modal-btn-confirm"
                style={{ flex: 1 }}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button
                className="exam-submit-modal-btn exam-submit-modal-btn-cancel"
                style={{ flex: 1 }}
                onClick={() => navigate("/exams")}
              >
                New Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────── */
  return (
    <div className="page">
      <TopNavbar />

      {/* ── Finish confirmation modal ── */}
      {showFinishModal && (
        <div className="exam-submit-modal-overlay">
          <div className="exam-submit-modal">
            <div className="exam-submit-modal-icon">📋</div>
            <h3 className="exam-submit-modal-title">Finish Revision?</h3>
            <p className="exam-submit-modal-sub">
              You have re-attempted{" "}
              <strong>{stats.reAttempted}</strong> of{" "}
              <strong>{stats.total}</strong> revision questions.
              {stats.total - stats.reAttempted > 0 && (
                <>
                  {" "}
                  <span className="exam-submit-unattempted">
                    {stats.total - stats.reAttempted} not re-attempted.
                  </span>
                </>
              )}
            </p>
            <div
              className="exam-submit-modal-actions"
              style={{ flexDirection: "row", gap: "0.75rem" }}
            >
              <button
                className="exam-submit-modal-btn exam-submit-modal-btn-confirm"
                style={{ flex: 1 }}
                disabled={submitting}
                onClick={handleFinishRevision}
              >
                {submitting ? "Saving…" : "✅ Yes, Finish"}
              </button>
              <button
                className="exam-submit-modal-btn exam-submit-modal-btn-cancel"
                style={{ flex: 1 }}
                disabled={submitting}
                onClick={() => setShowFinishModal(false)}
              >
                ← Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="revision-topbar">
        <div>
          <h2>Revision Mode</h2>
          <p>Review and re-attempt your wrong &amp; skipped questions</p>
        </div>
        <div className="revision-topbar-stats">
          <div className="revision-stat-chip">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="revision-stat-chip">
            <span>Wrong</span>
            <strong>{stats.wrongCount}</strong>
          </div>
          <div className="revision-stat-chip">
            <span>Skipped</span>
            <strong>{stats.skippedCount}</strong>
          </div>
          <div className="revision-stat-chip">
            <span>Re-done</span>
            <strong>{stats.reAttempted}</strong>
          </div>
          <div className="revision-stat-chip">
            <span>Correct</span>
            <strong>{stats.correctAfter}</strong>
          </div>
          <div className="revision-stat-chip">
            <span>Still Wrong</span>
            <strong>{stats.stillWrong}</strong>
          </div>
        </div>
      </div>

      {/* ── Body layout ── */}
      <div className="revision-layout">

        {/* ── LEFT — Question panel ── */}
        <div className="revision-main">
          <div className="revision-question-card">

            {/* Header row */}
            <div className="revision-question-header">
              <div className="revision-question-badge">
                Q.{currentIdx + 1}
              </div>
              <div
                className="revision-question-text"
                dangerouslySetInnerHTML={{
                  __html: currentQ.question || currentQ.text || "",
                }}
              />
            </div>

            {/* Reason + level badges */}
            <div className="revision-reason-row">
              <span
                className={
                  originalReason === "wrong"
                    ? "revision-reason-badge revision-badge-wrong"
                    : "revision-reason-badge revision-badge-skipped"
                }
              >
                {originalReason === "wrong" ? "❌ Wrong" : "⏭ Skipped"}
              </span>
              {currentQ.difficulty && (
                <span className="revision-reason-badge">
                  {currentQ.difficulty}
                </span>
              )}
            </div>

            {/* Question image (if any) */}
            {currentQ.image && (
              <img
                src={currentQ.image}
                alt="Question illustration"
                className="revision-question-image"
              />
            )}

            {/* Options */}
            <div className="review-options">
              {options.map((option, idx) => {
                const isCorrectOpt = idx === correctIdx;
                const isRevisionSelected = revisionAnswer === idx;
                const hasAnswered =
                  revisionAnswer !== undefined && revisionAnswer !== null;

                let optClass = "review-option-card";
                if (hasAnswered && isCorrectOpt) {
                  optClass += " review-correct revision-correct-pulse";
                } else if (hasAnswered && isRevisionSelected && !isCorrectOpt) {
                  optClass += " review-wrong review-selected";
                } else if (!hasAnswered && isRevisionSelected) {
                  optClass += " review-selected";
                }

                return (
                  <div
                    key={idx}
                    className={optClass}
                    onClick={() =>
                      !hasAnswered ? selectOption(idx) : undefined
                    }
                    style={!hasAnswered ? { cursor: "pointer" } : {}}
                  >
                    <div className="review-option-label">
                      {String.fromCharCode(65 + idx)}.
                    </div>
                    <div className="review-option-text">{option}</div>
                    {hasAnswered && isCorrectOpt && (
                      <div className="revision-correct-tick">✓</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Original answer / correct answer info */}
            <div className="revision-feedback">
              {originalReason === "wrong" ? (
                <>
                  <strong>Original Attempt</strong>
                  <p>
                    Your original answer was{" "}
                    <strong>
                      {optionLetter(currentQ._originalAnswer) !== "—"
                        ? `Option ${optionLetter(currentQ._originalAnswer)}`
                        : "recorded as wrong"}
                    </strong>
                    . Correct answer is{" "}
                    <strong>Option {optionLetter(correctIdx)}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <strong>Not Attempted</strong>
                  <p>
                    You skipped this question. Correct answer is{" "}
                    <strong>Option {optionLetter(correctIdx)}</strong>.
                  </p>
                </>
              )}
            </div>

            {/* Revision feedback after answering */}
            {revisionStatus === "correct-after-revision" && (
              <div className="revision-feedback revision-feedback--correct">
                <strong>✅ Correct this time!</strong>
                <p>Great job — you answered this correctly on revision.</p>
              </div>
            )}
            {revisionStatus === "still-wrong" && (
              <div className="revision-feedback revision-feedback--wrong">
                <strong>❌ Still incorrect.</strong>
                <p>
                  You selected Option{" "}
                  {optionLetter(revisionAnswer)}. Correct answer is Option{" "}
                  {optionLetter(correctIdx)}.
                </p>
              </div>
            )}

            {/* Explanation */}
            {currentQ.explanation && (
              <div className="review-explanation">
                <h4>Explanation</h4>
                <p>{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="review-navigation">
              <button
                className="review-nav-btn"
                disabled={currentIdx === 0}
                onClick={handlePrev}
              >
                ← Previous
              </button>
              <div className="review-question-count">
                {currentIdx + 1} / {questions.length}
              </div>
              <button
                className="review-nav-btn"
                disabled={currentIdx === questions.length - 1}
                onClick={handleNext}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Palette navigator ── */}
        <div className="navigator">
          <h2 className="palette-title">Questions</h2>

          {/* Legend */}
          <div className="exam-legend">
            <div className="exam-legend-item">
              <div className="exam-legend-badge" style={{ background: "#dc2626", color: "#fff" }}>
                {stats.wrongCount}
              </div>
              <span>Wrong</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge" style={{ background: "#ca8a04", color: "#fff" }}>
                {stats.skippedCount}
              </div>
              <span>Skipped</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-answered">
                {stats.correctAfter}
              </div>
              <span>Corrected</span>
            </div>
            <div className="exam-legend-item">
              <div className="exam-legend-badge legend-notanswered">
                {stats.stillWrong}
              </div>
              <span>Still Wrong</span>
            </div>
          </div>

          {/* Palette grid */}
          <div className="palette-grid">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={paletteBtnClass(q, index, currentIdx, revisionAnswers)}
                onClick={() => setCurrentIdx(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Finish button */}
          <button
            className="submit-btn"
            style={{ marginTop: "1rem", width: "100%" }}
            onClick={() => setShowFinishModal(true)}
          >
            Finish Revision
          </button>

          <button
            className="exam-leave-btn"
            style={{ marginTop: "0.5rem", width: "100%" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
