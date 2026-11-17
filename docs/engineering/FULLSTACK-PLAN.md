# Rootine Full-Stack Plan

| | |
|---|---|
| **Status** | DRAFT, for review and approval. No implementation starts until this is approved. |
| **Based on** | `docs/product/PRD.md` and `docs/design/UX-UI-PLAN.md` |
| **Scope** | MVP (P0) first. P1 items are planned but built only if time allows. |

Items marked **[TO CONFIRM]** need a team decision.

> **This file is the overview.** The frontend and backend each have their own detailed plan:
> - Frontend: `docs/frontend/FRONTEND-PLAN.md`
> - Backend: `docs/backend/BACKEND-PLAN.md`, `docs/backend/API-SPEC.md`, `docs/backend/DATABASE-SCHEMA.md`
> - Look and feel: `docs/design/CUTE-DESIGN-SYSTEM.md`
> - Testing: `docs/engineering/TEST-PLAN.md`
>
> Where this overview and a detailed plan differ, the detailed plan wins.

---

## 1. Goals of this plan

1. Choose the stack and explain why.
2. Define the structure of the frontend, backend, and database.
3. Define the API, security controls, and the timer logic, which is the riskiest part.
4. Break the work into phases with clear "done" checks, so the team can split tasks.

---

## 2. Stack decision **[TO CONFIRM]**

| Layer | Option A (recommended) | Option B | Option C |
|---|---|---|---|
| Frontend | React + Vite | React + Vite | Plain HTML/CSS/JS |
| Backend | Node.js + Express | Firebase (Auth + Firestore) | Node.js + Express |
| Database | Supabase (PostgreSQL) | Firestore | MySQL |
| Hosting | Vercel (static frontend + serverless API) | Firebase Hosting | Any VPS |
| Best when | Short deadline, custom backend is allowed | Course does not require own backend | Course requires MySQL or plain JS |

**Why Option A:**
- One language (JavaScript) across the team.
- Supabase gives the team one shared, hosted PostgreSQL database with no local database install. Every member needs the `DATABASE_URL` from the team.
- Express gives the team full control of authentication and security rules, which the PRD requires (hashing, CSRF, rate limiting).
- A relational model fits sessions, tasks, and history, and PostgreSQL supports the unique partial index that stops duplicate sessions.
- Vercel has no database of its own. Its Storage tab connects partner databases (Supabase, Neon). Supabase can be added from there, or created at supabase.com. Either way, copy the **pooled** connection string into `DATABASE_URL`. **[TO CONFIRM]** current Vercel Marketplace options.
- Only the database is used from Supabase. Login and security rules stay in our Express code, which the PRD requires and which keeps the course backend requirement met.

**Trade-off:** it needs internet access and a Supabase account, and free projects pause after about a week of inactivity. If the course requires MySQL, only the data-access layer changes (Option C).

**Decision needed first:** does CS0053 require a specific database or language? (PRD OQ-1.)

---

## 3. Architecture

```
Browser (React SPA)  --HTTPS-->  Express API  -->  Supabase PostgreSQL
  - Timer UI                       - Auth, sessions
  - Plant animation                - Validation
  - Notifications                  - Timer rules (source of truth)
```

- **One origin.** In production on Vercel, the built React files are served as static files and every `/api/*` request is rewritten to the Express app running as a serverless function. Same domain, so no CORS and cookies stay `SameSite`.
- **In development,** Vite runs on port 5173 and proxies `/api` to Express on port 4000.
- **The server is the source of truth for the timer.** The browser only displays it.

### Repository layout

```
CS0053 - PROJECT/
├── docs/
│   ├── product/PRD.md
│   ├── design/UX-UI-PLAN.md
│   └── engineering/FULLSTACK-PLAN.md
├── backend/
│   ├── src/
│   │   ├── app.js            # builds the Express app
│   │   ├── server.js         # starts it
│   │   ├── db.js             # connection and schema
│   │   ├── auth.js           # session and CSRF middleware
│   │   ├── security.js       # password hashing, tokens
│   │   └── routes/           # auth, tasks, settings, sessions, garden
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/            # Login, Focus, Tasks, Garden, Settings
│       ├── components/       # Plant, Layout, dialogs, form fields
│       ├── api.js            # fetch wrapper
│       └── styles.css        # design tokens and layout
└── README.md                 # setup and run steps
```

