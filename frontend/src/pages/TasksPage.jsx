import { useEffect, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { ConfirmDialog, Field, FormError } from '../components/ui.jsx';

export default function TasksPage() {
  const { sessionEnded } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState('');
  const [fields, setFields] = useState({});
  const [editing, setEditing] = useState(null); // { id, title, estimate }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError('');
    try { return await fn(); }
    catch (err) {
      if (err.status === 401) sessionEnded();
      setError(err.message);
      return null;
    }
  };

  const load = () => run(async () => setTasks((await api.get('/tasks')).tasks));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e.preventDefault();
    setFields({}); setBusy(true);
    try {
      await api.post('/tasks', { title, ...(estimate ? { estimatedPomodoros: Number(estimate) } : {}) });
      setTitle(''); setEstimate('');
      await load();
    } catch (err) {
      if (err.status === 401) sessionEnded();
      setFields(err.fields || {});
      if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
    } finally { setBusy(false); }
  };

  const toggle = (task) => run(async () => { await api.patch(`/tasks/${task.id}`, { isDone: !task.isDone }); await load(); });

  const saveEdit = async (e) => {
    e.preventDefault();
    setFields({});
    try {
      await api.patch(`/tasks/${editing.id}`, { title: editing.title, estimatedPomodoros: editing.estimate ? Number(editing.estimate) : null });
      setEditing(null);
      await load();
    } catch (err) {
      if (err.status === 401) sessionEnded();
      setFields(err.fields || {});
      if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
    }
  };

  const remove = async () => {
    setBusy(true);
    await run(async () => { await api.del(`/tasks/${toDelete.id}`); setToDelete(null); await load(); });
    setBusy(false);
  };

  return (
    <section className="stack">
      <h1>Tasks</h1>
      <form className="card" onSubmit={add} noValidate>
        <div className="row row--wrap">
          <div className="grow">
            <Field label="New task" error={fields.title}>
              {(p) => <input {...p} value={title} maxLength={120} placeholder="What will you work on?" onChange={(e) => setTitle(e.target.value)} />}
            </Field>
          </div>
          <div className="narrow">
            <Field label="Pomodoros" error={fields.estimatedPomodoros}>
              {(p) => <input {...p} type="number" inputMode="numeric" min="1" max="99" value={estimate} placeholder="Optional" onChange={(e) => setEstimate(e.target.value)} />}
            </Field>
          </div>
        </div>
        <button className="btn" disabled={busy}>Add task</button>
      </form>
      <FormError>{error}</FormError>

      {tasks === null ? <p role="status">Loading…</p> : tasks.length === 0 ? (
        <div className="card center"><p className="big-emoji" aria-hidden="true">🌰</p><p>No tasks yet. Add one above, then pick it before you focus.</p></div>
      ) : (
        <ul className="list">
          {tasks.map((task) => (
            <li key={task.id} className={`card task ${task.isDone ? 'is-done' : ''}`}>
              {editing?.id === task.id ? (
                <form onSubmit={saveEdit} className="stack stack--tight" noValidate>
                  <Field label="Task name" error={fields.title}>
                    {(p) => <input {...p} value={editing.title} maxLength={120} onChange={(e) => setEditing({ ...editing, title: e.target.value })} autoFocus />}
                  </Field>
                  <Field label="Pomodoros" error={fields.estimatedPomodoros}>
                    {(p) => <input {...p} type="number" min="1" max="99" value={editing.estimate} onChange={(e) => setEditing({ ...editing, estimate: e.target.value })} />}
                  </Field>
                  <div className="row"><button className="btn btn--small">Save</button><button type="button" className="btn btn--small btn--ghost" onClick={() => { setEditing(null); setFields({}); }}>Cancel</button></div>
                </form>
              ) : (
                <>
                  <label className="check task__check">
                    <input type="checkbox" checked={task.isDone} onChange={() => toggle(task)} />
                    <span className="task__title">{task.title}</span>
                  </label>
                  <p className="muted small">
                    {task.estimatedPomodoros ? `${task.completedSessions} of ${task.estimatedPomodoros} Pomodoros` : `${task.completedSessions} ${task.completedSessions === 1 ? 'Pomodoro' : 'Pomodoros'}`}
                    {task.isDone && ' · Done'}
                  </p>
                  <div className="row">
                    <button className="btn btn--small btn--ghost" onClick={() => setEditing({ id: task.id, title: task.title, estimate: task.estimatedPomodoros ?? '' })}>Edit</button>
                    <button className="btn btn--small btn--ghost btn--danger-text" onClick={() => setToDelete(task)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={!!toDelete} danger title="Delete this task?" confirmLabel="Delete task" busy={busy}
        onCancel={() => setToDelete(null)} onConfirm={remove}>
        <p>“{toDelete?.title}” will be removed. Plants you already grew with it stay in your garden.</p>
      </ConfirmDialog>
    </section>
  );
}
