import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createAi } from '../src/ai.js';
import { createDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';

// These tests replace the global fetch, so no real request is sent to Google and no key is used.
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const input = { system: 'You are Rootie.', messages: [{ role: 'user', content: 'hi' }] };
const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const makeAi = () => createAi({ aiApiKey: 'test-key', aiModel: 'test-model' });

test('ai client: is off (null) when no API key is set', () => {
  assert.equal(createAi({ aiApiKey: '', aiModel: 'x' }), null);
});

test('ai client: sends the documented request and returns the answer text', async () => {
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return reply(200, { candidates: [{ content: { parts: [{ text: 'Hello ' }, { text: 'there' }] } }] });
  };
  assert.equal(await makeAi().reply(input), 'Hello there');
  assert.match(seen.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/test-model:generateContent$/);
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['x-goog-api-key'], 'test-key'); // key goes in a header, never in the URL
  assert.equal(seen.url.includes('test-key'), false);
  const body = JSON.parse(seen.init.body);
  assert.equal(body.systemInstruction.parts[0].text, 'You are Rootie.');
  assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: 'hi' }] }]);
});

test('ai client: maps the assistant role to Gemini "model"', async () => {
  let body;
  globalThis.fetch = async (url, init) => { body = JSON.parse(init.body); return reply(200, { candidates: [{ content: { parts: [{ text: 'ok' }] } }] }); };
  await makeAi().reply({ system: 's', messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }] });
  assert.deepEqual(body.contents.map((c) => c.role), ['user', 'model', 'user']);
});

test('ai client: 429 gives a friendly "busy" error (503)', async () => {
  globalThis.fetch = async () => reply(429, {});
  await assert.rejects(makeAi().reply(input), (e) => e.status === 503 && /busy/i.test(e.message));
});

test('ai client: one 503 is retried, then the answer is returned', async () => {
  let n = 0;
  globalThis.fetch = async () => (++n === 1 ? reply(503, {}) : reply(200, { candidates: [{ content: { parts: [{ text: 'second try' }] } }] }));
  assert.equal(await makeAi().reply(input), 'second try');
  assert.equal(n, 2);
});

test('ai client: 503 twice in a row gives the "busy" error', async () => {
  globalThis.fetch = async () => reply(503, {});
  await assert.rejects(makeAi().reply(input), (e) => e.status === 503);
});

test('ai client: other HTTP errors give "not available" (502) without leaking details', async () => {
  globalThis.fetch = async () => reply(403, { error: { message: 'API key not valid: test-key' } });
  await assert.rejects(makeAi().reply(input), (e) => e.status === 502 && !e.message.includes('test-key'));
});

test('ai client: a network error or timeout gives a 502 message', async () => {
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(makeAi().reply(input), (e) => e.status === 502 && /in time/i.test(e.message));
});

test('ai client: an empty answer gives a meaningful message', async () => {
  globalThis.fetch = async () => reply(200, { candidates: [] });
  await assert.rejects(makeAi().reply(input), (e) => e.status === 502 && /no answer/i.test(e.message));
});

// Strategy pattern: createDb picks an interchangeable storage driver, and both expose the same interface.
test('strategy: createDb returns a driver with the shared interface (PGlite when no DATABASE_URL)', async () => {
  const db = await createDb({ ...loadConfig({}), pgliteDir: 'memory' });
  try {
    assert.equal(db.driver, 'pglite');
    for (const method of ['query', 'tx', 'migrate', 'close']) assert.equal(typeof db[method], 'function');
    await db.migrate();
    const rows = await db.query('SELECT 1 + 1 AS two');
    assert.equal(rows[0].two, 2);
    const out = await db.tx(async (t) => (await t.query('SELECT 3 AS three'))[0].three);
    assert.equal(out, 3);
  } finally { await db.close(); }
});
