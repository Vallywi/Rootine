import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './helpers.js';
import { cleanFriendCode, randomFriendCode, showFriendCode } from '../src/friendCode.js';

let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

let n = 0;
const newUser = async (name) => {
  const email = `friend${++n}@example.com`;
  const c = await s.register(email);
  await c.patch('/auth/profile', { displayName: name ?? `User${n}` });
  c.email = email;
  return c;
};
const codeOf = async (c) => (await c.get('/friends')).body.code;
// a minimal but valid JPEG (the server only checks the signature and the size)
const jpeg = (size = 600) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(size, 7), Buffer.from([0xff, 0xd9])]);
const putPhoto = (c, body, type = 'image/jpeg') =>
  fetch(`${c.base}/auth/avatar`, { method: 'PUT', headers: { 'Content-Type': type, 'X-Rootine-CSRF': c.state.csrf, Cookie: c.state.cookie }, body });
// finish a focus session of `minutes` for this user and collect the plant
async function grow(c, minutes) {
  const r = await c.post('/sessions', { kind: 'focus', plantType: 'rose', minutes });
  s.clock.t += minutes * 60_000;
  await c.post(`/sessions/${r.body.session.id}/complete`);
  await c.post(`/sessions/${r.body.session.id}/collect`);
}
const befriend = async (a, b) => {
  await b.post('/friends/requests', { code: await codeOf(a) });
  const req = (await a.get('/friends')).body.incoming[0];
  await a.post(`/friends/requests/${req.requestId}/accept`);
};

test('friend codes: 8 easy characters, shown as XXXX-XXXX, and cleaned when typed', () => {
  const code = randomFriendCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(showFriendCode('ABCD2345'), 'ABCD-2345');
  assert.equal(cleanFriendCode(' abcd-2345 '), 'ABCD2345');
  assert.equal(cleanFriendCode('ABCD0OIl'), null); // 0, O, I, l are not used
  assert.equal(cleanFriendCode('short'), null);
});

test('every account has its own friend code from the start', async () => {
  const a = await newUser(); const b = await newUser();
  const ca = await codeOf(a), cb = await codeOf(b);
  assert.match(ca, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.notEqual(ca, cb);
  assert.equal(await codeOf(a), ca); // it does not change
});

test('add a friend with their code: they get a request, accept it, and both see each other', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben');
  const add = await b.post('/friends/requests', { code: (await codeOf(a)).toLowerCase().replace('-', ' ') });
  assert.equal(add.status, 201);
  assert.equal(add.body.status, 'pending');
  assert.equal(add.body.user.displayName, 'Ana');
  assert.equal((await b.get('/friends')).body.outgoing.length, 1);
  const inbox = (await a.get('/friends')).body.incoming;
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].user.displayName, 'Ben');
  assert.equal((await a.get('/friends')).body.friends.length, 0); // not friends yet
  assert.equal((await a.post(`/friends/requests/${inbox[0].requestId}/accept`)).status, 200);
  assert.deepEqual((await a.get('/friends')).body.friends.map((f) => f.displayName), ['Ben']);
  assert.deepEqual((await b.get('/friends')).body.friends.map((f) => f.displayName), ['Ana']);
  assert.equal((await b.get('/friends')).body.outgoing.length, 0);
});

test('friends never see private details: no email, full name, age, or gender', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben');
  await befriend(a, b);
  const text = JSON.stringify([(await a.get('/friends')).body, (await a.get('/friends/leaderboard')).body]);
  for (const secret of [`friend${n}@example.com`, 'Mia Santos Reyes', 'email', 'fullName', 'age', 'gender', 'password']) {
    assert.ok(!text.includes(secret), `leaked: ${secret}`);
  }
});

test('request rules: unknown code, own code, bad code, duplicates, and asking someone who already asked you', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben');
  assert.equal((await b.post('/friends/requests', { code: 'ZZZZ-ZZZZ' })).status, 404);
  assert.equal((await b.post('/friends/requests', { code: await codeOf(b) })).status, 400);
  const bad = await b.post('/friends/requests', { code: 'hello' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.code);
  assert.equal((await b.post('/friends/requests', { code: '' })).status, 400);
  assert.equal((await b.post('/friends/requests', { code: await codeOf(a) })).status, 201);
  assert.equal((await b.post('/friends/requests', { code: await codeOf(a) })).status, 409); // already sent
  // Ana adds Ben's code while Ben's request is waiting: they become friends right away
  const both = await a.post('/friends/requests', { code: await codeOf(b) });
  assert.equal(both.status, 200);
  assert.equal(both.body.status, 'accepted');
  assert.equal((await a.post('/friends/requests', { code: await codeOf(b) })).status, 409); // already friends
  assert.equal((await a.get('/friends')).body.friends.length, 1);
});

