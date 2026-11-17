// Drawings for the newer plants and the trees. Every picture is split into two parts:
//   base = the stem or trunk, top = the flower, cap, or leafy crown.
// The growing animation scales the base with the plant and pops the top open near the end.
// Everything is drawn on the same 120 x 140 canvas as the other plants, with the pot top at y = 118.
const LEAF = '#6FA66F';

const leaf = (cx, cy, rot, rx = 10, ry = 4.5, fill = LEAF) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot} ${cx} ${cy})`} />
);

const buds = (x, y, lean) =>
  [0, 1, 2, 3, 4].map((i) => (
    <ellipse key={i} cx={x + lean * i * 0.6} cy={y - i * 5.5} rx={3.1 - i * 0.15} ry={4.8 - i * 0.25} fill={i % 2 ? '#B79BE6' : '#9B7BD1'} />
  ));

const rosette = (angles, rx, ry, colors, cy) =>
  angles.map((a, i) => (
    <ellipse key={a} cx="60" cy={cy} rx={rx} ry={ry} fill={colors[i % 2]} stroke="#4e9873" strokeOpacity=".35" strokeWidth="1" transform={`rotate(${a} 60 114)`} />
  ));

const blossom = (x, y) => (
  <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-2.8" rx="1.8" ry="2.8" fill="#fff" opacity=".85" transform={`rotate(${a})`} />)}
  </g>
);

export const NEW_ART = {
  rose: {
    fullTop: 40, origin: [60, 58],
    base: (
      <g>
        <path d="M60 118 L60 66" stroke={LEAF} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {leaf(47, 98, -28)}{leaf(73, 90, 28)}
        <path d="M60 108 l-4 -5 M60 100 l4 -5" stroke="#4f8a4f" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    ),
    top: (
      <g>
        <circle cx="60" cy="58" r="14" fill="#E0546B" />
        <path d="M47 60 q2 -14 13 -15 q12 1 13 15 q-2 11 -13 12 q-11 -1 -13 -12z" fill="#C93A55" />
        <path d="M52 58 q3 -8 9 -6 q6 2 4 8 q-3 5 -8 3" fill="none" stroke="#F6A9B8" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="60" cy="58" r="2.6" fill="#F6A9B8" />
      </g>
    ),
  },
  daisy: {
    fullTop: 40, origin: [60, 58],
    base: (
      <g>
        <path d="M60 118 L60 66" stroke={LEAF} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {leaf(48, 96, -25)}{leaf(72, 88, 25)}
      </g>
    ),
    top: (
      <g>
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i} cx="60" cy="48.5" rx="3.4" ry="8.5" fill="#fff" stroke="#e6dfcf" strokeWidth=".8" transform={`rotate(${i * 30} 60 58)`} />
        ))}
        <circle cx="60" cy="58" r="6.5" fill="#F6C945" />
        <circle cx="58" cy="56" r="2" fill="#FBE08A" />
      </g>
    ),
  },
  lavender: {
    fullTop: 34, origin: [60, 58],
    base: (
      <g>
        {[[52, 70], [60, 62], [68, 70]].map(([x2, y2], i) => (
          <path key={i} d={`M60 118 Q${60 + (x2 - 60) * 0.4} 95 ${x2} ${y2}`} stroke={LEAF} strokeWidth="3" fill="none" strokeLinecap="round" />
        ))}
        {leaf(50, 102, -35, 9, 3.5)}{leaf(70, 104, 35, 9, 3.5)}
      </g>
    ),
    top: <g>{buds(52, 70, -1.2)}{buds(60, 62, 0)}{buds(68, 70, 1.2)}</g>,
  },
  succulent: {
    fullTop: 76, origin: [60, 90],
    base: <g>{rosette([-75, -50, -25, 0, 25, 50, 75], 6.5, 15, ['#7FC8A0', '#63B58C'], 99)}</g>,
    top: (
      <g>
        {rosette([-42, -14, 14, 42], 5.2, 10, ['#97D6B4', '#7FC8A0'], 103)}
        <circle cx="60" cy="88" r="5" fill="#F29BB8" />
        <circle cx="60" cy="88" r="2" fill="#FBD2DE" />
      </g>
    ),
  },
  mushroom: {
    fullTop: 52, origin: [60, 84],
    base: <rect x="52" y="90" width="16" height="30" rx="8" fill="#FFF3E1" stroke="#EAD9BD" strokeWidth="1.2" />,
    top: (
      <g>
        <path d="M32 94 C32 70 46 60 60 60 C74 60 88 70 88 94 Q60 100 32 94z" fill="#EF6F82" />
        <circle cx="48" cy="76" r="4.2" fill="#fff" /><circle cx="68" cy="70" r="3.4" fill="#fff" />
        <circle cx="76" cy="85" r="3.6" fill="#fff" /><circle cx="55" cy="88" r="2.6" fill="#fff" />
      </g>
    ),
  },

  // ---------- trees (need a longer focus)
  pine: {
    tree: true, fullTop: 8, origin: [60, 70],
    base: <rect x="56.5" y="96" width="7" height="22" rx="2.5" fill="#8B6F47" />,
    top: (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M60 70 L30 108 L90 108z" fill="#3E7D5A" stroke="#3E7D5A" strokeWidth="6" />
        <path d="M60 46 L36 84 L84 84z" fill="#4F9468" stroke="#4F9468" strokeWidth="6" />
        <path d="M60 24 L42 58 L78 58z" fill="#5FA878" stroke="#5FA878" strokeWidth="6" />
        <path d="M60 8 l2.4 5.2 5.6 .7 -4.1 3.8 1.1 5.6 -5 -2.8 -5 2.8 1.1 -5.6 -4.1 -3.8 5.6 -.7z" fill="#F6C945" stroke="none" />
      </g>
    ),
  },
  apple: {
    tree: true, fullTop: 16, origin: [60, 56],
    base: (
      <g>
        <path d="M54 118 L55 86 Q56 78 60 72 Q64 78 65 86 L66 118z" fill="#8B6F47" />
        <path d="M60 90 q-9 -4 -14 -12" stroke="#8B6F47" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M60 86 q8 -3 13 -10" stroke="#8B6F47" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    ),
    top: (
      <g>
        <circle cx="60" cy="46" r="26" fill="#6FB26F" />
        <circle cx="38" cy="62" r="19" fill="#62A862" />
        <circle cx="82" cy="62" r="19" fill="#62A862" />
        <circle cx="60" cy="68" r="20" fill="#7AC07A" />
        <circle cx="50" cy="38" r="9" fill="#9bd89b" opacity=".6" />
        {[[46, 52], [72, 44], [60, 68], [34, 66], [86, 64]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r="5" fill="#E5484D" />
            <circle cx={x - 1.6} cy={y - 1.8} r="1.4" fill="#fff" opacity=".7" />
            <path d={`M${x} ${y - 5} q1 -3 3 -3`} stroke="#6b4a2a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
    ),
  },
  cherry: {
    tree: true, fullTop: 16, origin: [60, 54],
    base: (
      <g>
        <path d="M55 118 Q54 90 58 74 Q60 70 62 74 Q66 90 65 118z" fill="#7A5A4A" />
        <path d="M59 92 q-10 -3 -16 -14" stroke="#7A5A4A" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M61 86 q9 -3 15 -13" stroke="#7A5A4A" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    ),
    top: (
      <g>
        <circle cx="60" cy="44" r="25" fill="#F7B6CB" />
        <circle cx="36" cy="60" r="18" fill="#F29BB8" />
        <circle cx="84" cy="60" r="18" fill="#F29BB8" />
        <circle cx="60" cy="64" r="19" fill="#F9C4D5" />
        {[[48, 40], [72, 36], [38, 62], [82, 64], [60, 58], [56, 76], [66, 26]].map(([x, y]) => blossom(x, y))}
      </g>
    ),
  },
  ginkgo: {
    tree: true, fullTop: 16, origin: [60, 54],
    base: (
      <g>
        <path d="M56 118 Q57 92 59 74 Q60 70 61 74 Q63 92 64 118z" fill="#7A6A4A" />
        <path d="M59 90 q-9 -3 -14 -13" stroke="#7A6A4A" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M61 84 q9 -3 14 -12" stroke="#7A6A4A" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      </g>
    ),
    top: (
      <g>
        <circle cx="60" cy="44" r="25" fill="#F2C94C" />
        <circle cx="37" cy="60" r="18" fill="#E8B92F" />
        <circle cx="83" cy="60" r="18" fill="#E8B92F" />
        <circle cx="60" cy="64" r="19" fill="#F8DC7A" />
        {[[44, 40, -20], [72, 34, 25], [34, 62, -40], [84, 62, 40], [60, 54, 0], [52, 74, -10], [70, 72, 12]].map(([x, y, r]) => (
          <path key={`${x}${y}`} d="M0 0 L-6.5 -10 Q0 -14 6.5 -10z" fill="#FFE98A" stroke="#E8B92F" strokeWidth=".8" transform={`translate(${x} ${y}) rotate(${r})`} />
        ))}
        <path d="M60 12 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z" fill="#fff" opacity=".9" />
      </g>
    ),
  },
};

// A finished picture for the still stages (small, full, withered).
// `scale` shrinks the whole plant toward the pot, and `topScale` shrinks the flower or crown a little more.
export function StaticNewArt({ type, scale = 1, topScale = 1, wilt = false }) {
  const art = NEW_ART[type];
  const [ox, oy] = art.origin;
  const squash = (s, x, y) => `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;
  return (
    <g transform={`${squash(scale, 60, 118)}${wilt ? ' rotate(9 60 118)' : ''}`} style={wilt ? { filter: 'grayscale(.85) brightness(1.06)' } : undefined}>
      {art.base}
      <g transform={squash(topScale, ox, oy)}>{art.top}</g>
    </g>
  );
}
