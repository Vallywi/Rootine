import { useTimer } from '../lib/TimerContext.jsx';

// "3, 2, 1, GO!" between a finished break and the next focus round of the study plan.
export default function CountdownOverlay() {
  const t = useTimer();
  const n = t.countdown;
  if (n === null || n === undefined) return null;
  const pl = t.plan;
  return (
    <div className="countdown" role="status" aria-live="assertive">
      <div className="countdown__card">
        <p className="countdown__title">{n > 0 ? 'Next round starts in' : 'Let us grow!'}</p>
        <div key={n} className={`countdown__num ${n === 0 ? 'is-go' : ''}`} aria-hidden="true">{n > 0 ? n : 'GO!'}</div>
        <span className="visually-hidden">{n > 0 ? n : 'Go'}</span>
        {pl && <p className="muted">Round {pl.done + 1}{pl.rounds ? ` of ${pl.rounds}` : ''}. A new plant is on the way.</p>}
        <button type="button" className="btn btn--ghost" onClick={t.stopPlan}>Stop the plan</button>
      </div>
    </div>
  );
}
