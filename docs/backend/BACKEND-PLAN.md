# Rootine Backend Plan

| | |
|---|---|
| **Status** | DRAFT, for review. No code is written until the plan is approved. |
| **Scope** | Server, database, authentication, security, and timer rules. Frontend work is in `docs/frontend/FRONTEND-PLAN.md`. |
| **Related** | `docs/backend/API-SPEC.md` (endpoints), `docs/backend/DATABASE-SCHEMA.md` (tables), `docs/product/PRD.md` (requirements) |

Items marked **[TO CONFIRM]** need a team decision.

---

## 1. Purpose

The backend is the source of truth. It stores users, tasks, settings, and sessions. It decides when a session is finished, whether a plant grows or withers, and who may see what. The browser can ask, but it cannot decide.

---

## 2. Stack **[TO CONFIRM]**

| Need | Choice | Reason |
|---|---|---|
| Runtime | Node.js (current LTS) | Same language as the frontend |
| Web framework | Express | Simple, well documented, easy for students |
| Database | Supabase (hosted PostgreSQL), used as a plain database. Vercel has no database of its own, but Supabase can be added from Vercel's Marketplace. | Shared by the whole team, free tier, real PostgreSQL. Auth stays in our Express code. |
| Database driver | pg (node-postgres) with a connection pool | Parameterized queries and transactions, no extra framework |
| Validation | A schema library (zod) | Clear error messages, rejects unknown fields |
| Password hashing | `scrypt` from Node's built-in `crypto` | No native build tools needed, strong, salted |
| Security headers | helmet | Sets CSP and other headers in one place |
| Rate limiting | express-rate-limit with a database-backed counter | Slows brute force and abuse. In-memory counters do not work on Vercel (see section 9a). |
| Cookies | cookie-parser | Reads the session cookie |
| Tests | Node's built-in test runner | No extra tools |

**Alternatives**
- **SQLite** for a zero-setup local option. Only the data-access layer and the schema file change. Business rules stay the same.
- **MySQL** if the course requires it. Same small change.
- **Supabase Auth and client library** are not used. Using them would replace the auth module in section 5.1 and the API spec. **[TO CONFIRM]** only if the course allows it.
- **Firebase** if the course does not require a custom backend. Then the rules in this plan move into Firestore security rules and Cloud Functions, which is harder to test.

---

## 3. Folder structure

```
backend/
├── src/
│   ├── server.js           # reads config, starts the app
│   ├── app.js              # builds Express: middleware, routes, errors
│   ├── config.js           # environment variables with safe defaults
│   ├── db.js               # creates the pg pool, runs schema, transaction helper
│   ├── http.js             # HttpError, async wrapper, validation helper, error handler
│   ├── auth.js             # load session, CSRF check, requireAuth
│   ├── security.js         # hash and verify password, random tokens
│   └── routes/
│       ├── auth.js
│       ├── settings.js
│       ├── tasks.js
│       ├── sessions.js     # timer rules live here (or in a service file)
│       └── garden.js
├── tests/
└── .env.example            # sample environment values, no secrets
```

**Layering rule:** routes validate input and call functions. Business rules (timer, breaks, streaks) go in clearly named functions that tests can call without HTTP. If `sessions.js` grows large, split a `timerService.js`.

---

## 4. Request pipeline

Every request passes through these steps in order:

1. Security headers (helmet, CSP).
2. General rate limit.
3. JSON body parser with a small size limit (about 10 KB).
4. Cookie parser.
5. Load session from cookie (never fails, only sets `req.user` if valid).
6. CSRF check on every state-changing method.
7. `Cache-Control: no-store` on API responses.
8. Route handler with input validation.
9. Central error handler that hides internal details.

---

## 5. Modules

### 5.1 Authentication (FR-1 to FR-3)

**Register**
- The registration form is two steps. Step 1 "About you": nickname, full name, age, and gender. Step 2 "Your account": email (any valid email), password, and confirm password. The server requires all seven fields.
- Validate: valid email (lowercased, trimmed), password 8 to 128 characters, password not equal to email, and `confirmPassword` identical to `password` (checked again on the server, never only in the browser). The confirm password is not stored. Also validate nickname (1 to 40), full name (2 to 100; letters, spaces, `.`, `'` and `-`), age (whole number 5 to 120), and gender (one of four values).
- Age and gender are personal data. They are shown only to the signed-in user, are never written to logs, and are deleted with the account.
- Save the new user row (email, password hash, nickname, full name, age, gender, default settings, created time) in the database.
- Hash with `scrypt` and a unique salt.
- Duplicate email returns a message that does not confirm the account exists.
- On success, create a login session and return the user and CSRF token.

