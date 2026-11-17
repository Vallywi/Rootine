import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as api from './api.js';
import { useAuth } from './AuthContext.jsx';
import { alertDone, alertSoon, countSound, goSound, ringBell, tickSound } from './alerts.js';
import { coinsForSeconds } from '../../../shared/shop.js';
import { nextPlant } from '../../../shared/plan.js';

// The study plan (how many rounds to keep going) is remembered in this browser, so a reload does not lose it.
const PLAN_KEY = 'rootine.plan';
const loadPlan = (userId) => {
  try { const p = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null'); return p && p.userId === userId ? p : null; }
  catch { return null; }
};

const TimerContext = createContext(null);
export const useTimer = () => useContext(TimerContext);

// The server owns the timer. The browser only shows target - (now + clockOffset).
export function TimerProvider({ children }) {
  const { user, settings, sessionEnded, demo } = useAuth();
  const [info, setInfo] = useState({ session: null, nextBreak: 'short_break', focusSinceLongBreak: 0 });
  const [offset, setOffset] = useState(0); // serverNow - Date.now()
  const [, setNow] = useState(Date.now()); // changes every 250 ms to repaint
  const [result, setResult] = useState(null); // last finished session, shown on the Focus screen
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const completing = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const demoRef = useRef(demo);
  demoRef.current = demo;

  // ----- study plan: after a break, count 3, 2, 1, GO and start the next round by itself
  const [plan, setPlanState] = useState(() => loadPlan(user?.id));
  const planRef = useRef(plan);
  const [planDone, setPlanDone] = useState(null); // { rounds, coins } when a plan has just finished
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, 0 (= GO), or null
  const countingFor = useRef(null);
  const userId = user?.id;
  const setPlan = useCallback((p) => {
    planRef.current = p;
    setPlanState(p);
    try { if (p) localStorage.setItem(PLAN_KEY, JSON.stringify({ ...p, userId })); else localStorage.removeItem(PLAN_KEY); } catch { /* storage may be blocked */ }
  }, [userId]);
  const beginCountdown = useCallback((sessionId) => {
    if (!planRef.current) return;
    if (sessionId != null && countingFor.current === sessionId) return; // the same break can be reported twice
    countingFor.current = sessionId;
    setCountdown(3);
  }, []);

  const apply = useCallback((data, { announce = false } = {}) => {
    setOffset(data.serverNow - Date.now());
    setInfo({ session: data.session, nextBreak: data.nextBreak, focusSinceLongBreak: data.focusSinceLongBreak });
    if (data.session && data.session.status === 'completed' && announce) {
      if (data.session.kind !== 'focus' && planRef.current) {
        // The break is over and a plan is running: one bell, then 3, 2, 1, GO instead of waiting for a tap.
        setResult(null);
        alertDone(data.session, settingsRef.current);
        const id = data.session.id;
        setTimeout(() => beginCountdown(id), 1500);
      } else {
        setResult({ kind: data.session.kind, status: 'completed', session: data.session });
        alertDone(data.session, settingsRef.current);
      }
    }
  }, [beginCountdown]);

  const guard = useCallback(async (fn) => {
    setError('');
    setBusy(true);
    try { return await fn(); }
    catch (err) {
      if (err.status === 401) sessionEnded();
      else if (err.status === 409 && err.body?.session !== undefined) apply(err.body); // someone else changed it, show the truth
      setError(err.message);
      return null;
    } finally { setBusy(false); }
  }, [apply, sessionEnded]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get('/sessions/current');
      // A session that finished while the tab was closed comes back once as "completed".
      apply(data, { announce: true });
    } catch (err) {
      if (err.status === 401) sessionEnded();
    }
  }, [user, apply, sessionEnded]);

  useEffect(() => {
    if (!user) { setInfo({ session: null, nextBreak: 'short_break', focusSinceLongBreak: 0 }); setResult(null); return; }
    refresh();
  }, [user, refresh]);

  // Refresh when the tab becomes visible again (background timers are throttled by browsers).
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refresh);
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('online', refresh); };
  }, [refresh]);

  const { session } = info;
  const active = session?.status === 'active';

  // Repaint about four times per second. The value is always recomputed from timestamps.
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);

  const remainingMs = !session ? 0
    : session.status === 'active' ? Math.max(0, session.targetAt - (Date.now() + offset)) // the state value only triggers repaints
    : session.status === 'paused' ? session.remainingMs : 0;

  // "Almost done": the last minute, or the last fifth of a short session.
  const warnMs = session ? Math.min(60_000, session.plannedSeconds * 200) : 0;
  const nearEnd = !!session && (session.status === 'active' || session.status === 'paused') && remainingMs > 0 && remainingMs <= warnMs;
  const warnedFor = useRef(null);
  useEffect(() => {
    if (nearEnd && session.status === 'active' && warnedFor.current !== session.id) {
      warnedFor.current = session.id;
      alertSoon(session, settingsRef.current);
    }
  }, [nearEnd, session]);

  // A beep every second for the last 10 seconds (the bell at zero is played when the session completes).
  const lastTick = useRef('');
  const secondsLeft = Math.ceil(remainingMs / 1000);
  useEffect(() => {
    if (!session || session.status !== 'active' || secondsLeft < 1 || secondsLeft > 10) return;
    const key = `${session.id}:${secondsLeft}`;
    if (lastTick.current === key) return;
    lastTick.current = key;
    tickSound(secondsLeft, settingsRef.current);
  }, [session, secondsLeft]);

  // Keep ringing until the plant is collected (or, after a break, until the next session is started or dismissed). Stops by itself after 5 minutes.
  const ringing = !!result && result.status === 'completed' && !result.collected && !(session && session.status !== 'completed');
  useEffect(() => {
    if (!ringing) return undefined;
    const id = setInterval(() => ringBell(settingsRef.current), 4000);
    const stop = setTimeout(() => clearInterval(id), 5 * 60 * 1000);
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [ringing, result?.session?.id]);

  // Start the next round of the plan with a different plant.
  const startNextRef = useRef(null);
  startNextRef.current = async () => {
    const pl = planRef.current;
    if (!pl) return;
    const plantType = nextPlant(pl.lastPlant, settingsRef.current.focusMinutes, { unlockAll: demoRef.current, used: pl.used || [] });
    const ok = await guard(async () => {
      const body = { kind: 'focus', plantType };
      if (pl.taskId) body.taskId = pl.taskId;
      apply(await api.post('/sessions', body));
      return true;
    });
    if (ok) setPlan({ ...pl, lastPlant: plantType, used: [...(pl.used || []), plantType] });
    else setPlan(null); // something is in the way (for example the task was deleted): stop here and show the message
  };

  // 3, 2, 1, GO (each number lasts one second, GO a little less).
  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown > 0) countSound(countdown, settingsRef.current); else goSound(settingsRef.current);
    const id = setTimeout(() => {
      if (countdown > 0) setCountdown(countdown - 1);
      else { setCountdown(null); startNextRef.current?.(); }
    }, countdown > 0 ? 1000 : 900);
    return () => clearTimeout(id);
  }, [countdown]);

  // The "Time to rest" message fades after a few seconds.
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const complete = useCallback(async () => {
    if (completing.current || !session) return;
    completing.current = true;
    try {
      const data = await api.post(`/sessions/${session.id}/complete`);
      apply(data, { announce: true });
    } catch (err) {
      if (err.status === 409 && err.body?.session !== undefined) {
        // The server clock is slightly behind ours. Wait a moment before asking again.
        await new Promise((r) => setTimeout(r, 1000));
        apply(err.body);
      } else if (err.status === 401) sessionEnded();
    } finally { completing.current = false; }
  }, [session, apply, sessionEnded]);

  // When the countdown reaches zero, ask the server to complete (it checks the time itself).
  useEffect(() => {
    if (active && remainingMs <= 0) complete();
  }, [active, remainingMs, complete]);

  const value = {
    session, remainingMs, nearEnd, serverOffset: offset,
    nextBreak: info.nextBreak, focusSinceLongBreak: info.focusSinceLongBreak,
    result, clearResult: () => setResult(null),
    busy, error, clearError: () => setError(''),
    refresh,
    // planSpec: null for a single session, or { rounds } (rounds null = keep going until stopped).
    startFocus: (plantType, taskId, minutes, planSpec) => guard(async () => {
      const body = { kind: 'focus', plantType };
      if (taskId) body.taskId = taskId;
      if (minutes) body.minutes = minutes;
      setResult(null);
      setPlanDone(null);
      apply(await api.post('/sessions', body));
      setCountdown(null);
      countingFor.current = null;
      setPlan(planSpec ? { rounds: planSpec.rounds, done: 0, coins: 0, lastPlant: plantType, used: [plantType], taskId: taskId || null, startedAt: Date.now() } : null);
    }),
    plan, planDone, clearPlanDone: () => setPlanDone(null),
    countdown,
    stopPlan: () => { setPlan(null); setCountdown(null); countingFor.current = null; },
    startBreak: () => guard(async () => { setResult(null); apply(await api.post('/sessions', { kind: 'break' })); }),
    pause: () => guard(async () => apply(await api.post(`/sessions/${session.id}/pause`))),
    resume: () => guard(async () => apply(await api.post(`/sessions/${session.id}/resume`))),
    // Move the finished plant into the garden. Repeating the call is safe (the server ignores the second one).
    collect: (name) => guard(async () => {
      const finished = result?.session;
      if (!finished) return;
      const given = typeof name === 'string' ? name.trim() : ''; // buttons pass a click event here, which is ignored
      await api.post(`/sessions/${finished.id}/collect`, given ? { name: given } : {});
      const earned = coinsForSeconds(finished.plannedSeconds);
      const pl = planRef.current;
      if (pl) {
        const done = pl.done + 1;
        const next = { ...pl, done, coins: (pl.coins || 0) + earned };
        if (pl.rounds !== null && done >= pl.rounds) {
          // That was the last round of the plan: no more rest, show the summary.
          setPlan(null);
          setResult(null);
          setPlanDone({ rounds: done, coins: next.coins });
          return;
        }
        setPlan(next);
      }
      // Keep the rhythm going: the rest starts by itself right after the plant is collected.
      try {
        const data = await api.post('/sessions', { kind: 'break' });
        setResult(null);
        apply(data);
        setNotice(`Plant added to your garden! +${earned} coins. Time to rest.`);
      } catch {
        setResult((r) => (r ? { ...r, collected: true } : r)); // show the normal "added" screen with a Start break button
      }
    }),
    notice, clearNotice: () => setNotice(''),
    giveUp: () => guard(async () => {
      const kind = session.kind;
      const data = await api.post(`/sessions/${session.id}/give-up`);
      apply(data);
      setResult(kind === 'focus' ? { kind, status: 'given_up', session: data.session } : null);
      if (kind === 'focus') setPlan(null); // giving up a plant ends the plan
      else if (planRef.current) beginCountdown(session.id); // skipping a break goes straight to the next round
    }),
  };
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
