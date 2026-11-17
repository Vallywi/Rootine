import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

test('T-A1 register: 201, HttpOnly SameSite cookie, no password data in response', async () => {
  const c = s.newClient();
  const r = await c.post('/auth/register', { displayName: 'Mia', fullName: '  Mia   Santos  Reyes ', age: 20, gender: 'female', email: 'Mia@Gmail.com ', password: 'growing-plants-1', confirmPassword: 'growing-plants-1' });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.email, 'mia@gmail.com');
  assert.equal(r.body.user.displayName, 'Mia');
  assert.equal(r.body.user.fullName, 'Mia Santos Reyes'); // extra spaces collapsed
  assert.equal(r.body.user.age, 20);
  assert.equal(r.body.user.gender, 'female');
  assert.ok(r.body.csrfToken);
  const cookie = r.headers.getSetCookie().join(';');
  assert.match(cookie, /rootine_sid=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.ok(!JSON.stringify(r.body).includes('growing-plants'));
  assert.ok(!JSON.stringify(r.body).toLowerCase().includes('hash'));
});

test('T-A2 register: weak password and bad email each get a message', async () => {
  const c = s.newClient();
  const r = await c.post('/auth/register', { ...s.profile('x'), email: 'not-an-email', password: 'short', confirmPassword: 'short' });
  assert.equal(r.status, 400);
  assert.ok(r.body.fields.email);
  assert.ok(r.body.fields.password);
});

test('T-A2b register: confirm password mismatch is rejected and nothing is saved', async () => {
  const c = s.newClient();
  const r = await c.post('/auth/register', { ...s.profile('mismatch'), email: 'mismatch@example.com', password: 'growing-plants-1', confirmPassword: 'growing-plants-2' });
  assert.equal(r.status, 400);
  assert.equal(r.body.fields.confirmPassword, 'Passwords do not match.');
  const rows = await s.db.query("SELECT id FROM users WHERE email = 'mismatch@example.com'");
  assert.equal(rows.length, 0);
});

test('T-A2c register: the user row holds a hash, never the password', async () => {
  await s.register('row@example.com');
  const [u] = await s.db.query("SELECT * FROM users WHERE email = 'row@example.com'");
  assert.match(u.password_hash, /^scrypt\$/);
  assert.ok(!u.password_hash.includes('growing-plants-1'));
  assert.equal(u.display_name, 'row');
  assert.equal(u.full_name, 'Mia Santos Reyes');
  assert.equal(u.age, 20);
  assert.equal(u.gender, 'female');
  assert.equal(u.focus_minutes, 25);
  assert.equal(u.daily_goal, 4);
  assert.equal(u.theme, 'light');
  assert.ok(u.created_at > 0);
});

test('T-A3 register: duplicate email (any letter case) gets a 409 that does not confirm the account', async () => {
  await s.register('dup@example.com');
  const c = s.newClient();
  const r = await c.post('/auth/register', { ...s.profile('dup'), email: 'DUP@example.com', password: 'growing-plants-1', confirmPassword: 'growing-plants-1' });
  assert.equal(r.status, 409);
  assert.ok(!/already|exists|registered/i.test(r.body.error));
});

test('register rejects unknown fields (mass assignment)', async () => {
  const c = s.newClient();
  const r = await c.post('/auth/register', { ...s.profile('x'), email: 'x@example.com', password: 'growing-plants-1', confirmPassword: 'growing-plants-1', role: 'admin' });
  assert.equal(r.status, 400);
});

