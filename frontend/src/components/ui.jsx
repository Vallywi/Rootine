import { useEffect, useId, useRef, useState } from 'react';

// Label, hint, and error tied to the input. Errors use text and an icon, not color alone.
export function Field({ label, hint, error, children }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined })}
      {hint && !error && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="error" id={`${id}-err`} role="alert"><span aria-hidden="true">⚠ </span>{error}</p>}
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return <p className="form-error" role="alert"><span aria-hidden="true">⚠ </span>{children}</p>;
}

// Native <dialog>: focus is trapped and Escape closes it.
export function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancel', danger, busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="dialog-title">
      <form method="dialog" onSubmit={(e) => { e.preventDefault(); onConfirm(); }}>
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog__body">{children}</div>
        <div className="row row--end">
          <button type="button" className="btn btn--ghost" onClick={onCancel} autoFocus>{cancelLabel}</button>
          <button type="submit" className={`btn ${danger ? 'btn--danger' : ''}`} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</button>
        </div>
      </form>
    </dialog>
  );
}

// "3 of 4 today" ring. The number is also written as text.
export function GoalRing({ done, goal, size = 108 }) {
  const target = Math.min(1, goal ? done / goal : 0);
  const [pct, setPct] = useState(0); // starts empty, then fills with a transition
  useEffect(() => {
    const id = requestAnimationFrame(() => setPct(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="goal-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="goal-ring__track" fill="none" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} className="goal-ring__bar" fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 50 50)" />
      </svg>
      <div className="goal-ring__text"><strong>{done}</strong><span>of {goal} today</span></div>
    </div>
  );
}

export const formatClock = (ms) => {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60), s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const formatDate = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
