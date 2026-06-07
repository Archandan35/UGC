import { useState, useEffect } from 'react';
import { exportEngine } from '../../database-platform/export/ExportEngine';
import { eventBus, Events } from '../../database-platform/core/EventBus';
import { ALL_COLLECTIONS } from '../../database-platform/core/CollectionRegistry';
import StepBadge from './StepBadge';
import ProgressBar from './ProgressBar';

const FORMATS = [
  { id: 'udb',  label: '.udb v3', icon: '📦', special: true },
  { id: 'json', label: 'JSON',    icon: '📄' },
  { id: 'csv',  label: 'CSV',     icon: '📊' },
  { id: 'sql',  label: 'SQL',     icon: '🗃️' },
];

export default function ExportView({ showToast }) {
  const [selCols, setSelCols] = useState([ALL_COLLECTIONS[0].id]);
  const [format, setFormat] = useState('udb');
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [compress, setCompress] = useState(false);
  const [progress, setProgress] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const off = eventBus.on(Events.EXPORT_PROGRESS, (p) => setProgress(p));
    const offDone = eventBus.on(Events.EXPORT_COMPLETED, ({ results }) => {
      setReport(results);
      setProgress(null);
    });
    return () => { off(); offDone(); };
  }, []);

  const handleExport = async () => {
    try {
      setReport(null);
      await exportEngine.export({
        collections: selCols,
        format,
        encryptionPassword: encrypt ? password : null,
        compress,
      });
    } catch (err) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Export Data</h2>
        <p className="dbm-view-subtitle">Universal export with encryption, compression, and full package integrity</p>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="1" active /><h3>Select Collections</h3></div>
        <div className="udb-col-picker">
          {ALL_COLLECTIONS.map(col => {
            const active = selCols.includes(col.id);
            return (
              <label key={col.id} className={`udb-col-chip${active ? ' udb-col-chip--active' : ''}`}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setSelCols(prev =>
                    prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id]
                  )}
                />
                {col.icon} {col.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="2" active /><h3>Format & Options</h3></div>
        <div className="udb-format-grid">
          {FORMATS.map(f => (
            <label
              key={f.id}
              className={`udb-format-card${format === f.id ? ' udb-format-card--active' : ''}${f.special ? ' udb-format-card--special' : ''}`}
            >
              <input type="radio" name="fmt" checked={format === f.id} onChange={() => setFormat(f.id)} />
              <span className="udb-format-icon">{f.icon}</span>
              <span className="udb-format-name">{f.label}</span>
              {f.special && <span className="udb-badge">Universal v3</span>}
            </label>
          ))}
        </div>
        {format === 'udb' && (
          <div className="udb-options-row">
            <label className="udb-checkbox">
              <input type="checkbox" checked={compress} onChange={e => setCompress(e.target.checked)} />
              Compress data (gzip)
            </label>
            <label className="udb-checkbox">
              <input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)} />
              Encrypt with password (AES-256-GCM)
            </label>
            {encrypt && (
              <input
                type="password"
                className="dbm-search"
                placeholder="Encryption password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            )}
          </div>
        )}
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="3" active /><h3>Generate</h3></div>
        {progress && <ProgressBar value={progress.done} max={progress.total} label={`Exporting ${progress.collection}…`} />}
        <button className="btn btn-primary udb-export-btn" onClick={handleExport} disabled={!!progress}>
          ⬇️ Download Export
        </button>
      </div>

      {report && (
        <div className="udb-report udb-report--success">
          <div className="udb-report-header">✅ Export Report</div>
          <div className="udb-report-body">
            {report.map((r, i) => <div key={i}>✓ {r.collection}: {r.records} records → {r.file}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
