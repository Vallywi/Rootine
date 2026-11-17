import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as api from './api.js';
import { useAuth } from './AuthContext.jsx';
import { alertDone } from './alerts.js';

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
    session, remainingMs, serverOffset: offset,
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
    collect: () => guard(async () => {
      const finished = result?.session;
      if (!finished) return;
      await api.post(`/sessions/${finished.id}/collect`);
      setResult((r) => (r ? { ...r, collected: true } : r));
    }),
    giveUp: () => guard(async () => {
      const kind = session.kind;
      const data = await api.post(`/sessions/${session.id}/give-up`);
      apply(data);
      setResult(kind === 'focus' ? { kind, status: 'given_up', session: data.session } : null);
    }),
  };
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
