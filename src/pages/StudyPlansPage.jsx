import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TopNavbar from "../components/TopNavbar";
import { useAuth } from "../context/AuthContext";
import {
  listStudyPlans,
  createStudyPlan,
  deleteStudyPlan,
  updateStudyPlan,
} from "../data-layer";

const EMPTY = { title: "", startDate: "", endDate: "", targetHoursPerDay: 2, tasks: [] };

export default function StudyPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [newTask, setNewTask] = useState("");

  async function refresh() {
    if (!user) return;
    setLoading(true);
    setPlans(await listStudyPlans(user.id));
    setLoading(false);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  async function handleCreate() {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    try {
      await createStudyPlan(form);
      toast.success("Plan created");
      setForm(EMPTY);
      refresh();
    } catch (e) { toast.error(e.message); }
  }

  async function toggleTask(plan, idx) {
    const tasks = [...(plan.tasks || [])];
    tasks[idx] = { ...tasks[idx], done: !tasks[idx].done };
    await updateStudyPlan(plan.id, { tasks });
    refresh();
  }

  async function remove(id) {
    if (!confirm("Delete this plan?")) return;
    await deleteStudyPlan(id);
    refresh();
  }

  return (
    <div className="page">
      <TopNavbar />
      <div className="page-header">
        <div>
          <h2>Study Plans</h2>
          <p>Set goals, break them into tasks, and track your daily effort.</p>
        </div>
      </div>

      <div className="study-plan-grid">
        <div className="card study-plan-form">
          <h3>New Plan</h3>
          <input className="input" placeholder="Plan title (e.g. OPSC Prelims Sprint)"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid-2">
            <input type="date" className="input"
              value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input type="date" className="input"
              value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <label className="field-label">Target hours/day</label>
          <input type="number" min="1" max="12" className="input"
            value={form.targetHoursPerDay}
            onChange={(e) => setForm({ ...form, targetHoursPerDay: e.target.value })} />

          <label className="field-label">Tasks</label>
          <div className="row-gap">
            <input className="input" placeholder="Add a task" value={newTask}
              onChange={(e) => setNewTask(e.target.value)} />
            <button className="btn-secondary" onClick={() => {
              if (!newTask.trim()) return;
              setForm({ ...form, tasks: [...form.tasks, { text: newTask.trim(), done: false }] });
              setNewTask("");
            }}>Add</button>
          </div>
          <ul className="task-preview">
            {form.tasks.map((t, i) => <li key={i}>{t.text}</li>)}
          </ul>

          <button className="btn-primary full-width" onClick={handleCreate}>Create Plan</button>
        </div>

        <div className="study-plan-list">
          {loading ? (
            <div className="loading-overlay"><div className="loading-spinner" /></div>
          ) : plans.length === 0 ? (
            <div className="empty-state"><p>No study plans yet — create your first one.</p></div>
          ) : plans.map((p) => {
            const total = (p.tasks || []).length;
            const done = (p.tasks || []).filter((t) => t.done).length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div className="card study-plan-card" key={p.id}>
                <div className="study-plan-card-header">
                  <h3>{p.title}</h3>
                  <button className="btn-link-danger" onClick={() => remove(p.id)}>Delete</button>
                </div>
                <p className="muted">
                  {p.startDate || "—"} → {p.endDate || "—"} · {p.targetHoursPerDay}h/day
                </p>
                <div className="progress-bar">
                  <div className="progress-bar-fill" data-pct={pct} />
                </div>
                <span className="muted small">{done}/{total} tasks · {pct}%</span>
                <ul className="task-list">
                  {(p.tasks || []).map((t, i) => (
                    <li key={i} className={t.done ? "task-done" : ""}>
                      <label>
                        <input type="checkbox" checked={!!t.done} onChange={() => toggleTask(p, i)} />
                        {t.text}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
