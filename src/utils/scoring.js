/**
 * scoring.js — Centralised scoring rules (configurable per exam in future).
 */
const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };

function correctIndexOf(q) {
  if (typeof q.correctAnswer === "number") return q.correctAnswer;
  if (typeof q.correctAnswer === "string") {
    return ANSWER_MAP[q.correctAnswer.trim().toUpperCase()] ?? 0;
  }
  return 0;
}

export function scoreExam(questions, answers, { marksPerQuestion = 1, negativeMark = 0.25 } = {}) {
  let correct = 0, wrong = 0, unattempted = 0;
  for (const q of questions || []) {
    const a = answers?.[q.id];
    if (a === undefined || a === null) { unattempted++; continue; }
    if (a === correctIndexOf(q)) correct++;
    else wrong++;
  }
  const score = Number((correct * marksPerQuestion - wrong * negativeMark).toFixed(2));
  const total = (questions?.length || 0) * marksPerQuestion;
  const accuracy = questions?.length ? Math.round((correct / questions.length) * 100) : 0;
  return { correct, wrong, unattempted, score, total, accuracy };
}
