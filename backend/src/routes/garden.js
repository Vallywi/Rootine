import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse, parseId } from '../http.js';
import { YARD_LIMIT } from '../config.js';
import { requireAuth } from '../auth.js';

const DAY = 24 * 60 * 60 * 1000;

const querySchema = z.object({
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

// Local day number for a UTC timestamp. tzOffset is JS getTimezoneOffset() (UTC minus local, in minutes).
export const localDay = (ms, tzOffset) => Math.floor((ms - tzOffset * 60_000) / DAY);

export function computeStats(sessions, now, tzOffset) {
  const today = localDay(now, tzOffset);
  const localNow = new Date(now - tzOffset * 60_000);
  const weekStart = today - ((localNow.getUTCDay() + 6) % 7); // Monday
  const monthStart = Math.floor(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), 1) / DAY);

  let todayMin = 0, weekMin = 0, monthMin = 0, todaySessions = 0, totalSeconds = 0;
  const days = new Set();
  for (const s of sessions) {
    const day = localDay(s.ended_at, tzOffset);
    const minutes = s.planned_seconds / 60;
    days.add(day);
    totalSeconds += s.planned_seconds;
    if (day === today) { todayMin += minutes; todaySessions += 1; }
    if (day >= weekStart && day <= today) weekMin += minutes;
    if (day >= monthStart && day <= today) monthMin += minutes;
  }

  // Current streak stays alive if today has no session yet but yesterday does.
  let current = 0;
  let cursor = days.has(today) ? today : today - 1;
  while (days.has(cursor)) { current += 1; cursor -= 1; }

  let longest = 0, run = 0, prev = null;
  for (const d of [...days].sort((a, b) => a - b)) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  return {
    todayMinutes: Math.round(todayMin),
    weekMinutes: Math.round(weekMin),
    monthMinutes: Math.round(monthMin),
    totalPlants: sessions.length,
    todaySessions,
    currentStreak: current,
    longestStreak: longest,
    totalSeconds,
  };
}

// Badges are calculated on every request, never stored, so they cannot drift out of sync.
export function computeBadges(stats) {
  const hours = Math.floor(stats.totalSeconds / 3600);
  const make = (id, name, value, target) => ({ id, name, earned: value >= target, progress: Math.min(value, target), target });
  return [
    make('first_plant', 'First sprout', stats.totalPlants, 1),
    make('ten_plants', 'Ten plants', stats.totalPlants, 10),
    make('seven_day_streak', 'Week in bloom', stats.longestStreak, 7),
    make('hundred_hours', '100 focus hours', hours, 100),
  ];
}

export function gardenRoutes(ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const { tzOffset } = parse(querySchema, req.query);
    const userId = req.user.id;
    const completed = await ctx.db.query(
      `SELECT id, plant_type, task_title, planned_seconds, ended_at, collected_at, yard_x, yard_y FROM timer_sessions
        WHERE user_id = $1 AND kind = 'focus' AND status = 'completed' ORDER BY ended_at DESC, id DESC`,
      [userId],
    );
    const withered = await ctx.db.query(
      `SELECT id, plant_type, task_title, planned_seconds, ended_at FROM timer_sessions
        WHERE user_id = $1 AND kind = 'focus' AND status = 'given_up' ORDER BY ended_at DESC, id DESC LIMIT 30`,
      [userId],
    );
    const dto = (s) => ({
      id: s.id,
      plantType: s.plant_type,
      taskTitle: s.task_title,
      minutes: Math.round(s.planned_seconds / 60),
      endedAt: s.ended_at,
      x: s.yard_x ?? null, // where it stands in the yard (percent), or null while it is in the tray
      y: s.yard_y ?? null,
    });
    // Time and streaks count every finished session. Plants in the garden are the collected ones.
    const collected = completed.filter((s) => s.collected_at != null);
    const pending = completed.filter((s) => s.collected_at == null);
    const { totalSeconds, ...stats } = computeStats(completed, ctx.now(), tzOffset);
    stats.totalPlants = collected.length;
    stats.pendingPlants = pending.length;
    res.json({
      plants: collected.slice(0, 500).map(dto),
      pending: pending.map(dto),
      withered: withered.map(dto),
      stats,
      badges: computeBadges({ ...stats, totalSeconds }),
    });
  });

  // ----- Yard: put a collected plant outside, move it, or take it back.
  const positionSchema = z
    .object({
      x: z.number({ error: 'x must be a number from 0 to 100.' }).min(0, 'x must be a number from 0 to 100.').max(100, 'x must be a number from 0 to 100.'),
      y: z.number({ error: 'y must be a number from 0 to 100.' }).min(0, 'y must be a number from 0 to 100.').max(100, 'y must be a number from 0 to 100.'),
    })
    .strict();
  const round1 = (v) => Math.round(v * 10) / 10;

  const loadPlant = async (req) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    const [row] = await ctx.db.query(
      'SELECT id, kind, status, collected_at, yard_x FROM timer_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.id],
    );
    if (!row) throw notFound();
    return row;
  };

  router.put('/plants/:id/position', async (req, res) => {
    const row = await loadPlant(req);
    const body = parse(positionSchema, req.body);
    if (row.kind !== 'focus' || row.status !== 'completed' || row.collected_at == null) {
      throw new HttpError(409, 'Only collected plants can be placed in the yard.');
    }
    if (row.yard_x == null) {
      const [{ n }] = await ctx.db.query('SELECT count(*)::int AS n FROM timer_sessions WHERE user_id = $1 AND yard_x IS NOT NULL', [req.user.id]);
      if (n >= YARD_LIMIT) throw new HttpError(409, `Your yard is full (${YARD_LIMIT} plants). Put one back in the tray first.`);
    }
    const x = round1(body.x);
    const y = round1(body.y);
    await ctx.db.query('UPDATE timer_sessions SET yard_x = $3, yard_y = $4 WHERE id = $1 AND user_id = $2 AND collected_at IS NOT NULL', [row.id, req.user.id, x, y]);
    res.json({ plant: { id: row.id, x, y } });
  });

  router.delete('/plants/:id/position', async (req, res) => {
    const row = await loadPlant(req);
    await ctx.db.query('UPDATE timer_sessions SET yard_x = NULL, yard_y = NULL WHERE id = $1 AND user_id = $2', [row.id, req.user.id]);
    res.json({ plant: { id: row.id, x: null, y: null } });
  });

  return router;
}
