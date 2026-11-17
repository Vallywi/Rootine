// Reads environment variables once. Safe defaults for local development.
export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: Number(env.PORT) || 4000,
    // Supabase pooler connection string. Secret. If empty, a local PGlite database is used.
    databaseUrl: env.DATABASE_URL || '',
    databaseSsl: env.DATABASE_SSL !== 'false',
    pgliteDir: env.PGLITE_DIR || '.data/pglite',
    trustProxy: env.TRUST_PROXY === '1',
    // Create tables on start. On Vercel run `npm run db:init` once instead.
    autoMigrate: env.AUTO_MIGRATE ? env.AUTO_MIGRATE === '1' : !env.DATABASE_URL,
    rateLimit: env.RATE_LIMIT !== 'off',
  };
}

// Single source of truth for limits (see docs/backend/API-SPEC.md).
export const LIMITS = {
  email: 254,
  passwordMin: 8,
  passwordMax: 128,
  displayName: 40,
  taskTitle: 120,
  estimateMax: 99,
  tasksPerUser: 200,
  focus: [15, 60],
  shortBreak: [5, 15],
  longBreak: [10, 30],
  interval: [2, 6],
  dailyGoal: [1, 12],
  fullName: [2, 100],
  age: [5, 120],
};

export const GENDERS = ['female', 'male', 'non_binary', 'prefer_not_to_say'];

export const PLANT_TYPES = ['sunflower', 'cactus', 'tulip', 'sakura'];

export const SESSION_DAYS = 7;
export const LOCK_AFTER_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const COMPLETE_ALLOWANCE_MS = 1500;

