import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import TopNavbar from "../components/TopNavbar";
import { useAuth } from "../context/AuthContext";
import { getThread, listReplies, postReply } from "../data-layer";

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function ForumThreadPage() {
  const { threadId } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([getThread(threadId), listReplies(threadId)]);
      setThread(t);
      setReplies(r);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [threadId]);

  async function submit() {
    if (!user) { toast.error("Sign in to reply"); return; }
    if (!body.trim()) return;
    try {
      await postReply(threadId, body);
      setBody("");
      refresh();
    } catch (e) { toast.error(e.message); }
  }

  if (loading) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="page">
        <TopNavbar />
        <div className="empty-state">
          <h3>Thread not found</h3>
          <Link to="/forum" className="btn-primary">Back to Forum</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <TopNavbar />
      <Link to="/forum" className="back-link">← Back to Forum</Link>
      <div className="card forum-thread-detail">
        <h2>{thread.title}</h2>
        <div className="forum-thread-meta">
          <span>{thread.authorName}</span>
          <span>·</span>
          <span>{fmt(thread.createdAt)}</span>
        </div>
        <p className="forum-thread-body">{thread.body}</p>
        {thread.tags?.length > 0 && (
          <div className="forum-thread-tags">
            {thread.tags.map((tg) => <span key={tg} className="badge-soft">#{tg}</span>)}
          </div>
        )}
      </div>

      <h3 className="section-title">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h3>
      <div className="forum-replies">
        {replies.map((r) => (
          <div className="card forum-reply" key={r.id}>
            <div className="forum-reply-meta">
              <strong>{r.authorName}</strong>
              <span className="muted small">{fmt(r.createdAt)}</span>
            </div>
            <p>{r.body}</p>
          </div>
        ))}
      </div>

      <div className="card forum-composer">
        <h3>Add a Reply</h3>
        <textarea className="input" rows="4" placeholder="Share your thoughts..."
          value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn-primary full-width" onClick={submit}>Post Reply</button>
      </div>
    </div>
  );
}
