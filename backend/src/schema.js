import { PLANT_IDS } from '../../shared/plants.js';

// PostgreSQL schema (see docs/backend/DATABASE-SCHEMA.md). Safe to run more than once.
const PLANT_LIST = PLANT_IDS.map((id) => `'${id}'`).join(', ');

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  password_hash text NOT NULL,
  created_at bigint NOT NULL,
  focus_minutes integer NOT NULL DEFAULT 25,
  short_break_minutes integer NOT NULL DEFAULT 5,
  long_break_minutes integer NOT NULL DEFAULT 15,
  long_break_interval integer NOT NULL DEFAULT 4 CHECK (long_break_interval BETWEEN 2 AND 6),
  sound_enabled boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT false,
  daily_goal integer NOT NULL DEFAULT 4 CHECK (daily_goal BETWEEN 1 AND 12),
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  focus_since_long_break integer NOT NULL DEFAULT 0,
  failed_logins integer NOT NULL DEFAULT 0,
  locked_until bigint NOT NULL DEFAULT 0
);
-- Profile details collected at registration. Added with ALTER so existing databases upgrade safely.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text CHECK (char_length(full_name) BETWEEN 2 AND 100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age integer CHECK (age BETWEEN 5 AND 120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('female', 'male', 'non_binary', 'prefer_not_to_say'));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));

-- Timer lengths: the database allows focus 1 to 90 and short break 1 to 20 minutes. The app only allows 15 to 90 and 3 to 20 (the six presets need that range), and 1 minute only in demo mode.
-- Dropped and added again by name, so older databases with the narrower limits are upgraded.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_focus_minutes_check;
ALTER TABLE users ADD CONSTRAINT users_focus_minutes_check CHECK (focus_minutes BETWEEN 1 AND 90);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_long_break_minutes_check;
ALTER TABLE users ADD CONSTRAINT users_long_break_minutes_check CHECK (long_break_minutes BETWEEN 1 AND 30);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_short_break_minutes_check;
ALTER TABLE users ADD CONSTRAINT users_short_break_minutes_check CHECK (short_break_minutes BETWEEN 1 AND 20);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash text PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  created_at bigint NOT NULL,
  expires_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  estimated_pomodoros integer CHECK (estimated_pomodoros BETWEEN 1 AND 99),
  is_done boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks (user_id);

-- task details (added later; safe to run again)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other' CHECK (category IN ('study', 'work', 'personal', 'chores', 'health', 'other'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date text CHECK (due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes text CHECK (char_length(notes) <= 500);
UPDATE tasks SET status = 'done' WHERE is_done AND status <> 'done';

CREATE TABLE IF NOT EXISTS timer_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('focus', 'short_break', 'long_break')),
  plant_type text,
  task_id bigint REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text,
  planned_seconds integer NOT NULL CHECK (planned_seconds > 0),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'given_up', 'skipped')),
  started_at bigint NOT NULL,
  target_at bigint NOT NULL,
  paused_remaining_ms bigint,
  ended_at bigint,
  collected_at bigint
);

-- Plant types: rebuilt from the shared catalog each time, so new plants are allowed in older databases.
ALTER TABLE timer_sessions DROP CONSTRAINT IF EXISTS timer_sessions_plant_type_check;
ALTER TABLE timer_sessions ADD CONSTRAINT timer_sessions_plant_type_check CHECK (plant_type IN (${PLANT_LIST}));

-- Upgrade for databases created before plants had to be collected: add the column once and
-- mark every plant that was already finished as collected (so nothing disappears from the garden).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'timer_sessions' AND column_name = 'collected_at') THEN
    ALTER TABLE timer_sessions ADD COLUMN collected_at bigint;
    UPDATE timer_sessions SET collected_at = ended_at WHERE kind = 'focus' AND status = 'completed';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS timer_sessions_user_ended_idx ON timer_sessions (user_id, ended_at);
CREATE INDEX IF NOT EXISTS timer_sessions_task_idx ON timer_sessions (task_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_session_per_user
  ON timer_sessions (user_id) WHERE status IN ('active', 'paused');

-- Yard: where a collected plant stands outside. Both are percentages of the yard (0 to 100), or both empty.
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS yard_x double precision;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS yard_y double precision;
ALTER TABLE timer_sessions DROP CONSTRAINT IF EXISTS timer_sessions_yard_check;
ALTER TABLE timer_sessions ADD CONSTRAINT timer_sessions_yard_check
  CHECK ((yard_x IS NULL) = (yard_y IS NULL) AND (yard_x IS NULL OR (yard_x BETWEEN 0 AND 100 AND yard_y BETWEEN 0 AND 100)));
-- Friends and profile picture
ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_code text;
CREATE UNIQUE INDEX IF NOT EXISTS users_friend_code_uq ON users (friend_code);

-- the yard shop (added later; safe to run again)
ALTER TABLE users ADD COLUMN IF NOT EXISTS yard_house text NOT NULL DEFAULT 'hut';
ALTER TABLE users ADD COLUMN IF NOT EXISTS yard_fence text;
ALTER TABLE timer_sessions ADD COLUMN IF NOT EXISTS plant_name text CHECK (char_length(plant_name) BETWEEN 1 AND 30);
CREATE TABLE IF NOT EXISTS shop_purchases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  price integer NOT NULL CHECK (price > 0),
  bought_at bigint NOT NULL,
  x real,
  y real
);
CREATE UNIQUE INDEX IF NOT EXISTS shop_purchases_user_item_uq ON shop_purchases (user_id, item_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS share_progress boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar bytea;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS friendships (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at bigint NOT NULL,
  responded_at bigint,
  CHECK (requester_id <> addressee_id)
);
-- One row per pair of people, whoever asked first.
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_uq ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id);

-- Web Push: one row per browser or phone that allowed notifications, and one job per running session.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at bigint NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_uq ON push_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);
CREATE TABLE IF NOT EXISTS push_jobs (
  session_id bigint PRIMARY KEY REFERENCES timer_sessions(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  due_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS push_jobs_due_idx ON push_jobs (due_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  count integer NOT NULL
);
`;

// Supabase exposes tables through an automatic public API. Row Level Security with no
// policies keeps that API from returning any rows. The backend role is not affected.
export const RLS_SQL = ['users', 'auth_sessions', 'tasks', 'timer_sessions', 'friendships', 'shop_purchases', 'rate_limits', 'push_subscriptions', 'push_jobs']
  .map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`)
  .join('\n');
