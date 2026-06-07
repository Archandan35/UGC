import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  subscribeSubjects, subscribeTopics, subscribeSubtopics,
  createSubtopic, updateSubtopic, deleteSubtopicCascade, checkSubtopicDuplicate,
} from "../data-layer";
import AdminLayout from "./AdminLayout";

export default function SubTopics() {
  const [subjects,        setSubjects]        = useState([]);
  const [topics,          setTopics]          = useState([]);
  const [subTopics,       setSubTopics]       = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic,   setSelectedTopic]   = useState("");
  const [showPopup,       setShowPopup]       = useState(false);
  const [subTopicName,    setSubTopicName]    = useState("");
  const [editingId,       setEditingId]       = useState(null);

  useEffect(() => {
    const u1 = subscribeSubjects((data) => {
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) setSelectedSubject(data[0].id);
    });
    const u2 = subscribeTopics(setTopics);
    const u3 = subscribeSubtopics(setSubTopics);
    return () => { u1(); u2(); u3(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTopics   = topics.filter((t) => t.subjectId === selectedSubject);
  const filteredSubTopics = subTopics.filter(
    (s) => s.subjectId === selectedSubject && s.topicId === selectedTopic
  );

  useEffect(() => {
    if (filteredTopics.length > 0 && !selectedTopic) {
      setSelectedTopic(filteredTopics[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, topics]);

  async function handleAddSubTopic() {
    if (!subTopicName.trim()) { toast.error("SubTopic name required"); return; }
    if (!selectedSubject || !selectedTopic) { toast.error("Select subject and topic"); return; }
    const dup = await checkSubtopicDuplicate(subTopicName, selectedSubject, selectedTopic);
    if (dup) { toast.error("SubTopic already exists"); return; }
    await createSubtopic({ name: subTopicName.trim(), subjectId: selectedSubject, topicId: selectedTopic });
    toast.success("SubTopic Added");
    resetForm();
  }

  function editSubTopic(st) {
    setEditingId(st.id); setSubTopicName(st.name);
    setSelectedSubject(st.subjectId); setSelectedTopic(st.topicId);
    setShowPopup(true);
  }

  async function handleUpdate() {
    if (!subTopicName.trim()) { toast.error("SubTopic name required"); return; }
    await updateSubtopic(editingId, { name: subTopicName.trim(), subjectId: selectedSubject, topicId: selectedTopic });
    toast.success("SubTopic Updated");
    resetForm();
  }

  async function handleDelete(id) {
    if (!window.confirm("This will permanently delete:\n\n• Questions\n• Exams\n\nContinue?")) return;
    try {
      await deleteSubtopicCascade(id);
      toast.success("SubTopic Cascade Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  const getSubjectName = (id) => subjects.find((s) => s.id === id)?.name || "Unknown";
  const getTopicName   = (id) => topics.find((t) => t.id === id)?.name  || "Unknown";

  function resetForm() { setSubTopicName(""); setEditingId(null); setShowPopup(false); }

  return (
    <AdminLayout>
      <div className="page-header">
        <div><h2>SubTopic Management</h2><p>Total SubTopics: {filteredSubTopics.length}</p></div>
        <button onClick={() => setShowPopup(true)}>+ Add SubTopic</button>
      </div>
      <div className="filter-bar">
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
          {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>SubTopic</th><th>Subject</th><th>Topic</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {filteredSubTopics.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{getSubjectName(s.subjectId)}</td>
                <td>{getTopicName(s.topicId)}</td>
                <td><button className="edit-btn" onClick={() => editSubTopic(s)}>Edit</button></td>
                <td><button className="delete-btn" onClick={() => handleDelete(s.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{editingId ? "Edit SubTopic" : "Add SubTopic"}</h3>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
              {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="text" placeholder="SubTopic Name" value={subTopicName}
              onChange={(e) => setSubTopicName(e.target.value)} />
            {editingId
              ? <button onClick={handleUpdate}>Update SubTopic</button>
              : <button onClick={handleAddSubTopic}>Add SubTopic</button>}
            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
