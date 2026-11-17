import { useEffect, useRef, useState } from 'react';
import { Head, PLANTS, Pot, STAGE_LABEL, stageFor } from './Plant.jsx';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const LEAF = '#6FA66F';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// A plant that grows smoothly as `progress` goes from 0 to 1.
// The whole plant scales up from the pot. The leaves unfurl in the middle, and the flower pops open near the end.
// Every part changes with a CSS transition, so a new value glides instead of jumping.
export default function GrowingPlant({ type = 'sunflower', progress = 0, size = 200, title }) {
  const p = clamp01(progress);
  const stage = stageFor(p);
  const meta = PLANTS[type] ?? PLANTS.sunflower;

  const body = 0.1 + 0.9 * p; // overall size
  const leaves = clamp01((p - 0.2) / 0.3); // leaves unfurl
  const bloom = clamp01((p - 0.6) / 0.35); // flower pops open
  const seedOpacity = clamp01(1 - p / 0.1);
  const plantOpacity = clamp01((p - 0.03) / 0.07);

  // A little pop and sparkles each time the plant reaches a new stage.
  const [pop, setPop] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setPop(true);
    const id = setTimeout(() => setPop(false), 900);
    return () => clearTimeout(id);
  }, [stage]);

  const scale = (v, ox, oy, kind = 'grow') => ({ className: `g g--${kind}`, style: { transform: `scale(${v})`, transformOrigin: `${ox}px ${oy}px` } });
  const label = title ?? `${meta.name}, ${STAGE_LABEL[stage].toLowerCase()}`;
  const cactusBody = meta.body ?? '#5E9E6B';

  return (
    <div className={`growing ${pop ? 'is-pop' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 140" width={size} height={size} role="img" aria-label={label} className="plant plant--growing">
        <title>{label}</title>
        <ellipse cx="60" cy="112" rx="7" ry="5" fill="#8B6F47" stroke="#6b5233" strokeWidth="1.5" style={{ opacity: seedOpacity, transition: 'opacity .5s' }} />
        <g className="plant__sway">
          <g {...scale(body, 60, 118)} style={{ transform: `scale(${body})`, transformOrigin: '60px 118px', opacity: plantOpacity }}>
            {type === 'cactus' ? (
              <>
                <rect x="46" y="66" width="28" height="58" rx="12" fill={cactusBody} />
                <g {...scale(leaves, 48, 92, 'pop')}>
                  <path d="M48 92 h-8 v-14 a3.5 3.5 0 0 1 7 0" fill="none" stroke={cactusBody} strokeWidth="6" strokeLinecap="round" />
                </g>
                <g {...scale(bloom, 60, 66, 'pop')}><circle cx="60" cy="66" r="4.5" fill={meta.flower} /></g>
              </>
            ) : (
              <>
                <path d="M60 118 L60 60" stroke={LEAF} strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <g {...scale(leaves, 48, 95, 'pop')}><ellipse cx="48" cy="95" rx="10" ry="4.5" fill={LEAF} transform="rotate(-25 48 95)" /></g>
                <g {...scale(leaves, 72, 86, 'pop')}><ellipse cx="72" cy="86" rx="10" ry="4.5" fill={LEAF} transform="rotate(25 72 86)" /></g>
                <g {...scale(bloom, 60, 60, 'pop')}><Head type={type} stage="full" cx={60} cy={60} s={1} /></g>
              </>
            )}
          </g>
        </g>
        <Pot />
      </svg>
      {pop && (
        <span className="sparkles" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ '--a': `${i * 60}deg` }}>✦</i>)}
        </span>
      )}
    </div>
  );
}
