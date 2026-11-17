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

export default function Backdrop({ variant = 'soft' }) {
  const full = variant === 'full';
  return (
    <div className={`backdrop backdrop--${variant}`} aria-hidden="true">
      <div className="backdrop__sun" />
      <div className="backdrop__stars">
        {Array.from({ length: 14 }).map((_, i) => (
          <i key={i} style={{ '--x': `${(i * 37 + 11) % 100}%`, '--y': `${(i * 23 + 7) % 55}%`, '--d': `${2 + (i % 4)}s` }} />
        ))}
      </div>
      <Cloud className="cloud--1" face={full} />
      <Cloud className="cloud--2" />
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
