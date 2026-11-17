import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTimer } from '../lib/TimerContext.jsx';
import GrowingPlant from './GrowingPlant.jsx';
import { PLANTS } from './Plant.jsx';
import { formatClock } from './ui.jsx';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d={d} fill="currentColor" /></svg>
);
const PAUSE = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z';
const OPEN = 'M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14zM5 6h5v2H6v10h10v-4h2v6H4V6z';
const CLOSE = 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z';

// A floating timer that follows the user on every tab, so a running session is never out of sight.
// It also shows the finished plant (with a Collect button) if the time ran out while the user was on another tab.
// On the Focus tab it stays hidden, because that screen already shows the full timer.
export default function TimerOverlay() {
  const t = useTimer();
  const { pathname } = useLocation();
  const { session, result } = t;
  const running = !!session && (session.status === 'active' || session.status === 'paused');
  const waiting = !running && !!result && result.kind === 'focus' && result.status === 'completed' && !result.collected;
  const breakDone = !running && !!result && result.kind !== 'focus' && result.status === 'completed';
  const [thanks, setThanks] = useState(false);
  const boxRef = useRef(null);

  // A short "added to your garden" flash after collecting from here.
  useEffect(() => {
    if (!result?.collected) { setThanks(false); return undefined; }
    setThanks(true);
    const id = setTimeout(() => setThanks(false), 3500);
    return () => clearTimeout(id);
  }, [result?.collected, result?.session?.id]);

  const visible = pathname !== '/' && (running || waiting || breakDone || thanks);

  // The time in the browser tab title, on every page.
  useEffect(() => {
    document.title = running ? `${formatClock(t.remainingMs)} · Rootine` : 'Rootine';
  }, [running, t.remainingMs]);

  // Leave room under the page content so the overlay never hides the last items.
  useEffect(() => {
    document.body.classList.toggle('has-timer-overlay', visible);
    return () => document.body.classList.remove('has-timer-overlay');
  }, [visible]);

  // Tell the page how tall the overlay is right now (it grows when it shows the Collect card).
  useEffect(() => {
    const el = boxRef.current;
    if (!visible || !el) { document.body.style.removeProperty('--timer-overlay-h'); return undefined; }
    const publish = () => document.body.style.setProperty('--timer-overlay-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => { ro.disconnect(); document.body.style.removeProperty('--timer-overlay-h'); };
  }, [visible, running, waiting, thanks]);

  if (!visible) return null;

  const focus = running && session.kind === 'focus';
  const paused = running && session.status === 'paused';
  const percent = running ? Math.max(0, Math.min(1, 1 - t.remainingMs / (session.plannedSeconds * 1000))) : 1;
  const plantName = result?.session?.plantType ? PLANTS[result.session.plantType].name : 'plant';

  let label;
  if (running) label = `${focus ? (paused ? 'Paused' : 'Focusing') : session.kind === 'long_break' ? 'Long break' : 'Short break'}${session.taskTitle ? ` · ${session.taskTitle}` : ''}`;
  else if (waiting) label = `Your ${plantName.toLowerCase()} is fully grown!`;
  else if (thanks) label = 'Added to your garden!';
  else label = 'Break is over';

  return (
    <aside ref={boxRef} className={`timer-overlay ${waiting ? 'is-done' : ''}`} aria-label="Timer">
      <p className="visually-hidden" role="status" aria-live="polite">{label}</p>

      <div className="timer-overlay__art" aria-hidden="true">
        {running && focus && <GrowingPlant type={session.plantType} progress={percent} size={52} title="" />}
        {running && !focus && <span className="timer-overlay__emoji">☕</span>}
        {waiting && <GrowingPlant type={result.session.plantType} progress={1} size={52} title="" />}
        {!running && !waiting && <span className="timer-overlay__emoji">{thanks ? '🎉' : '🌤'}</span>}
      </div>

      <div className="timer-overlay__info">
        <span className="timer-overlay__label">{label}</span>
        {running && <strong className="timer-overlay__time" role="timer">{formatClock(t.remainingMs)}</strong>}
        {waiting && <span className="timer-overlay__hint">Tap Collect to add it to your garden.</span>}
        {t.error && <span className="timer-overlay__error" role="alert">{t.error}</span>}
      </div>

      <div className="timer-overlay__actions">
        {running && focus && (paused
          ? <button type="button" className="icon-btn" aria-label="Resume" title="Resume" onClick={t.resume} disabled={t.busy}><Icon d={PLAY} /></button>
          : <button type="button" className="icon-btn" aria-label="Pause" title="Pause" onClick={t.pause} disabled={t.busy}><Icon d={PAUSE} /></button>)}
        {waiting && <button type="button" className="btn btn--small" onClick={t.collect} disabled={t.busy}>{t.busy ? 'Collecting…' : 'Collect'}</button>}
        {(running || waiting || breakDone) && <Link to="/" className="icon-btn" aria-label="Open the Focus screen" title="Open Focus"><Icon d={OPEN} /></Link>}
        {(waiting || breakDone) && <button type="button" className="icon-btn" aria-label="Dismiss" title="Dismiss" onClick={t.clearResult}><Icon d={CLOSE} /></button>}
      </div>

      {running && <progress className="bar timer-overlay__bar" max="1" value={percent} aria-hidden="true" />}
    </aside>
  );
}
