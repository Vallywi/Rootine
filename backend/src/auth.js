import { HttpError } from './http.js';
import { SESSION_DAYS } from './config.js';
import { randomToken, sha256 } from './security.js';

export const COOKIE_NAME = 'rootine_sid';
export const CSRF_HEADER = 'x-rootine-csrf';

export function cookieOptions(config) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

// Creates a login session. Only the SHA-256 hash of the token is stored.
export async function createLoginSession(ctx, res, userId, client = ctx.db) {
  const token = randomToken();
  const csrfToken = randomToken();
  const now = ctx.now();
  await client.query(
    'INSERT INTO auth_sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [sha256(token), userId, csrfToken, now, now + SESSION_DAYS * 24 * 60 * 60 * 1000],
  );
  res.cookie(COOKIE_NAME, token, cookieOptions(ctx.config));
  return csrfToken;
}

// Sets req.user and req.csrfToken if the cookie is valid. Never fails by itself.
export function loadSession(ctx) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE_NAME];
      if (typeof token === 'string' && token) {
        const hash = sha256(token);
        const rows = await ctx.db.query(
          `SELECT s.token_hash, s.csrf_token, s.expires_at, u.id, u.email, u.display_name, u.full_name, u.age, u.gender
             FROM auth_sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = $1`,
          [hash],
        );
        const row = rows[0];
        if (row && row.expires_at > ctx.now()) {
          req.user = { id: row.id, email: row.email, displayName: row.display_name, fullName: row.full_name, age: row.age, gender: row.gender };
          req.csrfToken = row.csrf_token;
          req.sessionHash = row.token_hash;
        } else if (row) {
          // Expired: remove it when it is looked up.
          await ctx.db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hash]);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// State-changing requests need the custom header. Signed-in users must match their secret.
export function csrfCheck(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const header = req.get(CSRF_HEADER);
  if (!header) return next(new HttpError(403, 'Missing security token. Reload the page and try again.'));
  if (req.user && header !== req.csrfToken) {
    return next(new HttpError(403, 'Invalid security token. Reload the page and try again.'));
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
  next();
}
