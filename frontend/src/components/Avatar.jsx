import { useEffect, useState } from 'react';

const COLORS = ['#f4a6b7', '#9fd8b4', '#f7c873', '#a9c7f2', '#cdb2f0', '#f2b48c'];
const colorFor = (name = '') => COLORS[[...name].reduce((n, ch) => n + ch.codePointAt(0), 0) % COLORS.length];

// A round profile picture. Without a photo (or if it fails to load) it shows the first letter of the name.
export default function Avatar({ name, url, size = 36 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [url]);
  const letter = ([...(name || '?')][0] || '?').toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.46) };
  if (url && !broken) {
    return <img className="avatar" style={style} src={url} alt="" onError={() => setBroken(true)} />;
  }
  return <span className="avatar avatar--letter" style={{ ...style, background: colorFor(name) }} aria-hidden="true">{letter}</span>;
}

// Shrink a picked image to a 256 x 256 JPEG (centered square) so uploads stay small.
export async function shrinkToJpeg(file, side = 256) {
  const bitmap = await createImageBitmap(file);
  try {
    const crop = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = side; canvas.height = side;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background in a JPEG
    ctx.fillRect(0, 0, side, side);
    ctx.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, side, side);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that picture.'))), 'image/jpeg', 0.85);
    });
  } finally { bitmap.close?.(); }
}
