import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as api from './api.js';
import { useAuth } from './AuthContext.jsx';
import { alertDone, alertSoon, ringBell, tickSound } from './alerts.js';
import { coinsForSeconds } from '../../../shared/shop.js';

const TimerContext = createContext(null);
export const useTimer = () => useContext(TimerContext);

// The server owns the timer. The browser only shows target - (now + clockOffset).
export function TimerProvider({ children }) {
  const { user, settings, sessionEnded } = useAuth();
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

  const apply = useCallback((data, { announce = false } = {}) => {
    setOffset(data.serverNow - Date.now());
    setInfo({ session: data.session, nextBreak: data.nextBreak, focusSinceLongBreak: data.focusSinceLongBreak });
    if (data.session && data.session.status === 'completed' && announce) {
      setResult({ kind: data.session.kind, status: 'completed', session: data.session });
      alertDone(data.session, settingsRef.current);
    }
  }, []);

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
    startFocus: (plantType, taskId, minutes) => guard(async () => {
      const body = { kind: 'focus', plantType };
      if (taskId) body.taskId = taskId;
      if (minutes) body.minutes = minutes;
      setResult(null);
      apply(await api.post('/sessions', body));
    }),
    startBreak: () => guard(async () => { setResult(null); apply(await api.post('/sessions', { kind: 'break' })); }),
    pause: () => guard(async () => apply(await api.post(`/sessions/${session.id}/pause`))),
    resume: () => guard(async () => apply(await api.post(`/sessions/${session.id}/resume`))),
    // Move the finished plant into the garden. Repeating the call is safe (the server ignores the second one).
    collect: (name) => guard(async () => {
      const finished = result?.session;
      if (!finished) return;
      const given = typeof name === 'string' ? name.trim() : ''; // buttons pass a click event here, which is ignored
      await api.post(`/sessions/${finished.id}/collect`, given ? { name: given } : {});
      // Keep the rhythm going: the rest starts by itself right after the plant is collected.
      try {
        const data = await api.post('/sessions', { kind: 'break' });
        setResult(null);
        apply(data);
        setNotice(`Plant added to your garden! +${coinsForSeconds(finished.plannedSeconds)} coins. Time to rest.`);
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
    }),
  };
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
