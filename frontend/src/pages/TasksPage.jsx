import { useEffect, useMemo, useState } from 'react';
import * as api from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import { ConfirmDialog, Field, FormError } from '../components/ui.jsx';

const CATEGORIES = [
  ['study', 'Study', '\uD83D\uDCDA'],
  ['work', 'Work', '\uD83D\uDCBC'],
  ['personal', 'Personal', '\uD83C\uDF1F'],
  ['chores', 'Chores', '\uD83E\uDDF9'],
  ['health', 'Health', '\uD83C\uDF4E'],
  ['other', 'Other', '\uD83D\uDCCC'],
];
const PRIORITIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']];
const STATUSES = [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']];
const RANK = { urgent: 0, high: 1, medium: 2, low: 3 };
const catInfo = (id) => CATEGORIES.find((c) => c[0] === id) || CATEGORIES[5];

const pad = (n) => String(n).padStart(2, '0');
const todayText = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dayNumber = (text) => { const [y, m, d] = text.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86_400_000); };

// "Overdue by 2 days", "Due today", "Due tomorrow", "Due in 3 days", or a date. The tone drives the color.
function dueInfo(due, done) {
  if (!due) return null;
  const diff = dayNumber(due) - dayNumber(todayText());
  const date = new Date(`${due}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (done) return { text: `Due ${date}`, tone: 'calm', diff };
  if (diff < 0) return { text: `Overdue by ${-diff} ${diff === -1 ? 'day' : 'days'} (${date})`, tone: 'late', diff };
  if (diff === 0) return { text: 'Due today', tone: 'soon', diff };
  if (diff === 1) return { text: 'Due tomorrow', tone: 'soon', diff };
  if (diff <= 7) return { text: `Due in ${diff} days (${date})`, tone: 'near', diff };
  return { text: `Due ${date}`, tone: 'calm', diff };
}

const blank = { title: '', category: 'other', priority: 'medium', status: 'todo', dueDate: '', estimate: '', notes: '' };
const toBody = (f) => ({
  title: f.title,
  category: f.category,
  priority: f.priority,
  status: f.status,
  dueDate: f.dueDate || null,
  notes: f.notes.trim() || null,
  estimatedPomodoros: f.estimate ? Number(f.estimate) : null,
});

function Select({ props, value, onChange, options }) {
  return (
    <select {...props} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label, icon]) => <option key={v} value={v}>{icon ? `${icon} ${label}` : label}</option>)}
    </select>
  );
}

// The fields shared by "new task" and "edit task".
function TaskFields({ form, setForm, fields, idPrefix }) {
  const set = (k) => (v) => setForm({ ...form, [k]: v });
  return (
    <>
      <Field label="Task name" error={fields.title}>
        {(p) => <input {...p} value={form.title} maxLength={120} placeholder="What will you work on?" onChange={(e) => set('title')(e.target.value)} />}
      </Field>
      <div className="task-grid">
        <Field label="Kind of task" error={fields.category}>
          {(p) => <Select props={p} value={form.category} onChange={set('category')} options={CATEGORIES} />}
        </Field>
        <Field label="How urgent?" error={fields.priority}>
          {(p) => <Select props={p} value={form.priority} onChange={set('priority')} options={PRIORITIES} />}
        </Field>
        <Field label="Status" error={fields.status}>
          {(p) => <Select props={p} value={form.status} onChange={set('status')} options={STATUSES} />}
        </Field>
        <Field label="Due date" error={fields.dueDate}>
          {(p) => <input {...p} type="date" value={form.dueDate} onChange={(e) => set('dueDate')(e.target.value)} />}
        </Field>
        <Field label="Pomodoros needed" error={fields.estimatedPomodoros}>
          {(p) => <input {...p} type="number" inputMode="numeric" min="1" max="99" value={form.estimate} placeholder="Optional" onChange={(e) => set('estimate')(e.target.value)} />}
        </Field>
      </div>
      <Field label="Notes" hint="Optional. Up to 500 characters." error={fields.notes}>
        {(p) => <textarea {...p} rows={2} maxLength={500} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />}
      </Field>
    </>
  );
}

export default function TasksPage() {
  const { sessionEnded } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(blank);
  const [fields, setFields] = useState({});
  const [editing, setEditing] = useState(null); // { id, ...form fields }
  const [editFields, setEditFields] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('open'); // open | all | todo | doing | done
  const [sort, setSort] = useState('urgent'); // urgent | due | newest

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

  const fail = (err, setter) => {
    if (err.status === 401) sessionEnded();
    setter(err.fields || {});
    if (!err.fields || !Object.keys(err.fields).length) setError(err.message);
  };

  const add = async (e) => {
    e.preventDefault();
    setFields({}); setBusy(true); setError('');
    try {
      await api.post('/tasks', toBody(form));
      setForm(blank);
      await load();
    } catch (err) { fail(err, setFields); }
    finally { setBusy(false); }
  };

  const patch = (task, changes) => run(async () => { await api.patch(`/tasks/${task.id}`, changes); await load(); });
  const toggle = (task) => patch(task, { isDone: !task.isDone });

  const startEdit = (t) => {
    setEditFields({});
    setEditing({ id: t.id, title: t.title, category: t.category, priority: t.priority, status: t.status, dueDate: t.dueDate || '', estimate: t.estimatedPomodoros ?? '', notes: t.notes || '' });
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    setEditFields({}); setError('');
    try {
      await api.patch(`/tasks/${editing.id}`, toBody(editing));
      setEditing(null);
      await load();
    } catch (err) { fail(err, setEditFields); }
  };

  const remove = async () => {
    setBusy(true);
    await run(async () => { await api.del(`/tasks/${toDelete.id}`); setToDelete(null); await load(); });
    setBusy(false);
  };

  const summary = useMemo(() => {
    const open = (tasks || []).filter((t) => !t.isDone);
    const infos = open.map((t) => dueInfo(t.dueDate, false));
    return {
      open: open.length,
      overdue: infos.filter((i) => i?.tone === 'late').length,
      today: infos.filter((i) => i && i.diff === 0).length,
      urgent: open.filter((t) => t.priority === 'urgent').length,
    };
  }, [tasks]);

  const shown = useMemo(() => {
    const list = (tasks || []).filter((t) => (filter === 'all' ? true : filter === 'open' ? !t.isDone : t.status === filter));
    const due = (t) => (t.dueDate ? dayNumber(t.dueDate) : Infinity);
    return [...list].sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1; // finished ones go last
      if (sort === 'urgent') return RANK[a.priority] - RANK[b.priority] || due(a) - due(b) || b.id - a.id;
      if (sort === 'due') return due(a) - due(b) || RANK[a.priority] - RANK[b.priority] || b.id - a.id;
      return b.createdAt - a.createdAt || b.id - a.id;
    });
  }, [tasks, filter, sort]);

  return (
    <section className="stack">
      <h1>Tasks</h1>
      <form className="card stack stack--tight" onSubmit={add} noValidate>
        <h2>New task</h2>
        <TaskFields form={form} setForm={setForm} fields={fields} />
        <div><button className="btn" disabled={busy}>Add task</button></div>
      </form>
      <FormError>{error}</FormError>

      {tasks === null ? <p role="status">Loading...</p> : tasks.length === 0 ? (
        <div className="card center"><p className="big-emoji" aria-hidden="true">{'\uD83D\uDCDD'}</p><p>No tasks yet. Add one above, then pick it before you focus.</p></div>
      ) : (
        <>
          <p className="task-summary" role="status">
            <strong>{summary.open}</strong> to finish
            {summary.overdue > 0 && <> <span className="tag tag--late">{summary.overdue} overdue</span></>}
            {summary.today > 0 && <> <span className="tag tag--soon">{summary.today} due today</span></>}
            {summary.urgent > 0 && <> <span className="tag tag--urgent">{summary.urgent} urgent</span></>}
          </p>
          <div className="task-tools">
            <div className="chips" role="group" aria-label="Show">
              {[['open', 'Not done'], ['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done'], ['all', 'All']].map(([k, label]) => (
                <button key={k} type="button" className={`chip-btn ${filter === k ? 'is-on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
              ))}
            </div>
            <label className="task-sort">Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="urgent">Most urgent</option>
                <option value="due">Due soonest</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>

          {shown.length === 0 && <div className="card center"><p>Nothing here. Try another filter.</p></div>}
          <ul className="list">
            {shown.map((task, idx) => {
              const [, catName, catIcon] = catInfo(task.category);
              const due = dueInfo(task.dueDate, task.isDone);
              return (
                <li key={task.id} style={{ '--i': idx }} className={`card task task--${task.priority} ${task.isDone ? 'is-done' : ''}`}>
                  {editing?.id === task.id ? (
                    <form onSubmit={saveEdit} className="stack stack--tight" noValidate>
                      <TaskFields form={editing} setForm={setEditing} fields={editFields} />
                      <div className="row"><button className="btn btn--small">Save</button><button type="button" className="btn btn--small btn--ghost" onClick={() => { setEditing(null); setEditFields({}); }}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <label className="check task__check">
                        <input type="checkbox" checked={task.isDone} onChange={() => toggle(task)} />
                        <span className="task__title">{task.title}</span>
                      </label>
                      <p className="task__tags">
                        <span className="tag"><span aria-hidden="true">{catIcon}</span> {catName}</span>
                        <span className={`tag tag--${task.priority}`}>{PRIORITIES.find((p) => p[0] === task.priority)[1]}</span>
                        <span className={`tag tag--status-${task.status}`}>{STATUSES.find((s) => s[0] === task.status)[1]}</span>
                        {due && <span className={`tag tag--${due.tone}`}>{due.text}</span>}
                      </p>
                      {task.notes && <p className="task__notes">{task.notes}</p>}
                      <p className="muted small">
                        {task.estimatedPomodoros ? `${task.completedSessions} of ${task.estimatedPomodoros} Pomodoros` : `${task.completedSessions} ${task.completedSessions === 1 ? 'Pomodoro' : 'Pomodoros'}`}
                      </p>
                      <div className="row">
                        {!task.isDone && (
                          <label className="task-status">Status
                            <select value={task.status} onChange={(e) => patch(task, { status: e.target.value })}>
                              {STATUSES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                            </select>
                          </label>
                        )}
                        <button className="btn btn--small btn--ghost" onClick={() => startEdit(task)}>Edit</button>
                        <button className="btn btn--small btn--ghost btn--danger-text" onClick={() => setToDelete(task)}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog open={!!toDelete} danger title="Delete this task?" confirmLabel="Delete task" busy={busy}
        onCancel={() => setToDelete(null)} onConfirm={remove}>
        <p>{'\u201C'}{toDelete?.title}{'\u201D'} will be removed. Plants you already grew with it stay in your garden.</p>
      </ConfirmDialog>
    </section>
  );
}
