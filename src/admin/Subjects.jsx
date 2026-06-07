import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  subscribeSubjects, createSubject, updateSubject,
  deleteSubjectCascade, checkSubjectDuplicate,
} from "../data-layer";
import AdminLayout from "./AdminLayout";

export default function Subjects() {
  const [subjects,    setSubjects]    = useState([]);
  const [showPopup,   setShowPopup]   = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [editingId,   setEditingId]   = useState(null);

  useEffect(() => {
    return subscribeSubjects(setSubjects);
  }, []);

  async function handleAddSubject() {
    if (!subjectName.trim()) { toast.error("Subject name required"); return; }
    const dup = await checkSubjectDuplicate(subjectName);
    if (dup) { toast.error("Subject already exists"); return; }
    await createSubject({ name: subjectName.trim() });
    toast.success("Subject Added");
    resetForm();
  }

  function editSubject(subject) {
    setEditingId(subject.id);
    setSubjectName(subject.name);
    setShowPopup(true);
  }

  async function handleUpdate() {
    if (!subjectName.trim()) { toast.error("Subject name required"); return; }
    await updateSubject(editingId, { name: subjectName.trim() });
    toast.success("Subject Updated");
    resetForm();
  }

  async function handleDelete(id) {
    if (!window.confirm("This will permanently delete:\n\n• Topics\n• SubTopics\n• Questions\n• Exams\n\nContinue?")) return;
    try {
      await deleteSubjectCascade(id);
      toast.success("Subject Cascade Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  function resetForm() {
    setSubjectName(""); setEditingId(null); setShowPopup(false);
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <div><h2>Subject Management</h2><p>Total Subjects: {subjects.length}</p></div>
        <button onClick={() => setShowPopup(true)}>+ Add Subject</button>
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Subject</th><th>Edit</th><th>Delete</th></tr></thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td><button className="edit-btn" onClick={() => editSubject(s)}>Edit</button></td>
                <td><button className="delete-btn" onClick={() => handleDelete(s.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>{editingId ? "Edit Subject" : "Add Subject"}</h3>
            <input type="text" placeholder="Subject Name" value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)} />
            {editingId
              ? <button onClick={handleUpdate}>Update Subject</button>
              : <button onClick={handleAddSubject}>Add Subject</button>}
            <button className="cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
