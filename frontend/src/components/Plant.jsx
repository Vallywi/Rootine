// One SVG component for all plants. Stages: seed, sprout, small, full, withered.
// Plants sit in a pot with a small face. All shapes are drawn here, no image files.
export const PLANTS = {
  sunflower: { name: 'Sunflower', petal: '#E8B02E', center: '#7B5A2E' },
  cactus: { name: 'Cactus', body: '#5E9E6B', flower: '#E58AA8' },
  tulip: { name: 'Tulip', petal: '#E0657A', petal2: '#C84C63' },
  sakura: { name: 'Sakura', petal: '#F4B6C8', petal2: '#E98FAB' },
};
export const STAGE_LABEL = { seed: 'Seed', sprout: 'Sprout', small: 'Growing', full: 'Fully grown', withered: 'Withered' };

const LEAF = '#6FA66F';
const WILT = '#A59A7C';

export function stageFor(percent, status) {
  if (status === 'completed') return 'full';
  if (status === 'given_up') return 'withered';
  if (percent < 0.25) return 'seed';
  if (percent < 0.6) return 'sprout';
  return 'small';
}

function Head({ type, stage, cx, cy, s }) {
  const p = PLANTS[type];
  const wilt = stage === 'withered';
  if (type === 'sunflower') {
    return (
      <g>
        {Array.from({ length: 10 }).map((_, i) => (
          <ellipse key={i} cx={cx} cy={cy - 10 * s} rx={3.6 * s} ry={8 * s} fill={wilt ? WILT : p.petal} transform={`rotate(${i * 36} ${cx} ${cy})`} />
        ))}
        <circle cx={cx} cy={cy} r={8 * s} fill={wilt ? '#7a6b50' : p.center} />
      </g>
    );
  }
  if (type === 'tulip') {
    return (
      <g>
        <path d={`M${cx - 9 * s} ${cy - 2 * s} Q${cx - 10 * s} ${cy + 12 * s} ${cx} ${cy + 12 * s} Q${cx + 10 * s} ${cy + 12 * s} ${cx + 9 * s} ${cy - 2 * s} L${cx + 4.5 * s} ${cy - 10 * s} L${cx} ${cy - 3 * s} L${cx - 4.5 * s} ${cy - 10 * s} Z`} fill={wilt ? WILT : p.petal} />
        <path d={`M${cx} ${cy - 3 * s} L${cx + 4.5 * s} ${cy - 10 * s} L${cx + 9 * s} ${cy - 2 * s} Q${cx + 10 * s} ${cy + 12 * s} ${cx} ${cy + 12 * s} Z`} fill={wilt ? '#8e8466' : p.petal2} opacity="0.7" />
      </g>
    );
  }
  if (type === 'sakura') {
    return (
      <g>
        {Array.from({ length: 5 }).map((_, i) => (
          <circle key={i} cx={cx + Math.cos((i / 5) * 6.283 - 1.57) * 7 * s} cy={cy + Math.sin((i / 5) * 6.283 - 1.57) * 7 * s} r={6 * s} fill={wilt ? WILT : p.petal} />
        ))}
        <circle cx={cx} cy={cy} r={4 * s} fill={wilt ? '#8e8466' : p.petal2} />
      </g>
    );
  }
  return null;
}

export default function Plant({ type = 'sunflower', stage = 'full', size = 140, title }) {
  const wilt = stage === 'withered';
  const p = PLANTS[type] ?? PLANTS.sunflower;
  const stemColor = wilt ? WILT : LEAF;
  const label = title ?? `${p.name}, ${STAGE_LABEL[stage].toLowerCase()}`;
  // Plant height by stage.
  const h = { seed: 0, sprout: 22, small: 40, full: 58, withered: 44 }[stage];
  const s = { seed: 0, sprout: 0.5, small: 0.75, full: 1, withered: 0.85 }[stage];
  const potTop = 118;
  const topY = potTop - h;

  let plant = null;
  if (stage === 'seed') {
    plant = <ellipse cx="60" cy={potTop - 6} rx="7" ry="5" fill="#8B6F47" stroke="#6b5233" strokeWidth="1.5" />;
  } else if (type === 'cactus') {
    const body = wilt ? WILT : p.body;
    plant = (
      <g>
        <rect x={60 - 12 * s - 2} y={topY + 6} width={(24 * s) + 4} height={h} rx={12 * s} fill={body} />
        {stage !== 'sprout' && <path d={`M${60 - 12 * s} ${potTop - h * 0.45} h-${8 * s} v-${14 * s} a${3.5 * s} ${3.5 * s} 0 0 1 ${7 * s} 0`} fill="none" stroke={body} strokeWidth={6 * s} strokeLinecap="round" />}
        {stage === 'full' && <circle cx="60" cy={topY + 6} r="4.5" fill={p.flower} />}
        {stage === 'withered' && <path d={`M${60 - 12 * s} ${potTop - h * 0.45} h-${8 * s} v${6 * s}`} fill="none" stroke={body} strokeWidth={6 * s} strokeLinecap="round" />}
      </g>
    );
  } else {
    plant = (
      <g>
        <path d={wilt ? `M60 ${potTop} Q60 ${topY + 20} 72 ${topY + 6}` : `M60 ${potTop} L60 ${topY}`} stroke={stemColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {stage !== 'sprout' && <ellipse cx="48" cy={potTop - h * 0.4} rx={10 * s} ry={4.5 * s} fill={stemColor} transform={`rotate(${wilt ? 40 : -25} 48 ${potTop - h * 0.4})`} />}
        <ellipse cx="72" cy={potTop - h * 0.55} rx={10 * s} ry={4.5 * s} fill={stemColor} transform={`rotate(${wilt ? -40 : 25} 72 ${potTop - h * 0.55})`} />
        {stage === 'sprout' ? <ellipse cx="60" cy={topY} rx="7" ry="4" fill={LEAF} /> : <Head type={type} stage={stage} cx={wilt ? 72 : 60} cy={wilt ? topY + 6 : topY} s={s} />}
      </g>
    );
  }

  return (
    <svg className={`plant plant--${stage}`} width={size} height={size} viewBox="0 0 120 140" role="img" aria-label={label}>
      <title>{label}</title>
      <g className="plant__sway">{plant}</g>
      {/* pot with a small face */}
      <path d="M32 118 H88 L82 138 H38 Z" fill="#B65F50" />
      <rect x="28" y="113" width="64" height="9" rx="4.5" fill="#C97563" />
      <circle cx="51" cy="127" r="2" fill="#3a2a22" />
      <circle cx="69" cy="127" r="2" fill="#3a2a22" />
      {wilt ? <path d="M55 133 q5 -3 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            : <path d="M55 130 q5 4 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