**Login**
- Same generic error for wrong password and unknown email.
- Always run a hash comparison, even for unknown emails, so timing does not reveal accounts.
- After 5 failed attempts, lock the account for 15 minutes. **[TO CONFIRM]** numbers.
- On success, remove any old session on that browser (stops session fixation) and create a new one.

**Login session**
- Random 32-byte token in an `HttpOnly`, `SameSite=Lax` cookie, `Secure` in production.
- Only a SHA-256 hash of the token is stored.
- Each session has its own CSRF token.
- Expires after 7 days. **[TO CONFIRM]** (PRD open question on browser-close behavior.)
- Logout deletes the stored session, so a copied cookie stops working.

**No email verification and no password reset (team decision)**
- Registering creates a working account immediately. The backend sends no email, so it needs no mail service, SMTP account, or email secrets.
- A user who forgets the password cannot recover the account on their own. For demo accounts, a team member can store a new password hash directly in the database. **[TO CONFIRM]**
- Signed-in users can still change their password (next section).

**Edit display name** (signed in, FR-4)
- `PATCH /auth/profile`. Trimmed, 1 to 40 characters. Stored as plain text.

**Delete account** (signed in, FR-39)
- `DELETE /auth/account` with the current password. Wrong password changes nothing.
- One transaction deletes the user. Foreign keys cascade to tasks, timer sessions, and login sessions. Then clear the cookie.
- Log only that an account was deleted, with no email or other personal data.

**Change password** (signed in)
- Requires the current password. Signs out other devices, keeps this one.

### 5.2 Settings (FR-12, FR-35, FR-36)

- Fields and limits: focus 15 to 90, short break 3 to 20, long break 10 to 30, long-break interval 2 to 6, sound on or off, notifications on or off, daily goal 1 to 12, theme `light` or `dark`.
- **Demo mode (FR-48):** `limitsFor(config)` returns the normal limits, or limits that start at 1 minute when `config.demo` is true. The settings and session routes use it, so the same code path is tested. Trees skip their minimum in demo mode. The database `CHECK`s allow 1 minute, but the app refuses it unless demo mode is on. Leaving demo mode raises a saved 1 minute timer back to the minimum, and starting a session never uses a value below the minimum.
- Reject unknown fields and non-integer numbers.
- While the user has an active or paused session, reject changes to the four timing values with 409. Sound, notification, daily goal, and theme may still change.

### 5.3 Tasks (FR-24 to FR-26)

- Create, list, update (title, estimate, done), delete.
- Title trimmed, 1 to 120 characters. Estimate empty or 1 to 99.
- Limit of 200 tasks per user. **[TO CONFIRM]**
- Each task returns `completedSessions`, calculated from completed focus sessions linked to it.
- Another user's task returns 404 (same as not found).
- Deleting a task does not delete history (BR-11).
- The backend stores task titles as plain text. Escaping is the job of the display layer, and the frontend never renders HTML.

### 5.4 Timer sessions (FR-6 to FR-17)

This is the core. Rules:

| Action | Rule |
|---|---|
| **Start** | Reject with 409 if the user already has an active or paused session (BR-1). For focus: plant type must be one of the allowed types, optional task must belong to the user, optional custom minutes must be 15 to 90. Copy the duration and task title into the session (BR-11, BR-12). Set `started_at` and `target_at` from the server clock. For break: the server decides short or long. |
| **Pause** | Only for an active session. Save the remaining milliseconds and set status to paused. |
| **Resume** | Only for a paused session. Set a new `target_at = now + saved remaining`. |
| **Complete** | Allowed only when `now >= target_at` minus a small latency allowance (about 1.5 seconds). Idempotent: a second call returns the same completed session and changes nothing (BR-6). Runs inside one database transaction. Increases the long-break counter for focus. Resets it after a completed long break. |
| **Give up** | Focus becomes `given_up` (withered). Break becomes `skipped`. Idempotent. Cannot be applied to a completed session. |
| **Current** | Returns the open session or none. If an active session's time is over, the server completes it now, so a closed tab still records the finished session. **[TO CONFIRM]** |