test('only the person who was asked can accept or decline, and only the sender can cancel', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben'); const c = await newUser('Cy');
  await b.post('/friends/requests', { code: await codeOf(a) });
  const id = (await a.get('/friends')).body.incoming[0].requestId;
  assert.equal((await b.post(`/friends/requests/${id}/accept`)).status, 404); // the sender cannot accept
  assert.equal((await c.post(`/friends/requests/${id}/accept`)).status, 404); // a stranger cannot
  assert.equal((await c.post(`/friends/requests/${id}/decline`)).status, 404);
  assert.equal((await a.del(`/friends/requests/${id}`)).status, 404); // the receiver cannot "cancel"
  assert.equal((await b.del(`/friends/requests/${id}`)).status, 200); // the sender can
  assert.equal((await a.get('/friends')).body.incoming.length, 0);
  await b.post('/friends/requests', { code: await codeOf(a) });
  const id2 = (await a.get('/friends')).body.incoming[0].requestId;
  assert.equal((await a.post(`/friends/requests/${id2}/decline`)).status, 200);
  assert.equal((await b.get('/friends')).body.outgoing.length, 0);
  assert.equal((await a.post('/friends/requests/abc/accept')).status, 404);
});

test('either friend can remove the other, and a stranger cannot', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben'); const c = await newUser('Cy');
  await befriend(a, b);
  const idOfB = (await a.get('/friends')).body.friends[0].id;
  assert.equal((await c.del(`/friends/${idOfB}`)).status, 404);
  assert.equal((await a.del(`/friends/${idOfB}`)).status, 200);
  assert.equal((await b.get('/friends')).body.friends.length, 0);
  assert.equal((await a.del(`/friends/${idOfB}`)).status, 404); // already gone
});

test('leaderboard: ranks you and your friends by focus minutes this week, ties share a rank', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben'); const c = await newUser('Cy');
  await befriend(a, b); await befriend(a, c);
  await grow(a, 25); await grow(a, 25);   // 50
  await grow(b, 40);                      // 40
  await grow(c, 40);                      // 40 (tie with Ben)
  const rows = (await a.get('/friends/leaderboard?tzOffset=0&period=week')).body.rows;
  assert.deepEqual(rows.map((r) => [r.displayName, r.minutes, r.rank]), [['Ana', 50, 1], ['Ben', 40, 2], ['Cy', 40, 2]]);
  assert.equal(rows[0].isMe, true);
  assert.equal(rows[0].plants, 2);
  // Ben sees the same people, with himself marked
  const bRows = (await b.get('/friends/leaderboard?tzOffset=0')).body.rows;
  assert.deepEqual(bRows.map((r) => r.displayName), ['Ana', 'Ben']); // Ben is not friends with Cy
  assert.equal(bRows.find((r) => r.isMe).displayName, 'Ben');
});

test('leaderboard: all time counts older weeks too, and bad parameters are refused', async () => {
  const a0 = await newUser('Ana'); const b = await newUser('Ben');
  await befriend(a0, b);
  await grow(b, 30);
  s.clock.t += 20 * 24 * 3600_000; // three weeks later (old logins have expired)
  const a = s.newClient();
  const li = await a.post('/auth/login', { email: a0.email, password: 'growing-plants-1' });
  assert.equal(li.status, 200);
  await grow(a, 25);
  const week = (await a.get('/friends/leaderboard?period=week')).body.rows;
  const all = (await a.get('/friends/leaderboard?period=all')).body.rows;
  assert.equal(week.find((r) => r.isMe).minutes, 25);
  assert.equal(week.find((r) => r.displayName === 'Ben').minutes, 0);
  assert.equal(all.find((r) => r.displayName === 'Ben').minutes, 30);
  assert.equal((await a.get('/friends/leaderboard?period=year')).status, 400);
  assert.equal((await a.get('/friends/leaderboard?tzOffset=abc')).status, 400);
});

test('privacy switch: a friend who stops sharing leaves the leaderboard but stays a friend', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben');
  await befriend(a, b);
  await grow(b, 30);
  assert.equal((await a.get('/friends/leaderboard')).body.rows.length, 2);
  assert.equal((await b.put('/settings', { shareProgress: false })).body.settings.shareProgress, false);
  const board = (await a.get('/friends/leaderboard')).body;
  assert.deepEqual(board.rows.map((r) => r.displayName), ['Ana']);
  assert.equal(board.hidden, 1);
  const list = (await a.get('/friends')).body.friends;
  assert.equal(list.length, 1);
  assert.equal(list[0].sharing, false);
  await b.put('/settings', { shareProgress: true });
  assert.equal((await a.get('/friends/leaderboard')).body.rows.length, 2);
});

