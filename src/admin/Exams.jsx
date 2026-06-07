import { useEffect, useMemo, useState } from "react";
import { subscribeExams, deleteExam, deleteExams, updateExam, subscribeSubjects } from "../data-layer";
import AdminLayout from "./AdminLayout";

export default function Exams() {
  const [exams,    setExams]    = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedMockType,  setSelectedMockType]  = useState("");
  const [sortOrder,         setSortOrder]         = useState("default");
  const [selectedSubject,   setSelectedSubject]   = useState("");
  const [selectedTopic,     setSelectedTopic]     = useState("");
  const [selectedSubTopic,  setSelectedSubTopic]  = useState("");
  const [selectedExamIds,   setSelectedExamIds]   = useState(new Set());
  const [editingExamId,     setEditingExamId]     = useState(null);
  const [editFormData,      setEditFormData]      = useState({
    name:"", mockType:"sectional", subjectId:"", topicName:"", subTopicName:"", duration:0, totalQuestions:0
  });

  useEffect(() => {
    const u1 = subscribeExams(setExams);
    const u2 = subscribeSubjects(setSubjects);
    return () => { u1(); u2(); };
  }, []);

  const filteredTopics = useMemo(() => [
    ...new Set(exams.filter((e) => selectedSubject ? e.subjectId === selectedSubject : true)
      .map((e) => e.topicName).filter(Boolean))
  ], [exams, selectedSubject]);

  const filteredSubTopics = useMemo(() => [
    ...new Set(exams.filter((e) => selectedTopic ? e.topicName === selectedTopic : true)
      .map((e) => e.subTopicName).filter(Boolean))
  ], [exams, selectedTopic]);

  const editFormTopics = useMemo(() => [
    ...new Set(exams.filter((e) => editFormData.subjectId ? e.subjectId === editFormData.subjectId : true)
      .map((e) => e.topicName).filter(Boolean))
  ], [exams, editFormData.subjectId]);

  const editFormSubTopics = useMemo(() => [
    ...new Set(exams.filter((e) => editFormData.topicName ? e.topicName === editFormData.topicName : true)
      .map((e) => e.subTopicName).filter(Boolean))
  ], [exams, editFormData.topicName]);

  const filteredAndSortedExams = useMemo(() => {
    const filtered = exams.filter((exam) => {
      const mockTypeMatch  = selectedMockType ? (exam.mockType || "sectional") === selectedMockType : true;
      const subjectMatch   = selectedSubject  ? exam.subjectId === selectedSubject : true;
      const topicMatch     = selectedTopic    ? exam.topicName === selectedTopic   : true;
      const subTopicMatch  = selectedMockType === "full" ? true
        : (selectedSubTopic ? exam.subTopicName === selectedSubTopic : true);
      return mockTypeMatch && subjectMatch && topicMatch && subTopicMatch;
    });
    return filtered.sort((a, b) => {
      const nameA = a.name || ""; const nameB = b.name || "";
      if (sortOrder === "recent") {
        const tA = a.createdAt?.seconds || a.createdAt || 0;
        const tB = b.createdAt?.seconds || b.createdAt || 0;
        return tB !== tA ? tB - tA : String(b.id).localeCompare(String(a.id));
      } else if (sortOrder === "descending") {
        return nameB.localeCompare(nameA, undefined, { numeric:true, sensitivity:"base" });
      }
      return nameA.localeCompare(nameB, undefined, { numeric:true, sensitivity:"base" });
    });
  }, [exams, selectedMockType, selectedSubject, selectedTopic, selectedSubTopic, sortOrder]);

  useEffect(() => setSelectedExamIds(new Set()), [selectedMockType, selectedSubject, selectedTopic, selectedSubTopic]);

  const getSubjectName = (id) => subjects.find((s) => s.id === id)?.name || "-";

  function handleSelectExam(id) {
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const isAllVisibleSelected = useMemo(() =>
    filteredAndSortedExams.length > 0 && filteredAndSortedExams.every((e) => selectedExamIds.has(e.id)),
    [filteredAndSortedExams, selectedExamIds]);

  function handleSelectAllToggle() {
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (isAllVisibleSelected) filteredAndSortedExams.forEach((e) => next.delete(e.id));
      else filteredAndSortedExams.forEach((e) => next.add(e.id));
      return next;
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this exam?")) return;
    await deleteExam(id);
    setSelectedExamIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleBulkDelete() {
    if (selectedExamIds.size === 0) return;
    if (!window.confirm(`Delete all ${selectedExamIds.size} selected mock tests?`)) return;
    try {
      await deleteExams(Array.from(selectedExamIds));
      setSelectedExamIds(new Set());
      alert("Successfully deleted selected exams.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while running bulk delete.");
    }
  }

  function handleStartEdit(exam) {
    setEditingExamId(exam.id);
    setEditFormData({
      name: exam.name || "", mockType: exam.mockType || "sectional",
      subjectId: exam.subjectId || "", topicName: exam.topicName || "",
      subTopicName: exam.subTopicName || "", duration: exam.duration || 0,
      totalQuestions: exam.totalQuestions || exam.questionIds?.length || 0,
    });
  }

  function handleEditFormChange(e) {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const updated = { ...prev, [name]: name === "duration" || name === "totalQuestions" ? Number(value) : value };
      if (name === "mockType" && value === "full") updated.subTopicName = "";
      if (name === "subjectId") { updated.topicName = ""; updated.subTopicName = ""; }
      if (name === "topicName") updated.subTopicName = "";
      return updated;
    });
  }

  async function handleUpdate(e, id) {
    e.preventDefault();
    try {
      await updateExam(id, {
        name: editFormData.name, mockType: editFormData.mockType,
        subjectId: editFormData.subjectId, topicName: editFormData.topicName,
        subTopicName: editFormData.mockType === "full" ? "" : editFormData.subTopicName,
        duration: editFormData.duration, totalQuestions: editFormData.totalQuestions,
      });
      setEditingExamId(null);
    } catch (error) {
      console.error(error); alert("Failed to update exam.");
    }
  }

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header"><div><h2>Exams</h2><p>Manage generated mocks</p></div></div>

        {filteredAndSortedExams.length > 0 && (
          <div className="exam-select-all-bar">
            <label className="exam-select-all-label">
              <input type="checkbox" checked={isAllVisibleSelected} onChange={handleSelectAllToggle} />
              <strong>Select All Visible</strong>
            </label>
          </div>
        )}

        <div className="se-filter-bar">
          <select className="se-select" value={selectedMockType}
            onChange={(e) => { setSelectedMockType(e.target.value); setSelectedSubTopic(""); }}>
            <option value="">All Mock Types</option>
            <option value="full">Full Mock</option>
            <option value="sectional">Sectional Mock</option>
          </select>
          <select className="se-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="default">Sort: Default (Ascending)</option>
            <option value="descending">Sort: Name (Descending)</option>
            <option value="recent">Sort: Recently Added</option>
          </select>
          <select className="se-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="se-select" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
            <option value="">All Topics</option>
            {filteredTopics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {selectedMockType !== "full" && (
            <select className="se-select" value={selectedSubTopic} onChange={(e) => setSelectedSubTopic(e.target.value)}>
              <option value="">All Sub Topics</option>
              {filteredSubTopics.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          )}
        </div>

        {selectedExamIds.size > 0 && (
          <div className="bulk-actions-panel">
            <span className="bulk-actions-count">{selectedExamIds.size} mock test{selectedExamIds.size > 1 ? "s" : ""} selected</span>
            <button className="bulk-action-btn bulk-danger" onClick={handleBulkDelete}>Delete Selected Mocks</button>
          </div>
        )}

        <div className="exam-grid">
          {filteredAndSortedExams.map((exam) => (
            <div key={exam.id} className="exam-card">
              {editingExamId === exam.id ? (
                <form onSubmit={(e) => handleUpdate(e, exam.id)} className="edit-exam-form">
                  <h3>Edit Exam</h3>
                  <label>Exam Name:</label>
                  <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} required />
                  <label>Mock Type:</label>
                  <select name="mockType" value={editFormData.mockType} onChange={handleEditFormChange}>
                    <option value="sectional">Sectional Mock</option>
                    <option value="full">Full Mock</option>
                  </select>
                  <label>Subject:</label>
                  <select name="subjectId" value={editFormData.subjectId} onChange={handleEditFormChange}>
                    <option value="">Select Subject</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <label>Topic Name:</label>
                  <select name="topicName" value={editFormData.topicName} onChange={handleEditFormChange}>
                    <option value="">Select Topic</option>
                    {editFormTopics.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {editFormData.mockType !== "full" && (
                    <>
                      <label>Sub Topic Name:</label>
                      <select name="subTopicName" value={editFormData.subTopicName} onChange={handleEditFormChange}>
                        <option value="">Select Sub Topic</option>
                        {editFormSubTopics.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </>
                  )}
                  <label>Questions Count:</label>
                  <input type="number" name="totalQuestions" value={editFormData.totalQuestions} onChange={handleEditFormChange} />
                  <label>Duration (mins):</label>
                  <input type="number" name="duration" value={editFormData.duration} onChange={handleEditFormChange} />
                  <div className="exam-actions">
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" className="cancel-btn" onClick={() => setEditingExamId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="exam-card-checkbox">
                    <input type="checkbox" checked={selectedExamIds.has(exam.id)} onChange={() => handleSelectExam(exam.id)} />
                  </div>
                  <div className="exam-card-badge-row">
                    <div className={`exam-badge ${(exam.mockType||"sectional") === "full" ? "full-badge" : "sectional-badge"}`}>
                      {(exam.mockType||"sectional") === "full" ? "FULL MOCK" : "SECTIONAL MOCK"}
                    </div>
                  </div>
                  <h2 className="exam-card-title">{exam.name}</h2>
                  <div className="exam-details">
                    <p><strong>Subject:</strong> {getSubjectName(exam.subjectId)}</p>
                    <p><strong>Topic:</strong> {exam.topicName || "-"}</p>
                    {(exam.mockType||"sectional") === "sectional" && (
                      <p><strong>Sub Topic:</strong> {exam.subTopicName || "-"}</p>
                    )}
                    <p><strong>Questions:</strong> {exam.totalQuestions || exam.questionIds?.length || 0}</p>
                    <p><strong>Duration:</strong> {exam.duration || 0} mins</p>
                  </div>
                  <div className="exam-actions">
                    <button className="edit-btn" onClick={() => handleStartEdit(exam)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(exam.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
