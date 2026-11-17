# Rootine Database Schema (Draft)

| | |
|---|---|
| **Status** | DRAFT, for review. |
| **Database** | Supabase (hosted PostgreSQL), accessed only by the Express backend **[TO CONFIRM]**. Types below are PostgreSQL types. |
| **Related** | `docs/backend/BACKEND-PLAN.md`, `docs/backend/API-SPEC.md`, PRD section 12.4 |

---

## 1. Entity relationship overview

```
users 1 ───< auth_sessions
  │
  ├───< tasks 1 ───< timer_sessions   (task link is optional, kept as text if task is deleted)
  │
  └───< timer_sessions
```

- One user has many login sessions, tasks, and timer sessions.
- A timer session may point to one task. If the task is deleted, the link is cleared but the task title stays on the session.

---

## 2. Tables

### 2.1 `users`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| id | bigint | primary key, generated always as identity | |
| email | text | required, unique index on `lower(email)` | Login name |
| display_name | text | required, 1 to 40 | Nickname chosen at registration |
| full_name | text | 2 to 100 | Full name. Nullable only so older rows can be upgraded. The app requires it at registration. |
| age | integer | 5 to 120 | Same note as `full_name` |
| gender | text | one of `female`, `male`, `non_binary`, `prefer_not_to_say` | Same note as `full_name` |
| password_hash | text | required | `scrypt` format, never plain text |
| created_at | bigint | required | Milliseconds since 1970 |
| focus_minutes | integer | default 25, range 15 to 90 in the app (the database allows 1 to 90, and 1 is used only in demo mode) | Timer setting |
| short_break_minutes | integer | default 5, range 3 to 20 in the app (the database allows 1 to 20) | Timer setting |
| long_break_minutes | integer | default 15, range 10 to 30 | Timer setting |
| long_break_interval | integer | default 4, range 2 to 6 | Timer setting |
| sound_enabled | boolean | default true | Alert preference |
| notifications_enabled | boolean | default false | Alert preference |
| daily_goal | integer | default 4, range 1 to 12 | Daily goal in completed focus sessions |
| theme | text | one of `light`, `dark`, default `light` | Saved theme |
| focus_since_long_break | integer | default 0 | Counts completed focus sessions toward the next long break |
| failed_logins | integer | default 0 | For lockout |
| locked_until | bigint | default 0 | Lockout end time |

Range checks are enforced in the application. Add database `CHECK` constraints too (PostgreSQL supports them). **[TO CONFIRM]**

### 2.2 `auth_sessions` (login sessions)

| Column | Type | Rules | Purpose |
|---|---|---|---|
| token_hash | text | primary key | SHA-256 of the cookie token (the raw token is never stored) |
| user_id | bigint | required, FK to users, delete cascades | |
| csrf_token | text | required | Per-session CSRF secret |
| created_at | bigint | required | |
| expires_at | bigint | required | 7 days after creation |

Index: `user_id`.

### 2.3 `tasks`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| id | bigint | primary key, generated always as identity | |
| user_id | bigint | required, FK to users, delete cascades | Owner |
| title | text | required, 1 to 120 | |
| estimated_pomodoros | integer | nullable, 1 to 99 | |
| is_done | boolean | default false | |
| created_at | bigint | required | |
| updated_at | bigint | required | |

Index: `user_id`.

The number of completed Pomodoros per task is **calculated** from `timer_sessions`, not stored. This avoids numbers that drift out of sync.

### 2.4 `timer_sessions`

| Column | Type | Rules | Purpose |
|---|---|---|---|
| id | bigint | primary key, generated always as identity | |
| user_id | bigint | required, FK to users, delete cascades | Owner |
| kind | text | one of `focus`, `short_break`, `long_break` | |
| plant_type | text | nullable (null for breaks) | One of the 13 plant ids in `shared/plants.js` (nine flowers and plants, and the trees `pine`, `apple`, `cherry`, `ginkgo`). The `CHECK` is rebuilt from that list each time the schema runs. |
| task_id | bigint | nullable, FK to tasks, on delete set null | Optional link |
| task_title | text | nullable | Copy of the title at start (BR-11) |
| planned_seconds | integer | required | Duration copied at start (BR-12) |
| status | text | one of `active`, `paused`, `completed`, `given_up`, `skipped` | |
| started_at | bigint | required | Server time |
| target_at | bigint | required | When the session ends if not paused |
| paused_remaining_ms | bigint | nullable | Time left while paused |
| ended_at | bigint | nullable | When it completed or ended |
| collected_at | bigint | nullable | When the user collected the plant. Null while a finished plant is still waiting (and always null for breaks and given-up sessions). |
| yard_x | double precision | nullable, 0 to 100 | Where the collected plant stands in the yard, as a percent from the left. Null while it is in the tray. |
| yard_y | double precision | nullable, 0 to 100 | Percent from the top of the yard. A `CHECK` makes `yard_x` and `yard_y` both set or both empty. |

Indexes:
- `(user_id, ended_at)` for garden and stats queries.
- **Unique partial index** on `user_id` where `status` is `active` or `paused`. The database itself then refuses a second open session, even if two requests arrive at the same moment (BR-1).

---

## 3. Rules enforced by the database

| Rule | How |
|---|---|
| One open session per user | Unique partial index |
| Deleting a user removes their data | `ON DELETE CASCADE` |
| Deleting a task keeps history | `ON DELETE SET NULL` plus the copied `task_title` |
| No duplicate emails (any letter case) | Unique, case-insensitive email |
| Valid kinds and statuses | `CHECK` constraints |
| Foreign keys actually enforced | Always on in PostgreSQL |
| Nobody reads tables except our backend | Row Level Security turned on for every table with no policies (see section 8) |

