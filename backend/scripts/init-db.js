// Creates the tables (and turns on Row Level Security on Supabase). Safe to run again.
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db.js';

const config = loadConfig();
const db = await createDb(config);
await db.migrate();
console.log(`Database ready (${db.driver}).`);
await db.close();