Break choice: if completed focus sessions since the last long break reach the user's interval, the next break is long. Skipping a long break does not reset the counter. **[TO CONFIRM]** (PRD OQ-6).

All responses that include a session also return `serverNow`, so the frontend can correct for a wrong device clock.

**Collecting plants (FR-40).** Completing a focus session does not put the plant in the garden by itself. `POST /sessions/:id/collect` sets `collected_at` once, using a guarded update (`WHERE collected_at IS NULL`), so repeated or parallel calls are safe. `POST /sessions/collect-all` does the same for every waiting plant of the signed-in user. Only finished focus sessions owned by the user can be collected.

**Plants and trees (FR-44).** `shared/plants.js` is the single list of plants (id, name, kind, minimum focus minutes). The backend reads it to validate the plant on `POST /sessions` and to build the database `CHECK`, and the frontend reads it to draw the picker. For a tree, the focus length (the `minutes` sent, or the saved focus length) must be at least its minimum, otherwise the request is refused with a message on `plantType`.

**Yard (FR-45).** `PUT /garden/plants/:id/position` stores `yard_x` and `yard_y` for a collected focus plant of the signed-in user (404 for anyone else, 409 for anything not collected, and 409 when 60 plants are already outside). `DELETE` clears the position. The values are rounded to one decimal and range-checked in the app and in the database.

### 5.5 Garden and stats (FR-19, FR-27, FR-28)

- Completed focus sessions are the grown plants. Given-up focus sessions are the withered list (latest 30).
- Totals use completed focus time only (BR-8).
- The client sends its UTC offset. Day, week (starts Monday), and month boundaries use it (BR-10, A-7). **[TO CONFIRM]** time zone handling.
- `todaySessions` is the number of completed focus sessions in the local day. The frontend uses it for the daily goal ring.
- Badges are calculated from completed focus sessions on each request, not stored: first plant (1), ten plants (10), week in bloom (longest streak of 7), 100 focus hours.
- Streak counts consecutive local days with at least one completed session. The current streak stays alive if today has no session yet but yesterday does.

---

## 6. Security plan

| Threat | Control |
|---|---|
| Stolen password database | Salted `scrypt` hashes only |
| Brute force | Rate limit on auth routes, account lockout |
| Account enumeration | Generic login errors, equal timing, rate-limited registration |
| Session theft | `HttpOnly` cookie, hashed token in database, server-side logout, expiry |
| CSRF | `SameSite=Lax`, required custom header that must match the session's secret |
| XSS | Strict CSP (no inline scripts), JSON-only responses |
| SQL injection | Parameterized statements only, never string-built SQL with user input |
| Broken access control | Every query filters by the signed-in user's id |
| Mass assignment | Schemas reject unknown fields |
| Oversized requests | 10 KB body limit |
| Information leaks | Generic 500 message, no stack traces to clients, no passwords or tokens in logs |
| Insecure transport | HTTPS in production, HSTS, `Secure` cookies |
| Vulnerable packages | `npm audit` at each milestone, lockfile committed |
| Leaked secrets | Environment variables, `.env` in `.gitignore`, `.env.example` committed |

**Security tests to write** (see `docs/engineering/TEST-PLAN.md`): missing or wrong CSRF header, another user's IDs, lockout, logout invalidating a copied cookie, HTML in task titles.

---

## 7. Configuration

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `development` or `production` | development |
| `PORT` | Server port | 4000 |
| DATABASE_URL | Supabase PostgreSQL connection string (use the pooler URL). **Secret.** | none, required |
| DATABASE_SSL | Use TLS to the database | on |
| `TRUST_PROXY` | Set to 1 behind a hosting proxy | off |
| `DEMO_MODE` | `1` turns on demo mode: focus and breaks can be 1 minute and trees are unlocked. Development only. It is ignored (and a warning is logged) when `NODE_ENV` is `production`. | 0 |

The only secret for the MVP is `DATABASE_URL`, which contains the database password. It lives in `.env` (ignored by Git) and in the host's environment settings. Sessions still use random tokens stored in the database.

---

## 8. Error handling and logging

