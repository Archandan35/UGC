export default function SaveNext({ onSave, onNext, onMark, disabled }) {
  return (
    <div className="save-next-bar">
      <button className="btn-secondary" onClick={onMark} disabled={disabled}>Mark for Review</button>
      <button className="btn-secondary" onClick={onSave} disabled={disabled}>Save</button>
      <button className="btn-primary" onClick={onNext} disabled={disabled}>Save &amp; Next</button>
    </div>
  );
}
