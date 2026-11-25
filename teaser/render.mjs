// Step 4 of the teaser: draw teaser.html frame by frame in headless Edge, encode the video, and add music + voice-over.
// Run: node teaser/render.mjs              -> teaser/rootine-teaser.mp4 (1920x1080, 30 fps, 60 s, with sound)
//      node teaser/render.mjs --preview    -> a few still frames in teaser/preview/ to check the layout
//      node teaser/render.mjs --audio-only -> only remix the sound onto the existing video parts
// Needs teaser/audio/ from voiceover.ps1 and music.mjs. Uses WORKERS browser tabs in parallel to save time.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = process.env.TEASER_TOOLS || path.join(process.env.TEMP, 'rootine-teaser-tools');
const req = createRequire(path.join(TOOLS, 'package.json'));
const { default: puppeteer } = await import(pathToFileURL(req.resolve('puppeteer-core')).href);
const ffmpeg = req('ffmpeg-static');
const FPS = 30;
// Live recording plays the teaser this many times slower, so a short hiccup in the browser does not show as a jump.
const SLOW = Number(process.env.TEASER_SLOW || 3);
const WORKERS = Math.max(1, Math.min(4, os.cpus().length - 1));
const preview = process.argv.includes('--preview');
const audioOnly = process.argv.includes('--audio-only');
const partsDir = path.join(here, 'parts');
const OUT = path.join(here, 'rootine-teaser.mp4');

// The real Rootie answer from capture.mjs, trimmed to whole sentences so it fits the chat box.
const chat = JSON.parse(fs.readFileSync(path.join(here, 'assets/chat.json'), 'utf8'));
function trimReply(text, max = 420) {
  const first = (text || '').split(/\n\s*\n/)[0].trim();
  if (first.length <= max) return first;
  const sentences = first.match(/[^.!?]+[.!?]+/g) || [first];
  let out = '';
  for (const s of sentences) { if ((out + s).length > max) break; out += s; }
  return out.trim() || first.slice(0, max);
}
const reply = trimReply(chat.reply) || 'You focused 4 h 35 min this week and kept a 6-day streak. One more day earns your Week in bloom badge!';

const edge = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));

function run(args, label) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let log = ''; p.stderr.on('data', (d) => { log = (log + d).slice(-3000); });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${label} failed:\n${log}`))));
  });
}

async function openPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => { window.__capture = true; });
  await page.goto(pathToFileURL(path.join(here, 'teaser.html')).href, { waitUntil: 'load' });
  await page.evaluate(async (c) => {
    window.setChat(c);
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  }, { question: chat.question, reply });
  return page;
}

// One worker renders frames [from, to) into its own video part.
async function renderPart(browser, index, from, to, progress) {
  const page = await openPage(browser);
  const file = path.join(partsDir, `part-${index}.mp4`);
  const enc = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'ignore', 'pipe'] });
  let log = ''; enc.stderr.on('data', (d) => { log = (log + d).slice(-2000); });
  const done = new Promise((res, rej) => enc.on('close', (code) => (code === 0 ? res() : rej(new Error(log)))));
  for (let f = from; f < to; f++) {
    await page.evaluate((x) => window.render(x), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, optimizeForSpeed: true });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    progress[index] = f - from + 1;
  }
  enc.stdin.end();
  await done;
  await page.close();
  return file;
}

// Music under the voice: the music dips while Rootie's narrator speaks.
async function mux(videoFile) {
  const vo = JSON.parse(fs.readFileSync(path.join(here, 'audio/voiceover.json'), 'utf8').replace(/^\uFEFF/, ''));
  const lines = Array.isArray(vo) ? vo : [vo];
  const inputs = ['-i', videoFile, '-i', path.join(here, 'audio/music.wav')];
  const filters = [];
  lines.forEach((l, i) => {
    inputs.push('-i', path.join(here, 'audio', l.file));
    const ms = Math.round(l.start * 1000);
    filters.push(`[${i + 2}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms}|${ms},volume=1.9[v${i}]`);
  });
  filters.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0,asplit=2[vo][key]`);
  filters.push('[1:a]volume=0.55[mus]');
  filters.push('[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[duck]');
  filters.push('[duck][vo]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=11,apad[aout]');
  await run(['-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[aout]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', OUT], 'audio mix');
}

