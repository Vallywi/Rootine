// Natural, expressive voice-over with Gemini text-to-speech (uses AI_API_KEY from backend/.env).
// Replaces the robotic Windows voice from voiceover.ps1. Writes teaser/audio/vo-XX.wav and voiceover.json,
// which render.mjs mixes under the music. Run:
//   node teaser/voiceover-ai.mjs                 (voice Leda)
//   node teaser/voiceover-ai.mjs --voice Aoede   (try another voice: Aoede, Autonoe, Puck, Sulafat, Achird ...)
// Then: node teaser/render.mjs --audio-only
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.join(here, '../backend/.env')); } catch { /* use the environment */ }
const KEY = process.env.AI_API_KEY;
if (!KEY) { console.error('AI_API_KEY is not set (backend/.env).'); process.exit(1); }
const TTS_MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const CHECK_MODEL = process.env.AI_MODEL || 'gemini-flash-lite-latest';
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const VOICE = arg('--voice', 'Leda');
const req = createRequire(path.join(process.env.TEASER_TOOLS || path.join(process.env.TEMP, 'rootine-teaser-tools'), 'package.json'));
const ffmpeg = req('ffmpeg-static');
const dir = path.join(here, 'audio');
fs.mkdirSync(dir, { recursive: true });

// start (s) and the time until the next line begins, matching the scenes in teaser.html.
// `how` is the acting note for that line.
const LINES = [
  { start: 0.6, max: 4.8, how: 'soft and inviting, with a smile', text: 'This is Rootine. Focus a little... grow a lot.' },
  { start: 5.8, max: 4.2, how: 'playful and relatable, then bright', text: 'Hard to stay focused? Rootine turns your focus time into a garden.' },
  { start: 10.3, max: 6.6, how: 'friendly and clear, like showing a friend', text: 'Pick a rhythm, from a quick sprint to deep work, and choose a seed. Focus longer to unlock trees.' },
  { start: 17.3, max: 6.2, how: 'encouraging, with a tiny playful warning at the end', text: 'Stay on task, and your plant grows with the timer. Give up... and it wilts.' },
  { start: 23.8, max: 6.7, how: 'proud and happy', text: 'Every finished session becomes a plant. Track your minutes, keep your streak, and earn badges.' },
  { start: 30.8, max: 5.7, how: 'cozy and delighted, a little laugh on "even a cat"', text: 'Spend your coins on a cozy yard: a house, a fence... even a cat.' },
  { start: 36.8, max: 2.9, how: 'excited reveal, slower', text: 'And now... meet Rootie!' },
  { start: 39.8, max: 11.0, how: 'warm and impressed, like sharing a favorite feature', text: 'Your A.I. garden helper. Just ask how you are doing, and Rootie sums up your progress in seconds: your focus time, your streak, and what to work on next.' },
  { start: 51.2, max: 4.3, how: 'quick and upbeat', text: 'Plus tasks, friends, a leaderboard, and dark mode.' },
  { start: 55.8, max: 4.2, how: 'warm, confident closing line', text: 'Rootine. Start growing today. It is free!' },
];

const PROFILE = `# AUDIO PROFILE: Mika
A friendly young woman in her early twenties narrating a short, cozy app teaser for students. Natural, human, expressive. Never robotic or flat.

## THE SCENE
A bright, calm morning. She is talking to a friend about an app she loves, smiling while she speaks.

### DIRECTOR'S NOTES
Style: warm, cheerful and genuine, with real emotion that follows each line's note. Vary the pitch and energy naturally.
Pace: relaxed, conversational, never rushed. Take a clear breath and a long pause (about two seconds) between lines.
Accent: neutral, clear American English.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gemini(model, body) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', signal: AbortSignal.timeout(180_000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return json;
    const msg = JSON.stringify(json?.error?.message ?? json).replaceAll(KEY, '<key>').slice(0, 200);
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      const wait = Math.min(65, 10 * attempt);
      console.log(`  ${model}: ${res.status} (${msg}), waiting ${wait} s...`);
      await sleep(wait * 1000);
      continue;
    }
    throw new Error(`${model} ${res.status}: ${msg}`);
  }
  throw new Error(`${model}: still busy after several tries. Try again in a few minutes.`);
}

async function speak(transcript, note) {
  const prompt = `${PROFILE}\n${note ? `Line note: ${note}\n` : ''}\n#### TRANSCRIPT\n${transcript}`;
  const json = await gemini(TTS_MODEL, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
  });
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error('No audio came back.');
  let buf = Buffer.from(part.inlineData.data, 'base64');
  if (buf.toString('ascii', 0, 4) !== 'RIFF') buf = wavFromPcm(buf, Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] || 24000));
  return buf;
}

function wavFromPcm(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const ff = (args) => spawnSync(ffmpeg, ['-hide_banner', ...args], { encoding: 'utf8' });
const duration = (file) => Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(ff(['-i', file]).stderr).slice(1).reduce((a, v, i) => a + Number(v) * [3600, 60, 1][i], 0));

