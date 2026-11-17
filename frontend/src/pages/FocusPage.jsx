import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { useTimer } from '../lib/TimerContext.jsx';
import Plant, { PLANTS, STAGE_LABEL, stageFor } from '../components/Plant.jsx';
import GrowingPlant from '../components/GrowingPlant.jsx';
import Confetti from '../components/Confetti.jsx';
import PresetPicker from '../components/PresetPicker.jsx';
import { popOutSupported, requestPopOut } from '../components/PopOutTimer.jsx';
import { ConfirmDialog, FormError, GoalRing, formatClock } from '../components/ui.jsx';
import { coinsForSeconds } from '../../../shared/shop.js';
import { CUSTOM_HOURS, PLAN_CHOICES, hoursText, planFor, planMinutes } from '../../../shared/plan.js';

export default function FocusPage() {
  const { settings } = useAuth();
  const t = useTimer();
  const { session } = t;
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [today, setToday] = useState(null);
  const [pending, setPending] = useState(0);
  const [note, setNote] = useState('');

  // Daily goal progress and plants waiting to be collected. Refresh after any session change.
  const refreshGarden = useCallback(async () => {
    try {
      const g = await api.get(`/garden?tzOffset=${new Date().getTimezoneOffset()}`);
      setToday(g.stats.todaySessions);
      setPending(g.pending.length);
    } catch { /* the numbers are decorative here */ }
  }, []);
  useEffect(() => { refreshGarden(); }, [refreshGarden, t.result, session?.id, session?.status]);

  const collectAll = async () => {
    setNote('');
    try {
      const r = await api.post('/sessions/collect-all');
      setNote(r.collected === 1 ? 'Collected 1 plant! 🌱' : `Collected ${r.collected} plants! 🌱`);
      await refreshGarden();
    } catch (err) { setNote(err.message); }
  };


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

  return <StartView t={t} goal={goal} pending={pending} note={note} onCollectAll={collectAll} />;
}

function RunningView({ t, onGiveUp }) {
  const { session } = t;
  const focus = session.kind === 'focus';
  const paused = session.status === 'paused';
  const percent = Math.max(0, Math.min(1, 1 - t.remainingMs / (session.plannedSeconds * 1000)));
  const stage = stageFor(percent);
  return (
    <div className="card focus">
      {t.notice && <p className="success notice-pop" role="status">{t.notice}</p>}
      {t.plan && (
        <p className="plan-line" role="status">
          {focus ? `Round ${t.plan.done + 1}${t.plan.rounds ? ` of ${t.plan.rounds}` : ''}` : `Rest after round ${t.plan.done}`}
          <button type="button" className="plan-line__stop" onClick={t.stopPlan}>Stop plan</button>
        </p>
      )}
      <p className="chip">{focus ? (paused ? 'Paused' : 'Focusing') : session.kind === 'long_break' ? 'Long break' : 'Short break'}
        {session.taskTitle && <span className="chip__task"> · {session.taskTitle}</span>}</p>
      {focus
        ? <GrowingPlant type={session.plantType} progress={percent} size={220} />
        : <div className="break-art" aria-hidden="true">☕</div>}
      <p className="visually-hidden" role="status" aria-live="polite">{focus ? `${PLANTS[session.plantType].name}: ${STAGE_LABEL[stage]}` : 'Break in progress'}</p>
      <p className={`clock ${t.nearEnd ? 'is-near' : ''}`} aria-label={`${formatClock(t.remainingMs)} remaining`}>{formatClock(t.remainingMs)}</p>
      {t.nearEnd && <p className="near-note" role="status">{focus ? 'Almost there. Your plant is nearly fully grown.' : 'Almost done. Your break is ending.'}</p>}
      <progress className="bar" max="1" value={percent} aria-label="Session progress" />
      {focus && <p className="muted small grow-note">🌱 Your plant grows while you focus</p>}
      <FormError>{t.error}</FormError>
      <div className="row row--center">
        {focus && (paused
          ? <button className="btn" onClick={t.resume} disabled={t.busy}>Resume</button>
          : <button className="btn btn--ghost" onClick={t.pause} disabled={t.busy}>Pause</button>)}
        <button className="btn btn--ghost btn--danger-text" onClick={onGiveUp} disabled={t.busy}>{focus ? 'Give up' : 'Skip break'}</button>
        {popOutSupported() && <button type="button" className="btn btn--ghost" onClick={requestPopOut} title="Keep the timer on top of other tabs and apps">Pop out timer</button>}
      </div>
    </div>
  );
}