---

## 4. Data model

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email (unique), display_name, password_hash, created_at, timer settings, sound and notification flags, `focus_since_long_break`, failed_logins, locked_until | Settings live on the user row for the MVP. |
| `auth_sessions` | token_hash (PK), user_id, csrf_token, expires_at | Only a hash of the cookie token is stored. |
| `tasks` | id, user_id, title, estimated_pomodoros (nullable), is_done | Completed-session count is computed by query. |
| `timer_sessions` | id, user_id, kind (focus, short_break, long_break), plant_type, task_id, task_title, planned_seconds, status, started_at, target_at, paused_remaining_ms, ended_at | Durations are copied in at start (BR-12). Task title is copied so history survives task deletion (BR-11). |

**Constraints that enforce business rules:**
- Partial unique index on `timer_sessions(user_id)` where status is `active` or `paused`. This guarantees one open session per user (BR-1), even if two requests arrive at once.
- `task_id` uses `ON DELETE SET NULL`, so deleting a task keeps the history.
- Foreign keys are enabled and cascade on user deletion.

**Statuses:** `active`, `paused`, `completed`, `given_up` (focus only), `skipped` (break only).

---

## 5. API plan

All routes are under `/api`. JSON only. State-changing routes need the CSRF header (see section 7).

| Area | Endpoint | Purpose | PRD |
|---|---|---|---|
| Auth | `POST /auth/register` | Create account and sign in | FR-1 |
| | `POST /auth/login`, `POST /auth/logout` | Sign in and out | FR-2 |
| | `GET /auth/me` | Current user and CSRF token | FR-2 |
| | `POST /auth/change-password` | Change password when signed in | FR-2 |
| | `PATCH /auth/profile` | Edit display name | FR-4 |
| | `DELETE /auth/account` | Delete account (needs password) | FR-39 |
| Settings | `GET /settings`, `PUT /settings` | Durations, sound, notifications | FR-12, 36 |
| Tasks | `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` | Task CRUD | FR-24 to 26 |
| Sessions | `GET /sessions/current` | Restore after refresh | FR-8 |
| | `POST /sessions` | Start focus or break | FR-6, 11 |
| | `POST /sessions/:id/pause`, `/resume` | Pause and resume | FR-9 |
| | `POST /sessions/:id/complete` | Finish (idempotent) | FR-16 |
| | `POST /sessions/:id/give-up` | Give up or skip break | FR-10, 17 |
| Garden | `GET /garden` | Plants, withered list, stats, streak | FR-19, 27, 28 |

**Error format:** `{ "error": "message", "fields": { "email": "message" } }` with correct HTTP codes (400, 401, 403, 404, 409, 429).

**Ownership rule:** every query filters by the signed-in user's id. Another user's record returns 404, so IDs cannot be probed.

---

## 6. Timer design (core logic)

**Problem:** counting seconds with `setInterval` drifts when a tab is in the background, and a refresh loses state.

**Design:**
1. The server stores `started_at` and `target_at` (milliseconds).
2. The client displays `target_at - (now + clockOffset)`. `clockOffset` comes from the server time returned with each response, so a wrong device clock does not matter.
3. The client repaints about four times per second, but the value is always recomputed from timestamps.
4. **Pause** stores `paused_remaining_ms`. **Resume** sets a new `target_at = now + paused_remaining_ms`.
5. **Complete** is accepted only when `now >= target_at` (with about 1.5 seconds of latency allowance). It is idempotent: a repeated call returns the same result and grants nothing twice (BR-6).
6. **Refresh or closed tab:** `GET /sessions/current` returns the open session. If time ran out while the page was closed, the server completes it then. **[TO CONFIRM]** (PRD OQ about closing the browser.)
7. **Growth stages** come from elapsed percentage: 0% seed, 25% sprout, 60% small plant, full plant on completion (PRD A-6).
8. **Settings lock:** timer durations cannot change while a session is open. Sound and notification preferences still can.

**Break logic:** the server tracks completed focus sessions since the last long break. When the count reaches the user's interval, the next break is long. A long break resets the count only when it completes.

---

## 7. Security plan

