import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getExam,
  getQuestionsByIds,
  saveResult,
  recordAttempt,
  fetchBookmarks,
  syncBookmarks,
  getCurrentUid,
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

  const STORAGE_KEY = `exam_${examId}_${paperId || "all"}_${pyqYear || "x"}`;

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

  const currentQ        = questions[currentQuestion] || null;
  const currentQIdRef   = useRef(null);
  currentQIdRef.current = currentQ?.id || null;

  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
  }, []);

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

  useEffect(() => {
    async function loadExam() {
      try {
        const exam = await getExam(examId);
        if (!exam) { setQuestions([]); return; }
        setExamData(exam);
        if (exam.minutes) setTimeLeft(exam.minutes * 60);

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

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          setReview(parsed.review || {});
          setVisited(parsed.visited || {});
          setBookmarks(parsed.bookmarks || {});
          setTimePerQuestion(parsed.timePerQuestion || {});
          if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft);
        } else if (filtered.length > 0) {
          setVisited({ [filtered[0].id]: true });
        }

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
  }, [examId, paperId, language, pyqYear]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ answers, review, visited, bookmarks, timePerQuestion, timeLeft })
    );
  }, [answers, review, visited, bookmarks, timePerQuestion, timeLeft, loading, questions, STORAGE_KEY]);

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

  async function submitExam(isAuto = false) {
    if (submitting) return;
    setSubmitting(true);

    const map = { A: 0, B: 1, C: 2, D: 3 };
    let correct = 0, wrong = 0, unattempted = 0;

    questions.forEach((q) => {
      const userAns = answers[q.id];
      const correctIndex =
        typeof q.correctAnswer === "number" ? q.correctAnswer : map[q.correctAnswer] ?? 0;
      if (userAns === undefined) unattempted += 1;
      else if (userAns === correctIndex) correct += 1;
      else wrong += 1;
    });

    const score      = correct * 4 - wrong * 1;
    const totalMarks = questions.length * 4;
    const accuracy   = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    const scorePct   = totalMarks > 0 ? Math.round((Math.max(score, 0) / totalMarks) * 100) : 0;

    const resultData = {
      examId, paperId, language, pyqYear, mode,
      score, totalMarks, correct, wrong, unattempted, accuracy,
      answers, questions, timePerQuestion,
      submittedAt: new Date().toISOString(),
    };

    try {
      const uid = getCurrentUid();
      await saveResult(resultData);
      if (uid) {
        await syncBookmarks(uid, bookmarks, questions);
        await recordAttempt({ uid, scorePct, questionCount: questions.length });
      }
      localStorage.removeItem(STORAGE_KEY);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      navigate("/result", { state: resultData });
    } catch (err) {
      console.error("submitExam failed:", err);
      setSubmitting(false);
    }
  }

  const selectedOpt = currentQ ? answers[currentQ.id] : undefined;

  return {
    loading, submitting, questions, examData, mode, pyqYear, paperId, language,
    currentQuestion, setCurrentQuestion, answers, visited, review, bookmarks,
    timePerQuestion, currentQ, selectedOpt, selectOption, handleNext, handlePrev,
    goTo, clearResponse, toggleReview, toggleBookmark, submitExam,
    timeLeft, cheatCount, formatTime, setVisited,
  };
}
