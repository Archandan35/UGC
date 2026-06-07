import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getRevisionPool } from "../lib/revision";
import TopNav from "../components/TopNav";

// ─── helpers ────────────────────────────────────────────────────────────────

const ANSWER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function correctIndex(q) {
  if (typeof q?.correctAnswer === "number") return q.correctAnswer;
  if (typeof q?.correct_answer === "number") return q.correct_answer;
  const raw = q?.correctAnswer ?? q?.correct_answer ?? q?.answer;
  if (typeof raw === "string") {
    const key = raw.trim().toUpperCase();
    if (key in ANSWER_INDEX) return ANSWER_INDEX[key];
    const asNum = Number(key);
    if (Number.isFinite(asNum)) return asNum;
  }
  return 0;
}

function optionClassName(question, index, selected, revealed) {
  if (!revealed) return `ep-option${selected === index ? " ep-option--selected" : ""}`;
  const correct = correctIndex(question);
  if (index === correct) return "ep-option ep-option--correct";
  if (selected === index && index !== correct) return "ep-option ep-option--wrong";
  return "ep-option";
}

// ─── component ───────────────────────────────────────────────────────────────

export default function RevisionPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState({ questions: [], stats: null });
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }

    let cancelled = false;
    setIsLoading(true);

    getRevisionPool(user.id)
      .then((result) => { if (!cancelled) setData(result); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  // ── derived state ──────────────────────────────────────────────────────────

  const questions = data.questions || [];
  const question  = questions[current];
  const selected  = question ? answers[question.id] : undefined;
  const isRevealed = question ? !!revealed[question.id] : false;
  const solved    = isRevealed && selected === correctIndex(question);
  const completed = questions.filter(
    (q) => revealed[q.id] && answers[q.id] === correctIndex(q)
  ).length;

  // ── handlers ──────────────────────────────────────────────────────────────

  function selectOption(id, index) {
    setAnswers((prev) => ({ ...prev, [id]: index }));
    setRevealed((prev) => ({ ...prev, [id]: false }));
  }

  function toggleReveal(id) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function reattempt(id) {
    setAnswers((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setRevealed((prev) => ({ ...prev, [id]: false }));
  }

  // ── loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="page">
        <TopNav />
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <TopNav />

      {/* ── header ── */}
      <div className="revision-header">
        <div>
          <h2>Revision Mode</h2>
          <p>Wrong and skipped questions from your attempts. Reattempt them until you get them right.</p>
        </div>
        <div className="revision-stats">
          <div className="stat-chip">
            <span>Queue</span>
            <strong>{questions.length}</strong>
          </div>
          <div className="stat-chip">
            <span>Solved</span>
            <strong>{completed}</strong>
          </div>
          <div className="stat-chip">
            <span>Attempts</span>
            <strong>{data.stats?.attempts || 0}</strong>
          </div>
        </div>
      </div>

      {/* ── empty state ── */}
      {questions.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing to revise yet</h3>
          <p>Take a few mock exams. Wrong and skipped questions will show up here.</p>
          <button className="btn-primary" onClick={() => navigate("/exams")}>
            Browse Exams
          </button>
        </div>
      ) : (
        /* ── exam body ── */
        <div className="ep-body">

          {/* ── main panel ── */}
          <main className="ep-main">

            {/* question meta row */}
            <div className="exam-question-header">
              <div className="exam-q-label">
                <span className="exam-q-badge">Q{current + 1}</span>
                <span className="exam-q-count">{current + 1} / {questions.length}</span>
              </div>
              <span className={`badge-soft ${question._reason === "wrong" ? "badge-danger" : "badge-warning"}`}>
                {question._reason === "wrong" ? "Previously wrong" : "Skipped"}
              </span>
            </div>

            {/* question text */}
            <div className="ep-question-wrap">
              <span className="ep-q-badge">{current + 1}</span>
              <div
                className="ep-question-text"
                dangerouslySetInnerHTML={{ __html: question.question || "" }}
              />
            </div>

            {/* options */}
            <div className="ep-options">
              {(question.options || []).map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={optionClassName(question, index, selected, isRevealed)}
                  onClick={() => selectOption(question.id, index)}
                >
                  <span className="ep-option-radio">
                    <span className={selected === index ? "ep-radio-filled" : "ep-radio-empty"} />
                  </span>
                  <span className="ep-option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="ep-option-text">{option}</span>
                </button>
              ))}
            </div>

            {/* feedback banner */}
            {isRevealed && (
              <div className={`revision-feedback ${solved ? "revision-feedback--correct" : "revision-feedback--wrong"}`}>
                <strong>{solved ? "Correct. Nice recovery." : "Not quite. Check the correct answer and try again."}</strong>
                {question.explanation && <p>{question.explanation}</p>}
              </div>
            )}

            {/* action bar */}
            <div className="ep-action-bar">
              <button
                className="ep-btn ep-btn-outline"
                disabled={current === 0}
                onClick={() => setCurrent((v) => Math.max(0, v - 1))}
              >
                Previous
              </button>
              <button
                className="ep-btn ep-btn-outline"
                disabled={selected === undefined}
                onClick={() => toggleReveal(question.id)}
              >
                {isRevealed ? "Hide Answer" : "Check Answer"}
              </button>
              <button
                className="ep-btn ep-btn-outline"
                onClick={() => reattempt(question.id)}
              >
                Reattempt
              </button>
              <button
                className="ep-btn ep-btn-submit"
                disabled={current === questions.length - 1}
                onClick={() => setCurrent((v) => Math.min(questions.length - 1, v + 1))}
              >
                Next
              </button>
            </div>
          </main>

          {/* ── aside / question palette ── */}
          <aside className="ep-aside">
            <h3 className="ep-aside-title">Question Palette</h3>

            <div className="ep-legend">
              <div className="ep-legend-item">
                <span className="ep-legend-badge ep-badge-answered">1</span>
                <span className="ep-legend-label">Solved</span>
              </div>
              <div className="ep-legend-item">
                <span className="ep-legend-badge ep-badge-not-answered">1</span>
                <span className="ep-legend-label">Tried</span>
              </div>
              <div className="ep-legend-item">
                <span className="ep-legend-badge ep-badge-not-visited">1</span>
                <span className="ep-legend-label">Pending</span>
              </div>
              <div className="ep-legend-item">
                <span className="ep-legend-badge ep-badge-marked">1</span>
                <span className="ep-legend-label">Current</span>
              </div>
            </div>

            <div className="ep-qgrid">
              {questions.map((q, index) => {
                const answered = answers[q.id] !== undefined;
                const right    = revealed[q.id] && answers[q.id] === correctIndex(q);
                const cellCls  = [
                  "ep-qcell",
                  right ? "ep-qcell--answered" : answered ? "ep-qcell--not-answered" : "ep-qcell--unvisited",
                  current === index ? "ep-qcell--current" : "",
                ].join(" ").trim();

                return (
                  <button
                    key={q.id}
                    type="button"
                    className={cellCls}
                    onClick={() => setCurrent(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </aside>

        </div>
      )}
    </div>
  );
}
