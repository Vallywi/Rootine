import { Router } from 'express';
import { notFound, parseId } from '../http.js';
import { requireAuth } from '../auth.js';

// Profile pictures. You can see your own, and the pictures of your accepted friends. Nobody else's.
export function userRoutes(ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get('/:id/avatar', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw notFound();
    if (id !== req.user.id) {
      const [friend] = await ctx.db.query(
        `SELECT 1 FROM friendships WHERE status = 'accepted' AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
        [req.user.id, id],
      );
      if (!friend) throw notFound();
    }
    const [row] = await ctx.db.query('SELECT avatar FROM users WHERE id = $1 AND avatar IS NOT NULL', [id]);
    if (!row) throw notFound();
    res.set('Content-Type', 'image/jpeg');
    // The address ends in ?v=<version>, which changes when the picture changes, so it is safe to keep a while.
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(Buffer.from(row.avatar));
  });

  return router;
}