// Speech parts of a WAV, split wherever there is at least `minGap` seconds of silence.
function speechParts(file, minGap) {
  const out = ff(['-i', file, '-af', `silencedetect=n=-38dB:d=${minGap}`, '-f', 'null', '-']).stderr;
  const total = duration(file);
  const starts = [...out.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...out.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const parts = []; let cursor = 0;
  starts.forEach((s, i) => { if (s - cursor > 0.25) parts.push([cursor, s]); cursor = ends[i] ?? total; });
  if (total - cursor > 0.25) parts.push([cursor, total]);
  return parts;
}

// Cut [a, b] out of src, trim quiet edges, add tiny fades, and speed up only if it would run into the next line.
function cut(src, a, b, dest, max) {
  const len = b - a + 0.12;
  const tempo = Math.min(1.15, Math.max(1, len / (max - 0.15)));
  const af = [`atrim=${Math.max(0, a - 0.06)}:${b + 0.06}`, 'asetpts=PTS-STARTPTS', tempo > 1.001 ? `atempo=${tempo.toFixed(3)}` : null, 'afade=t=in:d=0.03', `afade=t=out:st=${Math.max(0, len / tempo - 0.08)}:d=0.08`].filter(Boolean).join(',');
  const r = ff(['-y', '-i', src, '-af', af, '-ar', '24000', '-ac', '1', dest]);
  if (r.status !== 0) throw new Error(r.stderr.slice(-500));
  return { seconds: duration(dest), tempo };
}

// Ask Gemini to write down what it hears, to make sure only the script was spoken.
async function transcribe(file) {
  const json = await gemini(CHECK_MODEL, {
    contents: [{ parts: [
      { inlineData: { mimeType: 'audio/wav', data: fs.readFileSync(file).toString('base64') } },
      { text: 'Write down exactly the words spoken in this audio. Reply with the words only.' },
    ] }],
    generationConfig: { temperature: 0 },
  });
  return json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
}
const words = (s) => s.toLowerCase().replace(/a\.i\./g, 'ai').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
function similarity(a, b) {
  const A = words(a), B = words(b);
  const dp = Array.from({ length: A.length + 1 }, () => Array(B.length + 1).fill(0));
  for (let i = 1; i <= A.length; i++) for (let j = 1; j <= B.length; j++) dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[A.length][B.length]) / (A.length + B.length || 1);
}

console.log(`voice ${VOICE}, model ${TTS_MODEL}`);
const tmp = path.join(dir, '_full.wav');
let pieces = null;

// 1) Try the whole script in one take (one request, and the emotion flows from line to line).
try {
  console.log('recording the whole script in one take...');
  fs.writeFileSync(tmp, await speak(LINES.map((l) => `(${l.how}) ${l.text}`).join('\n\n'), 'Read each paragraph with the feeling in its brackets. Do not say the bracketed notes out loud.'));
  for (const gap of [0.7, 0.55, 0.45, 0.85, 1.0]) {
    const parts = speechParts(tmp, gap);
    if (parts.length === LINES.length) { pieces = parts.map(([a, b]) => ({ src: tmp, a, b })); console.log(`  split into ${parts.length} lines at pauses of ${gap} s`); break; }
  }
  if (!pieces) console.log('  could not split it cleanly into lines, recording line by line instead');
} catch (e) { console.log('  one take failed:', e.message); }

// 2) Fallback: one request per line.
if (!pieces) {
  pieces = [];
  for (let i = 0; i < LINES.length; i++) {
    const src = path.join(dir, `_line-${i}.wav`);
    console.log(`recording line ${i + 1}/${LINES.length}...`);
    fs.writeFileSync(src, await speak(LINES[i].text, LINES[i].how));
    const parts = speechParts(src, 0.9);
    pieces.push({ src, a: parts[0]?.[0] ?? 0, b: parts.at(-1)?.[1] ?? duration(src) });
    await sleep(2500);
  }
}

// 3) Cut, fit to the scenes, and check each line by listening back.
const plan = [];
for (let i = 0; i < LINES.length; i++) {
  const l = LINES[i], file = `vo-${String(i).padStart(2, '0')}.wav`;
  const { seconds, tempo } = cut(pieces[i].src, pieces[i].a, pieces[i].b, path.join(dir, file), l.max);
  let heard = '', score = null;
  try { heard = await transcribe(path.join(dir, file)); score = similarity(heard, l.text); } catch (e) { heard = `(check skipped: ${e.message})`; }
  plan.push({ file, start: l.start, seconds: Math.round(seconds * 100) / 100, max: l.max, tempo: Math.round(tempo * 100) / 100, text: l.text, heard, match: score === null ? null : Math.round(score * 100) });
  console.log(`${file} ${seconds.toFixed(2)}s/${l.max}s${tempo > 1.001 ? ` (sped up x${tempo.toFixed(2)})` : ''}  match ${score === null ? '?' : Math.round(score * 100) + '%'}  heard: "${heard}"`);
}
for (const f of fs.readdirSync(dir)) if (f.startsWith('_')) fs.rmSync(path.join(dir, f));
// A line that runs long pushes the next one a little later, so two lines never overlap.
for (let i = 1; i < plan.length; i++) {
  const prevEnd = plan[i - 1].start + plan[i - 1].seconds + 0.15;
  if (prevEnd > plan[i].start) plan[i].start = Math.round(prevEnd * 100) / 100;
}
fs.writeFileSync(path.join(dir, 'voiceover.json'), JSON.stringify(plan, null, 2));
const bad = plan.filter((p) => p.match !== null && p.match < 80);
const late = plan.filter((p) => p.seconds > p.max);
if (bad.length) console.log('CHECK THESE LINES (the words do not match well):', bad.map((p) => p.file).join(', '));
if (late.length) console.log('These lines run a little into the next scene:', late.map((p) => p.file).join(', '));
console.log('done: teaser/audio/voiceover.json. Next: node teaser/render.mjs --audio-only');
