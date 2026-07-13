export default function QuestionNavigator({ questions = [], current = 0, statusOf, onJump }) {
  return (
    <div className="review-palette">
      {questions.map((q, i) => {
        const s = statusOf ? statusOf(q, i) : "not-visited";
        return (
          <button
            key={q.id || i}
            onClick={() => onJump?.(i)}
            className={`review-palette-btn ${s === "correct" ? "review-palette-correct" : ""} ${
              s === "wrong" ? "review-palette-wrong" : ""
            } ${s === "review" ? "review-palette-review" : ""} ${
              s === "not-visited" ? "review-palette-not-visited" : ""
            } ${current === i ? "review-current" : ""}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
