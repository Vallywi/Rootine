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

const createSchema = z.object({ title, estimatedPomodoros: estimate.optional() }).strict();
const patchSchema = z.object({ title: title.optional(), estimatedPomodoros: estimate.optional(), isDone: z.boolean().optional() }).strict();

// completedSessions is calculated, never stored, so it cannot drift out of sync.
const SELECT = `SELECT t.id, t.title, t.estimated_pomodoros, t.is_done, t.created_at,
  (SELECT count(*)::int FROM timer_sessions s
     WHERE s.task_id = t.id AND s.kind = 'focus' AND s.status = 'completed') AS completed_sessions
  FROM tasks t`;

const toDto = (t) => ({
  id: t.id,
  title: t.title,
  estimatedPomodoros: t.estimated_pomodoros,
  isDone: t.is_done,
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
      'INSERT INTO tasks (user_id, title, estimated_pomodoros, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id',
      [req.user.id, body.title, body.estimatedPomodoros ?? null, now],
    );
    res.status(201).json({ task: toDto(await load(req.user.id, created.id)) });
  });

  router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    const body = parse(patchSchema, req.body);
    const existing = await load(req.user.id, id);
    if (!existing) throw notFound();
    const next = {
      title: body.title ?? existing.title,
      est: body.estimatedPomodoros === undefined ? existing.estimated_pomodoros : body.estimatedPomodoros,
      done: body.isDone ?? existing.is_done,
    };
    await db.query('UPDATE tasks SET title = $3, estimated_pomodoros = $4, is_done = $5, updated_at = $6 WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
      next.title,
      next.est,
      next.done,
      ctx.now(),
    ]);
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
