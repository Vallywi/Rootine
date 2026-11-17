import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTimerView } from '../lib/useTimerView.js';
import GrowingPlant from './GrowingPlant.jsx';
import { formatClock } from './ui.jsx';
import { coinsForSeconds } from '../../../shared/shop.js';

// "Pop out" puts a small timer window on top of everything else: other browser tabs, other windows, other apps.
// It uses the browser's Picture-in-Picture window (Chrome and Edge on a computer). Elsewhere the button is hidden,
// and the time is still shown in the browser tab title.
export const popOutSupported = () => typeof window !== 'undefined' && 'documentPictureInPicture' in window;
export const requestPopOut = () => window.dispatchEvent(new Event('rootine:popout'));

const PAUSE = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z';
const Icon = ({ d }) => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d={d} fill="currentColor" /></svg>;

// The picture inside the pop-out window. It lives in its own React root, so it only gets plain values and functions.
// A small scene: sky with a sun or moon and clouds, a card with the plant and the time, and a strip of grass with flowers.
function PipView({ v }) {
  const pct = Math.round(Math.max(0, Math.min(1, v.percent)) * 100);
  // "Focusing · Read chapter 4" is shown as a short badge plus the task name on its own line.
  const parts = String(v.label).split(' \u00B7 ');
  const main = parts[0];
  const task = parts.slice(1).join(' \u00B7 ');
  return (
    <div className={`pip pip--${v.mode} ${v.mode === 'done' ? 'is-done' : ''} ${v.near ? 'is-near' : ''} ${v.paused ? 'is-paused' : ''}`}>
      <div className="pip__sky" aria-hidden="true">
        <span className="pip__sun" />
        <span className="pip__cloud pip__cloud--1" /><span className="pip__cloud pip__cloud--2" />
        {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="pip__star" style={{ left: `${8 + i * 16}%`, top: `${6 + (i % 3) * 9}%`, animationDelay: `${i * 0.4}s` }} />)}
      </div>

      <div className="pip__card">
        <div className="pip__art" aria-hidden="true">
          <span className="pip__mound" />
          {v.plantType ? <GrowingPlant type={v.plantType} progress={v.percent} size={72} title="" /> : <span className="pip__emoji">{v.emoji}</span>}
        </div>
        <div className="pip__info">
          <span className="pip__label">{main}</span>
          {v.mode === 'run' && <strong className="pip__time" role="timer">{v.time}</strong>}
          {v.mode === 'run' && task && <span className="pip__task" title={task}>{task}</span>}
          {v.mode === 'done' && v.coins > 0 && <span className="pip__coins"><span aria-hidden="true">{'\uD83E\uDE99'}</span> +{v.coins} coins when you collect</span>}
          {v.near && <span className="pip__soon">Almost there!</span>}
          {v.paused && <span className="pip__soon pip__soon--paused">Paused</span>}
          {v.error && <span className="pip__error" role="alert">{v.error}</span>}
        </div>
        <div className="pip__actions">
          {v.mode === 'run' && v.canPause && (
            <button type="button" className="icon-btn pip__btn" aria-label={v.paused ? 'Resume' : 'Pause'} title={v.paused ? 'Resume' : 'Pause'} onClick={v.onToggle} disabled={v.busy}>
              <Icon d={v.paused ? PLAY : PAUSE} />
            </button>
          )}
          {v.mode === 'done' && <button type="button" className="btn btn--small pip__collect" onClick={v.onCollect} disabled={v.busy}>{v.busy ? 'Collecting...' : 'Collect'}</button>}
        </div>
        {v.mode === 'run' && (
          <div className="pip__track" aria-hidden="true">
            <span className="pip__fill" style={{ width: `${pct}%` }} />
            <span className="pip__knob" style={{ left: `${pct}%` }}>{'\uD83C\uDF31'}</span>
          </div>
        )}
        {v.mode === 'run' && <progress className="visually-hidden" max="1" value={v.percent} aria-label="Session progress" />}
      </div>

      <div className="pip__grass" aria-hidden="true">
        {[8, 22, 37, 52, 66, 81, 92].map((x, i) => <span key={x} className={`pip__bloom pip__bloom--${i % 3}`} style={{ left: `${x}%` }} />)}
      </div>
      {v.mode === 'done' && <div className="pip__sparkles" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} style={{ left: `${10 + i * 13}%`, animationDelay: `${i * 0.25}s` }}>{'\u2728'}</i>)}</div>}
    </div>
  );
}

export default function PopOutTimer() {
  const view = useTimerView();
  const { t, session, running, waiting, breakDone, thanks, focus, paused, percent, label, any, nearEnd } = view;
  const winRef = useRef(null);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    try { rootRef.current?.unmount(); } catch { /* already gone */ }
    try { winRef.current?.close(); } catch { /* already closed */ }
    rootRef.current = null;
    winRef.current = null;
    setOpen(false);
  }, []);

  const openWindow = useCallback(async () => {
    if (!popOutSupported()) return;
    if (winRef.current) { try { winRef.current.focus(); } catch { /* ignore */ } return; }
    try {
      const pip = await window.documentPictureInPicture.requestWindow({ width: 340, height: 168 });
      // The new window starts empty, so give it the same look as the app.
      for (const sheet of document.styleSheets) {
        if (sheet.href) {
          const link = pip.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          pip.document.head.appendChild(link);
        } else {
          try {
            const style = pip.document.createElement('style');
            style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n');
            pip.document.head.appendChild(style);
          } catch { /* a sheet from another site cannot be read */ }
        }
      }
      pip.document.title = 'Rootine timer';
      pip.document.body.className = 'pip-body';
      const mount = pip.document.createElement('div');
      pip.document.body.appendChild(mount);
      rootRef.current = createRoot(mount);
      winRef.current = pip;
      pip.addEventListener('pagehide', () => { rootRef.current = null; winRef.current = null; setOpen(false); });
      setOpen(true);
    } catch (err) {
      // The user closed the prompt, or the browser refused. Say why in the console, to help when it does not open.
      console.warn('[pop-out] could not open the window:', err && err.message);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('rootine:popout', openWindow);
    return () => window.removeEventListener('rootine:popout', openWindow);
  }, [openWindow]);

  // Keep the window up to date on every change.
  useEffect(() => {
    if (!open || !rootRef.current || !winRef.current) return;
    winRef.current.document.documentElement.dataset.theme = document.documentElement.dataset.theme || 'light';
    const mode = running ? 'run' : waiting ? 'done' : 'note';
    rootRef.current.render(
      <PipView
        v={{
          mode,
          label,
          time: formatClock(t.remainingMs),
          percent,
          plantType: running && focus ? session.plantType : waiting ? view.result.session.plantType : null,
          emoji: running ? '☕' : thanks ? '🎉' : '🌤',
          paused,
          near: nearEnd,
          coins: waiting ? coinsForSeconds(view.result.session.plannedSeconds) : 0,
          canPause: focus,
          busy: t.busy,
          error: t.error,
          onToggle: paused ? t.resume : t.pause,
          onCollect: t.collect,
        }}
      />,
    );
  });

  // Nothing left to show: close the window by itself after a moment.
  useEffect(() => {
    if (!open || any) return undefined;
    const id = setTimeout(close, 1200);
    return () => clearTimeout(id);
  }, [open, any, close]);

  // Close it if the page goes away.
  useEffect(() => () => close(), [close]);

  return null;
}
