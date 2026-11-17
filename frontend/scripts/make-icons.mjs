// Draws the Rootine icons (a plant in a pot on a green background) as PNG files.
// Run once: node scripts/make-icons.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// scale < 1 keeps the picture inside the safe area (for maskable icons).
function art(scale, rounded) {
  return (u, v) => {
    const x = 0.5 + (u - 0.5) / scale, y = 0.5 + (v - 0.5) / scale;
    // background
    let bg = [47, 93, 80, 255];
    if (rounded && !(x > 0.02 && x < 0.98 && y > 0.02 && y < 0.98)) bg = [0, 0, 0, 0];
    if (rounded) {
      const cx = Math.min(Math.max(x, 0.2), 0.8), cy = Math.min(Math.max(y, 0.2), 0.8);
      if (!inCircle(x, y, cx, cy, 0.2) && (x < 0.2 || x > 0.8) && (y < 0.2 || y > 0.8)) bg = [0, 0, 0, 0];
    }
    if (bg[3] === 0 && rounded) return bg;
    // pot
    if (x > 0.34 && x < 0.66 && y > 0.62 && y < 0.82 && Math.abs(x - 0.5) < 0.16 - (y - 0.62) * 0.2) return [182, 95, 80, 255];
    if (x > 0.31 && x < 0.69 && y > 0.58 && y < 0.64) return [201, 117, 99, 255];
    // stem
    if (Math.abs(x - 0.5) < 0.012 && y > 0.4 && y < 0.6) return [111, 166, 111, 255];
    // leaves
    if (inEllipse(x, y, 0.4, 0.44, 0.1, 0.05) || inEllipse(x, y, 0.6, 0.38, 0.1, 0.05)) return [111, 166, 111, 255];
    // flower
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      if (inCircle(x, y, 0.5 + Math.cos(a) * 0.075, 0.28 + Math.sin(a) * 0.075, 0.055)) return [217, 154, 43, 255];
    }
    if (inCircle(x, y, 0.5, 0.28, 0.055)) return [139, 111, 71, 255];
    return bg;
  };
}

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.png', png(192, art(1, true)));
fs.writeFileSync('public/icons/icon-512.png', png(512, art(1, true)));
fs.writeFileSync('public/icons/icon-maskable-512.png', png(512, art(0.78, false)));
fs.writeFileSync('public/icons/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#2F5D50"/><path d="M34 62h32l-4 20H38z" fill="#B65F50"/><rect x="31" y="58" width="38" height="6" rx="3" fill="#C97563"/><rect x="49" y="40" width="2" height="19" fill="#6FA66F"/><ellipse cx="40" cy="44" rx="10" ry="5" fill="#6FA66F"/><ellipse cx="60" cy="38" rx="10" ry="5" fill="#6FA66F"/><circle cx="50" cy="28" r="10" fill="#D99A2B"/><circle cx="50" cy="28" r="5.5" fill="#8B6F47"/></svg>`);
console.log('icons written');
