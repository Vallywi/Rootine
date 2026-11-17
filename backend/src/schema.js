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
  long_break_minutes integer NOT NULL DEFAULT 15 CHECK (long_break_minutes BETWEEN 10 AND 30),
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

-- Timer lengths: focus 15 to 90 and short break 3 to 20 minutes (the six presets need this range).
-- Dropped and added again by name, so older databases with the narrower limits are upgraded.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_focus_minutes_check;
ALTER TABLE users ADD CONSTRAINT users_focus_minutes_check CHECK (focus_minutes BETWEEN 15 AND 90);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_short_break_minutes_check;
ALTER TABLE users ADD CONSTRAINT users_short_break_minutes_check CHECK (short_break_minutes BETWEEN 3 AND 20);

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
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  window_start bigint NOT NULL,
  count integer NOT NULL
);
`;

// Supabase exposes tables through an automatic public API. Row Level Security with no
// policies keeps that API from returning any rows. The backend role is not affected.
export const RLS_SQL = ['users', 'auth_sessions', 'tasks', 'timer_sessions', 'rate_limits']
  .map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`)
  .join('\n');
