import crypto from 'node:crypto';
// A friend code is 8 characters people can read out loud or type: no 0, O, 1, or I.
// It is shown as XXXX-XXXX. It is how a user is found, instead of an email address (which stays private).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomFriendCode() {
  const bytes = crypto.randomBytes(8);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

// What a person typed -> the stored form (upper case, no spaces or dashes), or null if it cannot be a code.
export function cleanFriendCode(text) {
  const code = String(text ?? '').toUpperCase().replace(/[\s-]/g, '');
  return new RegExp(`^[${ALPHABET}]{8}$`).test(code) ? code : null;
}

export const showFriendCode = (code) => (code ? `${code.slice(0, 4)}-${code.slice(4)}` : null);

// Gives a user a code if they have none yet. Safe to call again. Returns the user's code.
export async function ensureFriendCode(query, userId) {
  const [row] = await query('SELECT friend_code FROM users WHERE id = $1', [userId]);
  if (!row) return null;
  if (row.friend_code) return row.friend_code;
  for (let i = 0; i < 12; i += 1) {
    try {
      const done = await query('UPDATE users SET friend_code = $2 WHERE id = $1 AND friend_code IS NULL RETURNING friend_code', [userId, randomFriendCode()]);
      if (done.length) return done[0].friend_code;
      return (await query('SELECT friend_code FROM users WHERE id = $1', [userId]))[0].friend_code;
    } catch (err) {
      if (!(err && err.code === '23505')) throw err; // another user has this code: try a new one
    }
  }
  throw new Error('could not create a friend code');
}

// For databases that already had users before friend codes existed.
export async function backfillFriendCodes(query) {
  const rows = await query('SELECT id FROM users WHERE friend_code IS NULL');
  for (const r of rows) await ensureFriendCode(query, r.id);
}
