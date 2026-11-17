import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse, parseId } from '../http.js';
import { COMPLETE_ALLOWANCE_MS, LIMITS, PLANT_TYPES, plantInfo } from '../config.js';
import { isUniqueViolation } from '../db.js';
import { requireAuth } from '../auth.js';

const startSchema = z
  .object({
    kind: z.enum(['focus', 'break'], { error: 'Choose focus or break.' }),
    plantType: z.enum(PLANT_TYPES, { error: 'Choose one of the available plants.' }).optional(),
    taskId: z.number().int().positive().nullable().optional(),
    minutes: z
      .number({ error: 'Minutes must be a whole number.' })
      .int('Minutes must be a whole number.')
      .min(LIMITS.focus[0], `Minutes must be between ${LIMITS.focus[0]} and ${LIMITS.focus[1]}.`)
      .max(LIMITS.focus[1], `Minutes must be between ${LIMITS.focus[0]} and ${LIMITS.focus[1]}.`)
      .optional(),
  })
  .strict();

const COLUMNS = `id, kind, plant_type, task_id, task_title, planned_seconds, status, started_at, target_at, paused_remaining_ms, ended_at, collected_at`;

export function sessionDto(row, now) {
  if (!row) return null;
  let remainingMs = 0;
  if (row.status === 'active') remainingMs = Math.max(0, row.target_at - now);
  else if (row.status === 'paused') remainingMs = row.paused_remaining_ms ?? 0;
  return {
    id: row.id,
    kind: row.kind,
    plantType: row.plant_type,
    taskId: row.task_id,
    taskTitle: row.task_title,
    plannedSeconds: row.planned_seconds,
    status: row.status,
    startedAt: row.started_at,
    targetAt: row.target_at,
    remainingMs,
    endedAt: row.ended_at,
    collectedAt: row.collected_at ?? null,
  };
}

