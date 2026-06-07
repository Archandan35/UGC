import useGamification from "../hooks/useGamification";
import { BADGE_CATALOG } from "../data-layer";

/**
 * Compact streak + badges strip for the student dashboard / profile.
 * Uses existing globals.css glass-card styling.
 */
export default function StreakBadges() {
  const { gamification, loading } = useGamification();

  if (loading) return null;

  const streak = gamification?.currentStreak || 0;
  const longest = gamification?.longestStreak || 0;
  const attempts = gamification?.totalAttempts || 0;
  const best = gamification?.bestScorePct || 0;
  const earned = gamification?.badges || [];

  return (
    <div className="glass-card streak-strip" style={{ marginBottom: "1rem" }}>
      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-num">🔥 {streak}</span>
          <span className="streak-label">Day streak</span>
        </div>
        <div className="streak-stat">
          <span className="streak-num">🏅 {longest}</span>
          <span className="streak-label">Best streak</span>
        </div>
        <div className="streak-stat">
          <span className="streak-num">📝 {attempts}</span>
          <span className="streak-label">Mocks done</span>
        </div>
        <div className="streak-stat">
          <span className="streak-num">💯 {best}%</span>
          <span className="streak-label">Best score</span>
        </div>
      </div>

      <div className="badge-row">
        {Object.entries(BADGE_CATALOG).map(([key, b]) => {
          const has = earned.includes(key);
          return (
            <div
              key={key}
              className={`badge-chip ${has ? "earned" : "locked"}`}
              title={`${b.label} — ${b.desc}`}
            >
              <span className="badge-icon">{b.icon}</span>
              <span className="badge-name">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