- Use one error class that carries an HTTP status and a safe message.
- Validation errors return 400 with a `fields` object.
- Unexpected errors return 500 with a generic message. The real error is logged on the server without personal data.
- Do not log: passwords, tokens, cookies, request bodies.
- Do log: request method and path, status, timing, and error messages.

---

## 9. Data protection and privacy

- Collect only name, email, password hash, tasks, settings, and session history (PRD privacy section).
- Add an account deletion path as a post-MVP item. **[TO CONFIRM]** if the course expects it. Database foreign keys already cascade on user deletion.
- Export a backup from the Supabase dashboard (or `pg_dump`) before each deployment. Free projects have no automatic backups.

---

## 9a. Running on Vercel

Vercel does not run a long-lived Node server. Each `/api` request runs the Express app inside a short-lived serverless function. The plan adapts like this:

| Topic | Rule |
|---|---|
| Entry point | `app.js` builds and exports the Express app without calling `listen`. `server.js` (local only) calls `listen`. `api/index.js` on Vercel exports the app. |
| Routing | `vercel.json` rewrites `/api/(.*)` to the function and all other paths to `/index.html`. |
| Database connections | Many function instances can run at once, so each keeps a tiny pool (`max: 1`) and `DATABASE_URL` must be the Supabase **pooler** (transaction mode) string. Do not use named prepared statements. Direct connections can hit Supabase''s connection limit. |
| Rate limiting | An in-memory counter resets whenever an instance restarts and is not shared between instances. Store counters in the database (a small `rate_limits` table) or use a hosted store. Account lockout is already in the database and keeps working. |
| Proxy headers | Set `TRUST_PROXY=1` so the real client IP and HTTPS are detected. |
| File system | Read-only. No writing logs or uploads to disk. |
| Background jobs | None are available. The timer already works without them, because the server completes an expired session when it is next read. Delete expired `auth_sessions` when they are looked up, or with a daily Vercel Cron call. |
| Cold starts | The first request after idle can take a second or more. Keep the function small and avoid heavy imports. The frontend shows a loading state. |
| Time limit | Functions have a maximum run time. Every endpoint here is a short query, so this is not a problem. |
| Cookies | Same domain for the site and `/api`, so the `SameSite=Lax`, `Secure`, `HttpOnly` cookie works on desktop and phone. |

---

## 10. Work breakdown

| # | Task | Done when |
|---|---|---|
| B1 | Project setup, config, `.env.example`, `.gitignore`, README | Server starts and answers a health check |
| B2 | Supabase project, `pg` pool, schema and transaction helper | Tables and constraints exist in the Supabase project and a test query works |
| B3 | Error handling, validation helper, security headers, rate limits | Bad input returns clean 400 errors |
| B4 | Register, login, logout, `/me`, session cookie, CSRF | Auth tests pass |
| B5 | Lockout and change password | Lockout and change-password tests pass |
| B6 | Settings endpoints with limits and lock | Settings tests pass |
| B7 | Task endpoints with ownership checks | Task tests pass, including cross-user checks |
| B8 | Session endpoints and timer rules | Lifecycle tests pass with a fake clock |
| B9 | Garden and stats endpoints | Totals, streak, and week boundary tests pass |
| B12 | Extras: edit display name, delete account, daily goal, theme, badges | Tests T-E1 to T-E6 pass |
| B10 | Security review and `npm audit` | No open high issues |
| B11 | Vercel setup: `api/index.js`, `vercel.json`, environment variables, deployment notes | Live Vercel URL works, including login on a phone |

**Fake clock:** build the app so the current time can be supplied by tests. This lets tests check 25-minute sessions in milliseconds.

---

## 11. Definition of done (backend)

- Every endpoint in `API-SPEC.md` exists and matches its documented requests, responses, and status codes.
- Every PRD business rule BR-1 to BR-14 that applies to the backend has at least one automated test.
- Every route that touches user data checks ownership.
- `npm audit` shows no high or critical issues.
- No secrets or personal data in the repository or logs.
- Reviewed by at least one other team member.

## Addendum: friends module

routes/friends.js (friends, requests, leaderboard), routes/users.js (photo download), friendCode.js (generate, clean, backfill), and PUT/DELETE /auth/avatar in routes/auth.js. The leaderboard reuses computeStats from routes/garden.js so scores match the Garden page. Friends never receive email, full name, age, or gender.