test('T-A4 login: wrong password and unknown email give identical 401 messages', async () => {
  await s.register('login@example.com');
  const c = s.newClient();
  const wrong = await c.post('/auth/login', { email: 'login@example.com', password: 'nope-nope-nope' });
  const unknown = await c.post('/auth/login', { email: 'ghost@example.com', password: 'nope-nope-nope' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.error, unknown.body.error);
});

test('login works, /me returns the user, and a CSRF header is required to log out', async () => {
  await s.register('me@example.com');
  const c = s.newClient();
  const login = await c.post('/auth/login', { email: 'me@example.com', password: 'growing-plants-1' });
  assert.equal(login.status, 200);
  const me = await c.get('/auth/me');
  assert.equal(me.body.user.email, 'me@example.com');
  const noHeader = await c.post('/auth/logout', {}, { csrf: '' });
  assert.equal(noHeader.status, 403);
  const wrongHeader = await c.post('/auth/logout', {}, { csrf: 'wrong' });
  assert.equal(wrongHeader.status, 403);
});

test('T-A5 five wrong passwords lock the account until the time passes', async () => {
  await s.register('lock@example.com');
  const c = s.newClient();
  for (let i = 0; i < 5; i++) {
    const r = await c.post('/auth/login', { email: 'lock@example.com', password: 'wrong-wrong-1' });
    assert.equal(r.status, 401);
  }
  const locked = await c.post('/auth/login', { email: 'lock@example.com', password: 'growing-plants-1' });
  assert.equal(locked.status, 429);
  s.clock.t += 16 * 60_000;
  const ok = await c.post('/auth/login', { email: 'lock@example.com', password: 'growing-plants-1' });
  assert.equal(ok.status, 200);
});

test('T-A6 logout, then reuse the old cookie: 401', async () => {
  const c = await s.register('out@example.com');
  const oldCookie = c.state.cookie;
  const out = await c.post('/auth/logout', {});
  assert.equal(out.status, 200);
  const copy = s.newClient();
  copy.state.cookie = oldCookie;
  const r = await copy.get('/settings');
  assert.equal(r.status, 401);
});

test('login session expires after 7 days', async () => {
  const c = await s.register('expire@example.com');
  assert.equal((await c.get('/settings')).status, 200);
  s.clock.t += 8 * 24 * 3600_000;
  assert.equal((await c.get('/settings')).status, 401);
});

test('T-A11 change password: wrong current password gives 400 on currentPassword; success signs out other devices', async () => {
  const a = await s.register('change@example.com');
  const b = s.newClient();
  await b.post('/auth/login', { email: 'change@example.com', password: 'growing-plants-1' });
  const bad = await a.post('/auth/change-password', { currentPassword: 'wrong-pass-1', newPassword: 'brand-new-pass-1' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.currentPassword);
  const ok = await a.post('/auth/change-password', { currentPassword: 'growing-plants-1', newPassword: 'brand-new-pass-1' });
  assert.equal(ok.status, 200);
  assert.equal((await a.get('/settings')).status, 200); // this device stays signed in
  assert.equal((await b.get('/settings')).status, 401); // other device signed out
  const relog = await s.newClient().post('/auth/login', { email: 'change@example.com', password: 'brand-new-pass-1' });
  assert.equal(relog.status, 200);
});

test('T-E1 edit display name: empty, 41 characters, valid', async () => {
  const c = await s.register('name@example.com');
  assert.equal((await c.patch('/auth/profile', { displayName: '   ' })).status, 400);
  assert.equal((await c.patch('/auth/profile', { displayName: 'x'.repeat(41) })).status, 400);
  const ok = await c.patch('/auth/profile', { displayName: ' Mia ' });
  assert.equal(ok.status, 200);
  assert.equal((await c.get('/auth/me')).body.user.displayName, 'Mia');
});

test('T-E2 and T-E3 delete account: wrong password keeps data, correct password removes everything', async () => {
  const c = await s.register('bye@example.com');
  await c.post('/tasks', { title: 'Keep me' });
  await c.post('/sessions', { kind: 'focus', plantType: 'cactus' });
  const wrong = await c.del('/auth/account', { password: 'wrong-pass-1' });
  assert.equal(wrong.status, 400);
  assert.ok(wrong.body.fields.password);
  assert.equal((await s.db.query("SELECT id FROM users WHERE email = 'bye@example.com'")).length, 1);

  const oldCookie = c.state.cookie;
  const ok = await c.del('/auth/account', { password: 'growing-plants-1' });
  assert.equal(ok.status, 200);
  assert.equal((await s.db.query("SELECT id FROM users WHERE email = 'bye@example.com'")).length, 0);
  assert.equal((await s.db.query('SELECT id FROM tasks WHERE title = $1', ['Keep me'])).length, 0);
  const copy = s.newClient();
  copy.state.cookie = oldCookie;
  assert.equal((await copy.get('/auth/me')).body.user, null);
});

test('rate limit: repeated registrations from one client are throttled with 429', async () => {
  const limited = await startServer({ rateLimit: true });
  try {
    let last;
    for (let i = 0; i < 11; i++) {
      last = await limited.newClient().post('/auth/register', { ...limited.profile('rl'), email: `rl${i}@example.com`, password: 'growing-plants-1', confirmPassword: 'growing-plants-1' });
    }
    assert.equal(last.status, 429);
  } finally {
    await limited.close();
  }
});

test('API responses are never cached and unknown API paths return 404 JSON', async () => {
  const c = s.newClient();
  const r = await c.get('/health');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  const nf = await c.get('/does-not-exist');
  assert.equal(nf.status, 404);
});

test('register requires the profile fields: name, full name, age, gender', async () => {
  const c = s.newClient();
  const r = await c.post('/auth/register', { email: 'bare@example.com', password: 'growing-plants-1', confirmPassword: 'growing-plants-1' });
  assert.equal(r.status, 400);
  for (const f of ['displayName', 'fullName', 'age', 'gender']) assert.ok(r.body.fields[f], f);
});

test('register validates age, gender, and full name', async () => {
  const base = { ...s.profile('v'), email: 'v@example.com', password: 'growing-plants-1', confirmPassword: 'growing-plants-1' };
  const bad = [
    [{ age: 4 }, 'age'], [{ age: 121 }, 'age'], [{ age: 20.5 }, 'age'], [{ age: '20' }, 'age'],
    [{ gender: 'robot' }, 'gender'],
    [{ fullName: 'M' }, 'fullName'], [{ fullName: '12345' }, 'fullName'], [{ fullName: '<b>Mia</b>' }, 'fullName'],
    [{ displayName: '   ' }, 'displayName'], [{ displayName: 'x'.repeat(41) }, 'displayName'],
  ];
  for (const [change, field] of bad) {
    const r = await s.newClient().post('/auth/register', { ...base, ...change });
    assert.equal(r.status, 400, JSON.stringify(change));
    assert.ok(r.body.fields[field], `${field} for ${JSON.stringify(change)}`);
  }
  // names with accents, apostrophes, and hyphens are fine
  const ok = await s.newClient().post('/auth/register', { ...base, fullName: "Ma. Cristina O'Neil-Dela Peña", gender: 'prefer_not_to_say', age: 5 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.fullName, "Ma. Cristina O'Neil-Dela Peña");
});

test('profile: update full name, age, and gender; reject bad values and empty updates', async () => {
  const c = await s.register('prof@example.com');
  const ok = await c.patch('/auth/profile', { fullName: 'Maria Clara', age: 21, gender: 'non_binary' });
  assert.equal(ok.status, 200);
  const me = (await c.get('/auth/me')).body.user;
  assert.deepEqual([me.fullName, me.age, me.gender], ['Maria Clara', 21, 'non_binary']);
  assert.equal((await c.patch('/auth/profile', { age: 3 })).status, 400);
  assert.equal((await c.patch('/auth/profile', { gender: 'x' })).status, 400);
  assert.equal((await c.patch('/auth/profile', {})).status, 400);
  assert.equal((await c.patch('/auth/profile', { email: 'new@example.com' })).status, 400); // email cannot be changed here
});

test('login returns the profile details too', async () => {
  await s.register('again@example.com');
  const r = await s.newClient().post('/auth/login', { email: 'again@example.com', password: 'growing-plants-1' });
  assert.equal(r.body.user.fullName, 'Mia Santos Reyes');
  assert.equal(r.body.user.age, 20);
});