import { Router } from 'express';
import { z } from 'zod';
import { HttpError, parse } from '../http.js';
import { LIMITS, LOCK_AFTER_FAILURES, LOCK_MS } from '../config.js';
import { isUniqueViolation } from '../db.js';
import { hashPassword, verifyPassword, dummyHash } from '../security.js';
import { COOKIE_NAME, cookieOptions, createLoginSession, requireAuth } from '../auth.js';
import { rateLimit } from '../rateLimit.js';

const email = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address.')
  .max(LIMITS.email, 'That email address is too long.')
  .email('Enter a valid email address.');

const newPassword = z
  .string({ error: 'Enter a password.' })
  .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters.`)
  .max(LIMITS.passwordMax, `Use at most ${LIMITS.passwordMax} characters.`);

const registerSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string({ error: 'Confirm your password.' }).min(1, 'Confirm your password.'),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.password === v.email) c.addIssue({ code: 'custom', path: ['password'], message: 'Choose a password that is different from your email.' });
    if (v.confirmPassword !== v.password) c.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
  });

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().min(1, 'Enter your email address.').max(LIMITS.email),
    password: z.string().min(1, 'Enter your password.').max(LIMITS.passwordMax),
  })
  .strict();

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(LIMITS.passwordMax),
    newPassword,
  })
  .strict();

const profileSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Enter a name.').max(LIMITS.displayName, `Use at most ${LIMITS.displayName} characters.`),
  })
  .strict();

const deleteSchema = z.object({ password: z.string().min(1, 'Enter your password.').max(LIMITS.passwordMax) }).strict();

const userDto = (u) => ({ id: u.id, email: u.email, displayName: u.displayName ?? u.display_name });

export function authRoutes(ctx) {
  const router = Router();
  const { db } = ctx;
  const authLimit = rateLimit(ctx, { name: 'login', max: 20, windowMs: 15 * 60 * 1000 });
  const registerLimit = rateLimit(ctx, { name: 'register', max: 10, windowMs: 15 * 60 * 1000 });

  router.get('/me', (req, res) => {
    if (!req.user) return res.json({ user: null });
    res.json({ user: userDto(req.user), csrfToken: req.csrfToken });
  });

  router.post('/register', registerLimit, async (req, res) => {
    const body = parse(registerSchema, req.body);
    const hash = await hashPassword(body.password);
    const displayName = (body.email.split('@')[0] || 'Friend').slice(0, LIMITS.displayName);
    let user;
    try {
      [user] = await db.query(
        'INSERT INTO users (email, display_name, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name',
        [body.email, displayName, hash, ctx.now()],
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new HttpError(409, 'We could not create an account with those details. Try logging in instead.');
      }
      throw err;
    }
    const csrfToken = await createLoginSession(ctx, res, user.id);
    res.status(201).json({ user: userDto(user), csrfToken });
  });

  router.post('/login', authLimit, async (req, res) => {
    const body = parse(loginSchema, req.body);
    const [user] = await db.query(
      'SELECT id, email, display_name, password_hash, failed_logins, locked_until FROM users WHERE lower(email) = $1',
      [body.email],
    );
    const now = ctx.now();
    if (user && user.locked_until > now) {
      throw new HttpError(429, 'Too many failed attempts. Try again in a few minutes.');
    }
    // Always run one hash comparison, so timing does not reveal unknown emails.
    const ok = await verifyPassword(body.password, user ? user.password_hash : await dummyHash());
    if (!user || !ok) {
      if (user) {
        const failed = user.failed_logins + 1;
        if (failed >= LOCK_AFTER_FAILURES) {
          await db.query('UPDATE users SET failed_logins = 0, locked_until = $2 WHERE id = $1', [user.id, now + LOCK_MS]);
        } else {
          await db.query('UPDATE users SET failed_logins = $2 WHERE id = $1', [user.id, failed]);
        }
      }
      throw new HttpError(401, 'Email or password is incorrect.');
    }
    await db.query('UPDATE users SET failed_logins = 0, locked_until = 0 WHERE id = $1', [user.id]);
    // New session on every login (prevents session fixation). Drop this browser's old one.
    if (req.sessionHash) await db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [req.sessionHash]);
    const csrfToken = await createLoginSession(ctx, res, user.id);
    res.json({ user: userDto(user), csrfToken });
  });

  router.post('/logout', async (req, res) => {
    if (req.sessionHash) await db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [req.sessionHash]);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(ctx.config), maxAge: undefined });
    res.json({ ok: true });
  });

  router.post('/change-password', requireAuth, async (req, res) => {
    const body = parse(changePasswordSchema, req.body);
    const [row] = await db.query('SELECT email, password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await verifyPassword(body.currentPassword, row.password_hash))) {
      throw new HttpError(400, 'Please check the highlighted fields.', { fields: { currentPassword: 'Your current password is not correct.' } });
    }
    if (body.newPassword === row.email) {
      throw new HttpError(400, 'Please check the highlighted fields.', { fields: { newPassword: 'Choose a password that is different from your email.' } });
    }
    const hash = await hashPassword(body.newPassword);
    await db.tx(async (t) => {
      await t.query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.user.id, hash]);
      // Sign out all other devices. Keep this one.
      await t.query('DELETE FROM auth_sessions WHERE user_id = $1 AND token_hash <> $2', [req.user.id, req.sessionHash]);
    });
    res.json({ ok: true });
  });

  router.patch('/profile', requireAuth, async (req, res) => {
    const body = parse(profileSchema, req.body);
    const [user] = await db.query('UPDATE users SET display_name = $2 WHERE id = $1 RETURNING id, email, display_name', [
      req.user.id,
      body.displayName,
    ]);
    res.json({ user: userDto(user) });
  });

  router.delete('/account', requireAuth, async (req, res) => {
    const body = parse(deleteSchema, req.body);
    const [row] = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await verifyPassword(body.password, row.password_hash))) {
      throw new HttpError(400, 'Please check the highlighted fields.', { fields: { password: 'That password is not correct.' } });
    }
    // Foreign keys cascade to tasks, timer sessions, and login sessions.
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions(ctx.config), maxAge: undefined });
    ctx.logger.info('[account] an account was deleted');
    res.json({ ok: true });
  });

  return router;
}
