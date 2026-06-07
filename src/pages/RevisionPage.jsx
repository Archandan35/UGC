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
  return 0;
}

export default function RevisionPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pool, setPool] = useState({ questions: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    let cancelled = false;
    setLoading(true);
    getRevisionPool(user.id)
      .then((data) => {
        if (!cancelled) setPool(data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  if (loading) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      </div>
    );
  }

  const questions = pool.questions || [];
  const q = questions[current];

  return (
    <div className="page">
      <TopNavbar />
      <div className="revision-header">
        <div>
          <h2>Revision Mode</h2>
          <p>Questions you got wrong or skipped — practice them till you nail them.</p>
        </div>
        <div className="revision-stats">
          <div className="stat-chip"><span>Queue</span><strong>{questions.length}</strong></div>
          <div className="stat-chip"><span>Attempts</span><strong>{pool.stats?.attempts || 0}</strong></div>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing to revise yet 🎉</h3>
          <p>Take a few mock exams and any wrong answers will show up here.</p>
          <button className="btn-primary" onClick={() => navigate("/exams")}>Browse Exams</button>
        </div>
      ) : (
        <div className="revision-card">
          <div className="revision-progress-bar">
            <div className="revision-progress-fill" data-pct={Math.round(((current + 1) / questions.length) * 100)} />
          </div>
          <div className="revision-question-meta">
            <span className="badge-soft">Question {current + 1} / {questions.length}</span>
            <span className={`badge-soft ${q._reason === "wrong" ? "badge-danger" : "badge-warning"}`}>
              {q._reason === "wrong" ? "Previously wrong" : "Skipped"}
            </span>
          </div>
          <h3 className="revision-question-text" dangerouslySetInnerHTML={{ __html: q.question || "" }} />
          <div className="revision-options">
            {(q.options || []).map((opt, i) => {
              const isCorrect = i === correctIndexOf(q);
              const show = revealed[q.id];
              return (
                <div
                  key={i}
                  className={`revision-option ${show && isCorrect ? "revision-option-correct" : ""}`}
                >
                  <span className="revision-option-label">{String.fromCharCode(65 + i)}</span>
                  <span className="revision-option-text">{opt}</span>
                </div>
              );
            })}
          </div>

          {revealed[q.id] && q.explanation && (
            <div className="revision-explanation">
              <h4>Explanation</h4>
              <p>{q.explanation}</p>
            </div>
          )}

          <div className="revision-controls">
            <button
              className="btn-secondary"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            >
              ← Previous
            </button>
            <button
              className="btn-primary"
              onClick={() => setRevealed((r) => ({ ...r, [q.id]: !r[q.id] }))}
            >
              {revealed[q.id] ? "Hide Answer" : "Reveal Answer"}
            </button>
            <button
              className="btn-secondary"
              disabled={current === questions.length - 1}
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
