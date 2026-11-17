// Cute decorative background: pastel sky, drifting clouds, floating leaves and sparkles, and rolling hills.
// It is purely decorative (aria-hidden), never takes clicks, and stops moving when the user prefers less motion.
// "full" is for the landing and sign-in pages. "soft" is quieter, for the signed-in app.

function Cloud({ className, face = false }) {
  return (
    <svg className={`cloud ${className}`} viewBox="0 0 140 70" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="40" cy="42" r="22" />
        <circle cx="70" cy="30" r="28" />
        <circle cx="102" cy="42" r="22" />
        <rect x="38" y="40" width="66" height="24" rx="12" />
      </g>
      {face && (
        <g fill="none" stroke="#7b6a63" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="60" cy="44" r="1.6" fill="#7b6a63" />
          <circle cx="82" cy="44" r="1.6" fill="#7b6a63" />
          <path d="M66 50 q5 5 10 0" />
          <circle cx="53" cy="49" r="3.5" fill="#f4a6b7" stroke="none" opacity=".7" />
          <circle cx="89" cy="49" r="3.5" fill="#f4a6b7" stroke="none" opacity=".7" />
        </g>
      )}
    </svg>
  );
}

const LEAF = 'M12 2c5 2 8 7 6 12-2 4-6 6-10 5C4 14 6 6 12 2z';
const SPARKLE = 'M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z';

// Each floating piece: shape, horizontal position (%), size (px), duration (s), delay (s), color.
const FLOATERS = [
  ['leaf', 6, 22, 19, 0, 'var(--leaf)'],
  ['sparkle', 16, 14, 14, 4, 'var(--butter)'],
  ['petal', 27, 16, 22, 9, 'var(--blush)'],
  ['leaf', 38, 18, 17, 2, 'var(--leaf-2)'],
  ['sparkle', 49, 12, 13, 7, 'var(--butter)'],
  ['petal', 60, 18, 21, 1, 'var(--blush)'],
  ['leaf', 71, 24, 20, 6, 'var(--leaf)'],
  ['sparkle', 82, 15, 15, 11, 'var(--butter)'],
  ['petal', 91, 14, 18, 3, 'var(--blush)'],
];

function Floater({ kind, size, color }) {
  if (kind === 'petal') {
    return <svg viewBox="0 0 24 24" width={size} height={size}><ellipse cx="12" cy="12" rx="6" ry="10" fill={color} /></svg>;
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d={kind === 'leaf' ? LEAF : SPARKLE} fill={color} />
    </svg>
  );
}

