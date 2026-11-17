// One SVG component for all plants. Stages: seed, sprout, small, full, withered.
// Plants sit in a pot with a small face. All shapes are drawn here, no image files.
import { PLANT_CATALOG } from '../../../shared/plants.js';
import { NEW_ART, StaticNewArt } from './plantArt.jsx';

// Colors for the first four plants (the newer ones are drawn in plantArt.jsx).
const LOOKS = {
  sunflower: { petal: '#E8B02E', center: '#7B5A2E' },
  cactus: { body: '#5E9E6B', flower: '#E58AA8' },
  tulip: { petal: '#E0657A', petal2: '#C84C63' },
  sakura: { petal: '#F4B6C8', petal2: '#E98FAB' },
};
// id, name, kind ("plant" or "tree"), and minMinutes come from shared/plants.js.
export const PLANTS = Object.fromEntries(PLANT_CATALOG.map((p) => [p.id, { ...LOOKS[p.id], ...p }]));
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

export function Head({ type, stage, cx, cy, s }) {
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

// Visible area per stage. Short plants are cropped so they do not float in empty space.
// The pot is always at the bottom, so plants of different sizes stand on the same line.
const VIEW = { seed: [98, 42], sprout: [84, 56], small: [54, 86], full: [34, 106], withered: [56, 84] };

// The newer plants and trees are tall or short in different ways, so their crop is worked out from the top of the picture.
function viewFor(type, stage) {
  const art = NEW_ART[type];
  if (!art) return VIEW[stage];
  const top = { seed: 98, sprout: 84 }[stage]
    ?? Math.max(0, Math.round(118 - (118 - art.fullTop) * { small: 0.62, full: 1, withered: 0.95 }[stage]) - 6);
  return [top, 140 - top];
}

// fit="tight" (default) crops the empty space. fit="full" keeps one fixed box, so the layout does not jump while a plant grows.
// ground=true draws a little face on a mound of earth instead of a pot (used outside, in the yard).
export default function Plant({ type = 'sunflower', stage = 'full', size = 140, title, fit = 'tight', ground = false }) {
  const wilt = stage === 'withered';
  const view = fit === 'full' ? [0, 140] : viewFor(type, stage);
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
  } else if (NEW_ART[type] && stage !== 'sprout') {
    plant = <StaticNewArt type={type} scale={{ small: 0.58, full: 1, withered: 0.92 }[stage]} topScale={{ small: 0.6, full: 1, withered: 0.9 }[stage]} wilt={wilt} />;
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
    <svg className={`plant plant--${stage}`} width={size} height={fit === 'full' ? size : Math.round((size * view[1]) / 120)} viewBox={`0 ${view[0]} 120 ${view[1]}`} role="img" aria-label={label}>
      <title>{label}</title>
      <g className="plant__sway">{plant}</g>
      {ground ? <Mound wilt={wilt} /> : <Pot wilt={wilt} />}
    </svg>
  );
}

// The pot with a small face. The eyes blink now and then, and the mouth droops when the plant is withered.
export function Pot({ wilt = false }) {
  return (
    <g className="pot">
      <path d="M32 118 H88 L82 138 H38 Z" fill="#B65F50" />
      <rect x="28" y="113" width="64" height="9" rx="4.5" fill="#C97563" />
      <circle className="eye" cx="51" cy="127" r="2" fill="#3a2a22" />
      <circle className="eye" cx="69" cy="127" r="2" fill="#3a2a22" />
      {!wilt && <><circle cx="45" cy="130" r="2.6" fill="#f4a6b7" opacity=".75" /><circle cx="75" cy="130" r="2.6" fill="#f4a6b7" opacity=".75" /></>}
      {wilt ? <path d="M55 133 q5 -3 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            : <path d="M55 130 q5 4 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
    </g>
  );
}

// A little hill of earth with a face, so a plant can stand outside in the yard without its pot.
export function Mound({ wilt = false }) {
  return (
    <g className="pot">
      <ellipse cx="60" cy="130" rx="40" ry="11" fill="#7A5C3A" />
      <path d="M24 130 C28 112 92 112 96 130 Z" fill="#8B6F47" />
      <path d="M36 122 C44 114 76 114 84 122" fill="none" stroke="#A98B5F" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
      <circle className="eye" cx="51" cy="126" r="2" fill="#3a2a22" />
      <circle className="eye" cx="69" cy="126" r="2" fill="#3a2a22" />
      {!wilt && <><circle cx="45" cy="129" r="2.6" fill="#f4a6b7" opacity=".75" /><circle cx="75" cy="129" r="2.6" fill="#f4a6b7" opacity=".75" /></>}
      {wilt ? <path d="M55 132 q5 -3 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            : <path d="M55 129 q5 4 10 0" stroke="#3a2a22" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
    </g>
  );
}
