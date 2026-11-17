import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { useTimer } from '../lib/TimerContext.jsx';
import { useGrowLoop } from '../lib/useGrowLoop.js';
import GrowingPlant, { prefersReducedMotion } from './GrowingPlant.jsx';
import Plant from './Plant.jsx';
import Confetti from './Confetti.jsx';

// A short guided tour for beginners. Steps with a `target` light up that part of the page.
// Steps without one (or whose target is not on screen) are shown in the middle.
const STEPS = [
  { id: 'welcome', demo: 'sprout', title: 'Welcome to Rootine! 🌱', text: 'Rootine turns your focus time into a garden. Here is a quick tour, about one minute. You can skip it any time.' },
  { id: 'presets', target: 'presets', title: '1. Pick your rhythm ⏱️', text: 'Choose how long to focus and how long to rest. 25 / 5 Classic is a great start if you are new. Want something else? Tap Custom.' },
  { id: 'plants', target: 'plants', title: '2. Choose a seed 🌻', text: 'Pick the plant you want to grow. They all grow the same way: stay focused and it blooms.' },
  { id: 'task', target: 'task', title: '3. What are you working on? 📝', text: 'This is optional. Add tasks in the Tasks tab, then pick one here to count the Pomodoros you spend on it.' },
  { id: 'start', target: 'start', title: '4. Press Start focus ▶️', text: 'The timer runs on our server, so refreshing the page or closing the tab will not lose your progress.' },
  { id: 'grow', demo: 'grow', title: '5. Stay focused 🌿', text: 'Your plant grows while the timer runs. You can pause if you need to. If you give up, the plant withers.' },
  { id: 'collect', demo: 'collect', title: '6. Collect your plant 🧺', text: 'When the time is up, tap Collect plant to add it to your Garden. Then enjoy your break!' },
  { id: 'nav', target: 'nav', title: '7. Explore 🧭', text: 'Tasks is your to-do list. Garden shows your plants, streaks, and badges. Settings has your goal, theme, and details.' },
  { id: 'done', demo: 'done', title: 'You are ready! 🎉', text: 'Plant your first seed whenever you like. Need this tour again? Tap the ? button at the top, or open Settings.' },
];

const findTarget = (name) =>
  [...document.querySelectorAll(`[data-tour="${name}"]`)].find((el) => el.getClientRects().length > 0) || null;

function Demo({ kind }) {
  const loop = useGrowLoop(4200, 1200);
  if (kind === 'sprout') return <GrowingPlant type="sunflower" progress={0.3} size={92} title="" />;
  if (kind === 'grow') return <GrowingPlant type="tulip" progress={loop} size={92} title="" />;
  if (kind === 'collect') return (
    <div className="tour__demo-collect">
      <Plant type="cactus" stage="full" size={80} title="" />
      <span className="tour__basket" aria-hidden="true">🧺</span>
    </div>
  );
  return (
    <div className="tour__demo-done">
      <GrowingPlant type="sunflower" progress={1} size={92} title="" />
      <Confetti count={14} />
    </div>
  );
}

// Open it from anywhere with: window.dispatchEvent(new Event('rootine:tour'))
export default function Tour() {
  const { user } = useAuth();
  const { session } = useTimer();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const storageKey = `rootine.tour.v1.${user.id}`;

  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const seen = useCallback(() => {
    try { return !!localStorage.getItem(storageKey); } catch { return true; } // no storage: do not nag
  }, [storageKey]);

  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setOpen(false);
  }, [storageKey]);

  // First visit: open the tour on the Focus screen once the page has settled.
  useEffect(() => {
    if (seen() || session || pathname !== '/') return undefined;
    const id = setTimeout(() => { setI(0); setOpen(true); }, 900);
    return () => clearTimeout(id);
  }, [pathname, session, seen]);

  // Replay from the ? button or from Settings.
  useEffect(() => {
    const start = () => { setI(0); setOpen(true); if (window.location.pathname !== '/') navigate('/'); };
    window.addEventListener('rootine:tour', start);
    return () => window.removeEventListener('rootine:tour', start);
  }, [navigate]);

  // Scroll the highlighted part into view when the step changes.
  useEffect(() => {
    if (!open || !step.target) return;
    const el = findTarget(step.target);
    el?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the highlighted element while it moves (scrolling, resizing).
  useEffect(() => {
    if (!open) return undefined;
    let raf; let lastKey = '';
    const tick = () => {
      const el = step.target ? findTarget(step.target) : null;
      let next = null;
      if (el) { const r = el.getBoundingClientRect(); next = { top: r.top, left: r.left, width: r.width, height: r.height }; }
      const key = next ? `${Math.round(next.top)},${Math.round(next.left)},${Math.round(next.width)},${Math.round(next.height)}` : 'none';
      if (key !== lastKey) { lastKey = key; setRect(next); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open) nextRef.current?.focus(); }, [open, i]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); finish(); return; }
    if (e.key !== 'Tab') return;
    const items = [...cardRef.current.querySelectorAll('button')].filter((b) => !b.disabled);
    if (!items.length) return;
    const first = items[0], lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastItem.focus(); }
    else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); first.focus(); }
  };

  const pad = 10;
  const vw = window.innerWidth, vh = window.innerHeight;
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : { top: vh / 2, left: vw / 2, width: 0, height: 0 }; // nothing to highlight: just dim the page
  const cardOnTop = !!rect && rect.top + rect.height / 2 > vh * 0.55;

  return (
    <div className="tour" onKeyDown={onKeyDown}>
      <div className="tour__blocker" />
      <div className={`tour__spot ${rect ? 'has-target' : ''}`} style={spot} aria-hidden="true" />
      <div
        ref={cardRef}
        className={`tour__card ${cardOnTop ? 'tour__card--top' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
      >
        <div className="tour__body" key={step.id}>
          {step.demo && <div className="tour__demo" aria-hidden="true"><Demo kind={step.demo} /></div>}
          <h2 id="tour-title">{step.title}</h2>
          <p id="tour-text">{step.text}</p>
        </div>
        <div className="tour__dots" role="img" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((s, n) => <span key={s.id} className={`dot ${n <= i ? 'is-on' : ''}`} />)}
        </div>
        <div className="row row--between">
          {!last ? <button type="button" className="btn btn--ghost btn--small" onClick={finish}>Skip tour</button> : <span />}
          <div className="row">
            {i > 0 && <button type="button" className="btn btn--ghost btn--small" onClick={() => setI(i - 1)}>Back</button>}
            <button type="button" ref={nextRef} className="btn btn--small" onClick={() => (last ? finish() : setI(i + 1))}>
              {last ? 'Let’s plant!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