// A smiling sun (daytime) and a sleepy moon (night). The page theme decides which one shows.
function Sun() {
  return (
    <svg className="sun" viewBox="0 0 120 120" aria-hidden="true">
      <g className="sun__rays" stroke="#ffd45e" strokeWidth="6" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="60" y1="8" x2="60" y2="20" transform={`rotate(${i * 30} 60 60)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="32" fill="#ffe27a" />
      <circle cx="48" cy="56" r="3.2" fill="#7b5a2e" />
      <circle cx="72" cy="56" r="3.2" fill="#7b5a2e" />
      <path d="M50 68 q10 9 20 0" stroke="#7b5a2e" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="66" r="5" fill="#ffb3a7" opacity=".7" />
      <circle cx="80" cy="66" r="5" fill="#ffb3a7" opacity=".7" />
    </svg>
  );
}

function Moon() {
  return (
    <svg className="moon" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="34" fill="#f6efc9" />
      <circle cx="44" cy="44" r="6" fill="#ebe2b0" />
      <circle cx="78" cy="70" r="8" fill="#ebe2b0" />
      <path d="M40 58 q6 5 12 0" stroke="#7b6a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M68 58 q6 5 12 0" stroke="#7b6a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M54 72 q6 5 12 0" stroke="#7b6a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="68" r="5" fill="#f4a6b7" opacity=".6" />
      <circle cx="82" cy="66" r="5" fill="#f4a6b7" opacity=".6" />
      <text className="moon__z" x="92" y="30" fontSize="16" fill="#f6efc9" fontWeight="800">z</text>
      <text className="moon__z moon__z--2" x="102" y="18" fontSize="12" fill="#f6efc9" fontWeight="800">z</text>
    </svg>
  );
}

function Rainbow() {
  const arcs = ['#ffb3b3', '#ffd9a8', '#fff2a8', '#c5ecb7', '#b7dcf5', '#d6c4f2'];
  return (
    <svg className="rainbow" viewBox="0 0 300 160" aria-hidden="true">
      {arcs.map((c, i) => (
        <path key={c} d={`M${20 + i * 12} 160 A${130 - i * 12} ${130 - i * 12} 0 0 1 ${280 - i * 12} 160`} fill="none" stroke={c} strokeWidth="12" />
      ))}
    </svg>
  );
}

function Butterfly({ className, color }) {
  return (
    <span className={`butterfly ${className}`} aria-hidden="true">
      <svg viewBox="0 0 40 30" width="34" height="26">
        <g className="butterfly__wings">
          <ellipse cx="12" cy="11" rx="10" ry="8" fill={color} />
          <ellipse cx="13" cy="22" rx="7" ry="6" fill={color} opacity=".85" />
          <ellipse cx="28" cy="11" rx="10" ry="8" fill={color} />
          <ellipse cx="27" cy="22" rx="7" ry="6" fill={color} opacity=".85" />
        </g>
        <rect x="19" y="6" width="3" height="18" rx="1.5" fill="#6b5a52" />
        <path d="M20 6 q-3 -5 -6 -5 M21 6 q3 -5 6 -5" stroke="#6b5a52" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Bee() {
  return (
    <span className="bee" aria-hidden="true">
      <svg viewBox="0 0 40 32" width="34" height="27">
        <ellipse className="bee__wing" cx="15" cy="8" rx="7" ry="5" fill="#dff3ff" opacity=".9" />
        <ellipse className="bee__wing bee__wing--2" cx="25" cy="8" rx="7" ry="5" fill="#dff3ff" opacity=".9" />
        <ellipse cx="20" cy="19" rx="13" ry="9" fill="#ffd45e" />
        <path d="M14 11 v16 M21 10 v18 M28 12 v14" stroke="#4a3a2a" strokeWidth="3.4" />
        <circle cx="31" cy="17" r="1.6" fill="#4a3a2a" />
        <path d="M33 21 q2 1.5 4 0" stroke="#4a3a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Mushroom({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="0" width="10" height="16" rx="5" fill="#fff4e3" />
      <path d="M-18 2 a18 14 0 0 1 36 0z" fill="#ef7f8e" />
      <circle cx="-7" cy="-5" r="2.8" fill="#fff" />
      <circle cx="5" cy="-8" r="2.4" fill="#fff" />
      <circle cx="11" cy="-1" r="1.9" fill="#fff" />
    </g>
  );
}

export default function Backdrop({ variant = 'soft' }) {
  const full = variant === 'full';
  return (
    <div className={`backdrop backdrop--${variant}`} aria-hidden="true">
      <Sun />
      <Moon />
      {full && <Rainbow />}
      <div className="backdrop__stars">
        {Array.from({ length: 14 }).map((_, i) => (
          <i key={i} style={{ '--x': `${(i * 37 + 11) % 100}%`, '--y': `${(i * 23 + 7) % 55}%`, '--d': `${2 + (i % 4)}s` }} />
        ))}
      </div>
      <Cloud className="cloud--1" face={full} />
      <Cloud className="cloud--2" />
      <Butterfly className="butterfly--1" color="#f6a6c1" />
      {full && <Butterfly className="butterfly--2" color="#a6d4f6" />}
      {full && <Bee />}
      {full && <Cloud className="cloud--3" />}
      {FLOATERS.slice(0, full ? FLOATERS.length : 4).map(([kind, x, size, dur, delay, color], i) => (
        <span key={i} className="floater" style={{ '--x': `${x}%`, '--dur': `${dur}s`, '--delay': `${delay}s`, color }}>
          <Floater kind={kind} size={size} color={color} />
        </span>
      ))}
      <svg className="hills" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path className="hill hill--3" d="M0 200 C240 120 420 140 640 190 C860 240 1060 150 1440 170 L1440 320 L0 320Z" />
        <path className="hill hill--2" d="M0 250 C200 190 420 210 700 245 C980 280 1180 200 1440 235 L1440 320 L0 320Z" />
        <path className="hill hill--1" d="M0 290 C260 250 520 270 800 285 C1100 300 1260 265 1440 280 L1440 320 L0 320Z" />
        {full && (
          <g className="tufts">
            <Mushroom x={140} y={278} s={1.1} />
            <Mushroom x={1040} y={284} s={0.9} />
            <Mushroom x={760} y={296} s={0.7} />
            {[90, 210, 430, 610, 820, 980, 1190, 1330].map((x, i) => (
              <g key={x} transform={`translate(${x} ${262 + (i % 3) * 14})`}>
                <circle r="6" cx="0" cy="0" fill={i % 2 ? 'var(--blush)' : 'var(--butter)'} />
                <circle r="2.4" cx="0" cy="0" fill="#fff" opacity=".85" />
                <path d="M0 6 v14" stroke="var(--leaf-2)" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
