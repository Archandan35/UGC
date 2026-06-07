import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getExam,
  getQuestionsByIds,
  saveResult,
  recordAttempt,
  fetchBookmarks,
  syncBookmarks,
  getCurrentUid,
  // Attempt-state helpers from data-layer (no raw localStorage in this hook)
  getAttemptKey,
  saveAttemptState,
  loadAttemptState,
  clearAttemptState,
  calcProgress,
} from "../data-layer";

export default function useExamEngine() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paperId    = searchParams.get("paperId")  || null;
  const language   = searchParams.get("language") || null;
  const pyqYearRaw = searchParams.get("pyqYear");
  const pyqYear    = pyqYearRaw ? Number(pyqYearRaw) : null;
  const mode       = searchParams.get("mode") || (pyqYear ? "pyq" : "mock");
  // "restart" → always fresh; "resume" → load saved state; default → fresh (safe default)
  const startMode  = searchParams.get("start") || "restart";

  const ATTEMPT_KEY = getAttemptKey(examId, paperId, pyqYear);

  const [questions,       setQuestions]       = useState([]);
  const [examData,        setExamData]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers,         setAnswers]         = useState({});
  const [visited,         setVisited]         = useState({});
  const [review,          setReview]          = useState({});
  const [bookmarks,       setBookmarks]       = useState({});
  const [timePerQuestion, setTimePerQuestion] = useState({});
  const [timeLeft,        setTimeLeft]        = useState(1800);
  const [cheatCount,      setCheatCount]      = useState(0);
  const [submitting,      setSubmitting]      = useState(false);
  const [showLeaveModal,  setShowLeaveModal]  = useState(false);

  // Prevent duplicate submissions even across re-renders / rapid clicks
  const submittedRef = useRef(false);

  const currentQ        = questions[currentQuestion] || null;
  const currentQIdRef   = useRef(null);
  currentQIdRef.current = currentQ?.id || null;

  // ── Fullscreen ───────────────────────────────────────────────
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
  }, []);

  // ── Cheat detection ──────────────────────────────────────────
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        setCheatCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            alert("Exam auto-submitted due to repeated tab switching.");
            submitExam(true);
          } else {
            alert(`Warning ${next}/3 : Tab switching detected`);
          }
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load exam ────────────────────────────────────────────────
  useEffect(() => {
    async function loadExam() {
      try {
        const exam = await getExam(examId);
        if (!exam) { setQuestions([]); return; }
        setExamData(exam);

        // Duration — support both `minutes` (legacy) and `duration` (current DB column)
        const durationMins = exam.minutes || exam.duration || 0;
        if (durationMins) setTimeLeft(durationMins * 60);

        const questionIds = exam.questionIds || exam.questions || [];
        let filtered = [];
        if (questionIds.length > 0) {
          const fetched = await getQuestionsByIds(questionIds);
          const byId = new Map(fetched.map((q) => [q.id, q]));
          filtered = questionIds.map((id) => byId.get(id)).filter(Boolean);
        }

        if (pyqYear) filtered = filtered.filter((q) => Number(q.pyqYear) === pyqYear);
        if (paperId) filtered = filtered.filter((q) => !q.paperId || q.paperId === paperId);
        if (language && language !== "bilingual")
          filtered = filtered.filter((q) => !q.language || q.language === language);

        setQuestions(filtered);

        // ── Resume vs Restart logic ──────────────────────────────
        // Only restore saved state when the student explicitly chose "Resume".
        // "restart" (or any other value) always starts a clean session.
        if (startMode === "resume") {
          const saved = loadAttemptState(ATTEMPT_KEY);
          if (saved) {
            setAnswers(saved.answers            || {});
            setReview(saved.review              || {});
            setVisited(saved.visited            || {});
            setBookmarks(saved.bookmarks        || {});
            setTimePerQuestion(saved.timePerQuestion || {});
            if (saved.timeLeft != null)        setTimeLeft(saved.timeLeft);
            if (saved.currentQuestion != null) setCurrentQuestion(saved.currentQuestion);
          } else if (filtered.length > 0) {
            setVisited({ [filtered[0].id]: true });
          }
        } else {
          // Fresh start — clear any stale attempt so the student sees Q1 with no answers
          clearAttemptState(ATTEMPT_KEY);
          if (filtered.length > 0) {
            setVisited({ [filtered[0].id]: true });
          }
        }

        // Merge remote bookmarks (read-only merge, never clobbers local selections)
        const uid = getCurrentUid();
        if (uid) {
          const remote = await fetchBookmarks(uid);
          if (Object.keys(remote).length) {
            setBookmarks((prev) => {
              const merged = { ...prev };
              Object.keys(remote).forEach((qid) => {
                if (merged[qid] === undefined) merged[qid] = true;
              });
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("loadExam failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, paperId, language, pyqYear, startMode]);

  // ── Auto-save attempt state ──────────────────────────────────
  useEffect(() => {
    if (loading || questions.length === 0) return;
    saveAttemptState(ATTEMPT_KEY, {
      examId,
      answers,
      review,
      visited,
      bookmarks,
      timePerQuestion,
      timeLeft,
      currentQuestion,
      progress: calcProgress(answers, questions.length),
    });
  }, [
    answers, review, visited, bookmarks,
    timePerQuestion, timeLeft, currentQuestion,
    loading, questions, ATTEMPT_KEY, examId,
  ]);

  // ── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      const qid = currentQIdRef.current;
      if (qid) {
        setTimePerQuestion((prev) => ({ ...prev, [qid]: (prev[qid] || 0) + 1 }));
      }
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); submitExam(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Helpers ──────────────────────────────────────────────────
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function selectOption(index) {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: index }));
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      const next = currentQuestion + 1;
      setCurrentQuestion(next);
      setVisited((prev) => ({ ...prev, [questions[next].id]: true }));
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  }

  function goTo(index) {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
      setVisited((prev) => ({ ...prev, [questions[index].id]: true }));
    }
  }

  function clearResponse() {
    if (!currentQ) return;
    setAnswers((prev) => { const u = { ...prev }; delete u[currentQ.id]; return u; });
  }

  function toggleReview() {
    if (!currentQ) return;
    setReview((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  }

  function toggleBookmark() {
    if (!currentQ) return;
    setBookmarks((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  }

  // ── Submit exam ──────────────────────────────────────────────
  async function submitExam(isAuto = false) {
    // Double-guard: both state flag and ref to survive rapid re-renders
    if (submitting || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const map = { A: 0, B: 1, C: 2, D: 3 };
    let correct = 0, wrong = 0, unattempted = 0;

    questions.forEach((q) => {
      const userAns = answers[q.id];
      const correctIndex =
        typeof q.correctAnswer === "number" ? q.correctAnswer : (map[q.correctAnswer] ?? 0);
      if (userAns === undefined)        unattempted += 1;
      else if (userAns === correctIndex) correct     += 1;
      else                               wrong       += 1;
    });

    const score      = correct * 4 - wrong * 1;
    const totalMarks = questions.length * 4;
    const accuracy   = correct + wrong > 0
      ? Math.round((correct / (correct + wrong)) * 100)
      : 0;
    const scorePct   = totalMarks > 0
      ? Math.round((Math.max(score, 0) / totalMarks) * 100)
      : 0;

    const resultData = {
      examId, paperId, language, pyqYear, mode,
      score, totalMarks,
      correct, wrong,
      unanswered: unattempted,
      unattempted,
      accuracy,
      answers,
      questions,
      timePerQuestion,
      submittedAt: new Date().toISOString(),
    };

    try {
      const uid = getCurrentUid();
      const savedId = await saveResult(resultData);
      if (savedId) resultData.id = savedId;

      if (uid) {
        await syncBookmarks(uid, bookmarks, questions);
        await recordAttempt({ uid, scorePct, questionCount: questions.length });
      }

      // Clear saved attempt — exam is done, no resume needed
      clearAttemptState(ATTEMPT_KEY);

      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

      // Always navigate to Result Page — fixes Issue 1
      navigate("/result", { state: resultData });
    } catch (err) {
      console.error("submitExam failed:", err);
      // Allow retry on error
      submittedRef.current = false;
      setSubmitting(false);
    }
  }

  // ── Save state and leave (Issue 3 leave action) ──────────────
  const handleSaveAndLeave = useCallback(() => {
    // Flush current state immediately before navigation
    saveAttemptState(ATTEMPT_KEY, {
      examId,
      answers,
      review,
      visited,
      bookmarks,
      timePerQuestion,
      timeLeft,
      currentQuestion,
      progress: calcProgress(answers, questions.length),
    });
    setShowLeaveModal(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate("/dashboard");
  }, [
    ATTEMPT_KEY, examId, answers, review, visited, bookmarks,
    timePerQuestion, timeLeft, currentQuestion, questions, navigate,
  ]);

  const selectedOpt = currentQ ? answers[currentQ.id] : undefined;

  return {
    loading, submitting, questions, examData, mode, pyqYear, paperId, language,
    currentQuestion, setCurrentQuestion, answers, visited, review, bookmarks,
    timePerQuestion, currentQ, selectedOpt, selectOption, handleNext, handlePrev,
    goTo, clearResponse, toggleReview, toggleBookmark, submitExam,
    timeLeft, cheatCount, formatTime, setVisited,
    // Leave-modal controls
    showLeaveModal, setShowLeaveModal, handleSaveAndLeave,
  };
}