---

## 4. Important queries (for planning indexes)

| Need | Query idea |
|---|---|
| Restore the running timer | Find the user's session where status is active or paused |
| Garden | Completed focus sessions for the user, newest first |
| Today, week, month totals | Sum of planned minutes for completed focus sessions since a start time |
| Streak | Distinct local days of completed focus sessions |
| Task progress | Count completed focus sessions for the task |

At school-project scale these run fast with the indexes above.

---

## 5. Migrations and seed data

- **First version:** keep the schema in `backend/db/001_init.sql` and run it in the Supabase SQL editor (or with `psql`). Use `CREATE TABLE IF NOT EXISTS` so it is safe to repeat.
- **Upgrade to collectable plants:** `collected_at` is added once, and plants that were already finished are marked collected so nothing disappears. Running the schema again does not collect waiting plants.
- **Upgrade to the new timer limits:** the two `CHECK` constraints (`users_focus_minutes_check`, `users_short_break_minutes_check`) are dropped and added again by name each time the schema runs, so older databases move from 15 to 60 and 5 to 15 to the new 15 to 90 and 3 to 20.
- **Upgrade to more plants and the yard:** the plant `CHECK` (`timer_sessions_plant_type_check`) is dropped and added again from the shared list, and `yard_x` and `yard_y` are added if missing. Nothing existing changes.
- **Later changes:** keep numbered migration files (`001_init.sql`, `002_...`) once real users exist. **[TO CONFIRM]** whether needed for the course.
- **Demo seed (optional):** a script that adds a demo user with a few completed plants, so a presentation never starts with an empty garden. Keep it out of production.

---

## 6. Backup and retention

- Export a backup from the Supabase dashboard (or `pg_dump`) before each deployment. Free projects have no automatic backups.
- Delete expired `auth_sessions` rows periodically, or when they are looked up.
- Given-up session history can be trimmed after a long time. **[TO CONFIRM]**

---

## 7. Future tables (not in the MVP)

| Feature | Table idea |
|---|---|
| Coins and shop (FR-20, 21) | `user_plants` (unlocked plants), a `coins` column or a ledger table |
| Categories (FR-37) | `categories`, plus `category_id` on tasks |
| Badges (FR-23) | Not needed in the MVP: badges are calculated from `timer_sessions` on each request. Add `user_badges` only if badges must keep an earned date. |
| Friends and leaderboard (FR-32) | `friendships` |
| Admin and plant catalog (FR-34) | `plants` catalog table, `role` on users |

---

## 8. Supabase setup

| Step | Detail |
|---|---|
| Project | One Supabase project per environment (a shared development project and, later, production). Keep the database password in a team password manager. |
| Connection | Use the **pooler** connection string from the Supabase dashboard as `DATABASE_URL`. The backend connects with `pg` over TLS. |
| Schema | Run `backend/db/001_init.sql` once. |
| Row Level Security | Run `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` on every table and add **no policies**. Supabase exposes tables through an automatic public API, and this keeps that API from returning any rows. Our backend connects with a database role that is not blocked by this, so it keeps working. |
| Keys | The browser never receives a Supabase URL or key. The `anon` and `service_role` keys are not used and must not be committed. |
| Ownership checks | Still done in every backend query (BR-9). RLS is a second layer, not a replacement. |
| Free tier limits | A free project pauses after about a week without activity. Open it before a demo and keep a recent export. |

Example of the one-open-session rule in PostgreSQL:

```sql
CREATE UNIQUE INDEX one_open_session_per_user
  ON timer_sessions (user_id)
  WHERE status IN ('active', 'paused');
```

## Addendum: friends and photos

users gets: friend_code text (unique index users_friend_code_uq, 8 characters from ABCDEFGHJKLMNPQRSTUVWXYZ23456789), share_progress boolean default true, avatar bytea (JPEG, up to 150 KB), avatar_version int default 0.

New table friendships: id, requester_id and addressee_id (both reference users, on delete cascade), status ('pending' or 'accepted'), created_at, responded_at. A unique index on LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id) allows one row per pair. Row level security is enabled like the other tables.

The upgrade is additive. Existing users get a friend code the next time the server starts or npm run db:init runs.

## Addendum: task details

tasks gets category, priority, status (all text with CHECK lists and defaults), due_date (text, YYYY-MM-DD, so time zones cannot shift it), and notes (up to 500 characters). The upgrade is additive. Existing finished tasks get status done.

## Addendum: shop and plant names

users gets yard_house (default 'hut') and yard_fence (null = no fence). timer_sessions gets plant_name (1 to 30 characters). New table shop_purchases: id, user_id (cascade delete), item_id, price, bought_at, x and y (percent, null while in the tray), unique on (user_id, item_id). Coins are never stored: balance = sum of coins for collected focus sessions minus the sum of prices in shop_purchases. Row level security is on for shop_purchases.

## Addendum: shop and plant names

users gets yard_house (default 'hut') and yard_fence (null = no fence). timer_sessions gets plant_name (1 to 30 characters). New table shop_purchases: id, user_id (cascade delete), item_id, price, bought_at, x and y (percent, null while in the tray), unique on (user_id, item_id). Coins are never stored: balance = sum of coins for collected focus sessions minus the sum of prices in shop_purchases. Row level security is on for shop_purchases.
