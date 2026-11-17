import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse, parseId } from '../http.js';
import { YARD_LIMIT } from '../config.js';
import { requireAuth } from '../auth.js';
import { PLANT_CATALOG, plantInfo } from '../../../shared/plants.js';

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
// `stats` can carry: totalPlants, longestStreak, totalSeconds, species, trees, bestSessionMinutes, tasksDone, friends.
export function computeBadges(stats) {
  const v = {
    plants: stats.totalPlants ?? 0,
    streak: stats.longestStreak ?? 0,
    hours: Math.floor((stats.totalSeconds ?? 0) / 3600),
    session: stats.bestSessionMinutes ?? 0,
    species: stats.species ?? 0,
    trees: stats.trees ?? 0,
    tasks: stats.tasksDone ?? 0,
    friends: stats.friends ?? 0,
  };
  const make = (group, id, icon, name, hint, key, target) => ({
    id, group, icon, name, hint, earned: v[key] >= target, progress: Math.min(v[key], target), target,
  });
  return [
    make('Plants', 'first_plant', '\uD83C\uDF31', 'First sprout', 'Collect your first plant.', 'plants', 1),
    make('Plants', 'five_plants', '\uD83C\uDF3C', 'Little patch', 'Collect 5 plants.', 'plants', 5),
    make('Plants', 'ten_plants', '\uD83C\uDF3B', 'Ten plants', 'Collect 10 plants.', 'plants', 10),
    make('Plants', 'twentyfive_plants', '\uD83C\uDFE1', 'Garden keeper', 'Collect 25 plants.', 'plants', 25),
    make('Plants', 'fifty_plants', '\uD83C\uDFC6', 'Plant hero', 'Collect 50 plants.', 'plants', 50),
    make('Streaks', 'three_day_streak', '\uD83D\uDD25', 'Warming up', 'Focus 3 days in a row.', 'streak', 3),
    make('Streaks', 'seven_day_streak', '\uD83C\uDF38', 'Week in bloom', 'Focus 7 days in a row.', 'streak', 7),
    make('Streaks', 'fourteen_day_streak', '\uD83D\uDCAA', 'Two weeks strong', 'Focus 14 days in a row.', 'streak', 14),
    make('Streaks', 'thirty_day_streak', '\uD83C\uDF33', 'Month of growth', 'Focus 30 days in a row.', 'streak', 30),
    make('Focus time', 'one_hour', '\u23F0', 'First hour', 'Focus for 1 hour in total.', 'hours', 1),
    make('Focus time', 'ten_hours', '\u23F3', 'Ten hours', 'Focus for 10 hours in total.', 'hours', 10),
    make('Focus time', 'fifty_hours', '\uD83D\uDCAB', 'Focus fan', 'Focus for 50 hours in total.', 'hours', 50),
    make('Focus time', 'hundred_hours', '\uD83C\uDFC5', '100 focus hours', 'Focus for 100 hours in total.', 'hours', 100),
    make('Focus time', 'deep_diver', '\uD83C\uDF0A', 'Deep diver', 'Finish one session of 50 minutes or more.', 'session', 50),
    make('Focus time', 'marathon', '\uD83E\uDDE0', 'Marathon mind', 'Finish one session of 90 minutes.', 'session', 90),
    make('Collection', 'first_tree', '\uD83C\uDF32', 'Tree hugger', 'Grow your first tree.', 'trees', 1),
    make('Collection', 'plant_collector', '\uD83E\uDEB4', 'Plant collector', 'Grow 5 different kinds of plants.', 'species', 5),
    make('Collection', 'full_garden', '\uD83C\uDF08', 'Full garden', `Grow all ${PLANT_CATALOG.length} kinds of plants.`, 'species', PLANT_CATALOG.length),
    make('Tasks and friends', 'task_tamer', '\u2705', 'Task tamer', 'Finish your first task.', 'tasks', 1),
    make('Tasks and friends', 'getting_things_done', '\uD83D\uDCCB', 'Getting things done', 'Finish 10 tasks.', 'tasks', 10),
    make('Tasks and friends', 'buddy', '\uD83E\uDD1D', 'Buddy', 'Make your first friend.', 'friends', 1),
    make('Tasks and friends', 'garden_club', '\uD83C\uDF89', 'Garden club', 'Have 5 friends.', 'friends', 5),
  ];
}

export function gardenRoutes(ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const { tzOffset } = parse(querySchema, req.query);
    const userId = req.user.id;
    const completed = await ctx.db.query(
      `SELECT id, plant_name, plant_type, task_title, planned_seconds, ended_at, collected_at, yard_x, yard_y FROM timer_sessions
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
      name: s.plant_name ?? null,
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
    const kinds = new Set(collected.map((s) => s.plant_type));
    const [{ n: tasksDone }] = await ctx.db.query('SELECT count(*)::int AS n FROM tasks WHERE user_id = $1 AND is_done', [userId]);
    const [{ n: friends }] = await ctx.db.query(
      "SELECT count(*)::int AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)", [userId]);
    const extra = {
      species: kinds.size,
      trees: collected.filter((s) => plantInfo(s.plant_type)?.kind === 'tree').length,
      bestSessionMinutes: Math.round(Math.max(0, ...completed.map((s) => s.planned_seconds)) / 60),
      tasksDone,
      friends,
    };
    stats.totalPlants = collected.length;
    stats.pendingPlants = pending.length;
    res.json({
      plants: collected.slice(0, 500).map(dto),
      pending: pending.map(dto),
      withered: withered.map(dto),
      stats,
      badges: computeBadges({ ...stats, ...extra, totalSeconds }),
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

  // Give a plant a name (or clear it). Works for any finished plant, collected or not.
  router.patch('/plants/:id', async (req, res) => {
    const row = await loadPlant(req);
    const body = parse(z.object({ name: z.string({ error: 'A name must be text.' }).trim().max(30, 'Use at most 30 characters.').nullable() }).strict(), req.body);
    if (row.kind !== 'focus' || row.status !== 'completed') throw new HttpError(409, 'Only finished plants can be named.');
    const name = body.name || null;
    await ctx.db.query('UPDATE timer_sessions SET plant_name = $3 WHERE id = $1 AND user_id = $2', [row.id, req.user.id, name]);
    res.json({ plant: { id: row.id, name } });
  });

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
