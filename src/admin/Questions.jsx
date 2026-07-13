import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  subscribeSubjects, subscribeTopics, subscribeSubtopics, subscribeQuestions,
  createQuestion, updateQuestion, deleteQuestion, checkQuestionDuplicate,
} from "../data-layer";
import AdminLayout from "./AdminLayout";
import { useNavigate } from "react-router-dom";

export default function Questions() {
  const [subjects,    setSubjects]    = useState([]);
  const [topics,      setTopics]      = useState([]);
  const [subTopics,   setSubTopics]   = useState([]);
  const [questions,   setQuestions]   = useState([]);

  const [selectedSubject,  setSelectedSubject]  = useState("");
  const [selectedTopic,    setSelectedTopic]    = useState("");
  const [selectedSubTopic, setSelectedSubTopic] = useState("");

  const [filterSubject,  setFilterSubject]  = useState("");
  const [filterTopic,    setFilterTopic]    = useState("");
  const [filterSubTopic, setFilterSubTopic] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [difficulty, setDifficulty] = useState("easy");
  const [explanation, setExplanation] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const optionLabels = ["A","B","C","D"];
  const navigate = useNavigate();

  useEffect(() => {
    const u1 = subscribeSubjects(setSubjects);
    const u2 = subscribeTopics(setTopics);
    const u3 = subscribeSubtopics(setSubTopics);
    const u4 = subscribeQuestions(setQuestions);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const filteredTopics   = topics.filter((t) => t.subjectId === selectedSubject);
  const filteredSubTopics = subTopics.filter(
    (s) => s.subjectId === selectedSubject && s.topicId === selectedTopic
  );

  async function handleAddQuestion() {
    if (!questionText.trim()) { toast.error("Question required"); return; }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      toast.error("All options required"); return;
    }
    if (!selectedSubject || !selectedTopic || !selectedSubTopic) {
      toast.error("Select hierarchy"); return;
    }
    const dup = await checkQuestionDuplicate(questionText, selectedSubTopic);
    if (dup) { toast.error("Question already exists"); return; }

    await createQuestion({
      subjectId: selectedSubject, topicId: selectedTopic, subTopicId: selectedSubTopic,
      question: questionText.trim(),
      options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
      correctAnswer: typeof correctAnswer === "number" ? optionLabels[correctAnswer] : correctAnswer,
      difficulty, explanation: explanation.trim(),
    });
    toast.success("Question Added");
    resetForm();
  }

  function editQuestion(q) {
    setEditingId(q.id);
    setSelectedSubject(q.subjectId); setSelectedTopic(q.topicId); setSelectedSubTopic(q.subTopicId);
    setQuestionText(q.question);
    setOptionA(q.options?.[0] || ""); setOptionB(q.options?.[1] || "");
    setOptionC(q.options?.[2] || ""); setOptionD(q.options?.[3] || "");
    setCorrectAnswer(q.correctAnswer || "A");
    setDifficulty(q.difficulty || "easy"); setExplanation(q.explanation || "");
    setShowPopup(true);
  }

  async function handleUpdate() {
    await updateQuestion(editingId, {
      subjectId: selectedSubject, topicId: selectedTopic, subTopicId: selectedSubTopic,
      question: questionText.trim(),
      options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
      correctAnswer: typeof correctAnswer === "number" ? optionLabels[correctAnswer] : correctAnswer,
      difficulty, explanation: explanation.trim(),
    });
    toast.success("Question Updated");
    resetForm();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete Question?")) return;
    await deleteQuestion(id);
    toast.success("Question Deleted");
  }

  async function bulkDeleteQuestions() {
    if (!window.confirm(`Delete ${selectedQuestions.length} questions?`)) return;
    for (const id of selectedQuestions) await deleteQuestion(id);
    setSelectedQuestions([]);
    toast.success("Questions Deleted");
  }

  function resetForm() {
    setQuestionText(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD("");
    setCorrectAnswer("A"); setDifficulty("easy"); setExplanation("");
    setEditingId(null); setShowPopup(false);
  }

  function getName(arr, id) { return arr.find((x) => x.id === id)?.name || "Unknown"; }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch   = q.question?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject  = filterSubject  ? q.subjectId  === filterSubject  : true;
    const matchesTopic    = filterTopic    ? q.topicId    === filterTopic    : true;
    const matchesSubTopic = filterSubTopic ? q.subTopicId === filterSubTopic : true;
    return matchesSearch && matchesSubject && matchesTopic && matchesSubTopic;
  });

  const totalPages = Math.ceil(filteredQuestions.length / perPage);
  const paginated  = filteredQuestions.slice((page - 1) * perPage, page * perPage);

  return (
    <AdminLayout>
      <div className="page-header">
        <div><h2>Questions Management</h2><p>Total Questions: {filteredQuestions.length}</p></div>
      </div>

      <div className="questions-toolbar">
        <div className="questions-toolbar-left">
          <input className="question-search" placeholder="Search Questions..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <div className="inline-filters">
            <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setFilterTopic(""); setFilterSubTopic(""); }}>
              <option value="">All Subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterTopic} onChange={(e) => { setFilterTopic(e.target.value); setFilterSubTopic(""); }}>
              <option value="">All Topic</option>
              {topics.filter((t) => !filterSubject || t.subjectId === filterSubject)
                .map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={filterSubTopic} onChange={(e) => setFilterSubTopic(e.target.value)}>
              <option value="">All SubTopic</option>
              {subTopics.filter((st) => {
                const sameSubject = !filterSubject || String(st.subjectId||"").trim() === String(filterSubject||"").trim();
                const sameTopic   = !filterTopic   || String(st.topicId||"").trim()   === String(filterTopic||"").trim();
                return sameSubject && sameTopic;
              }).map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
        </div>
        <div className="questions-toolbar-right">
          {selectedQuestions.length > 0 && (
            <button className="delete-btn" onClick={bulkDeleteQuestions}>
              Delete Selected ({selectedQuestions.length})
            </button>
          )}
          <button className="smart-edit-btn" onClick={() => navigate("/admin/Smartquestionedit")}>✏ Smart Edit</button>
          <button className="add-question-btn" onClick={() => setShowPopup(true)}>+ Add Question</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox"
                  checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                  onChange={(e) => setSelectedQuestions(e.target.checked ? filteredQuestions.map((q) => q.id) : [])} />
              </th>
              <th>Question</th><th>Subject</th><th>Difficulty</th><th>Answer</th><th>Edit</th><th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((q, index) => (
              <tr key={q.id}>
                <td>
                  <input type="checkbox" checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => setSelectedQuestions((prev) =>
                      e.target.checked ? [...prev, q.id] : prev.filter((id) => id !== q.id))} />
                </td>
                <td>{(page - 1) * perPage + index + 1}. {q.question}</td>
                <td>{getName(subjects, q.subjectId)}</td>
                <td>{q.difficulty}</td>
                <td>
                  {typeof q.correctAnswer === "number"
                    ? q.options?.[q.correctAnswer]
                    : q.options?.[optionLabels.indexOf(q.correctAnswer)]}
                </td>
                <td><button className="edit-btn" onClick={() => editQuestion(q)}>Edit</button></td>
                <td><button className="delete-btn" onClick={() => handleDelete(q.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{editingId ? "Edit Question" : "Add Question"}</h3>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
              <option value="">Select Topic</option>
              {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={selectedSubTopic} onChange={(e) => setSelectedSubTopic(e.target.value)}>
              <option value="">Select SubTopic</option>
              {filteredSubTopics.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea placeholder="Question Text" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            <input placeholder="Option A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
            <input placeholder="Option B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
            <input placeholder="Option C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
            <input placeholder="Option D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
            <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
              {optionLabels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <textarea placeholder="Explanation (optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            {editingId
              ? <button onClick={handleUpdate}>Update Question</button>
              : <button onClick={handleAddQuestion}>Add Question</button>}
            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
