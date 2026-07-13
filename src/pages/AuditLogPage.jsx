import { useEffect, useState } from "react";
import TopNavbar from "../components/TopNavbar";
import AdminSidebar from "../components/AdminSidebar";
import { getRecentAuditLogs } from "../data-layer";

function fmt(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRecentAuditLogs(300, actionFilter ? { action: actionFilter } : {})
      .then((rows) => !cancelled && setLogs(rows))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [actionFilter]);

  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <TopNavbar />
        <div className="page-header">
          <div>
            <h2>Audit Log</h2>
            <p>Tamper-evident record of privileged admin actions.</p>
          </div>
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /></div>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr><td colSpan="4" className="empty-row">No audit log entries yet.</td></tr>
                )}
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{fmt(l.createdAt)}</td>
                    <td><span className="badge-soft">{l.action}</span></td>
                    <td>{l.actorEmail || l.actorUid}</td>
                    <td><code className="audit-meta">{JSON.stringify(l.meta || {})}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