test('only friends can see each other’s profile picture', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben'); const c = await newUser('Cy');
  await befriend(a, b);
  const up = await putPhoto(a, jpeg());
  assert.equal(up.status, 200);
  const { avatarUrl } = await up.json();
  assert.match(avatarUrl, /^\/api\/users\/\d+\/avatar\?v=1$/);
  assert.equal((await a.get('/auth/me')).body.user.avatarUrl, avatarUrl);
  const path = avatarUrl.replace('/api', '');
  const mine = await fetch(`${a.base}${path}`, { headers: { Cookie: a.state.cookie } });
  assert.equal(mine.status, 200);
  assert.equal(mine.headers.get('content-type'), 'image/jpeg');
  assert.match(mine.headers.get('cache-control'), /private/);
  assert.equal((await mine.arrayBuffer()).byteLength, jpeg().length);
  assert.equal((await fetch(`${a.base}${path}`, { headers: { Cookie: b.state.cookie } })).status, 200); // a friend
  assert.equal((await fetch(`${a.base}${path}`, { headers: { Cookie: c.state.cookie } })).status, 404); // a stranger
  assert.equal((await fetch(`${a.base}${path}`)).status, 401); // signed out
  // the friend list shows the address of the picture
  assert.equal((await b.get('/friends')).body.friends[0].avatarUrl, avatarUrl);
});

test('profile picture rules: JPEG only, the right size, replace, and remove', async () => {
  const a = await newUser('Ana');
  assert.equal((await putPhoto(a, Buffer.from('<script>alert(1)</script>'.repeat(20)))).status, 400); // not a JPEG
  assert.equal((await putPhoto(a, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(600)]), 'image/jpeg')).status, 400); // a PNG named JPEG
  assert.equal((await putPhoto(a, jpeg(50))).status, 400); // too small to be a photo
  assert.equal((await putPhoto(a, jpeg(160 * 1024))).status, 413); // too big
  assert.equal((await putPhoto(a, jpeg(), 'image/png')).status, 400); // wrong type
  assert.equal((await a.get('/auth/me')).body.user.avatarUrl, null);
  const first = await (await putPhoto(a, jpeg(600))).json();
  const second = await (await putPhoto(a, jpeg(900))).json();
  assert.notEqual(first.avatarUrl, second.avatarUrl); // the address changes, so browsers fetch the new one
  const gone = await a.del('/auth/avatar');
  assert.equal(gone.status, 200);
  assert.equal((await a.get('/auth/me')).body.user.avatarUrl, null);
  const missing = await fetch(`${a.base}${first.avatarUrl.replace('/api', '').split('?')[0]}`, { headers: { Cookie: a.state.cookie } });
  assert.equal(missing.status, 404);
  const signedOut = s.newClient();
  assert.equal((await putPhoto(signedOut, jpeg())).status, 401);
});

test('a profile picture needs the security header like every other change', async () => {
  const a = await newUser('Ana');
  const r = await fetch(`${a.base}/auth/avatar`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg', Cookie: a.state.cookie }, body: jpeg() });
  assert.equal(r.status, 403);
});

test('deleting an account removes its friendships and requests', async () => {
  const a = await newUser('Ana'); const b = await newUser('Ben'); const c = await newUser('Cy');
  await befriend(a, b);
  await c.post('/friends/requests', { code: await codeOf(a) });
  assert.equal((await a.del('/auth/account', { password: 'growing-plants-1' })).status, 200);
  assert.equal((await b.get('/friends')).body.friends.length, 0);
  assert.equal((await c.get('/friends')).body.outgoing.length, 0);
  const left = await s.db.query('SELECT count(*)::int AS n FROM friendships WHERE requester_id NOT IN (SELECT id FROM users) OR addressee_id NOT IN (SELECT id FROM users)');
  assert.equal(left[0].n, 0);
});

test('adding friends is rate limited', async () => {
  const limited = await startServer({ rateLimit: true });
  try {
    const a = await limited.register('limit1@example.com');
    let last;
    for (let i = 0; i < 16; i++) last = await a.post('/friends/requests', { code: 'ZZZZ-ZZZZ' });
    assert.equal(last.status, 429);
  } finally { await limited.close(); }
});
