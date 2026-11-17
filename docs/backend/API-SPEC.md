# Rootine API Specification (Draft)

| | |
|---|---|
| **Status** | DRAFT. This is the contract between frontend and backend. Agree on it first, then both teams can build in parallel. |
| **Base path** | `/api` |
| **Format** | JSON requests and responses |
| **Related** | `docs/backend/BACKEND-PLAN.md`, `docs/frontend/FRONTEND-PLAN.md` |

---

## 1. Conventions

### Authentication
A random token is stored in an `HttpOnly` cookie named `rootine_sid`. The frontend cannot read it. Every request must include cookies (`credentials: same-origin`).

### CSRF protection
Every request that is not GET must include the header:

```
X-Rootine-CSRF: <token>
```

- Signed-in users use the `csrfToken` returned by login, register, or `GET /auth/me`.
- Before login, any non-empty value is accepted for the auth endpoints (the header's presence is the protection).
- Missing or wrong token returns `403`.

### Success and error shapes
Success returns the data described per endpoint. Errors return:

```json
{ "error": "Readable message.", "fields": { "email": "Enter a valid email address." } }
```

`fields` appears only for validation errors.

### Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Invalid input (see `fields`) |
| 401 | Not signed in, or wrong credentials |
| 403 | Missing or invalid CSRF token |
| 404 | Not found, or not yours |
| 409 | Conflict with current state (for example a session is already running) |
| 413 | Request too large |
| 429 | Too many requests or account temporarily locked |
| 500 | Unexpected server error (generic message) |

### Times
All timestamps are milliseconds since 1970 (UTC numbers). Durations are seconds or milliseconds as named (`plannedSeconds`, `remainingMs`).

### Limits (single source of truth)

| Field | Allowed |
|---|---|
| Display name (nickname) | 1 to 40 characters |
| Full name | 2 to 100 characters: letters, spaces, `.`, `'` and `-` |
| Age | whole number, 5 to 120 |
| Gender | `female`, `male`, `non_binary`, `prefer_not_to_say` |
| Daily goal | 1 to 12 completed focus sessions per day |
| Email | valid, up to 254 characters |
| Password | 8 to 128 characters |
| Task title | 1 to 120 characters |
| Estimated Pomodoros | empty, or whole number 1 to 99 |
| Focus minutes | whole number 15 to 90 |
| Short break minutes | whole number 3 to 20 |
| Long break minutes | whole number 10 to 30 |
| Long-break interval | whole number 2 to 6 |
| Tasks per user | up to 200 |
| Plant types | `sunflower`, `cactus`, `tulip`, `sakura` |

---

## 2. Health

### `GET /health`
Public. Response `200`: `{ "ok": true }`

---

## 3. Auth

### `GET /auth/me`
Public. Returns the signed-in user, or `null`.

```json
{ "user": { "id": 1, "email": "mia@example.com", "displayName": "Mia", "fullName": "Mia Santos Reyes", "age": 20, "gender": "female" }, "csrfToken": "..." }
```
Signed out: `{ "user": null }`

### `POST /auth/register`
```json
{
  "displayName": "Mia",
  "fullName": "Mia Santos Reyes",
  "age": 20,
  "gender": "female",
  "email": "mia@gmail.com",
  "password": "growing-plants-1",
  "confirmPassword": "growing-plants-1"
}
```
All seven fields are required and unknown fields are rejected. `gender` is one of `female`, `male`, `non_binary`, `prefer_not_to_say`. `age` is a whole number from 5 to 120. `fullName` is 2 to 100 characters: letters, spaces, and the characters `.`, `'` and `-` only (extra spaces are collapsed). `displayName` is the nickname, 1 to 40 characters.
- `201`: `{ "user": {...}, "csrfToken": "..." }` and sets the cookie.
- `400`: validation errors in `fields`. If `confirmPassword` differs from `password`: `fields.confirmPassword` = "Passwords do not match."
- `409`: "We could not create an account with those details. Try logging in instead." (does not confirm the account exists)

### `POST /auth/login`
```json
{ "email": "mia@example.com", "password": "growing-plants-1" }
```
- `200`: `{ "user": {...}, "csrfToken": "..." }` and sets the cookie.
- `401`: "Email or password is incorrect." (same for unknown email and wrong password)
- `429`: account temporarily locked after repeated failures.

### `POST /auth/logout`
Body `{}`. `200`: `{ "ok": true }`. Deletes the server-side session and clears the cookie.

### `POST /auth/change-password` (signed in)
```json
{ "currentPassword": "old", "newPassword": "new-password-123" }
```
- `200`: `{ "ok": true }`. Other devices are signed out.
- `400`: `fields.currentPassword` if the current password is wrong.

### `PATCH /auth/profile` (signed in)
```json
{ "displayName": "Mia", "fullName": "Mia Reyes", "age": 21, "gender": "non_binary" }
```
- Send any subset of `displayName`, `fullName`, `age`, `gender` (same rules as registration). An empty body or any other field (such as `email`) returns `400`.
- `200`: `{ "user": { "id": 1, "email": "mia@gmail.com", "displayName": "Mia", "fullName": "Mia Reyes", "age": 21, "gender": "non_binary" } }`
- `400`: display name empty, longer than 40 characters, or unknown field.

### `DELETE /auth/account` (signed in)
```json
{ "password": "growing-plants-1" }
```
- `200`: `{ "ok": true }`. Permanently deletes the user and everything they own (tasks, sessions, plants, settings, login sessions), then clears the cookie.
- `400`: wrong password on `password`. Nothing is deleted.
- Needs the CSRF header like every non-GET request.

---

## 4. Settings (signed in)

### `GET /settings`
```json
{
  "settings": {
    "focusMinutes": 25,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 15,
    "longBreakInterval": 4,
    "soundEnabled": true,
    "notificationsEnabled": false,
    "dailyGoal": 4,
    "theme": "light"
  },
  "limits": {
    "focus": [15, 90], "shortBreak": [3, 20], "longBreak": [10, 30], "interval": [2, 6], "dailyGoal": [1, 12]
  }
}
```

### `PUT /settings`
Send any subset of the fields above. Unknown fields return `400`.
- `200`: `{ "settings": {...} }`
- `400`: out-of-range values, with `fields`.
- `409`: a timing field was sent while a session is active or paused. `dailyGoal`, `theme`, `soundEnabled`, and `notificationsEnabled` can change at any time. `theme` is `"light"` or `"dark"`.

---

## 5. Tasks (signed in)

Task object:
```json
{ "id": 7, "title": "Review Chapter 4", "estimatedPomodoros": 3, "isDone": false, "completedSessions": 2, "createdAt": 1700000000000 }
```

| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `GET /tasks` | none | `200 { "tasks": [...] }` open tasks first, newest first | |
| `POST /tasks` | `{ "title", "estimatedPomodoros"? }` | `201 { "task": {...} }` | `400`, `409` at 200 tasks |
| `PATCH /tasks/:id` | any of `title`, `estimatedPomodoros` (or `null`), `isDone` | `200 { "task": {...} }` | `400`, `404` |
| `DELETE /tasks/:id` | none | `200 { "ok": true }` | `404` |

Deleting a task keeps past sessions. They keep the task title as text.

---

## 6. Timer sessions (signed in)

Session object:
```json
{
  "id": 12,
  "kind": "focus",
  "plantType": "cactus",
  "taskId": 7,
  "taskTitle": "Review Chapter 4",
  "plannedSeconds": 1500,
  "status": "active",
  "startedAt": 1700000000000,
  "targetAt": 1700001500000,
  "remainingMs": 1499000,
  "endedAt": null
}
```
- `kind`: `focus`, `short_break`, or `long_break`.
- `status`: `active`, `paused`, `completed`, `given_up` (focus), `skipped` (break).

Every session response also includes:
```json
{ "session": { ... }, "serverNow": 1700000001000, "nextBreak": "short_break", "focusSinceLongBreak": 1 }
```
`session` is `null` when nothing is open.

### `GET /sessions/current`
Returns the open session or `null`. If an active session's time already ran out, it is completed first and returned with status `completed` once.

### `POST /sessions`
Start a focus session:
```json
{ "kind": "focus", "plantType": "cactus", "taskId": 7, "minutes": 25 }
```
`taskId` and `minutes` are optional. Without `minutes`, the saved focus length is used.

Start a break (the server picks short or long):
```json
{ "kind": "break" }
```
- `201`: session response.
- `400`: invalid plant, minutes out of range.
- `404`: task not found.
- `409`: `{ "error": "You already have a session in progress.", "session": {...}, "serverNow": ... }`

### `POST /sessions/:id/pause`
`200`: session with `status: "paused"` and `remainingMs` frozen. `409` if not running.

### `POST /sessions/:id/resume`
`200`: session with `status: "active"` and a new `targetAt`. `409` if not paused.

### `POST /sessions/:id/complete`
- `200`: session with `status: "completed"`. Calling again returns the same result and changes nothing.
- `409`: "This session is not finished yet." (time not up), "Resume the session before finishing it." (paused), or the session was already given up.

### `POST /sessions/:id/give-up`
- `200`: focus becomes `given_up` (withered), break becomes `skipped`. Calling again returns the same result.
- `409`: the session is already completed.

### `POST /sessions/:id/collect`
Adds a finished plant to the garden. Body `{}`.
- `200`: `{ "plant": { "id", "plantType", "taskTitle", "minutes", "endedAt", "collectedAt" }, "newlyCollected": true }`. Calling again returns the same `collectedAt` with `"newlyCollected": false` and changes nothing.
- `409`: "Only finished focus sessions can be collected." (still running, given up, skipped, or a break).
- `404`: not found, or not yours.

### `POST /sessions/collect-all`
Collects every finished plant that is waiting. Body `{}`. `200`: `{ "collected": 2 }` (`0` if none were waiting). Only the signed-in user's plants are affected.

---

## 7. Garden (signed in)

### `GET /garden?tzOffset=<minutes>`
`tzOffset` is the value of the browser's `getTimezoneOffset()`. If missing, UTC is used.

```json
{
  "plants":   [ { "id": 12, "plantType": "cactus", "taskTitle": "Review Chapter 4", "minutes": 25, "endedAt": 1700001500000 } ],
  "pending":  [ { "id": 13, "plantType": "sunflower", "taskTitle": null, "minutes": 25, "endedAt": 1700003000000 } ],
  "withered": [ { "id": 11, "plantType": "tulip", "taskTitle": null, "minutes": 25, "endedAt": 1699990000000 } ],
  "stats": {
    "todayMinutes": 50,
    "weekMinutes": 125,
    "monthMinutes": 400,
    "totalPlants": 16,
    "todaySessions": 3,
    "currentStreak": 3,
    "longestStreak": 5
  },
  "badges": [
    { "id": "first_plant", "name": "First sprout", "earned": true, "progress": 1, "target": 1 },
    { "id": "ten_plants", "name": "Ten plants", "earned": false, "progress": 6, "target": 10 },
    { "id": "seven_day_streak", "name": "Week in bloom", "earned": false, "progress": 3, "target": 7 },
    { "id": "hundred_hours", "name": "100 focus hours", "earned": false, "progress": 12, "target": 100 }
  ]
}
```
- `todaySessions` counts completed focus sessions today (local day). The frontend compares it with `settings.dailyGoal`.
- `badges` are calculated on every request from completed focus sessions. No badge is stored, so the numbers cannot drift out of sync. `progress` and `target` for `hundred_hours` are in hours.
- `plants` are the **collected** plants, newest first. `pending` are finished focus sessions that are not collected yet.
- `stats.totalPlants` counts collected plants and `stats.pendingPlants` counts waiting ones. Time, `todaySessions`, and streaks count every finished session, collected or not. The "First sprout" and "Ten plants" badges count collected plants.
- `withered` are given-up focus sessions, latest 30. They do not count toward stats.

---

## 8. Rules the API guarantees

1. A user has at most one active or paused session at a time (BR-1).
2. A completed session creates exactly one plant, even with repeated calls or several tabs (BR-6).
3. A given-up session can never become completed (BR-3).
4. Changing settings never changes a running session (BR-12).
5. A user can only read or change their own data (BR-9).
6. Breaks never create plants (BR-4).
