import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';

// Regression test for a bug found while following the install guide on a fresh clone:
// backend/.data does not exist yet, and the local database used to crash with ENOENT.
test('local database: creates its folder on a fresh clone (no .data folder yet)', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rootine-fresh-'));
  const dir = path.join(root, 'missing', '.data', 'pglite'); // parents do not exist
  const db = await createDb({ ...loadConfig({}), pgliteDir: dir });
  try {
    assert.equal(db.driver, 'pglite');
    await db.migrate();
    assert.equal((await db.query('SELECT 1 AS one'))[0].one, 1);
    assert.equal(fs.existsSync(dir), true);
  } finally {
    await db.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
