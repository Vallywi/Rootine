import { SCHEMA_SQL, RLS_SQL } from './schema.js';

// bigint columns hold millisecond timestamps. They fit safely in a JS number.
function normalize(value) {
  if (typeof value === 'bigint') return Number(value);
  return value;
}
function normalizeRows(rows) {
  return rows.map((row) => {
    const out = {};
    for (const key of Object.keys(row)) out[key] = normalize(row[key]);
    return out;
  });
}

// Returns { query(sql, params) -> rows, tx(fn), migrate(), close(), driver }.
// Inside tx(fn), fn receives an object with the same query(sql, params) function.
export async function createDb(config) {
  if (config.databaseUrl) return createPgDb(config);
  return createPgliteDb(config);
}

async function createPgDb(config) {
  const pg = (await import('pg')).default;
  // Return int8 (bigint) columns as numbers.
  pg.types.setTypeParser(20, (v) => Number(v));
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    // Many serverless instances can run at once, so each keeps a tiny pool.
    max: config.isProduction ? 1 : 5,
    idleTimeoutMillis: 10_000,
  });
  return {
    driver: 'pg',
    async query(sql, params = []) {
      const result = await pool.query(sql, params);
      return normalizeRows(result.rows);
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn({
          query: async (sql, params = []) => normalizeRows((await client.query(sql, params)).rows),
        });
        await client.query('COMMIT');
        return out;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
    async migrate() {
      await pool.query(SCHEMA_SQL);
      await pool.query(RLS_SQL);
    },
    async close() {
      await pool.end();
    },
  };
}

async function createPgliteDb(config) {
  // Local development and tests only. Real PostgreSQL running inside Node, no install needed.
  const { PGlite } = await import('@electric-sql/pglite');
  const db = config.pgliteDir === 'memory' ? new PGlite() : new PGlite(config.pgliteDir);
  await db.waitReady;
  // PGlite runs one query at a time, so serialize everything to keep transactions isolated.
  let chain = Promise.resolve();
  const enqueue = (fn) => {
    const run = chain.then(fn, fn);
    chain = run.catch(() => {});
    return run;
  };
  return {
    driver: 'pglite',
    query(sql, params = []) {
      return enqueue(async () => normalizeRows((await db.query(sql, params)).rows));
    },
    tx(fn) {
      return enqueue(() =>
        db.transaction(async (t) =>
          fn({ query: async (sql, params = []) => normalizeRows((await t.query(sql, params)).rows) }),
        ),
      );
    },
    async migrate() {
      await enqueue(() => db.exec(SCHEMA_SQL));
    },
    async close() {
      await db.close();
    },
  };
}

// PostgreSQL error code 23505 = unique violation.
export const isUniqueViolation = (err) => err && err.code === '23505';
