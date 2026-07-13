/**
 * components/exam/LeaveExamModal.jsx
 *
 * Animated confirmation modal shown when a student tries to exit an exam.
 * Reuses existing CSS classes (.ph-dialog-overlay, .ph-dialog, etc.)
 * and adds `.leave-modal-*` classes for the two-button row layout.
 *
 * Props:
 *   show         boolean   — whether to render the modal
 *   onContinue   function  — called when student clicks "Continue Exam"
 *   onLeave      function  — called when student clicks "Leave" (saves + exits)
 */
export default function LeaveExamModal({ show, onContinue, onLeave }) {
  if (!show) return null;

  return (
    <div
      className="ph-dialog-overlay leave-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      aria-describedby="leave-modal-desc"
    >
      <div className="ph-dialog leave-modal">
        <div className="ph-dialog-icon" aria-hidden="true">🚪</div>

        <h3 className="ph-dialog-title" id="leave-modal-title">
          Do you want to leave the exam?
        </h3>

        <p className="ph-dialog-sub" id="leave-modal-desc">
          If you leave now, your exam progress, selected answers, and timer
          state will be saved automatically. You can resume the exam later.
        </p>

        <div className="leave-modal-actions">
          <button
            className="leave-modal-btn leave-modal-btn-continue"
            onClick={onContinue}
            autoFocus
          >
            ✅ Continue Exam
          </button>
          <button
            className="leave-modal-btn leave-modal-btn-leave"
            onClick={onLeave}
          >
            🚪 Save &amp; Leave
          </button>
        </div>
      </div>
    </div>
  );
}
