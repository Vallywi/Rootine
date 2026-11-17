// Pictures for the shop: houses, fences, and decorations. All drawn with simple shapes so they stay crisp at any size.

const Face = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="-5" cy="0" r="1.6" fill="#4a3a35" /><circle cx="5" cy="0" r="1.6" fill="#4a3a35" />
    <path d="M-3 3 Q0 6 3 3" stroke="#4a3a35" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    <circle cx="-8" cy="3" r="2" fill="#f7a8b8" opacity=".7" /><circle cx="8" cy="3" r="2" fill="#f7a8b8" opacity=".7" />
  </g>
);

// ---------- houses (viewBox 200 x 170, the ground is at y = 165)
const HOUSES = {
  // The starter home: crooked, patched, and a little sad. Meant to be upgraded.
  hut: (
    <>
      <ellipse cx="100" cy="164" rx="70" ry="5" fill="rgba(0,0,0,.14)" />
      <path d="M44 163 L47 96 L155 92 L158 163Z" fill="#a39682" stroke="#6b604f" strokeWidth="2" strokeLinejoin="round" />
      {[62, 80, 98, 116, 134].map((x, i) => <path key={x} d={`M${x} ${i % 2 ? 98 : 95} L${x + (i % 2 ? 1 : -1)} 162`} stroke="#7d7261" strokeWidth="1.6" />)}
      <rect x="120" y="120" width="26" height="18" fill="#c4b38d" stroke="#7d7261" strokeWidth="1.5" transform="rotate(-4 133 129)" />
      <path d="M122 124 L144 134 M144 124 L122 134" stroke="#8d7c58" strokeWidth="1.2" transform="rotate(-4 133 129)" />
      <path d="M24 100 L98 42 L110 50 L178 94 L164 100 L108 60 L96 62 L38 108Z" fill="#7b6048" stroke="#4e3b2b" strokeWidth="2" strokeLinejoin="round" />
      <path d="M70 76 L90 62 L98 70 L80 84Z" fill="#9a7c5c" /><path d="M120 66 L136 74 L128 84 L114 74Z" fill="#6a523c" />
      <path d="M132 58 L142 52 L146 70 L136 74Z" fill="#8a8a8a" stroke="#555" strokeWidth="1.5" />
      <path d="M140 46 q-6 -8 2 -14 q-3 -8 6 -12" stroke="#c9c9c9" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M66 163 L68 118 Q82 108 94 118 L96 163Z" fill="#6b4a33" stroke="#4e3b2b" strokeWidth="2" />
      <path d="M81 112 L78 134 L84 146" stroke="#3d2b1f" strokeWidth="1.5" fill="none" />
      <circle cx="90" cy="142" r="2" fill="#d9b44a" />
      <rect x="44" y="150" width="10" height="13" fill="#7d7261" transform="rotate(8 49 156)" />
    </>
  ),
  cottage: (
    <>
      <ellipse cx="100" cy="164" rx="76" ry="5" fill="rgba(0,0,0,.14)" />
      <rect x="132" y="38" width="18" height="34" rx="2" fill="#c97a5e" stroke="#9a5a43" strokeWidth="2" />
      <rect x="128" y="34" width="26" height="8" rx="3" fill="#b4684e" />
      <rect x="40" y="88" width="120" height="75" rx="6" fill="#fff1d6" stroke="#d9c39a" strokeWidth="2" />
      <path d="M22 96 L100 34 L178 96Z" fill="#e0614e" stroke="#a8412f" strokeWidth="2.5" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${46 + i * 22} 92 q11 12 22 0`} stroke="#b84b39" strokeWidth="2" fill="none" />)}
      <path d="M84 163 V124 Q100 104 116 124 V163Z" fill="#58a6a0" stroke="#3d7f7a" strokeWidth="2" />
      <circle cx="109" cy="146" r="2.4" fill="#f6d26b" />
      <rect x="48" y="112" width="26" height="26" rx="4" fill="#bfe6f4" stroke="#8a6b4f" strokeWidth="3" />
      <path d="M61 112 V138 M48 125 H74" stroke="#8a6b4f" strokeWidth="2" />
      <rect x="126" y="112" width="26" height="26" rx="4" fill="#bfe6f4" stroke="#8a6b4f" strokeWidth="3" />
      <path d="M139 112 V138 M126 125 H152" stroke="#8a6b4f" strokeWidth="2" />
      <rect x="44" y="138" width="34" height="9" rx="2" fill="#a9724c" />
      {[50, 58, 66, 74].map((x, i) => <circle key={x} cx={x} cy={136} r="3.4" fill={['#f48fb1', '#ffd54f', '#f48fb1', '#ffd54f'][i]} />)}
      <Face x={100} y={80} s={0.9} />
    </>
  ),
  cabin: (
    <>
      <ellipse cx="100" cy="164" rx="80" ry="5" fill="rgba(0,0,0,.14)" />
      <rect x="128" y="34" width="20" height="38" fill="#9a9a9a" stroke="#6e6e6e" strokeWidth="2" />
      <path d="M128 48 H148 M128 60 H148" stroke="#6e6e6e" strokeWidth="1.5" />
      <rect x="38" y="84" width="124" height="79" rx="4" fill="#b8814e" stroke="#7a5230" strokeWidth="2" />
      {[96, 108, 120, 132, 144, 156].map((y) => <path key={y} d={`M38 ${y} H162`} stroke="#8a5d36" strokeWidth="2.2" />)}
      {[96, 108, 120, 132, 144, 156].map((y) => <circle key={`l${y}`} cx="38" cy={y - 6} r="3" fill="#cf9a64" stroke="#7a5230" strokeWidth="1" />)}
      <path d="M20 92 L100 30 L180 92Z" fill="#4f8a5b" stroke="#2f5f3a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 30 L100 92" stroke="#2f5f3a" strokeWidth="1.5" opacity=".6" />
      <rect x="80" y="112" width="40" height="51" rx="3" fill="#6b4226" stroke="#4a2b17" strokeWidth="2" />
      <circle cx="112" cy="140" r="2.4" fill="#f6d26b" />
      <rect x="48" y="108" width="24" height="24" rx="3" fill="#ffe28a" stroke="#4a2b17" strokeWidth="3" />
      <path d="M60 108 V132 M48 120 H72" stroke="#4a2b17" strokeWidth="2" />
      <rect x="128" y="108" width="24" height="24" rx="3" fill="#ffe28a" stroke="#4a2b17" strokeWidth="3" />
      <path d="M140 108 V132 M128 120 H152" stroke="#4a2b17" strokeWidth="2" />
      <rect x="70" y="100" width="60" height="6" fill="#7a5230" /><rect x="72" y="106" width="5" height="57" fill="#7a5230" /><rect x="123" y="106" width="5" height="57" fill="#7a5230" />
      <rect x="64" y="158" width="72" height="6" rx="2" fill="#a06a3c" />
    </>
  ),
  treehouse: (
    <>
      <ellipse cx="100" cy="164" rx="60" ry="5" fill="rgba(0,0,0,.14)" />
      <path d="M82 164 Q88 130 86 96 H114 Q112 130 118 164Z" fill="#8a5d36" stroke="#5e3d22" strokeWidth="2" />
      <path d="M92 150 Q96 130 94 110" stroke="#6b4527" strokeWidth="2" fill="none" />
      <circle cx="58" cy="62" r="34" fill="#6fbf73" stroke="#3f8f4a" strokeWidth="2" />
      <circle cx="142" cy="62" r="34" fill="#6fbf73" stroke="#3f8f4a" strokeWidth="2" />
      <circle cx="100" cy="34" r="38" fill="#7fcf84" stroke="#3f8f4a" strokeWidth="2" />
      <circle cx="100" cy="76" r="34" fill="#6fbf73" stroke="#3f8f4a" strokeWidth="2" />
      <rect x="60" y="92" width="80" height="8" rx="2" fill="#a06a3c" stroke="#6b4527" strokeWidth="1.5" />
      <rect x="68" y="56" width="64" height="38" rx="3" fill="#e8c28a" stroke="#a07a45" strokeWidth="2" />
      <path d="M62 58 L100 28 L138 58Z" fill="#ee8a4c" stroke="#b5602b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M92 94 V74 Q100 64 108 74 V94Z" fill="#6b4226" />
      <rect x="114" y="66" width="12" height="12" rx="2" fill="#bfe6f4" stroke="#a07a45" strokeWidth="2" />
      <rect x="74" y="66" width="12" height="12" rx="2" fill="#bfe6f4" stroke="#a07a45" strokeWidth="2" />
      <path d="M130 98 L140 164 M146 98 L150 164" stroke="#c9a46b" strokeWidth="2" />
      {[112, 126, 140, 154].map((y) => <path key={y} d={`M${133 + (y - 98) * 0.1} ${y} H${148 + (y - 98) * 0.05}`} stroke="#c9a46b" strokeWidth="3" strokeLinecap="round" />)}
      <circle cx="40" cy="70" r="3" fill="#f48fb1" /><circle cx="160" cy="54" r="3" fill="#ffd54f" /><circle cx="120" cy="22" r="3" fill="#f48fb1" />
    </>
  ),
  castle: (
    <>
      <ellipse cx="100" cy="164" rx="84" ry="5" fill="rgba(0,0,0,.14)" />
      <rect x="22" y="74" width="40" height="89" fill="#f6c4d6" stroke="#c98aa4" strokeWidth="2" />
      <rect x="138" y="74" width="40" height="89" fill="#f6c4d6" stroke="#c98aa4" strokeWidth="2" />
      <path d="M16 78 L42 30 L68 78Z" fill="#b79ae6" stroke="#8a6fc0" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M132 78 L158 30 L184 78Z" fill="#b79ae6" stroke="#8a6fc0" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M42 30 V12 L56 17 L42 22" fill="#ee6c8a" stroke="#c0445f" strokeWidth="1.5" />
      <path d="M158 30 V12 L172 17 L158 22" fill="#ee6c8a" stroke="#c0445f" strokeWidth="1.5" />
      <rect x="58" y="94" width="84" height="69" fill="#fbd5e2" stroke="#c98aa4" strokeWidth="2" />
      {[58, 76, 94, 112, 130].map((x) => <rect key={x} x={x} y="84" width="12" height="12" fill="#fbd5e2" stroke="#c98aa4" strokeWidth="2" />)}
      <path d="M100 56 L124 94 H76Z" fill="#b79ae6" stroke="#8a6fc0" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 56 V38 L114 43 L100 48" fill="#ffd54f" stroke="#c9a02a" strokeWidth="1.5" />
      <path d="M84 163 V132 Q100 110 116 132 V163Z" fill="#8a6fc0" stroke="#5e4a96" strokeWidth="2" />
      <path d="M100 118 V163" stroke="#5e4a96" strokeWidth="1.5" />
      <rect x="34" y="96" width="16" height="22" rx="8" fill="#ffe28a" stroke="#c98aa4" strokeWidth="2" />
      <rect x="150" y="96" width="16" height="22" rx="8" fill="#ffe28a" stroke="#c98aa4" strokeWidth="2" />
      <rect x="92" y="98" width="16" height="12" rx="6" fill="#ffe28a" stroke="#c98aa4" strokeWidth="2" />
      <Face x={100} y={150} s={0} />
    </>
  ),
};

export function HouseArt({ id, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 200 170" role="img" aria-label={id} focusable="false">
      <title>{id}</title>
      {HOUSES[id] ?? HOUSES.hut}
    </svg>
  );
}

// ---------- fences: one section (viewBox 40 x 60), repeated across the yard
const FENCES = {
  wood: (
    <>
      <rect x="0" y="16" width="40" height="6" fill="#a9724c" /><rect x="0" y="38" width="40" height="6" fill="#a9724c" />
      <rect x="5" y="6" width="10" height="54" rx="2" fill="#c08857" stroke="#8a5a34" strokeWidth="1.5" />
      <rect x="25" y="6" width="10" height="54" rx="2" fill="#c08857" stroke="#8a5a34" strokeWidth="1.5" />
    </>
  ),
  picket: (
    <>
      <rect x="0" y="20" width="40" height="5" fill="#efe2c4" stroke="#d9c9a4" strokeWidth="1" /><rect x="0" y="42" width="40" height="5" fill="#efe2c4" stroke="#d9c9a4" strokeWidth="1" />
      <path d="M3 60 V14 L10 5 L17 14 V60Z" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M23 60 V14 L30 5 L37 14 V60Z" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
  stone: (
    <>
      <rect x="0" y="8" width="40" height="52" fill="#b9b3a6" />
      {[[0, 8, 18], [20, 8, 20], [0, 24, 10], [10, 24, 20], [30, 24, 10], [0, 40, 20], [20, 40, 20]].map(([x, y, w], i) => (
        <rect key={i} x={x + 1} y={y + 1} width={w - 2} height="14" rx="3" fill={i % 2 ? '#cfc9bb' : '#c2bcae'} stroke="#8f897c" strokeWidth="1.2" />
      ))}
      <rect x="0" y="4" width="40" height="6" rx="3" fill="#d9d4c7" stroke="#8f897c" strokeWidth="1.2" />
    </>
  ),
  hedge: (
    <>
      <path d="M0 60 V26 Q6 10 14 22 Q22 4 30 20 Q36 10 40 26 V60Z" fill="#5fae6a" stroke="#3f8a4d" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="30" r="3" fill="#f48fb1" /><circle cx="22" cy="22" r="3" fill="#ffd54f" /><circle cx="32" cy="34" r="3" fill="#f48fb1" /><circle cx="16" cy="44" r="3" fill="#fff" />
    </>
  ),
};

export function FenceArt({ id, className = '' }) {
  const art = FENCES[id];
  if (!art) return null;
  return (
    <div className={`yard-fence ${className}`} aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => (
        <svg key={i} viewBox="0 0 40 60" preserveAspectRatio="none" focusable="false">{art}</svg>
      ))}
    </div>
  );
}

// ---------- decorations (viewBox 100 x 100, base near y = 96)
const DECOR = {
  signpost: (
    <>
      <ellipse cx="50" cy="95" rx="18" ry="3" fill="rgba(0,0,0,.14)" />
      <rect x="46" y="22" width="8" height="74" rx="2" fill="#a9724c" stroke="#7a4f2f" strokeWidth="1.5" />
      <path d="M52 26 H84 L92 34 L84 42 H52Z" fill="#e8c28a" stroke="#a07a45" strokeWidth="2" strokeLinejoin="round" />
      <path d="M48 48 H16 L8 56 L16 64 H48Z" fill="#f2d8a8" stroke="#a07a45" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="70" cy="34" r="2.5" fill="#6fbf73" /><circle cx="30" cy="56" r="2.5" fill="#f48fb1" />
    </>
  ),
  mailbox: (
    <>
      <ellipse cx="50" cy="95" rx="18" ry="3" fill="rgba(0,0,0,.14)" />
      <rect x="46" y="48" width="8" height="48" rx="2" fill="#a9724c" stroke="#7a4f2f" strokeWidth="1.5" />
      <path d="M24 52 V36 Q24 24 40 24 H62 Q78 24 78 36 V52Z" fill="#e0614e" stroke="#a8412f" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="40" y="38" width="22" height="4" rx="2" fill="#a8412f" />
      <path d="M78 36 V12 H92 V22 H84 V36" fill="#ffd54f" stroke="#c9a02a" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  lamp: (
    <>
      <ellipse cx="50" cy="95" rx="14" ry="3" fill="rgba(0,0,0,.14)" />
      <rect x="47" y="40" width="6" height="56" rx="2" fill="#4f5b66" />
      <rect x="40" y="88" width="20" height="8" rx="3" fill="#4f5b66" />
      <circle className="decor-glow" cx="50" cy="26" r="22" fill="#ffe28a" opacity=".35" />
      <path d="M38 14 L50 6 L62 14 V40 H38Z" fill="#ffe9a8" stroke="#4f5b66" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 14 V40" stroke="#4f5b66" strokeWidth="1.5" />
    </>
  ),
  bench: (
    <>
      <ellipse cx="50" cy="94" rx="36" ry="4" fill="rgba(0,0,0,.14)" />
      <rect x="18" y="62" width="8" height="30" rx="2" fill="#7a4f2f" /><rect x="74" y="62" width="8" height="30" rx="2" fill="#7a4f2f" />
      <rect x="12" y="56" width="76" height="12" rx="4" fill="#c08857" stroke="#8a5a34" strokeWidth="2" />
      <rect x="14" y="30" width="72" height="8" rx="3" fill="#c08857" stroke="#8a5a34" strokeWidth="2" /><rect x="14" y="42" width="72" height="8" rx="3" fill="#c08857" stroke="#8a5a34" strokeWidth="2" />
      <rect x="20" y="30" width="6" height="30" fill="#8a5a34" /><rect x="74" y="30" width="6" height="30" fill="#8a5a34" />
    </>
  ),
  pond: (
    <>
      <ellipse cx="50" cy="66" rx="46" ry="26" fill="#d8c9a6" stroke="#b9a883" strokeWidth="2" />
      <ellipse cx="50" cy="64" rx="38" ry="20" fill="#8fd0ea" stroke="#6ab4d4" strokeWidth="2" />
      <ellipse cx="36" cy="58" rx="12" ry="5" fill="#d9f2fb" opacity=".7" />
      <ellipse className="decor-ripple" cx="62" cy="70" rx="8" ry="3" fill="none" stroke="#fff" strokeWidth="2" />
      <ellipse cx="66" cy="62" rx="9" ry="4.5" fill="#6fbf73" stroke="#3f8f4a" strokeWidth="1.5" /><path d="M66 62 L72 59" stroke="#8fd0ea" strokeWidth="2" />
      <circle cx="64" cy="59" r="2.6" fill="#f48fb1" />
    </>
  ),
  birdbath: (
    <>
      <ellipse cx="50" cy="95" rx="22" ry="3" fill="rgba(0,0,0,.14)" />
      <path d="M42 94 Q46 66 46 56 H54 Q54 66 58 94Z" fill="#c9c9c9" stroke="#8f8f8f" strokeWidth="2" />
      <path d="M20 44 Q50 70 80 44 Z" fill="#d9d9d9" stroke="#8f8f8f" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="50" cy="44" rx="30" ry="6" fill="#8fd0ea" stroke="#8f8f8f" strokeWidth="2" />
      <path d="M58 40 q4 -12 12 -8 q-1 8 -8 10Z" fill="#7fb7f0" stroke="#4a86c9" strokeWidth="1.5" /><circle cx="68" cy="33" r="1.4" fill="#333" /><path d="M71 33 l5 1.5 -5 1" fill="#f6b04a" />
    </>
  ),
  scarecrow: (
    <>
      <ellipse cx="50" cy="95" rx="18" ry="3" fill="rgba(0,0,0,.14)" />
      <rect x="47" y="30" width="6" height="66" rx="2" fill="#a9724c" />
      <rect x="14" y="44" width="72" height="6" rx="3" fill="#a9724c" />
      <path d="M32 46 L24 70 H76 L68 46Z" fill="#e0614e" stroke="#a8412f" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 52 H64 M34 60 H66" stroke="#f6a08e" strokeWidth="2" />
      <path d="M12 46 l-6 8 M12 46 l-2 9 M88 46 l6 8 M88 46 l2 9" stroke="#e8c260" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="30" r="14" fill="#f3d9a4" stroke="#c9a566" strokeWidth="2" />
      <Face x={50} y={30} s={0.9} />
      <path d="M26 24 H74 L66 22 Q50 2 34 22Z" fill="#c9a24a" stroke="#8f7125" strokeWidth="2" strokeLinejoin="round" />
      <rect x="34" y="20" width="32" height="4" fill="#8a5a34" />
    </>
  ),
  swing: (
    <>
      <ellipse cx="50" cy="95" rx="38" ry="4" fill="rgba(0,0,0,.14)" />
      <path d="M14 96 L34 14 M86 96 L66 14" stroke="#a9724c" strokeWidth="6" strokeLinecap="round" />
      <rect x="28" y="10" width="44" height="7" rx="3" fill="#8a5a34" />
      <path d="M40 17 V70 M60 17 V70" stroke="#d9c9a4" strokeWidth="2.5" />
      <rect x="34" y="68" width="32" height="7" rx="3" fill="#ee8a4c" stroke="#b5602b" strokeWidth="2" />
    </>
  ),
  windmill: (
    <>
      <ellipse cx="50" cy="95" rx="26" ry="4" fill="rgba(0,0,0,.14)" />
      <path d="M32 96 L40 36 H60 L68 96Z" fill="#f3e6cf" stroke="#c9b48a" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 70 H64 M34 82 H66" stroke="#d9c9a4" strokeWidth="2" />
      <path d="M38 36 L50 18 L62 36Z" fill="#e0614e" stroke="#a8412f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 96 V80 Q50 72 56 80 V96Z" fill="#8a5a34" />
      <g className="decor-blades">
        <path d="M50 30 L46 2 H54Z M50 30 L78 26 V34Z M50 30 L54 58 H46Z M50 30 L22 34 V26Z" fill="#fffdf6" stroke="#c9b48a" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <circle cx="50" cy="30" r="4" fill="#a9724c" />
    </>
  ),
};

export function DecorArt({ id, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label={id} focusable="false">
      <title>{id}</title>
      {DECOR[id] ?? null}
    </svg>
  );
}

// One picture for any shop item (used in the shop cards).
export function ItemArt({ item }) {
  if (item.category === 'house') return <HouseArt id={item.id} />;
  if (item.category === 'fence') return (
    <svg viewBox="0 0 120 60" aria-hidden="true" focusable="false" className="shop-fence-preview">
      {[0, 1, 2].map((i) => <svg key={i} x={i * 40} y="0" width="40" height="60" viewBox="0 0 40 60" preserveAspectRatio="none">{FENCES[item.id]}</svg>)}
    </svg>
  );
  return <DecorArt id={item.id} />;
}
