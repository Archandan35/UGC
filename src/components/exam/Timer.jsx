import { useEffect, useState } from "react";
import { formatHMS } from "../../utils/timer";

export default function Timer({ seconds = 0, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return undefined; }
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [left, onExpire]);

  const danger = left < 60;
  return (
    <div className={`exam-timer ${danger ? "exam-timer-danger" : ""}`} aria-live="polite">
      ⏱ {formatHMS(left)}
    </div>
  );
}