| Threat | Control |
|---|---|
| Password theft from the database | Salted `scrypt` hashes. No plain text. Minimum 8 characters, maximum 128. |
| Brute force | Per-IP rate limit on auth routes, plus account lockout (5 failures, 15 minutes). |
| Account enumeration | One generic login error. Equal timing using a dummy hash. Rate-limited registration. |
| Session theft | Random token in an `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie. Only the hash is stored. Server-side logout. 7-day expiry. Old session dropped on login. |
| CSRF | `SameSite` cookie plus a required custom header that must match a per-session secret. |
| XSS | React escapes output. Strict Content Security Policy (`script-src 'self'`). No `dangerouslySetInnerHTML`. |
| Injection | Parameterized SQL only. Input validated with a schema library (zod). Unknown fields rejected. |
| Broken access control | Ownership check on every query (BR-9). |
| Data exposure | `Cache-Control: no-store` on API. Helmet headers. Request body size limit. Generic 500 errors. |
| Dependencies | Run `npm audit` before each milestone. Pin versions with the lockfile. |
| Secrets | Environment variables only. `.env` in `.gitignore`. `DATABASE_URL` is never committed. |

**No email verification and no password reset (team decision):** a new account works right after registration, and the app sends no email. A forgotten password cannot be recovered by the user. Signed-in users can still change their password. This removes the need for any email service, SMTP account, or email secrets.

---

## 8. Frontend plan

**Routes**

| Path | Screen | Access |
|---|---|---|
| `/login`, `/register` | Auth | Guests |
| `/` | Focus (idle, running, break, result) | Signed in |
| `/tasks` | Task list and forms | Signed in |
| `/garden` | Stats, grown plants, withered plants | Signed in |
| `/settings` | Timer, alerts, account | Signed in |

**State**
- `AuthProvider`: user, settings, and login functions.
- `SessionProvider`: the running timer. It lives at app level, so the timer still finishes and alerts when the user is on another page.
- Page data (tasks, garden) is fetched per page. No heavy state library is needed.

**Key components:** `Plant` (SVG, 4 stages plus withered, 4 plant types), `Layout` (top nav on desktop, bottom nav on phones), `ConfirmDialog` (native `<dialog>`), `Field` (label, hint, error).

**Notifications (three layers, PRD FR-13, 35, 36)**
1. In-app banner. Always shown.
2. Soft sound. Optional, off by a toggle.
3. Browser notification. Requested only when the user presses **Enable notifications**. If denied or unsupported, the app shows a message and keeps working.
- Limit: notifications work only while the tab is open. Alerts with a closed browser need push notifications and a service worker, which is post-MVP.

**Design (from the UX/UI plan, "cute" direction)**
- Palette: forest green `#2F5D50`, leaf green `#6FA66F`, cream `#F7F3E8`, earth brown `#8B6F47`, amber `#D99A2B`, terracotta `#B65F50`.
- Rounded cards (24px), a rounded font (Nunito, self-hosted), plants with small faces on the pot, and gentle sway and grow animations.
- Mobile first. Touch targets at least 44 px. Inputs at 16 px to avoid iOS zoom. Safe-area padding for the bottom nav.
- Accessibility: visible focus, labels on every input, errors not shown by color alone, a live region for stage changes, and `prefers-reduced-motion` support.

---

## 9. Testing plan

| Level | What | How |
|---|---|---|
| API tests | Auth, lockout, CSRF, ownership, task CRUD, settings limits, session lifecycle, break logic, idempotent completion | Node's built-in test runner with a fake clock |
| Manual UI checklist | Each PRD acceptance criterion (section 14 of the PRD) | Checklist table with pass or fail, kept in `docs/engineering/` |
| Browser check | Phone width (390 px), tablet, desktop; no horizontal scroll | Manual in Chrome or Edge device mode |
| Security check | CSRF header missing, other user's IDs, XSS strings in task titles | Part of the API tests plus a manual pass |
| User testing | At least 5 testers, short feedback form | Before submission |

---

## 10. Build phases

Each phase ends with something demonstrable. Estimates assume a team of 3 to 4 **[TO CONFIRM]**.

