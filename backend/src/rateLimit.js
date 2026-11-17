import { HttpError } from './http.js';

// Counter stored in the database. In-memory counters do not work on Vercel,
// because every request can run in a different short-lived instance.
export function rateLimit(ctx, { name, max, windowMs }) {
  return async (req, res, next) => {
    try {
      if (!ctx.config.rateLimit) return next();
      const now = ctx.now();
      const key = `${name}:${req.ip}`;
      const rows = await ctx.db.query(
        `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, $2::bigint, 1)
         ON CONFLICT (key) DO UPDATE SET
           window_start = CASE WHEN rate_limits.window_start + $3::bigint <= $2::bigint THEN $2::bigint ELSE rate_limits.window_start END,
           count = CASE WHEN rate_limits.window_start + $3::bigint <= $2::bigint THEN 1 ELSE rate_limits.count + 1 END
         RETURNING count`,
        [key, now, windowMs],
      );
      if (rows[0].count > max) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
      next();
    } catch (err) {
      next(err);
    }
  };
}
