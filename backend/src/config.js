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
    // Web Push (optional). Generate keys with: npx web-push generate-vapid-keys. The private key and cron secret are secrets.
    vapidPublicKey: env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: env.VAPID_PRIVATE_KEY || '',
    vapidSubject: env.VAPID_SUBJECT || 'mailto:admin@example.com',
    cronSecret: env.CRON_SECRET || '',
    trustProxy: env.TRUST_PROXY === '1',
    // Create tables on start. On Vercel run `npm run db:init` once instead.
    autoMigrate: env.AUTO_MIGRATE ? env.AUTO_MIGRATE === '1' : !env.DATABASE_URL,
    rateLimit: env.RATE_LIMIT !== 'off',
    // Demo mode (development only): focus and breaks can be as short as 1 minute, and trees are unlocked,
    // so you can see growing, collecting, and the yard without waiting. It is never honored in production.
    demo: env.DEMO_MODE === '1' && nodeEnv !== 'production',
    demoIgnored: env.DEMO_MODE === '1' && nodeEnv === 'production',
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
  focus: [15, 90],
  shortBreak: [3, 20],
  longBreak: [10, 30],
  interval: [2, 6],
  dailyGoal: [1, 12],
  fullName: [2, 100],
  age: [5, 120],
};

export const GENDERS = ['female', 'male', 'non_binary', 'prefer_not_to_say'];

// Limits for this app. Demo mode lowers the shortest focus and break lengths to 1 minute.
export function limitsFor(config) {
  if (!config.demo) return LIMITS;
  return { ...LIMITS, focus: [1, LIMITS.focus[1]], shortBreak: [1, LIMITS.shortBreak[1]], longBreak: [1, LIMITS.longBreak[1]] };
}

// Plants come from the shared catalog (shared/plants.js). Trees need a minimum focus length.
export { PLANT_IDS as PLANT_TYPES, plantInfo, YARD_LIMIT } from '../../shared/plants.js';

export const SESSION_DAYS = 7;
export const LOCK_AFTER_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const COMPLETE_ALLOWANCE_MS = 1500;

