import { Router } from 'express';
import { z } from 'zod';
import { HttpError, parse } from '../http.js';
import { LIMITS } from '../config.js';
import { requireAuth } from '../auth.js';

const range = (name, [min, max]) =>
  z.number({ error: `${name} must be a whole number.` }).int(`${name} must be a whole number.`).min(min, `${name} must be between ${min} and ${max}.`).max(max, `${name} must be between ${min} and ${max}.`);

const TIMING_FIELDS = ['focusMinutes', 'shortBreakMinutes', 'longBreakMinutes', 'longBreakInterval'];

const settingsSchema = z
  .object({
    focusMinutes: range('Focus length', LIMITS.focus),
    shortBreakMinutes: range('Short break', LIMITS.shortBreak),
    longBreakMinutes: range('Long break', LIMITS.longBreak),
    longBreakInterval: range('Long-break interval', LIMITS.interval),
    soundEnabled: z.boolean(),
    notificationsEnabled: z.boolean(),
    dailyGoal: range('Daily goal', LIMITS.dailyGoal),
    theme: z.enum(['light', 'dark'], { error: 'Theme must be light or dark.' }),
  })
  .partial()
  .strict();

const COLUMNS = {
  focusMinutes: 'focus_minutes',
  shortBreakMinutes: 'short_break_minutes',
  longBreakMinutes: 'long_break_minutes',
  longBreakInterval: 'long_break_interval',
  soundEnabled: 'sound_enabled',
  notificationsEnabled: 'notifications_enabled',
  dailyGoal: 'daily_goal',
  theme: 'theme',
};

const toDto = (u) => ({
  focusMinutes: u.focus_minutes,
  shortBreakMinutes: u.short_break_minutes,
  longBreakMinutes: u.long_break_minutes,
  longBreakInterval: u.long_break_interval,
  soundEnabled: u.sound_enabled,
  notificationsEnabled: u.notifications_enabled,
  dailyGoal: u.daily_goal,
  theme: u.theme,
});

const SELECT = `SELECT focus_minutes, short_break_minutes, long_break_minutes, long_break_interval,
  sound_enabled, notifications_enabled, daily_goal, theme FROM users WHERE id = $1`;

export function settingsRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const [row] = await db.query(SELECT, [req.user.id]);
    res.json({
      settings: toDto(row),
      limits: { focus: LIMITS.focus, shortBreak: LIMITS.shortBreak, longBreak: LIMITS.longBreak, interval: LIMITS.interval, dailyGoal: LIMITS.dailyGoal },
    });
  });

  router.put('/', async (req, res) => {
    const body = parse(settingsSchema, req.body);
    const keys = Object.keys(body);
    if (keys.length) {
      // Timing values are locked while a session is running (BR-12).
      if (keys.some((k) => TIMING_FIELDS.includes(k))) {
        const open = await db.query("SELECT id FROM timer_sessions WHERE user_id = $1 AND status IN ('active', 'paused')", [req.user.id]);
        if (open.length) throw new HttpError(409, 'Finish or give up your current session before changing timer lengths.');
      }
      const sets = keys.map((k, i) => `${COLUMNS[k]} = $${i + 2}`);
      await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, [req.user.id, ...keys.map((k) => body[k])]);
    }
    const [row] = await db.query(SELECT, [req.user.id]);
    res.json({ settings: toDto(row) });
  });

  return router;
}
