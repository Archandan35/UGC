import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  subscribeSubjects, subscribeTopics,
  createTopic, updateTopic, deleteTopicCascade, checkTopicDuplicate,
} from "../data-layer";
import AdminLayout from "./AdminLayout";

export default function Topics() {
  const [subjects,        setSubjects]        = useState([]);
  const [topics,          setTopics]          = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showPopup,       setShowPopup]       = useState(false);
  const [topicName,       setTopicName]       = useState("");
  const [editingId,       setEditingId]       = useState(null);

  useEffect(() => {
    const u1 = subscribeSubjects((data) => {
      setSubjects(data);
      if (data.length > 0 && !selectedSubject) setSelectedSubject(data[0].id);
    });
    const u2 = subscribeTopics(setTopics);
    return () => { u1(); u2(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddTopic() {
    if (!topicName.trim()) { toast.error("Topic name required"); return; }
    if (!selectedSubject)  { toast.error("Select subject"); return; }
    const dup = await checkTopicDuplicate(topicName, selectedSubject);
    if (dup) { toast.error("Topic already exists"); return; }
    await createTopic({ name: topicName.trim(), subjectId: selectedSubject });
    toast.success("Topic Added");
    resetForm();
  }

  function editTopic(topic) {
    setEditingId(topic.id);
    setTopicName(topic.name);
    setSelectedSubject(topic.subjectId);
    setShowPopup(true);
  }

  async function handleUpdate() {
    if (!topicName.trim()) { toast.error("Topic name required"); return; }
    await updateTopic(editingId, { name: topicName.trim(), subjectId: selectedSubject });
    toast.success("Topic Updated");
    resetForm();
  }

  async function handleDelete(id) {
    if (!window.confirm("This will permanently delete:\n\n• SubTopics\n• Questions\n• Exams\n\nContinue?")) return;
    try {
      await deleteTopicCascade(id);
      toast.success("Topic Cascade Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  const filteredTopics = topics.filter((t) => t.subjectId === selectedSubject);
  const getSubjectName = (id) => subjects.find((s) => s.id === id)?.name || "Unknown";

  function resetForm() {
    setTopicName(""); setEditingId(null); setShowPopup(false);
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div><h2>Topic Management</h2><p>Total Topics: {filteredTopics.length}</p></div>
        <button onClick={() => setShowPopup(true)}>+ Add Topic</button>
      </div>
      <div className="filter-bar">
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Topic</th><th>Subject</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {filteredTopics.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{getSubjectName(t.subjectId)}</td>
                <td><button className="edit-btn" onClick={() => editTopic(t)}>Edit</button></td>
                <td><button className="delete-btn" onClick={() => handleDelete(t.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{editingId ? "Edit Topic" : "Add Topic"}</h3>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="text" placeholder="Topic Name" value={topicName}
              onChange={(e) => setTopicName(e.target.value)} />
            {editingId
              ? <button onClick={handleUpdate}>Update Topic</button>
              : <button onClick={handleAddTopic}>Add Topic</button>}
            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