export function sessionRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  router.use(requireAuth);

  const getOpen = async (userId) =>
    (await db.query(`SELECT ${COLUMNS} FROM timer_sessions WHERE user_id = $1 AND status IN ('active', 'paused')`, [userId]))[0];

  const getOwned = async (userId, id) =>
    (await db.query(`SELECT ${COLUMNS} FROM timer_sessions WHERE id = $1 AND user_id = $2`, [id, userId]))[0];

  // Marks an active session completed exactly once and updates the long-break counter.
  // The status check in the UPDATE makes repeated or parallel calls safe (BR-6).
  const finish = async (userId, row) => {
    const endedAt = Math.min(ctx.now(), row.target_at);
    await db.tx(async (t) => {
      const updated = await t.query(
        "UPDATE timer_sessions SET status = 'completed', ended_at = $3, paused_remaining_ms = NULL WHERE id = $1 AND user_id = $2 AND status = 'active' RETURNING id",
        [row.id, userId, endedAt],
      );
      if (!updated.length) return;
      if (row.kind === 'focus') await t.query('UPDATE users SET focus_since_long_break = focus_since_long_break + 1 WHERE id = $1', [userId]);
      else if (row.kind === 'long_break') await t.query('UPDATE users SET focus_since_long_break = 0 WHERE id = $1', [userId]);
    });
    return getOwned(userId, row.id);
  };

  // If time already ran out while the tab was closed, complete it now.
  const settleExpired = async (userId, row) => {
    if (row && row.status === 'active' && ctx.now() >= row.target_at) return finish(userId, row);
    return row;
  };

  const body = async (userId, row) => {
    const [u] = await db.query('SELECT focus_since_long_break, long_break_interval FROM users WHERE id = $1', [userId]);
    return {
      session: sessionDto(row, ctx.now()),
      serverNow: ctx.now(),
      nextBreak: u.focus_since_long_break >= u.long_break_interval ? 'long_break' : 'short_break',
      focusSinceLongBreak: u.focus_since_long_break,
    };
  };

  router.get('/current', async (req, res) => {
    let row = await getOpen(req.user.id);
    row = await settleExpired(req.user.id, row);
    if (row && (row.status === 'completed')) return res.json(await body(req.user.id, row));
    res.json(await body(req.user.id, row ?? null));
  });

  router.post('/', async (req, res) => {
    const input = parse(startSchema, req.body);
    const userId = req.user.id;

    let open = await settleExpired(userId, await getOpen(userId));
    if (open && (open.status === 'active' || open.status === 'paused')) {
      throw new HttpError(409, 'You already have a session in progress.', await body(userId, open));
    }

    const [u] = await db.query(
      'SELECT focus_minutes, short_break_minutes, long_break_minutes, long_break_interval, focus_since_long_break FROM users WHERE id = $1',
      [userId],
    );
    const now = ctx.now();
    let values;
    if (input.kind === 'focus') {
      if (!input.plantType) throw new HttpError(400, 'Please check the highlighted fields.', { fields: { plantType: 'Choose a plant.' } });
      let taskTitle = null;
      let taskId = null;
      if (input.taskId) {
        const [task] = await db.query('SELECT id, title FROM tasks WHERE id = $1 AND user_id = $2', [input.taskId, userId]);
        if (!task) throw notFound();
        taskId = task.id;
        taskTitle = task.title; // copied, so history survives task deletion (BR-11)
      }
      const minutes = input.minutes ?? u.focus_minutes;
      const info = plantInfo(input.plantType);
      if (minutes < info.minMinutes) {
        // Trees take longer to grow. Say which rhythm unlocks them.
        throw new HttpError(400, 'Please check the highlighted fields.', {
          fields: { plantType: `${info.name} needs a focus session of at least ${info.minMinutes} minutes. Choose a longer rhythm.` },
        });
      }
      const seconds = minutes * 60; // copied duration (BR-12)
      values = ['focus', input.plantType, taskId, taskTitle, seconds];
    } else {
      const long = u.focus_since_long_break >= u.long_break_interval;
      values = [long ? 'long_break' : 'short_break', null, null, null, (long ? u.long_break_minutes : u.short_break_minutes) * 60];
    }

    let created;
    try {
      [created] = await db.query(
        `INSERT INTO timer_sessions (user_id, kind, plant_type, task_id, task_title, planned_seconds, status, started_at, target_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8) RETURNING ${COLUMNS}`,
        [userId, ...values, now, now + values[4] * 1000],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Two requests arrived together. The database refused the second one (BR-1).
        throw new HttpError(409, 'You already have a session in progress.', await body(userId, await getOpen(userId)));
      }
      throw err;
    }
    res.status(201).json(await body(userId, created));
  });

  const loadOwned = async (req) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    const row = await getOwned(req.user.id, id);
    if (!row) throw notFound();
    return row;
  };

  // Collecting moves a finished plant into the garden. It is a separate step, so a plant is never
  // lost if the tab is closed before the user taps Collect. Repeating the call changes nothing.
  router.post('/collect-all', async (req, res) => {
    const rows = await db.query(
      "UPDATE timer_sessions SET collected_at = $2 WHERE user_id = $1 AND kind = 'focus' AND status = 'completed' AND collected_at IS NULL RETURNING id",
      [req.user.id, ctx.now()],
    );
    res.json({ collected: rows.length });
  });

  router.post('/:id/collect', async (req, res) => {
    const row = await loadOwned(req);
    if (row.kind !== 'focus' || row.status !== 'completed') {
      throw new HttpError(409, 'Only finished focus sessions can be collected.');
    }
    const updated = await db.query(
      "UPDATE timer_sessions SET collected_at = $3 WHERE id = $1 AND user_id = $2 AND collected_at IS NULL RETURNING collected_at",
      [row.id, req.user.id, ctx.now()],
    );
    const collectedAt = updated.length ? updated[0].collected_at : row.collected_at;
    res.json({
      plant: { id: row.id, plantType: row.plant_type, taskTitle: row.task_title, minutes: Math.round(row.planned_seconds / 60), endedAt: row.ended_at, collectedAt },
      newlyCollected: updated.length > 0,
    });
  });

  router.post('/:id/pause', async (req, res) => {
    let row = await loadOwned(req);
    if (row.status === 'active' && ctx.now() >= row.target_at) {
      row = await finish(req.user.id, row);
      throw new HttpError(409, 'This session has already finished.', await body(req.user.id, row));
    }
    if (row.status !== 'active') throw new HttpError(409, 'This session is not running.', await body(req.user.id, row));
    const remaining = Math.max(0, row.target_at - ctx.now());
    // Guarded update: only an active session can be paused, even with parallel calls.
    await db.query("UPDATE timer_sessions SET status = 'paused', paused_remaining_ms = $3 WHERE id = $1 AND user_id = $2 AND status = 'active'", [row.id, req.user.id, remaining]);
    res.json(await body(req.user.id, await getOwned(req.user.id, row.id)));
  });

  router.post('/:id/resume', async (req, res) => {
    const row = await loadOwned(req);
    if (row.status !== 'paused') throw new HttpError(409, 'This session is not paused.', await body(req.user.id, row));
    const now = ctx.now();
    await db.query(
      "UPDATE timer_sessions SET status = 'active', target_at = $3::bigint + paused_remaining_ms, paused_remaining_ms = NULL WHERE id = $1 AND user_id = $2 AND status = 'paused'",
      [row.id, req.user.id, now],
    );
    res.json(await body(req.user.id, await getOwned(req.user.id, row.id)));
  });

  router.post('/:id/complete', async (req, res) => {
    const row = await loadOwned(req);
    if (row.status === 'completed') return res.json(await body(req.user.id, row)); // idempotent
    if (row.status === 'given_up' || row.status === 'skipped') {
      throw new HttpError(409, 'This session was already ended.', await body(req.user.id, row));
    }
    if (row.status === 'paused') throw new HttpError(409, 'Resume the session before finishing it.', await body(req.user.id, row));
    if (ctx.now() + COMPLETE_ALLOWANCE_MS < row.target_at) {
      throw new HttpError(409, 'This session is not finished yet.', await body(req.user.id, row));
    }
    res.json(await body(req.user.id, await finish(req.user.id, row)));
  });

  router.post('/:id/give-up', async (req, res) => {
    const row = await loadOwned(req);
    if (row.status === 'completed') throw new HttpError(409, 'This session is already completed.', await body(req.user.id, row));
    if (row.status === 'given_up' || row.status === 'skipped') return res.json(await body(req.user.id, row)); // idempotent
    const endStatus = row.kind === 'focus' ? 'given_up' : 'skipped';
    await db.query(
      "UPDATE timer_sessions SET status = $3, ended_at = $4, paused_remaining_ms = NULL WHERE id = $1 AND user_id = $2 AND status IN ('active', 'paused')",
      [row.id, req.user.id, endStatus, ctx.now()],
    );
    res.json(await body(req.user.id, await getOwned(req.user.id, row.id)));
  });

  return router;
}

