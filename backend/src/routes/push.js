import { Router } from 'express';
import { z } from 'zod';
import { timingSafeEqual } from 'node:crypto';
import { HttpError, parse } from '../http.js';
import { requireAuth } from '../auth.js';
import { donePayload } from '../push.js';

const MAX_SUBSCRIPTIONS = 10; // per person (phone, laptop, ...)

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000).startsWith('https://', 'The push address must use https.'),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

const sameSecret = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function pushRoutes(ctx) {
  const router = Router();
  const { db } = ctx;

  // Called every minute by a scheduler (see docs/PUSH-SETUP.md). Sends every push that is due.
  // Not a logged-in route: it is protected by CRON_SECRET (Authorization: Bearer <secret>).
  router.get('/dispatch', async (req, res) => {
    const secret = ctx.config.cronSecret;
    if (!secret || !ctx.pusher) throw new HttpError(404, 'Not found.');
    const auth = req.get('authorization') || '';
    if (!auth.startsWith('Bearer ') || !sameSecret(auth.slice(7), secret)) throw new HttpError(401, 'Not allowed.');

    // Claim the due jobs in one statement, so two overlapping calls never send the same push twice.
    const jobs = await db.query('DELETE FROM push_jobs WHERE due_at <= $1 RETURNING session_id, user_id, kind', [ctx.now()]);
    let sent = 0;
    for (const job of jobs) {
      const subs = await db.query(
        `SELECT s.id, s.endpoint, s.p256dh, s.auth FROM push_subscriptions s JOIN users u ON u.id = s.user_id
          WHERE s.user_id = $1 AND u.notifications_enabled`,
        [job.user_id],
      );
      const payload = donePayload(job.kind, job.session_id);
      for (const sub of subs) {
        try {
          if ((await ctx.pusher.send(sub, payload)) === 'gone') await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
          else sent += 1;
        } catch (err) {
          ctx.logger.error(`[push] send failed: ${err.statusCode || err.message}`);
        }
      }
    }
    res.json({ due: jobs.length, sent });
  });

  router.use(requireAuth);

  router.get('/key', (req, res) => {
    if (!ctx.pusher) return res.json({ enabled: false });
    res.json({ enabled: true, publicKey: ctx.pusher.publicKey });
  });

  router.post('/subscribe', async (req, res) => {
    if (!ctx.pusher) throw new HttpError(503, 'Push notifications are not set up on this server.');
    const { endpoint, keys } = parse(subscribeSchema, req.body);
    const [{ count }] = await db.query('SELECT count(*)::int AS count FROM push_subscriptions WHERE user_id = $1 AND endpoint <> $2', [req.user.id, endpoint]);
    if (count >= MAX_SUBSCRIPTIONS) {
      await db.query('DELETE FROM push_subscriptions WHERE id IN (SELECT id FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at LIMIT 1)', [req.user.id]);
    }
    // The same browser can be re-registered (also after another person logs in on it): the endpoint moves to this user.
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [req.user.id, endpoint, keys.p256dh, keys.auth, ctx.now()],
    );
    res.status(201).json({ ok: true });
  });

  router.post('/unsubscribe', async (req, res) => {
    const { endpoint } = parse(z.object({ endpoint: z.string().max(1000) }), req.body);
    await db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.user.id, endpoint]);
    res.json({ ok: true });
  });

  return router;
}