if (preview) {
  const browser = await puppeteer.launch({ executablePath: edge, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb'] });
  const page = await openPage(browser);
  const dir = path.join(here, 'preview');
  fs.mkdirSync(dir, { recursive: true });
  for (const t of [1.2, 4.5, 6.5, 9.5, 13, 20, 27, 34, 38.5, 43, 50, 54.5, 59]) {
    await page.evaluate((x) => window.render(x), t);
    await page.screenshot({ path: path.join(dir, `t${String(t).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 80 });
  }
  await browser.close();
  console.log('preview frames in', dir);
} else {
  const joined = path.join(partsDir, 'video.mp4');
  if (!audioOnly && !process.argv.includes('--exact')) {
    // Fast mode (default): play the teaser live and record it with Edge's screencast (about 40 frames a second),
    // then pick one recorded frame for every 1/30 s. Takes about as long as the video itself.
    fs.rmSync(partsDir, { recursive: true, force: true });
    const framesDir = path.join(partsDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    const browser = await puppeteer.launch({ executablePath: edge, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
    const page = await openPage(browser);
    const cdp = await page.createCDPSession();
    const recorded = []; // { t: seconds into the teaser, file }
    let startWall = null, writes = [];
    cdp.on('Page.screencastFrame', (e) => {
      cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
      if (startWall === null) return;
      const t = (e.metadata.timestamp - startWall) / SLOW;
      if (t < -0.05) return;
      const file = path.join(framesDir, `f-${String(recorded.length).padStart(5, '0')}.jpg`);
      recorded.push({ t, file });
      writes.push(fs.promises.writeFile(file, Buffer.from(e.data, 'base64')));
    });
    // Warm-up: show every moment once, so pictures are decoded and painted before recording starts.
    await page.evaluate(async () => { for (let t = 0; t <= 60; t += 0.25) { window.render(t); await new Promise((r) => requestAnimationFrame(r)); } window.render(0); });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    await new Promise((r) => setTimeout(r, 1000));
    // Start the clock in the page and remember the same moment in wall-clock seconds (what screencast timestamps use).
    startWall = await page.evaluate((dur, slow) => new Promise((resolve) => {
      const t0 = performance.now();
      const wall = (performance.timeOrigin + t0) / 1000;
      const loop = () => { const t = (performance.now() - t0) / 1000 / slow; window.render(Math.min(t, dur)); if (t < dur + 0.5) requestAnimationFrame(loop); };
      loop();
      resolve(wall);
    }), 60, SLOW);
    console.log(`recording live at 1/${SLOW} speed (${60 * SLOW} s)...`);
    await new Promise((r) => setTimeout(r, (60 * SLOW + 1) * 1000));
    await cdp.send('Page.stopScreencast');
    await Promise.all(writes);
    await browser.close();
    recorded.sort((a, b) => a.t - b.t);
    const gaps = recorded.slice(1).map((r, i) => r.t - recorded[i].t);
    const big = gaps.map((g, i) => [g, recorded[i].t]).filter(([g]) => g > 1 / FPS + 0.01).map(([g, at]) => `${at.toFixed(2)}s:+${Math.round(g * 1000)}ms`);
    if (big.length) console.log('gaps over 80 ms at', big.join(' '));
    console.log(`recorded ${recorded.length} frames (${Math.round(recorded.length / 60)} per video second, longest gap ${Math.round(Math.max(...gaps) * 1000)} ms)`);
    // One frame for every 1/30 s: the newest recorded frame at that moment.
    const enc = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), joined], { stdio: ['pipe', 'ignore', 'pipe'] });
    let log = ''; enc.stderr.on('data', (d) => { log = (log + d).slice(-2000); });
    const done = new Promise((res, rej) => enc.on('close', (code) => (code === 0 ? res() : rej(new Error(log)))));
    let j = 0;
    for (let k = 0; k < 60 * FPS; k++) {
      const target = k / FPS;
      while (j + 1 < recorded.length && recorded[j + 1].t <= target + 0.001) j++;
      const buf = fs.readFileSync(recorded[j].file);
      if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    }
    enc.stdin.end();
    await done;
    fs.rmSync(framesDir, { recursive: true, force: true });
  } else if (!audioOnly) {
    fs.rmSync(partsDir, { recursive: true, force: true });
    fs.mkdirSync(partsDir, { recursive: true });
    const browser = await puppeteer.launch({ executablePath: edge, headless: true, args: ['--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb'] });
    const total = 60 * FPS;
    const chunk = Math.ceil(total / WORKERS);
    const progress = Array(WORKERS).fill(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const done = progress.reduce((a, b) => a + b, 0);
      const secs = (Date.now() - started) / 1000;
      const eta = done ? Math.round(secs / done * (total - done)) : '?';
      console.log(`frames ${done}/${total} (${Math.round(done / total * 100)}%), ${Math.round(secs)} s so far, about ${eta} s left`);
    }, 15000);
    const files = await Promise.all(Array.from({ length: WORKERS }, (_, i) => renderPart(browser, i, i * chunk, Math.min(total, (i + 1) * chunk), progress)));
    clearInterval(timer);
    await browser.close();
    fs.writeFileSync(path.join(partsDir, 'list.txt'), files.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
    await run(['-y', '-f', 'concat', '-safe', '0', '-i', path.join(partsDir, 'list.txt'), '-c', 'copy', joined], 'join');
    console.log(`video frames done in ${Math.round((Date.now() - started) / 1000)} s`);
  }
  await mux(joined);
  console.log('video:', OUT, Math.round(fs.statSync(OUT).size / 1e5) / 10, 'MB');
}
