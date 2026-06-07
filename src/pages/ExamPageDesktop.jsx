import useExamEngine from "../hooks/useExamEngine";

/**
 * ExamPageDesktop — exact same classes & structure as old ExamPageDesktop.jsx.
 * Uses new useExamEngine hook (no firebase / no old functions).
 */
export default function ExamPageDesktop() {
  const {
    loading,
    questions,
    examData,
    currentQuestion,
    setCurrentQuestion,
    answers,
    visited,
    review,
    bookmarks,
    currentQ,
    selectedOpt,
    selectOption,
    handleNext,
    handlePrev,
    clearResponse,
    toggleReview,
    toggleBookmark,
    submitExam,
    timeLeft,
    cheatCount,
    formatTime,
    setVisited,
  } = useExamEngine();

  if (loading) {
    return (
      <div className="page">
        <h2>Loading Exam...</h2>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="page">
        <h2>No Questions Found!</h2>
      </div>
    );
  }

  const options =
    currentQ.options ||
    [currentQ.optionA, currentQ.optionB, currentQ.optionC, currentQ.optionD].filter(Boolean);

  return (
    <div className="exam-layout">

      {/* ── LEFT ── */}
      <div className="exam-main">

        {/* Topbar */}
        <div className="topbar">
          <div>
            <h2>{examData?.name || examData?.title || "Mock Test"}</h2>
            <p>{examData?.mockType || examData?.type || "Full"}</p>
          </div>
          <div className="topbar-right">
            <h2>⏳ {formatTime(timeLeft)}</h2>
            <p>Warnings: {cheatCount ?? 0}/3</p>
          </div>
        </div>

        {/* Question card */}
        <div className="question-card">

          {/* Number badge + question text */}
          <div className="question-header-row">
            <div className="question-number-box">
              Q.{currentQuestion + 1}
            </div>
            <div
              className="question-text-main"
              dangerouslySetInnerHTML={{
                __html: currentQ.question || currentQ.text || "",
              }}
            />
          </div>

          {/* Options */}
          <div className="options-list">
            {options.map((option, idx) => (
              <label
                key={idx}
                className={selectedOpt === idx ? "selected-option" : "option-card"}
              >
                <input
                  type="radio"
                  className="option-radio"
                  checked={selectedOpt === idx}
                  onChange={() => selectOption(idx)}
                />
                <div className="option-text">
                  <div className="option-label-box">
                    {String.fromCharCode(65 + idx)}.
                  </div>
                  <div className="option-value">{option}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Action buttons */}
          <div className="exam-buttons">
            <button onClick={handlePrev} disabled={currentQuestion === 0}>
              Previous
            </button>
            <button onClick={toggleReview}>
              {review[currentQ.id] ? "Unmark Review" : "Mark Review"}
            </button>
            <button onClick={toggleBookmark}>
              {bookmarks[currentQ.id] ? "★ Bookmarked" : "☆ Bookmark"}
            </button>
            <button onClick={clearResponse}>
              Clear Response
            </button>
            <button onClick={handleNext} disabled={currentQuestion === questions.length - 1}>
              Save &amp; Next
            </button>
            <button
              className="submit-btn"
              onClick={() => {
                if (window.confirm("Submit the exam now?")) submitExam(false);
              }}
            >
              Submit
            </button>
          </div>

        </div>
      </div>

      {/* ── RIGHT — Navigator ── */}
      <div className="navigator">

        <h2 className="palette-title">Questions</h2>

        {/* Legend */}
        <div className="exam-legend">
          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-answered">
              {Object.keys(answers).length}
            </div>
            <span>Answered</span>
          </div>
          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-marked">
              {Object.keys(review).filter((id) => review[id]).length}
            </div>
            <span>Marked</span>
          </div>
          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-notanswered">
              {questions.filter((q) => visited[q.id] && answers[q.id] === undefined).length}
            </div>
            <span>Not Answered</span>
          </div>
          <div className="exam-legend-item">
            <div className="exam-legend-badge legend-notvisited">
              {questions.filter((q) => !visited[q.id]).length}
            </div>
            <span>Not Visited</span>
          </div>
        </div>

        {/* Palette grid */}
        <div className="palette-grid">
          {questions.map((q, index) => {
            const answered  = answers[q.id] !== undefined;
            const marked    = !!review[q.id];
            const isVisited = !!visited[q.id];

            let btnClass = "palette-btn";
            if (marked && answered)  btnClass += " marked-answered";
            else if (marked)         btnClass += " marked";
            else if (answered)       btnClass += " answered";
            else if (isVisited)      btnClass += " not-answered";
            else                     btnClass += " not-visited";

            if (currentQuestion === index) btnClass += " current";

            return (
              <button
                key={q.id}
                className={btnClass}
                onClick={() => {
                  setCurrentQuestion(index);
                  setVisited((prev) => ({ ...prev, [q.id]: true }));
                }}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
