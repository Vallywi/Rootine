import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { useTimer } from '../lib/TimerContext.jsx';
import Plant, { PLANTS, STAGE_LABEL, stageFor } from '../components/Plant.jsx';
import { ConfirmDialog, FormError, GoalRing, formatClock } from '../components/ui.jsx';

export default function FocusPage() {
  const { settings } = useAuth();
  const t = useTimer();
  const { session } = t;
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [today, setToday] = useState(null);

  // Daily goal progress. Refresh after any session change.
  useEffect(() => {
    let alive = true;
    api.get(`/garden?tzOffset=${new Date().getTimezoneOffset()}`)
      .then((g) => { if (alive) setToday(g.stats.todaySessions); })
      .catch(() => {});
    return () => { alive = false; };
  }, [t.result, session?.id, session?.status]);

  // Show the time in the browser tab while a session runs.
  useEffect(() => {
    const running = session && (session.status === 'active' || session.status === 'paused');
    document.title = running ? `${formatClock(t.remainingMs)} · Rootine` : 'Rootine';
    return () => { document.title = 'Rootine'; };
  }, [session, t.remainingMs]);

  const goal = today !== null && <GoalRing done={today} goal={settings.dailyGoal} />;

  if (session && (session.status === 'active' || session.status === 'paused')) {
    return (
      <section className="stack">
        <RunningView t={t} onGiveUp={() => setConfirmGiveUp(true)} />
        <ConfirmDialog
          open={confirmGiveUp} danger
          title={session.kind === 'focus' ? 'Give up this session?' : 'Skip this break?'}
          confirmLabel={session.kind === 'focus' ? 'Yes, give up' : 'Skip break'}
          cancelLabel={session.kind === 'focus' ? 'Keep going' : 'Keep resting'}
          busy={t.busy}
          onCancel={() => setConfirmGiveUp(false)}
          onConfirm={async () => { await t.giveUp(); setConfirmGiveUp(false); }}
        >
          {session.kind === 'focus'
            ? <p>Your plant will wither and this session will not count toward your garden.</p>
            : <p>You can start your next focus session right away.</p>}
        </ConfirmDialog>
      </section>
    );
  }

  if (t.result) return <ResultView t={t} goal={goal} />;

  return <StartView t={t} goal={goal} />;
}

function RunningView({ t, onGiveUp }) {
  const { session } = t;
  const focus = session.kind === 'focus';
  const paused = session.status === 'paused';
  const percent = 1 - t.remainingMs / (session.plannedSeconds * 1000);
  const stage = stageFor(percent);
  return (
    <div className="card focus">
      <p className="chip">{focus ? (paused ? 'Paused' : 'Focusing') : session.kind === 'long_break' ? 'Long break' : 'Short break'}
        {session.taskTitle && <span className="chip__task"> · {session.taskTitle}</span>}</p>
      {focus ? <Plant type={session.plantType} stage={stage} size={200} fit="full" /> : <div className="break-art" aria-hidden="true">☕</div>}
      <p className="visually-hidden" role="status" aria-live="polite">{focus ? `${PLANTS[session.plantType].name}: ${STAGE_LABEL[stage]}` : 'Break in progress'}</p>
      <p className="clock" aria-label={`${formatClock(t.remainingMs)} remaining`}>{formatClock(t.remainingMs)}</p>
      <progress className="bar" max="1" value={Math.max(0, Math.min(1, percent))} aria-label="Session progress" />
      <FormError>{t.error}</FormError>
      <div className="row row--center">
        {focus && (paused
          ? <button className="btn" onClick={t.resume} disabled={t.busy}>Resume</button>
          : <button className="btn btn--ghost" onClick={t.pause} disabled={t.busy}>Pause</button>)}
        <button className="btn btn--ghost btn--danger-text" onClick={onGiveUp} disabled={t.busy}>{focus ? 'Give up' : 'Skip break'}</button>
      </div>
    </div>
  );
}

function ResultView({ t, goal }) {
  const { result } = t;
  const focusDone = result.kind === 'focus' && result.status === 'completed';
  const gaveUp = result.kind === 'focus' && result.status === 'given_up';
  const s = result.session;
  return (
    <section className="stack">
      <div className="card focus" role="status">
        {focusDone && <>
          <Plant type={s.plantType} stage="full" size={200} fit="full" />
          <h1>Your {PLANTS[s.plantType].name.toLowerCase()} is fully grown!</h1>
          <p className="muted">It is now in your garden. Time for a break?</p>
        </>}
        {gaveUp && <>
          <Plant type={s.plantType} stage="withered" size={200} fit="full" />
          <h1>Your plant withered</h1>
          <p className="muted">That is okay. A fresh seed is waiting whenever you are ready.</p>
        </>}
        {!focusDone && !gaveUp && <>
          <div className="break-art" aria-hidden="true">🌤</div>
          <h1>Break is over</h1>
          <p className="muted">Ready for another focus session?</p>
        </>}
        <FormError>{t.error}</FormError>
        <div className="row row--center">
          {focusDone && <button className="btn" onClick={t.startBreak} disabled={t.busy}>Start {t.nextBreak === 'long_break' ? 'long' : 'short'} break</button>}
          <button className={`btn ${focusDone ? 'btn--ghost' : ''}`} onClick={t.clearResult}>{focusDone ? 'Skip break' : 'Plant a new seed'}</button>
        </div>
      </div>
      {goal && <div className="card row row--center">{goal}</div>}
    </section>
  );
}

function StartView({ t, goal }) {
  const { settings } = useAuth();
  const [plant, setPlant] = useState('sunflower');
  const [taskId, setTaskId] = useState('');
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    api.get('/tasks').then((d) => setTasks(d.tasks.filter((x) => !x.isDone))).catch(() => {});
  }, []);
  const untilLong = Math.max(0, settings.longBreakInterval - t.focusSinceLongBreak);

  return (
    <section className="stack">
      <div className="card focus">
        <h1>Plant a seed</h1>
        <p className="muted">Focus for {settings.focusMinutes} minutes to grow it.</p>
        <Plant type={plant} stage="seed" size={160} fit="full" title={`${PLANTS[plant].name} seed`} />
        <fieldset className="plant-picker">
          <legend>Choose a plant</legend>
          {Object.entries(PLANTS).map(([key, p]) => (
            <label key={key} className={`plant-option ${plant === key ? 'is-selected' : ''}`}>
              <input type="radio" name="plant" value={key} checked={plant === key} onChange={() => setPlant(key)} />
              <Plant type={key} stage="full" size={56} title="" />
              <span>{p.name}</span>
            </label>
          ))}
        </fieldset>
        <div className="field field--center">
          <label htmlFor="task">Working on (optional)</label>
          <select id="task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No task</option>
            {tasks.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
        </div>
        <FormError>{t.error}</FormError>
        <button className="btn btn--big" disabled={t.busy} onClick={() => t.startFocus(plant, taskId ? Number(taskId) : null)}>
          {t.busy ? 'Starting…' : 'Start focus'}
        </button>
        <p className="muted small">
          {untilLong === 0 ? 'Your next break will be a long one.' : `${untilLong} more focus ${untilLong === 1 ? 'session' : 'sessions'} until a long break.`}
        </p>
      </div>
      {goal && <div className="card row row--center">{goal}</div>}
    </section>
  );
}
