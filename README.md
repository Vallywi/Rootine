# Rootine

A Pomodoro focus web app. While you focus, a plant grows. Finish the session, then tap **Collect plant** to add it to your garden. Give up and it withers. Pick a rhythm that fits you (15/3, 25/5, 40/10, 50/10, 75/15, 90/20, or your own), and take the short tour on your first visit. Grow 9 flowers and plants, or 4 trees that need a longer focus (40, 50, 75, or 90 minutes), then place your collected plants outside in the Yard. It works in any browser, on phones and computers, and can be installed from Chrome like an app (PWA).

![Rootine landing page](screenshots/landing.png)

Plans and specs are in [`docs/`](docs/README.md). Teaser video: [`teaser/rootine-teaser.mp4`](teaser/rootine-teaser.mp4).

## Features

### Pick a rhythm and plant a seed
Six focus rhythms from a 15/3 sprint to a 90/20 ultradian block, or your own. Trees unlock when you focus for 40 minutes or more.

![Choose a rhythm](screenshots/focus.png)

### Watch it grow
The plant grows with the timer. The server keeps the time, so refreshing or closing the tab does not break a session. Give up and the plant withers.

![A growing plant](screenshots/growing.png)

### Collect plants, keep streaks, earn badges
Every finished session becomes a plant you can name. The garden shows focus minutes for today, this week and this month, your streak, and badges with progress.

![Garden](screenshots/garden.png)

### Build a cozy yard and spend coins
Coins come from collected plants. Buy houses, fences, decorations and pets, and place your plants outside.

| Yard | Shop |
|---|---|
| ![Yard](screenshots/yard.png) | ![Shop](screenshots/shop.png) |

### Tasks
Track tasks with a kind, urgency, status, due date and notes.

![Tasks](screenshots/tasks.png)

### Friends and leaderboard
Add friends with a friend code and compare focus minutes. Friends only see your nickname, photo and score.

![Friends](screenshots/friends.png)

### Rootie, the AI assistant (Google Gemini API)
Ask "How is my progress this week?" and Rootie answers with your real numbers. The server calls the Gemini API with a snapshot of your own data only. The API key never reaches the browser. Without a key the rest of the app still works. See [`docs/AI-CHAT-SETUP.md`](docs/AI-CHAT-SETUP.md).

![Rootie chat](screenshots/rootie-chat.png)

### Works on your phone
Install it from the browser like an app (PWA), with light and dark themes.

<img src="screenshots/phone-garden.png" alt="Rootine on a phone" width="320">

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite 7, PWA plugin |
| Backend | Node.js 20+, Express 5, zod, helmet |
| Database | PostgreSQL (Supabase), PGlite for local use and tests |
| External API | Google Gemini `generateContent` |
| Design pattern | Strategy (interchangeable database drivers in `backend/src/db.js`) |
| Hosting | Vercel |

## Course documentation

| Document | File |
|---|---|
| Requirements (SRS) | [`docs/SRS.md`](docs/SRS.md) |
| Architecture | [`docs/architecture.md`](docs/architecture.md) |
| API documentation | [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) |
| Design pattern | [`docs/DESIGN_PATTERNS.md`](docs/DESIGN_PATTERNS.md) |
| User manual | [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) |
| Test report | [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) |
| VS Code extensions | [`docs/VSCODE_EXTENSIONS.md`](docs/VSCODE_EXTENSIONS.md) |
| Git and GitHub workflow | [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md) |
| Presentation script | [`docs/PRESENTATION_SCRIPT.txt`](docs/PRESENTATION_SCRIPT.txt) |

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

### Demo mode (development only)

Growing a plant normally takes 15 minutes or more, and a tree takes 40 to 90. To try everything quickly, set `DEMO_MODE=1` in `backend/.env` and restart the backend. You get a **Demo 1 / 1** rhythm (a 1 minute session), every tree is unlocked, and a **DEMO** badge shows in the top bar. Set it back to `0` (or remove the line) to return to normal. It is ignored when `NODE_ENV=production`, so it can never be on in Vercel.

### Tests

```bash
npm test                 # 128 backend tests (auth, tasks, settings, timer rules, garden)
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
