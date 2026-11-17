import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse, parseId } from '../http.js';
import { LIMITS } from '../config.js';
import { requireAuth } from '../auth.js';

const title = z
  .string({ error: 'Enter a task name.' })
  .trim()
  .min(1, 'Enter a task name.')
  .max(LIMITS.taskTitle, `Use at most ${LIMITS.taskTitle} characters.`);
const estimate = z
  .number({ error: 'Estimate must be a whole number.' })
  .int('Estimate must be a whole number.')
  .min(1, `Estimate must be between 1 and ${LIMITS.estimateMax}.`)
  .max(LIMITS.estimateMax, `Estimate must be between 1 and ${LIMITS.estimateMax}.`)
  .nullable();

export const CATEGORIES = ['study', 'work', 'personal', 'chores', 'health', 'other'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const STATUSES = ['todo', 'doing', 'done'];
const category = z.enum(CATEGORIES, { error: 'Choose a kind of task from the list.' });
const priority = z.enum(PRIORITIES, { error: 'Choose how urgent it is from the list.' });
const status = z.enum(STATUSES, { error: 'Choose to do, doing, or done.' });
// A real calendar date written as YYYY-MM-DD (no time, so time zones cannot shift it).
const dueDate = z
  .string({ error: 'Enter a date.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date like 2026-03-31.')
  .refine((s) => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; }, 'That date does not exist.')
  .nullable();
const notes = z.string({ error: 'Notes must be text.' }).trim().max(500, 'Use at most 500 characters for notes.').nullable();

const createSchema = z.object({
  title, estimatedPomodoros: estimate.optional(),
  category: category.optional(), priority: priority.optional(), status: status.optional(), dueDate: dueDate.optional(), notes: notes.optional(),
}).strict();
const patchSchema = z.object({
  title: title.optional(), estimatedPomodoros: estimate.optional(), isDone: z.boolean().optional(),
  category: category.optional(), priority: priority.optional(), status: status.optional(), dueDate: dueDate.optional(), notes: notes.optional(),
}).strict();

// completedSessions is calculated, never stored, so it cannot drift out of sync.
const SELECT = `SELECT t.id, t.title, t.estimated_pomodoros, t.is_done, t.created_at, t.category, t.priority, t.status, t.due_date, t.notes,
  (SELECT count(*)::int FROM timer_sessions s
     WHERE s.task_id = t.id AND s.kind = 'focus' AND s.status = 'completed') AS completed_sessions
  FROM tasks t`;

const toDto = (t) => ({
  id: t.id,
  title: t.title,
  estimatedPomodoros: t.estimated_pomodoros,
  isDone: t.is_done,
  category: t.category,
  priority: t.priority,
  status: t.status,
  dueDate: t.due_date,
  notes: t.notes,
  completedSessions: t.completed_sessions,
  createdAt: t.created_at,
});

export function taskRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  router.use(requireAuth);

  const load = async (userId, id) => {
    const [row] = await db.query(`${SELECT} WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
    return row;
  };

  router.get('/', async (req, res) => {
    const rows = await db.query(`${SELECT} WHERE t.user_id = $1 ORDER BY t.is_done, t.created_at DESC, t.id DESC`, [req.user.id]);
    res.json({ tasks: rows.map(toDto) });
  });

  router.post('/', async (req, res) => {
    const body = parse(createSchema, req.body);
    const [{ n }] = await db.query('SELECT count(*)::int AS n FROM tasks WHERE user_id = $1', [req.user.id]);
    if (n >= LIMITS.tasksPerUser) throw new HttpError(409, `You can keep up to ${LIMITS.tasksPerUser} tasks. Delete one to add another.`);
    const now = ctx.now();
    const [created] = await db.query(
      'INSERT INTO tasks (user_id, title, estimated_pomodoros, category, priority, status, is_done, due_date, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id',
      [req.user.id, body.title, body.estimatedPomodoros ?? null, body.category ?? 'other', body.priority ?? 'medium', body.status ?? 'todo', (body.status ?? 'todo') === 'done', body.dueDate ?? null, body.notes || null, now],
    );
    res.status(201).json({ task: toDto(await load(req.user.id, created.id)) });
  });

  router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    const body = parse(patchSchema, req.body);
    const existing = await load(req.user.id, id);
    if (!existing) throw notFound();
    // "Done" is kept in two places (status and isDone). Whichever one the client sends decides, and the other follows.
    let nextStatus = body.status ?? existing.status;
    if (body.status === undefined && body.isDone !== undefined) nextStatus = body.isDone ? 'done' : (existing.status === 'done' ? 'todo' : existing.status);
    const next = {
      title: body.title ?? existing.title,
      est: body.estimatedPomodoros === undefined ? existing.estimated_pomodoros : body.estimatedPomodoros,
      status: nextStatus,
      category: body.category ?? existing.category,
      priority: body.priority ?? existing.priority,
      due: body.dueDate === undefined ? existing.due_date : body.dueDate,
      notes: body.notes === undefined ? existing.notes : (body.notes || null),
    };
    await db.query(
      'UPDATE tasks SET title = $3, estimated_pomodoros = $4, is_done = $5, status = $6, category = $7, priority = $8, due_date = $9, notes = $10, updated_at = $11 WHERE id = $1 AND user_id = $2',
      [id, req.user.id, next.title, next.est, next.status === 'done', next.status, next.category, next.priority, next.due, next.notes, ctx.now()],
    );
    res.json({ task: toDto(await load(req.user.id, id)) });
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    // Past sessions keep the copied task title. The link is cleared by ON DELETE SET NULL.
    const rows = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (!rows.length) throw notFound();
    res.json({ ok: true });
  });

  return router;
}