function ResultView({ t, goal }) {
  const { result } = t;
  const [plantName, setPlantName] = useState('');
  const focusDone = result.kind === 'focus' && result.status === 'completed';
  const gaveUp = result.kind === 'focus' && result.status === 'given_up';
  const s = result.session;
  const collected = !!result.collected;
  return (
    <section className="stack">
      <div className={`card focus ${collected ? 'is-collected' : ''}`} role="status">
        {focusDone && <>
          <div className="plant-stage">
            <GrowingPlant type={s.plantType} progress={1} size={220} />
            <Confetti key={collected ? 'collected' : 'grown'} count={collected ? 12 : 20} />
            {collected && <span className="plus-one" aria-hidden="true">+1 🌱</span>}
          </div>
          {collected ? (
            <>
              <h1>Added to your garden! 🎉</h1>
              <p className="muted">Your {PLANTS[s.plantType].name.toLowerCase()} is safe in your garden now.</p>
            </>
          ) : (
            <>
              <h1>Your {PLANTS[s.plantType].name.toLowerCase()} is fully grown!</h1>
              <p className="muted">Collect it to add it to your garden and earn <strong>{'\uD83E\uDE99'} {coinsForSeconds(s.plannedSeconds)} coins</strong>.</p>
              <div className="name-field">
                <label htmlFor="plant-name">Name your plant (optional)</label>
                <input id="plant-name" value={plantName} maxLength={30} placeholder={PLANTS[s.plantType].name} autoComplete="off" onChange={(e) => setPlantName(e.target.value)} />
              </div>
            </>
          )}
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
          {focusDone && !collected && <>
            <button className="btn btn--big" onClick={() => t.collect(plantName)} disabled={t.busy}>{t.busy ? 'Collecting…' : '🧺 Collect plant'}</button>
            <button className="btn btn--ghost" onClick={t.clearResult} disabled={t.busy}>Collect later</button>
          </>}
          {focusDone && collected && <>
            <button className="btn" onClick={t.startBreak} disabled={t.busy}>Start {t.nextBreak === 'long_break' ? 'long' : 'short'} break</button>
            <button className="btn btn--ghost" onClick={t.clearResult}>Skip break</button>
            <Link to="/garden" className="btn btn--ghost">See my garden</Link>
          </>}
          {!focusDone && <button className="btn" onClick={t.clearResult}>Plant a new seed</button>}
        </div>
      </div>
      {goal && <div className="card row row--center">{goal}</div>}
    </section>
  );
}

function StartView({ t, goal, pending, note, onCollectAll }) {
  const { settings, demo } = useAuth();
  const [plant, setPlant] = useState('sunflower');
  const [taskId, setTaskId] = useState('');
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    api.get('/tasks').then((d) => setTasks(d.tasks.filter((x) => !x.isDone).sort((a, b) => ['urgent', 'high', 'medium', 'low'].indexOf(a.priority) - ['urgent', 'high', 'medium', 'low'].indexOf(b.priority)))).catch(() => {});
  }, []);
  const untilLong = Math.max(0, settings.longBreakInterval - t.focusSinceLongBreak);
  // How long to study: one session, keep going, or a number of hours (turned into rounds).
  const [choice, setChoice] = useState(() => { try { return localStorage.getItem('rootine.planChoice') || 'open'; } catch { return 'open'; } });
  const [hours, setHours] = useState(() => { try { return localStorage.getItem('rootine.planHours') || '2'; } catch { return '2'; } });
  useEffect(() => { try { localStorage.setItem('rootine.planChoice', choice); localStorage.setItem('rootine.planHours', hours); } catch { /* ignore */ } }, [choice, hours]);
  const spec = planFor(choice, hours, settings.focusMinutes, settings.shortBreakMinutes); // null, { rounds }, or undefined (hours not valid yet)
  const planText = spec === undefined ? `Enter hours from ${CUSTOM_HOURS.min} to ${CUSTOM_HOURS.max}.`
    : spec === null ? 'One focus session, then a break. You start each round yourself.'
    : spec.rounds === null ? `It repeats by itself: ${settings.focusMinutes} min focus, ${settings.shortBreakMinutes} min rest, then 3, 2, 1, go. A different plant grows each round. Stop any time.`
    : `${spec.rounds} ${spec.rounds === 1 ? 'round' : 'rounds'} of ${settings.focusMinutes} min focus with ${settings.shortBreakMinutes} min rests, about ${hoursText(planMinutes(spec.rounds, settings.focusMinutes, settings.shortBreakMinutes))} in all. It repeats by itself, with a different plant each round.`;
  // A tree needs a longer focus. If the rhythm gets shorter, go back to a plant that is still allowed.
  useEffect(() => {
    if (!demo && settings.focusMinutes < PLANTS[plant].minMinutes) setPlant('sunflower');
  }, [settings.focusMinutes, plant, demo]);

  return (
    <section className="stack">
      {demo && (
        <p className="notice" role="status">
          ⚡ Demo mode is on (development only). Sessions can be 1 minute long and every tree is unlocked, so you can try growing, collecting, and the yard right away.
        </p>
      )}
      {pending > 0 && (
        <div className="card collect-banner">
          <span className="collect-banner__icon" aria-hidden="true">🧺</span>
          <div className="grow">
            <strong>{pending === 1 ? '1 plant is' : `${pending} plants are`} ready to collect!</strong>
            <p className="muted small">Collect them to add them to your garden.</p>
          </div>
          <button className="btn btn--small" onClick={onCollectAll}>Collect all</button>
        </div>
      )}
      {note && <p className="success center" role="status">{note}</p>}
      {t.planDone && (
        <div className="card center plan-done" role="status">
          <p className="big-emoji" aria-hidden="true">{'\uD83C\uDF89'}</p>
          <h2>Study plan complete!</h2>
          <p>You finished {t.planDone.rounds} {t.planDone.rounds === 1 ? 'round' : 'rounds'} and earned <strong>{'\uD83E\uDE99'} {t.planDone.coins} coins</strong>. Time for a proper rest.</p>
          <button type="button" className="btn" onClick={t.clearPlanDone}>Great!</button>
        </div>
      )}
      <div className="card focus">
        <h1>Plant a seed</h1>
        <p className="muted">Focus for {settings.focusMinutes} minute{settings.focusMinutes === 1 ? '' : 's'} to grow it, then rest for {settings.shortBreakMinutes}.</p>
        <Plant type={plant} stage="seed" size={200} title={`${PLANTS[plant].name} seed`} />
        <PresetPicker />
        <fieldset className="plan-picker" data-tour="plan">
          <legend>How long do you want to study?</legend>
          <div className="seg">
            {PLAN_CHOICES.map((c) => (
              <label key={c.id} className={choice === c.id ? 'is-selected' : ''}>
                <input type="radio" name="plan" value={c.id} checked={choice === c.id} onChange={() => setChoice(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
          {choice === 'custom' && (
            <div className="field field--center">
              <label htmlFor="plan-hours">Hours</label>
              <input id="plan-hours" type="number" inputMode="decimal" min={CUSTOM_HOURS.min} max={CUSTOM_HOURS.max} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          )}
          <p className="muted small plan-picker__text" role="status">{planText}</p>
        </fieldset>
        <fieldset className="plant-picker" data-tour="plants">
          <legend>Choose a plant</legend>
          {[
            { title: 'Flowers and plants', items: Object.values(PLANTS).filter((p) => p.kind === 'plant') },
            { title: 'Trees', note: 'Trees take longer to grow. Pick a longer rhythm above to unlock them.', items: Object.values(PLANTS).filter((p) => p.kind === 'tree') },
          ].map((group) => (
            <div key={group.title} className="plant-group">
              <p className="plant-group__title">{group.title}</p>
              {group.note && <p className="plant-group__note">{group.note}</p>}
              <div className="plant-group__grid">
                {group.items.map((p) => {
                  const locked = !demo && settings.focusMinutes < p.minMinutes;
                  return (
                    <label key={p.id} className={`plant-option ${plant === p.id ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}`}>
                      <input type="radio" name="plant" value={p.id} checked={plant === p.id} disabled={locked} onChange={() => setPlant(p.id)} />
                      <Plant type={p.id} stage="full" size={56} title="" />
                      <span>{p.name}</span>
                      {locked && <span className="plant-option__lock"><span aria-hidden="true">🔒 </span>{p.minMinutes}+ min<span className="visually-hidden"> of focus needed to grow this tree</span></span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </fieldset>
        <div className="field field--center" data-tour="task">
          <label htmlFor="task">Working on (optional)</label>
          <select id="task" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No task</option>
            {tasks.map((x) => <option key={x.id} value={x.id}>{x.title}{x.priority === 'urgent' ? ' (urgent)' : x.priority === 'high' ? ' (high)' : ''}</option>)}
          </select>
        </div>
        <FormError>{t.error}</FormError>
        <button className="btn btn--big" data-tour="start" disabled={t.busy || spec === undefined} onClick={() => t.startFocus(plant, taskId ? Number(taskId) : null, undefined, spec)}>
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
