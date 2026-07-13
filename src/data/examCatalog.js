/**
 * examCatalog.js — Multi-exam schema.
 *
 * The platform now supports many exams, each with one or more papers,
 * a language, and (for PYQ banks) a year. Every question / mock / result
 * carries these keys so content can be filtered precisely:
 *
 *   examId   — stable exam slug (e.g. "ugc-net-odia")
 *   paperId  — paper within the exam (e.g. "paper-2")
 *   language — "odia" | "english" | "bilingual"
 *   pyqYear  — number for Previous-Year-Question sets, else null
 *
 * This file is the source of truth for the catalog UI. Actual questions live
 * in the questions table filtered by { examId, paperId, language, pyqYear }.
 */

export const LANGUAGES = ["odia", "english", "bilingual"];

export const EXAM_CATALOG = [
  {
    examId: "ugc-net-odia",
    name: "UGC NET — Odia",
    short: "UGC NET Odia",
    authority: "UGC / NTA",
    description: "Paper 1 (Teaching & Research Aptitude) + Paper 2 (Odia subject).",
    languages: ["odia", "english", "bilingual"],
    isFree: true,
    papers: [
      { paperId: "paper-1", name: "Paper 1 — Teaching & Research Aptitude", questions: 50, minutes: 60 },
      { paperId: "paper-2", name: "Paper 2 — Odia", questions: 100, minutes: 120 },
    ],
    pyqYears: [2024, 2023, 2022, 2021, 2020],
  },
  {
    examId: "opsc-oas",
    name: "OPSC — OAS (Odisha Civil Services)",
    short: "OPSC OAS",
    authority: "Odisha PSC",
    description: "Prelims GS + CSAT for the Odisha Administrative Service.",
    languages: ["english", "bilingual"],
    isFree: false,
    papers: [
      { paperId: "prelims-gs", name: "Prelims — General Studies", questions: 100, minutes: 120 },
      { paperId: "prelims-csat", name: "Prelims — CSAT", questions: 80, minutes: 120 },
    ],
    pyqYears: [2023, 2022, 2021],
  },
  {
    examId: "bed-cet",
    name: "Odisha B.Ed CET",
    short: "B.Ed CET",
    authority: "SCERT Odisha",
    description: "Common Entrance Test for B.Ed admission in Odisha.",
    languages: ["odia", "english", "bilingual"],
    isFree: false,
    papers: [
      { paperId: "cet", name: "B.Ed CET — Full Paper", questions: 100, minutes: 120 },
    ],
    pyqYears: [2024, 2023],
  },
  {
    examId: "otet",
    name: "OTET (Odisha Teacher Eligibility Test)",
    short: "OTET",
    authority: "BSE Odisha",
    description: "Paper I (Class I–V) and Paper II (Class VI–VIII).",
    languages: ["odia", "english", "bilingual"],
    isFree: false,
    papers: [
      { paperId: "paper-1", name: "OTET Paper I", questions: 150, minutes: 150 },
      { paperId: "paper-2", name: "OTET Paper II", questions: 150, minutes: 150 },
    ],
    pyqYears: [2023, 2022],
  },
];

export function getExam(examId) {
  return EXAM_CATALOG.find((e) => e.examId === examId) || null;
}

export function getPaper(examId, paperId) {
  return getExam(examId)?.papers.find((p) => p.paperId === paperId) || null;
}

/** Build a filter object for questions/mocks queries. */
export function buildContentFilter({ examId, paperId, language, pyqYear } = {}) {
  const f = {};
  if (examId) f.examId = examId;
  if (paperId) f.paperId = paperId;
  if (language) f.language = language;
  if (pyqYear) f.pyqYear = Number(pyqYear);
  return f;
}
