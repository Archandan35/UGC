import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNavbar from "../components/TopNavbar";
import { useAuth } from "../context/AuthContext";
import { getRevisionPool } from "../data-layer";

const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };

function correctIndexOf(q) {
  if (typeof q.correctAnswer === "number") return q.correctAnswer;
  if (typeof q.correctAnswer === "string") {
    return ANSWER_MAP[q.correctAnswer.trim().toUpperCase()] ?? 0;
  }
  if (typeof q.answer === "string") {
    return ANSWER_MAP[q.answer.trim().toUpperCase()] ?? 0;
  }
  return 0;
}

export default function RevisionPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pool, setPool] = useState({ questions: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const uid = user.id || user.uid;
    if (!uid) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    getRevisionPool(uid)
      .then((data) => {
        if (!cancelled) setPool(data);
      })
      .catch(err => console.error("[RevisionPage] error:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      </div>
    );
  }

  const questions = pool.questions || [];
  const wrongCount = questions.filter(q => q._reason === "wrong").length;
  const skippedCount = questions.filter(q => q._reason === "unattempted").length;

  if (questions.length === 0) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="revision-topbar">
          <div>
            <h2>Revision Mode</h2>
            <p>Questions you got wrong or skipped — practice them till you nail them.</p>
          </div>
          <div className="revision-topbar-stats">
            <div className="revision-stat-chip"><span>Queue</span><strong>0</strong></div>
            <div className="revision-stat-chip"><span>Attempts</span><strong>{pool.stats?.attempts || 0}</strong></div>
          </div>
        </div>
        <div className="revision-empty-state">
          <h3>Nothing to revise yet 🎉</h3>
          <p>Take a few mock exams and any wrong answers will show up here.</p>
          <button className="btn-primary" onClick={() => navigate("/exams")}>Browse Exams</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const correctIdx = correctIndexOf(q);

  return (
    <div className="page">
      <TopNavbar />

      {/* ── Top bar ── */}
      <div className="revision-topbar">
        <div>
          <h2>Revision Mode</h2>
          <p>Questions you got wrong or skipped — practice them till you nail them.</p>
        </div>
        <div className="revision-topbar-stats">
          <div className="revision-stat-chip"><span>Queue</span><strong>{questions.length}</strong></div>
          <div className="revision-stat-chip"><span>Wrong</span><strong>{wrongCount}</strong></div>
          <div className="revision-stat-chip"><span>Skipped</span><strong>{skippedCount}</strong></div>
          <div className="revision-stat-chip"><span>Attempts</span><strong>{pool.stats?.attempts || 0}</strong></div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="revision-layout">

        {/* ── Question panel (left) ── */}
        <div className="revision-main">
          <div className="revision-question-card">

            {/* Question header */}
            <div className="revision-question-header">
              <div className="revision-question-badge">Q.{current + 1}</div>
              <div
                className="revision-question-text"
                dangerouslySetInnerHTML={{ __html: q.question || "" }}
              />
            </div>

            {/* Reason badge */}
            <div className="revision-reason-row">
              <span className={`revision-reason-badge ${q._reason === "wrong" ? "revision-badge-wrong" : "revision-badge-skipped"}`}>
                {q._reason === "wrong" ? "Previously Wrong" : "Previously Skipped"}
              </span>
              {q.difficulty && (
                <span className={`revision-reason-badge revision-badge-level ${
                  q.difficulty === "Easy" ? "level-easy"
                  : q.difficulty === "Medium" ? "level-medium"
                  : "level-hard"
                }`}>
                  {q.difficulty}
                </span>
              )}
            </div>

            {/* Options — always show correct answer highlighted */}
            <div className="review-options">
              {(q.options || []).map((opt, i) => {
                const isCorrectOpt = i === correctIdx;
                return (
                  <div
                    key={i}
                    className={`review-option-card ${isCorrectOpt ? "review-correct revision-correct-pulse" : ""}`}
                  >
                    <div className="review-option-label">{String.fromCharCode(65 + i)}.</div>
                    <div className="review-option-text">{opt}</div>
                    {isCorrectOpt && (
                      <div className="revision-correct-tick">✓</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {q.explanation && (
              <div className="review-explanation">
                <h4>Explanation</h4>
                <p>{q.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="review-navigation">
              <button
                className="review-nav-btn"
                disabled={current === 0}
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
              >
                ← Previous
              </button>
              <div className="review-question-count">
                {current + 1} / {questions.length}
              </div>
              <button
                className="review-nav-btn"
                disabled={current === questions.length - 1}
                onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar palette (right) ── */}
        <div className="review-sidebar">
          <h3>Questions</h3>

          {/* Legend */}
          <div className="review-legend">
            <div className="review-legend-item">
              <span className="review-legend-counter wrong">{wrongCount}</span>
              Wrong
            </div>
            <div className="review-legend-item">
              <span className="review-legend-counter not-visited">{skippedCount}</span>
              Skipped
            </div>
          </div>

          {/* Palette grid */}
          <div className="review-palette">
            {questions.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => setCurrent(index)}
                className={`review-palette-btn ${
                  item._reason === "wrong"
                    ? "review-palette-wrong"
                    : "revision-palette-skipped"
                } ${current === index ? "review-current" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
