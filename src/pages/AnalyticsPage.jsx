import { useEffect, useMemo, useState } from "react";
import { getResultsFiltered, getUsers, getQuestions } from "../data-layer";
import AdminSidebar from "../components/AdminSidebar";
import TopNavbar from "../components/TopNavbar";
import { LineTrend, BarBreakdown, DonutShare } from "../components/analytics/Charts";

/**
 * Analytics dashboard.
 *
 * Reads the most recent 500 `results` docs (ordered by createdAt desc)
 * and the `users` summary data ONCE. The page is
 * intentionally read-only and uses server-side ordering + limit so the
 * Database cost stays bounded as the data grows.
 */
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [totals, setTotals] = useState({ users: 0, proUsers: 0, questions: 0 });
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const since = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
        const [resultsData, usersData, questionsData] = await Promise.all([
          getResultsFiltered({ since, max: 500 }),
          getUsers(),
          getQuestions(),
        ]);

        if (cancelled) return;

        setResults(resultsData);
        const proUsers = usersData.filter((u) => u.isPro).length;
        setTotals({
          users: usersData.length,
          proUsers,
          questions: questionsData.length > 0 ? "—" : 0,
        });
      } catch (err) {
        console.error("[AnalyticsPage] load failed", err);
        if (!cancelled) setError(err.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [rangeDays]);

  /* ─────────────── Derived datasets ─────────────── */

  const dailyExams = useMemo(() => {
    const buckets = new Map();
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    results.forEach((r) => {
      const ts = r.createdAt || r.submittedAt;
      if (!ts) return;
      const key = new Date(ts).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({
      label: label.slice(5),
      value,
    }));
  }, [results, rangeDays]);

  const subjectBreakdown = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      const s = r.subject || r.examSubject || "Other";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [results]);

  const passFailDist = useMemo(() => {
    let pass = 0;
    let fail = 0;
    results.forEach((r) => {
      const pct =
        typeof r.percentage === "number"
          ? r.percentage
          : r.score && r.total
          ? (r.score / r.total) * 100
          : null;
      if (pct == null) return;
      if (pct >= 40) pass++;
      else fail++;
    });
    return [
      { label: "Pass (≥40%)", value: pass },
      { label: "Fail (<40%)", value: fail },
    ];
  }, [results]);

  const avgScore = useMemo(() => {
    const scored = results
      .map((r) =>
        typeof r.percentage === "number"
          ? r.percentage
          : r.score && r.total
          ? (r.score / r.total) * 100
          : null
      )
      .filter((v) => v != null);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  }, [results]);

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <TopNavbar />
        <div className="page analytics-page">
          <header className="analytics-header">
            <div>
              <h1>Analytics</h1>
              <p className="muted">
                Last {rangeDays} days · {results.length} exam attempts
              </p>
            </div>
            <div className="analytics-range">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  className={`chip ${rangeDays === d ? "chip--active" : ""}`}
                  onClick={() => setRangeDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </header>

          {error && (
            <div className="card card--error">
              <strong>Could not load analytics.</strong>
              <p>{error}</p>
            </div>
          )}

          <section className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Total users</span>
              <span className="stat-card__value">{totals.users}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Pro subscribers</span>
              <span className="stat-card__value">{totals.proUsers}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Exam attempts</span>
              <span className="stat-card__value">{results.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Average score</span>
              <span className="stat-card__value">{avgScore}%</span>
            </div>
          </section>

          <section className="analytics-row">
            <div className="card">
              <h3>Daily exam attempts</h3>
              {loading ? (
                <div className="skeleton skeleton--chart" />
              ) : (
                <LineTrend data={dailyExams} label="Attempts" />
              )}
            </div>
            <div className="card">
              <h3>Pass / Fail distribution</h3>
              {loading ? (
                <div className="skeleton skeleton--chart" />
              ) : (
                <DonutShare data={passFailDist} />
              )}
            </div>
          </section>

          <section className="card">
            <h3>Attempts by subject (top 8)</h3>
            {loading ? (
              <div className="skeleton skeleton--chart" />
            ) : (
              <BarBreakdown data={subjectBreakdown} label="Attempts" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
