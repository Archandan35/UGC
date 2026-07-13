import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import TopNavbar from "../components/TopNavbar";
import { useAuth } from "../context/AuthContext";
import { listThreads, createThread } from "../data-layer";

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function ForumPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ title: "", body: "", tags: "" });

  async function refresh() {
    setLoading(true);
    try { setThreads(await listThreads({ max: 100 })); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  async function submit() {
    if (!user) { toast.error("Sign in to post"); return; }
    if (!draft.title.trim()) { toast.error("Title required"); return; }
    try {
      await createThread({
        title: draft.title,
        body: draft.body,
        tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Posted");
      setDraft({ title: "", body: "", tags: "" });
      refresh();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="page">
      <TopNavbar />
      <div className="page-header">
        <div>
          <h2>Discussion Forum</h2>
          <p>Ask questions, share strategy, help fellow aspirants.</p>
        </div>
      </div>

      <div className="forum-grid">
        <div className="card forum-composer">
          <h3>Start a Thread</h3>
          <input className="input" placeholder="Title" value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="input" rows="5" placeholder="What's on your mind?"
            value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <input className="input" placeholder="Tags (comma separated)" value={draft.tags}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
          <button className="btn-primary full-width" onClick={submit}>Post</button>
        </div>

        <div className="forum-thread-list">
          {loading ? (
            <div className="loading-overlay"><div className="loading-spinner" /></div>
          ) : threads.length === 0 ? (
            <div className="empty-state"><p>No threads yet — start the first conversation.</p></div>
          ) : threads.map((t) => (
            <Link to={`/forum/${t.id}`} key={t.id} className="card forum-thread-card">
              <div className="forum-thread-title">{t.title}</div>
              <div className="forum-thread-meta">
                <span>{t.authorName}</span>
                <span>·</span>
                <span>{t.replyCount || 0} replies</span>
                <span>·</span>
                <span>{fmt(t.lastActivityAt || t.createdAt)}</span>
              </div>
              {t.tags?.length > 0 && (
                <div className="forum-thread-tags">
                  {t.tags.map((tg) => <span key={tg} className="badge-soft">#{tg}</span>)}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
