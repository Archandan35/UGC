export default function ProgressBar({ value = 0, max = 100 }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <div className="progress-bar-fill" data-pct={pct} />
    </div>
  );
}
