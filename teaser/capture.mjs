// Step 1 of the teaser: run the real Rootine app locally with a seeded demo account,
// then take screenshots of the real screens (and a real Rootie reply) for the video.
// Run: node teaser/capture.mjs   (needs frontend/dist built, and puppeteer-core in TOOLS)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { loadConfig } from '../backend/src/config.js';
import { createDb } from '../backend/src/db.js';
import { createApp } from '../backend/src/app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = process.env.TEASER_TOOLS || path.join(process.env.TEMP, 'rootine-teaser-tools');
const { createRequire } = await import('node:module');
const toolRequire = createRequire(path.join(TOOLS, 'package.json'));
const { default: puppeteer } = await import(pathToFileURL(toolRequire.resolve('puppeteer-core')).href);
const OUT = path.join(here, 'assets');
fs.mkdirSync(OUT, { recursive: true });
try { process.loadEnvFile(path.join(here, '../backend/.env')); } catch { /* no key: fallback reply below */ }

// ---------- the app, with a clock we can move ----------
const MIN = 60_000, DAY = 24 * 60 * MIN;
let offset = 0;
const now = () => Date.now() + offset;
const config = { ...loadConfig({ ...process.env, DATABASE_URL: '', DEMO_MODE: '0', NODE_ENV: 'development' }), pgliteDir: 'memory', rateLimit: false };
const db = await createDb(config);
await db.migrate();
const silent = { log() {}, info() {}, error: console.error, warn() {} };
const api = createApp({ db, config, now, logger: silent, pusher: null });
const web = express();
web.use(api);
const dist = path.join(here, '../frontend/dist');
web.use(express.static(dist, { index: false }));
web.use((req, res) => res.sendFile(path.join(dist, 'index.html')));
const server = await new Promise((r) => { const s = web.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---------- seed a believable account through the real API ----------
let cookie = '', csrf = 'x';
async function call(method, p, body) {
  const res = await fetch(BASE + '/api' + p, {
    method, headers: { 'Content-Type': 'application/json', 'X-Rootine-CSRF': csrf, ...(cookie && { Cookie: cookie }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.getSetCookie?.()[0]; if (set) cookie = set.split(';')[0];
  const json = await res.json().catch(() => null);
  if (json?.csrfToken) csrf = json.csrfToken;
  if (!res.ok) throw new Error(`${method} ${p} ${res.status} ${JSON.stringify(json)}`);
  return json;
}
const EMAIL = 'mia@rootine.app', PASSWORD = 'growing-plants-1';
await call('POST', '/auth/register', { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD, displayName: 'Mia', fullName: 'Mia Santos', age: 20, gender: 'female' });

const tasks = {};
for (const t of [
  { title: 'Math reviewer for midterms', priority: 'high', category: 'study', estimatedPomodoros: 4, dueDate: new Date(Date.now() + DAY).toISOString().slice(0, 10) },
  { title: 'CS0053 project documentation', priority: 'urgent', category: 'study', estimatedPomodoros: 6 },
  { title: 'Read chapter 5 of Biology', priority: 'medium', category: 'study', estimatedPomodoros: 2 },
  { title: 'Clean my desk', priority: 'low', category: 'chores', estimatedPomodoros: 1 },
  { title: 'Morning stretch', priority: 'medium', category: 'health', estimatedPomodoros: 1 },
]) tasks[t.title] = (await call('POST', '/tasks', t)).task.id;

const grown = [];
async function grow(startOffset, plantType, minutes, taskTitle) {
  offset = startOffset;
  const { session } = await call('POST', '/sessions', { kind: 'focus', plantType, minutes, taskId: taskTitle ? tasks[taskTitle] : null });
  offset += minutes * MIN;
  await call('POST', `/sessions/${session.id}/complete`);
  await call('POST', `/sessions/${session.id}/collect`);
  grown.push(session.id);
}
// Six days of focus: a streak, a mix of plants, and some trees.
const plan = [
  [-5, ['sunflower', 25], ['tulip', 25]],
  [-4, ['cactus', 25], ['pine', 40], ['daisy', 25]],
  [-3, ['rose', 25], ['lavender', 25]],
  [-2, ['apple', 50], ['sakura', 25], ['succulent', 25]],
  [-1, ['mushroom', 25], ['sunflower', 25], ['cherry', 75]],
  [0, ['tulip', 25], ['rose', 25]],
];
const taskNames = Object.keys(tasks);
const msSinceMidnight = (() => { const d = new Date(); return d - new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
let n = 0;
for (const [day, ...sessions] of plan) {
  // Today's sessions start just after local midnight (or 70 minutes ago if it is very early), so they count as today.
  let start = day === 0 ? -Math.min(msSinceMidnight - 2 * MIN, 4.5 * 60 * MIN) : day * DAY - 2 * 60 * MIN;
  if (day === 0 && msSinceMidnight < 72 * MIN) start = -msSinceMidnight + MIN;
  for (const [plantType, minutes] of sessions) {
    await grow(start, plantType, minutes, taskNames[n++ % 3]);
    start += (minutes + 8) * MIN;
  }
}
offset = 0;
await call('PATCH', `/tasks/${tasks['Read chapter 5 of Biology']}`, { isDone: true });
await call('PATCH', `/tasks/${tasks['Morning stretch']}`, { isDone: true });
await call('PATCH', `/tasks/${tasks['CS0053 project documentation']}`, { status: 'doing' });

// Yard: plants outside, a house, a fence, decor and a pet.
const spots = [[14, 62], [26, 74], [38, 60], [52, 78], [64, 63], [76, 75], [86, 60], [20, 88], [46, 90], [70, 89], [58, 52], [32, 50]];
for (let i = 0; i < spots.length && i < grown.length; i++) await call('PUT', `/garden/plants/${grown[i]}/position`, { x: spots[i][0], y: spots[i][1] });
for (const id of ['cottage', 'picket', 'flowerbed', 'bench', 'cat']) { try { await call('POST', '/shop/buy', { itemId: id }); } catch (e) { console.warn('buy', id, e.message); } }
for (const [category, itemId] of [['house', 'cottage'], ['fence', 'picket']]) { try { await call('POST', '/shop/equip', { category, itemId }); } catch (e) { console.warn('equip', e.message); } }
for (const [id, x, y] of [['flowerbed', 8, 80], ['bench', 90, 84]]) { try { await call('PUT', `/shop/items/${id}/position`, { x, y }); } catch (e) { console.warn('place', id, e.message); } }

// ---------- screenshots ----------
const font = fs.readdirSync(path.join(dist, 'assets')).find((f) => /^nunito-latin-wght-normal.*\.woff2$/.test(f));
fs.copyFileSync(path.join(dist, 'assets', font), path.join(OUT, 'nunito.woff2'));
const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: edge, headless: true, args: ['--hide-scrollbars', '--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const settle = (ms = 1200) => new Promise((r) => setTimeout(r, ms));
const shot = async (name, opts = {}) => { await page.screenshot({ path: path.join(OUT, `${name}.png`), ...opts }); console.log('shot', name); };
const hideNoise = () => page.addStyleTag({ content: '.update-banner, .install-banner { display: none !important; }' });

// Landing page (logged out).
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await settle(2500); await hideNoise();
await shot('landing-hero');
await page.$eval('#rootie', (el) => el.scrollIntoView({ block: 'center' })); await settle(1500);
await shot('landing-rootie');

// Transparent plant pictures from the landing page, for the growing animation.
await page.addStyleTag({ content: 'html, body, .landing, .card, .stage, .showcase__item { background: transparent !important; box-shadow: none !important; border-color: transparent !important; } .backdrop, .cloud, [class*="backdrop"] { display: none !important; } * { animation: none !important; }' });
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 6 });
await settle(800);
const stages = await page.$$('.stages svg');
for (let i = 0; i < stages.length; i++) await stages[i].screenshot({ path: path.join(OUT, `stage-${i}.png`), omitBackground: true });
const showcase = await page.$$('.showcase svg');
for (let i = 0; i < showcase.length; i++) await showcase[i].screenshot({ path: path.join(OUT, `plant-${i}.png`), omitBackground: true });
console.log('plants', stages.length, showcase.length);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

// Log in through the real form, and mark the tour as seen.
await page.goto(BASE + '/login', { waitUntil: 'networkidle0' });
const me = await (await fetch(BASE + '/api/auth/me', { headers: { Cookie: cookie } })).json();
await page.evaluate((id) => { localStorage.setItem(`rootine.tour.v1.${id}`, '1'); }, me.user.id);
await page.type('input[type="email"]', EMAIL);
await page.type('input[type="password"]', PASSWORD);
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
await settle(2000); await hideNoise();

await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await settle(2000); await hideNoise();
await shot('focus');
for (const [route, name] of [['/tasks', 'tasks'], ['/garden', 'garden'], ['/yard', 'yard'], ['/shop', 'shop'], ['/friends', 'friends']]) {
  await page.goto(BASE + route, { waitUntil: 'networkidle0' }); await settle(2200); await hideNoise();
  await shot(name, ['tasks', 'garden'].includes(name) ? { fullPage: true } : {});
}

// Rootie chat with a real answer.
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await settle(1500); await hideNoise();
await page.click('.chat-fab'); await settle(800);
const QUESTION = 'How is my progress this week?';
await page.type('#chat-input', QUESTION);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !document.querySelector('.chat__log')?.textContent.includes('Thinking...'), { timeout: 60_000 });
await settle(600);
const replyText = await page.$$eval('.chat__msg--bot', (els) => els.at(-1).textContent);
const errorText = await page.$eval('.chat__log', (el) => el.querySelector('.chat__error')?.textContent || '');
await shot('chat');
fs.writeFileSync(path.join(OUT, 'chat.json'), JSON.stringify({ question: QUESTION, reply: errorText ? '' : replyText, error: errorText }, null, 2));
console.log('reply:', errorText || replyText);

// Phone view of the garden (before a session is running, so no timer bar covers it).
await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.goto(BASE + '/garden', { waitUntil: 'networkidle0' }); await settle(2000); await hideNoise();
await shot('phone-garden', { fullPage: true });
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
// A running session, 60% grown: start it 15 minutes "ago".
offset = -15 * MIN;
await call('POST', '/sessions', { kind: 'focus', plantType: 'sunflower', minutes: 25, taskId: tasks['Math reviewer for midterms'] });
offset = 0;
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await settle(2500); await hideNoise();
await shot('growing');


await browser.close();
server.close();
await db.close();
process.exit(0);
