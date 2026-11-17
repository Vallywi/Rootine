import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../http.js';
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
      `SELECT id, plant_type, task_title, planned_seconds, ended_at FROM timer_sessions
        WHERE user_id = $1 AND kind = 'focus' AND status = 'completed' ORDER BY ended_at DESC, id DESC`,
      [userId],
    );
    const withered = await ctx.db.query(
      `SELECT id, plant_type, task_title, planned_seconds, ended_at FROM timer_sessions
        WHERE user_id = $1 AND kind = 'focus' AND status = 'given_up' ORDER BY ended_at DESC, id DESC LIMIT 30`,
      [userId],
    );
    const dto = (s) => ({ id: s.id, plantType: s.plant_type, taskTitle: s.task_title, minutes: Math.round(s.planned_seconds / 60), endedAt: s.ended_at });
    const { totalSeconds, ...stats } = computeStats(completed, ctx.now(), tzOffset);
    res.json({
      plants: completed.slice(0, 500).map(dto),
      withered: withered.map(dto),
      stats,
      badges: computeBadges({ ...stats, totalSeconds }),
    });
  });

  return router;
}
