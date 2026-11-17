import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTimerView } from '../lib/useTimerView.js';
import GrowingPlant from './GrowingPlant.jsx';
import { popOutSupported, requestPopOut } from './PopOutTimer.jsx';
import { formatClock } from './ui.jsx';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d={d} fill="currentColor" /></svg>
);
const PAUSE = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z';
const OPEN = 'M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14zM5 6h5v2H6v10h10v-4h2v6H4V6z';
const CLOSE = 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z';
const POP = 'M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z';

// A floating timer that follows the user, so a running session is never out of sight.
//  - On every tab except Focus it is always shown.
//  - On Focus it appears only when the big timer has been scrolled out of view.
//  - If the time runs out while the user is elsewhere, it shows the finished plant with a Collect button.
// For a timer that stays visible over other browser tabs and other apps, see PopOutTimer.
export default function TimerOverlay() {
  const v = useTimerView();
  const { t, session, result, running, waiting, breakDone, thanks, focus, paused, percent, label, any, nearEnd } = v;
  const { pathname } = useLocation();
  const onFocusTab = pathname === '/';
  const boxRef = useRef(null);

  // On the Focus tab, is the big timer still on screen?
  const [bigClockSeen, setBigClockSeen] = useState(true);
  useEffect(() => {
    if (!onFocusTab || !running) { setBigClockSeen(true); return undefined; }
    const check = () => {
      const el = document.querySelector('.focus .clock');
      if (!el) { setBigClockSeen(true); return; }
      const r = el.getBoundingClientRect();
      setBigClockSeen(r.bottom > 56 && r.top < window.innerHeight - 56);
    };
    check();
    const id = setInterval(check, 400);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { clearInterval(id); window.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [onFocusTab, running]);

  const visible = any && (!onFocusTab || (running && !bigClockSeen));

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

  return (
    <aside ref={boxRef} className={`timer-overlay ${waiting ? 'is-done' : ''} ${nearEnd ? 'is-near' : ''}`} aria-label="Timer">
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
        {nearEnd && <span className="timer-overlay__hint">Almost there</span>}
        {waiting && <span className="timer-overlay__hint">Tap Collect to add it to your garden.</span>}
        {t.error && <span className="timer-overlay__error" role="alert">{t.error}</span>}
      </div>

      <div className="timer-overlay__actions">
        {running && focus && (paused
          ? <button type="button" className="icon-btn" aria-label="Resume" title="Resume" onClick={t.resume} disabled={t.busy}><Icon d={PLAY} /></button>
          : <button type="button" className="icon-btn" aria-label="Pause" title="Pause" onClick={t.pause} disabled={t.busy}><Icon d={PAUSE} /></button>)}
        {waiting && <button type="button" className="btn btn--small" onClick={t.collect} disabled={t.busy}>{t.busy ? 'Collecting…' : 'Collect'}</button>}
        {running && popOutSupported() && (
          <button type="button" className="icon-btn" aria-label="Pop out the timer" title="Pop out: keep it on top of other tabs and apps" onClick={requestPopOut}><Icon d={POP} /></button>
        )}
        {onFocusTab ? null : (running || waiting || breakDone) && <Link to="/" className="icon-btn" aria-label="Open the Focus screen" title="Open Focus"><Icon d={OPEN} /></Link>}
        {(waiting || breakDone) && <button type="button" className="icon-btn" aria-label="Dismiss" title="Dismiss" onClick={t.clearResult}><Icon d={CLOSE} /></button>}
      </div>

      {running && <progress className="bar timer-overlay__bar" max="1" value={percent} aria-hidden="true" />}
    </aside>
  );
}