| Phase | Work | Done when |
|---|---|---|
| 0. Setup | Repo, folders, README, lint and formatting, `.gitignore`, branch rules | Everyone can run an empty frontend and backend |
| 1. Auth | Database schema, register, login, logout, `/me`, auth pages, protected routes | A user can register, log in, and log out; wrong password gives a generic error |
| 2. Timer core | Session API, timestamp timer, start, pause, resume, give up, complete, refresh recovery | A 15-minute session survives refresh and completes once |
| 3. Plants and garden | Plant SVG art (4 stages, withered), growth display, garden page | Completed sessions appear as plants |
| 4. Tasks and settings | Task CRUD, link to session, editable durations, break logic | Task shows "2 of 3 Pomodoros"; settings lock during a session |
| 5. Alerts | In-app banner, sound, browser notification with fallbacks | Alerts fire once per completion |
| 6. Stats and polish | Today, week, month, streak; responsive pass; accessibility pass; installable PWA (manifest, icons, service worker that never caches `/api`; see FRONTEND-PLAN 11a); daily goal ring, badges, dark theme, edit display name, delete account; empty and error states | PRD acceptance criteria all pass |
| 6b. Extras (only if time) | Coins and plant shop (FR-20, 21), task categories (FR-37), ambient sounds (FR-30), export my data | Each extra has its own tests and does not break P0 |
| 7. Hardening | Security review, dependency audit, full test run, bug fixing | No open high-priority bugs |
| 8. Release | Deployment, final README, demo script, presentation | Live URL works end to end |

**Work split suggestion for 4 members:** (1) backend auth and security, (2) backend timer and API tests, (3) frontend pages and state, (4) design, plant art, and documentation.

**Cut order if time runs short:** stats charts, then extra plant types, then alerts beyond the in-app banner. Never cut the timer, garden, or authentication.

---

## 11. Deployment plan **[TO CONFIRM]**

- Deploy to **Vercel** from the Git repository. Vercel runs `vite build` and serves `frontend/dist` as static files.
- The Express app is exposed as a serverless function (`api/index.js` exports the app). `vercel.json` rewrites `/api/*` to it and every other path to `index.html`, so React routes like `/garden` work on refresh. Details: `docs/backend/BACKEND-PLAN.md` section 9a.
- The database is hosted by Supabase, so nothing is stored on Vercel. Choose the Vercel function region closest to the Supabase region.
- Set variables in Vercel, Project Settings, Environment Variables. Use separate values for Preview and Production. Never commit them.
- Every push to a branch gets a Preview URL for testing. The main branch deploys to the Production URL.
- Free Hobby plan is for non-commercial use, which fits a school project **[TO CONFIRM]** current limits.
- Environment variables: `NODE_ENV=production`, `DATABASE_URL` (secret, Supabase pooler URL), `TRUST_PROXY=1`. `PORT` is not needed on Vercel.
- HTTPS is required (secure cookies and notifications depend on it).
- Export a Supabase backup before each deployment.

---

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Timer inaccuracy in background tabs | Core feature feels broken | Timestamp-based design (section 6), tested with a fake clock |
| Duplicate rewards from refresh or two tabs | Wrong stats | Idempotent complete plus unique index |
| Plant art takes too long | Delays the demo | One SVG component with 4 plants; reuse shapes |
| Free Supabase project pauses after inactivity, or the database password leaks | Demo fails or data exposed | Open the project before the demo, keep an export, seed demo data, keep `DATABASE_URL` out of Git |
| Team members blocked on each other | Delays | Agree on the API contract (section 5) before coding |
| Scope growth (friends, leaderboard, ambient sound) | Missed deadline | They stay in P2 until the MVP passes |

---

## 13. Decisions needed before coding

1. Does the course require a specific stack or database? (decides Option A, B, or C)
2. How many members, and who owns which area?
3. What is the deadline? (sets the phase dates)
4. Password reset and email verification: removed from the project by team decision. A forgotten password cannot be recovered by the user.
5. If the browser is closed mid-session, should the session count as completed once time runs out, or wither? Recommended: complete if the full time elapsed.
6. Where do withered plants appear? Recommended: a separate "Withered" section in the Garden.
7. Hosting choice. Current plan: Vercel for the app and Supabase for the database.

## 14. Approval

| Name | Role | Status | Date |
|---|---|---|---|
| | | ☐ Approved ☐ Changes needed | |
| | | ☐ Approved ☐ Changes needed | |
