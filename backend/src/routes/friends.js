import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, parse, parseId } from '../http.js';
import { requireAuth } from '../auth.js';
import { rateLimit } from '../rateLimit.js';
import { cleanFriendCode, ensureFriendCode, showFriendCode } from '../friendCode.js';
import { computeStats } from './garden.js';

const MAX_FRIENDS = 50;

const addSchema = z.object({ code: z.string({ error: 'Enter your friend’s code.' }).trim().min(1, 'Enter your friend’s code.').max(40, 'That is not a friend code.') }).strict();
const querySchema = z.object({
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
  period: z.enum(['week', 'all']).default('week'),
});

// What a friend may see about someone: a nickname and a photo. Never an email, full name, age, or gender.
const personDto = (u) => ({
  id: u.id,
  displayName: u.display_name,
  avatarUrl: u.has_avatar ? `/api/users/${u.id}/avatar?v=${u.avatar_version}` : null,
});
const PERSON = 'u.id, u.display_name, (u.avatar IS NOT NULL) AS has_avatar, u.avatar_version, u.share_progress';

export function friendRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  router.use(requireAuth);
  const addLimit = rateLimit(ctx, { name: 'friend-add', max: 15, windowMs: 15 * 60 * 1000 });

  const acceptedFriends = (userId) => db.query(
    `SELECT f.id AS friendship_id, f.responded_at, ${PERSON}
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
      WHERE f.status = 'accepted' AND (f.requester_id = $1 OR f.addressee_id = $1)
      ORDER BY lower(u.display_name), u.id`,
    [userId],
  );

  // Everything the Friends page needs in one call.
  router.get('/', async (req, res) => {
    const me = req.user.id;
    const code = await ensureFriendCode((sql, params) => db.query(sql, params), me);
    const [mine] = await db.query('SELECT share_progress FROM users WHERE id = $1', [me]);
    const friends = await acceptedFriends(me);
    const incoming = await db.query(
      `SELECT f.id AS request_id, f.created_at, ${PERSON} FROM friendships f JOIN users u ON u.id = f.requester_id
        WHERE f.addressee_id = $1 AND f.status = 'pending' ORDER BY f.created_at DESC`,
      [me],
    );
    const outgoing = await db.query(
      `SELECT f.id AS request_id, f.created_at, ${PERSON} FROM friendships f JOIN users u ON u.id = f.addressee_id
        WHERE f.requester_id = $1 AND f.status = 'pending' ORDER BY f.created_at DESC`,
      [me],
    );
    res.json({
      code: showFriendCode(code),
      shareProgress: mine.share_progress,
      friends: friends.map((f) => ({ ...personDto(f), sharing: f.share_progress, since: f.responded_at })),
      incoming: incoming.map((r) => ({ requestId: r.request_id, sentAt: r.created_at, user: personDto(r) })),
      outgoing: outgoing.map((r) => ({ requestId: r.request_id, sentAt: r.created_at, user: personDto(r) })),
    });
  });

  // Add a friend by their code. If they already asked you, you become friends right away.
  router.post('/requests', addLimit, async (req, res) => {
    const body = parse(addSchema, req.body);
    const code = cleanFriendCode(body.code);
    if (!code) throw new HttpError(400, 'Please check the highlighted fields.', { fields: { code: 'A friend code has 8 letters and numbers, like K7M2-9QXA.' } });
    const me = req.user.id;
    const [other] = await db.query(`SELECT ${PERSON} FROM users u WHERE u.friend_code = $1`, [code]);
    if (!other) throw new HttpError(404, 'No one has that friend code. Check it and try again.');
    if (other.id === me) throw new HttpError(400, 'That is your own code. Share it with a friend instead.');

    const [existing] = await db.query(
      'SELECT id, requester_id, status FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)',
      [me, other.id],
    );
    const now = ctx.now();
    if (existing) {
      if (existing.status === 'accepted') throw new HttpError(409, 'You are already friends.');
      if (existing.requester_id === me) throw new HttpError(409, 'You already sent them a request. Now wait for them to accept.');
      // they asked first: accept
      await db.query("UPDATE friendships SET status = 'accepted', responded_at = $2 WHERE id = $1 AND status = 'pending'", [existing.id, now]);
      return res.json({ status: 'accepted', user: personDto(other) });
    }
    const [{ n }] = await db.query(
      "SELECT count(*)::int AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)", [me]);
    if (n >= MAX_FRIENDS) throw new HttpError(409, `You can have up to ${MAX_FRIENDS} friends.`);
    const [row] = await db.query(
      "INSERT INTO friendships (requester_id, addressee_id, created_at) VALUES ($1, $2, $3) RETURNING id", [me, other.id, now]);
    res.status(201).json({ status: 'pending', requestId: row.id, user: personDto(other) });
  });

  const loadRequest = async (req, who) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    const [row] = await db.query(
      `SELECT id, requester_id, addressee_id, status FROM friendships WHERE id = $1 AND ${who === 'addressee' ? 'addressee_id' : 'requester_id'} = $2`,
      [id, req.user.id],
    );
    if (!row) throw notFound();
    return row;
  };

  router.post('/requests/:id/accept', async (req, res) => {
    const row = await loadRequest(req, 'addressee');
    if (row.status !== 'pending') throw new HttpError(409, 'You are already friends.');
    const [{ n }] = await db.query(
      "SELECT count(*)::int AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)", [req.user.id]);
    if (n >= MAX_FRIENDS) throw new HttpError(409, `You can have up to ${MAX_FRIENDS} friends.`);
    await db.query("UPDATE friendships SET status = 'accepted', responded_at = $2 WHERE id = $1", [row.id, ctx.now()]);
    res.json({ ok: true });
  });

  router.post('/requests/:id/decline', async (req, res) => {
    const row = await loadRequest(req, 'addressee');
    if (row.status !== 'pending') throw new HttpError(409, 'You are already friends. Remove them from your friends list instead.');
    await db.query('DELETE FROM friendships WHERE id = $1', [row.id]);
    res.json({ ok: true });
  });

  // Cancel a request you sent.
  router.delete('/requests/:id', async (req, res) => {
    const row = await loadRequest(req, 'requester');
    if (row.status !== 'pending') throw new HttpError(409, 'You are already friends.');
    await db.query('DELETE FROM friendships WHERE id = $1', [row.id]);
    res.json({ ok: true });
  });

  // Remove a friend (either of the two can do it).
  router.delete('/:userId', async (req, res) => {
    const other = parseId(req.params.userId);
    if (!other) throw notFound();
    const gone = await db.query(
      `DELETE FROM friendships WHERE status = 'accepted' AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)) RETURNING id`,
      [req.user.id, other],
    );
    if (!gone.length) throw notFound();
    res.json({ ok: true });
  });

  // The leading score. Score = focus minutes finished this week (or all time).
  // Only you and friends who share their progress are listed, and everyone is measured with the viewer's week.
  router.get('/leaderboard', async (req, res) => {
    const { tzOffset, period } = parse(querySchema, req.query);
    const me = req.user.id;
    const friends = (await acceptedFriends(me)).filter((f) => f.share_progress);
    const people = [{ id: me, display_name: req.user.displayName, has_avatar: req.user.hasAvatar, avatar_version: req.user.avatarVersion, isMe: true }, ...friends];
    const ids = people.map((p) => p.id);
    const sessions = await db.query(
      `SELECT user_id, ended_at, planned_seconds, collected_at FROM timer_sessions
        WHERE user_id = ANY($1::bigint[]) AND kind = 'focus' AND status = 'completed'`,
      [ids],
    );
    const byUser = new Map(ids.map((id) => [id, []]));
    for (const s of sessions) byUser.get(s.user_id).push(s);

    const rows = people.map((p) => {
      const list = byUser.get(p.id);
      const stats = computeStats(list, ctx.now(), tzOffset);
      return {
        ...personDto(p),
        isMe: !!p.isMe,
        minutes: period === 'week' ? stats.weekMinutes : Math.round(stats.totalSeconds / 60),
        plants: list.filter((s) => s.collected_at != null).length,
        streak: stats.currentStreak,
      };
    });
    // Most minutes first. A tie goes to the one with more plants, then to the name, so the order never jumps around.
    rows.sort((a, b) => b.minutes - a.minutes || b.plants - a.plants || a.displayName.localeCompare(b.displayName) || a.id - b.id);
    let rank = 0, prev = null;
    rows.forEach((r, i) => {
      const key = `${r.minutes}|${r.plants}`;
      if (key !== prev) { rank = i + 1; prev = key; }
      r.rank = rank; // friends with exactly the same score share a rank
    });
    res.json({ period, rows, hidden: (await acceptedFriends(me)).filter((f) => !f.share_progress).length });
  });

  return router;
}
