// Step 3 of the teaser: write a soft, cheerful 60 second background track (original, so no copyright issues).
// Pads + a plucked arpeggio + a light kick, in C major (C, G, Am, F), 96 BPM. Output: teaser/audio/music.wav
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RATE = 44100, SECONDS = 60, N = RATE * SECONDS;
const L = new Float32Array(N), R = new Float32Array(N);
const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
// C, G, Am, F (MIDI notes)
const CHORDS = [[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]];

function add(buf, i, v) { if (i >= 0 && i < N) buf[i] += v; }

// Soft pad: detuned sines with slow attack and release, one chord per bar.
for (let bar = 0; bar * BAR < SECONDS; bar++) {
  const chord = CHORDS[bar % 4], t0 = bar * BAR, len = BAR + 0.6;
  for (const note of chord.slice(1)) {
    for (const det of [-0.12, 0.12]) {
      const f = hz(note + det);
      const s0 = Math.floor(t0 * RATE), s1 = Math.floor((t0 + len) * RATE);
      for (let s = s0; s < s1; s++) {
        const t = (s - s0) / RATE;
        const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.8);
        const v = Math.sin(2 * Math.PI * f * t) * env * 0.028;
        add(det < 0 ? L : R, s, v); add(det < 0 ? R : L, s, v * 0.5);
      }
    }
  }
  // Bass: root note, two hits per bar.
  for (const off of [0, BEAT * 2]) {
    const f = hz(chord[0]), s0 = Math.floor((t0 + off) * RATE), len2 = BEAT * 1.8;
    for (let s = 0; s < len2 * RATE; s++) {
      const t = s / RATE, env = Math.exp(-t * 2.2) * Math.min(1, t / 0.01);
      const v = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env * 0.09;
      add(L, s0 + s, v); add(R, s0 + s, v);
    }
  }
}

// Plucked arpeggio in eighth notes, panned left and right. Starts after the intro bloom.
const ARP = [0, 1, 2, 3, 2, 1, 3, 2];
for (let k = 0; k * BEAT / 2 < SECONDS; k++) {
  const t0 = k * BEAT / 2;
  if (t0 < 2.4) continue;
  const chord = CHORDS[Math.floor(t0 / BAR) % 4];
  const note = chord[ARP[k % 8]] + 12;
  const f = hz(note), s0 = Math.floor(t0 * RATE), pan = (k % 2 ? 0.7 : 0.3);
  for (let s = 0; s < 0.6 * RATE; s++) {
    const t = s / RATE, env = Math.exp(-t * 7) * Math.min(1, t / 0.004);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 14)) * env * 0.05;
    add(L, s0 + s, v * (1 - pan) * 2); add(R, s0 + s, v * pan * 2);
  }
}

// Light kick on beats 1 and 3, from 5.5 s (after the intro) until the end card.
for (let b = 0; b * BEAT < SECONDS; b += 2) {
  const t0 = b * BEAT;
  if (t0 < 5.5 || t0 > 56) continue;
  const s0 = Math.floor(t0 * RATE);
  let phase = 0;
  for (let s = 0; s < 0.25 * RATE; s++) {
    const t = s / RATE, f = 50 + 90 * Math.exp(-t * 30);
    phase += 2 * Math.PI * f / RATE;
    const v = Math.sin(phase) * Math.exp(-t * 14) * 0.14;
    add(L, s0 + s, v); add(R, s0 + s, v);
  }
}

// A little "bloom" chime when the sunflower opens (2.6 s) and on the end card (55.8 s).
for (const [t0, notes] of [[2.6, [72, 76, 79, 84]], [55.8, [72, 76, 79, 84, 88]]]) {
  notes.forEach((m, j) => {
    const s0 = Math.floor((t0 + j * 0.07) * RATE), f = hz(m);
    for (let s = 0; s < 1.6 * RATE; s++) {
      const t = s / RATE, v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 3) * 0.05;
      add(L, s0 + s, v); add(R, s0 + s, v);
    }
  });
}

// Fade in and out, normalise, and write a 16-bit stereo WAV.
let peak = 0;
for (let s = 0; s < N; s++) {
  const t = s / RATE, fade = Math.min(1, t / 0.8, (SECONDS - t) / 2.5);
  L[s] *= fade; R[s] *= fade;
  peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
}
const gain = 0.85 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8);
out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(RATE, 24); out.writeUInt32LE(RATE * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let s = 0; s < N; s++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[s] * gain)) * 32767), 44 + s * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[s] * gain)) * 32767), 46 + s * 4);
}
fs.mkdirSync(path.join(here, 'audio'), { recursive: true });
fs.writeFileSync(path.join(here, 'audio/music.wav'), out);
console.log('music: teaser/audio/music.wav', SECONDS, 's');
