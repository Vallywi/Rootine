# Rootine

A Pomodoro focus web app. While you focus, a plant grows. Finish the session, then tap **Collect plant** to add it to your garden. Give up and it withers. Pick a rhythm that fits you (15/3, 25/5, 40/10, 50/10, 75/15, 90/20, or your own), and take the short tour on your first visit. Grow 9 flowers and plants, or 4 trees that need a longer focus (40, 50, 75, or 90 minutes), then place your collected plants outside in the Yard. It works in any browser, on phones and computers, and can be installed from Chrome like an app (PWA).

Plans and specs are in [`docs/`](docs/README.md).

## What is inside

| Folder | What |
|---|---|
| `backend/` | Express API (auth, tasks, settings, timer sessions, garden). PostgreSQL through `pg`. |
| `frontend/` | React + Vite app with the PWA manifest and service worker. |
| `api/index.js` | Vercel entry point that runs the Express app as a serverless function. |
| `vercel.json` | Vercel routing and security headers. |
| `docs/` | PRD, design, plans, API spec, database schema, test plan. |

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
npm run dev:backend      # terminal 1: API on http://localhost:4000
npm run dev:frontend     # terminal 2: app on http://localhost:5173
```

Open http://localhost:5173 and create an account.

With no `DATABASE_URL`, the backend uses a local PostgreSQL database stored in `backend/.data/` (PGlite), so nothing else has to be installed. Delete that folder to start fresh.

To test on a phone on the same Wi-Fi, start the frontend with `npm run dev:frontend -- --host` and open `http://<your-computer-ip>:5173`. Login works. Browser notifications and "Install" need HTTPS, so test those on the Vercel URL.

### Tests

```bash
npm test                 # 45 backend tests (auth, tasks, settings, timer rules, garden)
```

## Use Supabase as the database

1. Create a project at https://supabase.com (or add Supabase from the Vercel dashboard, Storage tab).
2. Go to Project Settings, Database, Connection string, and copy the **pooler** connection string (transaction mode).
3. Put it in `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-xx.pooler.supabase.com:6543/postgres
   ```
   Never commit this file. It contains the database password.
4. Create the tables once: `npm run db:init`. This also turns on Row Level Security with no policies, so Supabase's public API cannot read your data.
5. Run the app as usual. The terminal shows `database: pg`.

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel. Keep the project root as the repository root. Vercel reads `vercel.json`.
2. Add these Environment Variables (Production, and Preview if you want previews to work):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The Supabase pooler connection string |
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |

3. Run `npm run db:init` once on your computer with the same `DATABASE_URL` (step 4 above).
4. Deploy. Open the Vercel URL on a phone. In Chrome, use the install icon or **Install app**.

Notes:
- The database is created by `npm run db:init`, not on each request.
- Free Supabase projects pause after about a week of no use. Open the project before a demo.
- Rate limits are stored in the database, because Vercel functions do not share memory.

## Decisions made

- No email verification and no password reset. A forgotten password cannot be recovered by the user. Signed-in users can change their password and delete their account.
- Any valid email is accepted at registration.
- The server is the source of truth for the timer. The browser only shows the countdown.

## Not built yet

Phase 6b extras from `docs/engineering/FULLSTACK-PLAN.md`: coins and shop, task categories, ambient sounds, export my data.

Also still to do: a connection test against your real Supabase project (this was tested with the local PGlite database, which is real PostgreSQL), deployment to Vercel, and user testing with real people. `npm audit --omit=dev` reports 0 issues. The 4 moderate findings left are in the build tool `workbox-build`, which is not shipped to users.
