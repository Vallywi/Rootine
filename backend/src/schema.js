// PostgreSQL schema (see docs/backend/DATABASE-SCHEMA.md). Safe to run more than once.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  password_hash text NOT NULL,
  created_at bigint NOT NULL,
  focus_minutes integer NOT NULL DEFAULT 25 CHECK (focus_minutes BETWEEN 15 AND 60),
  short_break_minutes integer NOT NULL DEFAULT 5 CHECK (short_break_minutes BETWEEN 5 AND 15),
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
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));

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
  plant_type text CHECK (plant_type IN ('sunflower', 'cactus', 'tulip', 'sakura')),
  task_id bigint REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text,
  planned_seconds integer NOT NULL CHECK (planned_seconds > 0),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'given_up', 'skipped')),
  started_at bigint NOT NULL,
  target_at bigint NOT NULL,
  paused_remaining_ms bigint,
  ended_at bigint
);
CREATE INDEX IF NOT EXISTS timer_sessions_user_ended_idx ON timer_sessions (user_id, ended_at);
CREATE INDEX IF NOT EXISTS timer_sessions_task_idx ON timer_sessions (task_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_session_per_user
  ON timer_sessions (user_id) WHERE status IN ('active', 'paused');

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
