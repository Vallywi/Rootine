// Local development server. On Vercel, api/index.js is used instead.
import { loadConfig } from './config.js';
import { createDb } from './db.js';
import { createApp } from './app.js';

const config = loadConfig();
const db = await createDb(config);
if (config.autoMigrate) await db.migrate();
const app = createApp({ db, config });
app.listen(config.port, () => {
  console.log(`Rootine API on http://localhost:${config.port} (database: ${db.driver})`);
});
