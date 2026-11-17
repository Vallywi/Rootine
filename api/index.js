// Vercel serverless entry. Vercel rewrites every /api/* request here (see vercel.json).
// The app is built once per warm instance and reused.
import { loadConfig } from '../backend/src/config.js';
import { createDb } from '../backend/src/db.js';
import { createApp } from '../backend/src/app.js';

let appPromise;
async function init() {
  const config = loadConfig();
  if (!config.databaseUrl) throw new Error('DATABASE_URL is not set');
  const db = await createDb(config);
  return createApp({ db, config });
}

export default async function handler(req, res) {
  try {
    appPromise ??= init();
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    appPromise = undefined; // try again on the next request
    console.error('[startup]', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'The server is not ready. Please try again.' }));
  }
}
