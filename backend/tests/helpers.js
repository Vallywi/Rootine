import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';

// Starts the real app on a random port with an in-memory PostgreSQL (PGlite) and a fake clock.
export async function startServer({ rateLimit = false } = {}) {
  const config = { ...loadConfig({}), pgliteDir: 'memory', rateLimit };
  const db = await createDb(config);
  await db.migrate();
  const clock = { t: Date.UTC(2025, 0, 6, 8, 0, 0) }; // a Monday morning
  const silent = { log() {}, info() {}, error() {}, warn() {} };
  const app = createApp({ db, config, now: () => clock.t, logger: silent });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  // A tiny browser: keeps its own cookie and CSRF token.
  const newClient = () => {
    const state = { cookie: '', csrf: 'anything' };
    const call = async (method, path, body, { csrf = state.csrf, headers = {} } = {}) => {
      const h = { ...headers };
      if (body !== undefined) h['Content-Type'] = 'application/json';
      if (csrf) h['X-Rootine-CSRF'] = csrf;
      if (state.cookie) h.Cookie = state.cookie;
      const res = await fetch(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
      for (const c of res.headers.getSetCookie?.() ?? []) {
        const [pair] = c.split(';');
        const [name, value] = pair.split('=');
        if (/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c) || value === '') state.cookie = '';
        else state.cookie = `${name}=${value}`;
      }
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      if (json?.csrfToken) state.csrf = json.csrfToken;
      return { status: res.status, body: json, headers: res.headers };
    };
    return {
      state,
      get: (p, o) => call('GET', p, undefined, o),
      post: (p, b = {}, o) => call('POST', p, b, o),
      put: (p, b, o) => call('PUT', p, b, o),
      patch: (p, b, o) => call('PATCH', p, b, o),
      del: (p, b, o) => call('DELETE', p, b, o),
    };
  };

  const profile = (email) => ({
    displayName: email.split('@')[0].slice(0, 40),
    fullName: 'Mia Santos Reyes',
    age: 20,
    gender: 'female',
  });
  const register = async (email = 'mia@example.com', password = 'growing-plants-1') => {
    const c = newClient();
    const r = await c.post('/auth/register', { ...profile(email), email, password, confirmPassword: password });
    if (r.status !== 201) throw new Error(`register failed: ${r.status} ${JSON.stringify(r.body)}`);
    return c;
  };

  return {
    db, clock, newClient, register, profile,
    minutes: (n) => n * 60_000,
    async close() {
      await new Promise((r) => server.close(r));
      await db.close();
    },
  };
}
