import { useEffect, useRef, useState } from 'react';

// Pets for the yard. Each picture faces right and fits a 100 x 100 box with its feet near y = 94.
// The tail (.pet-tail) wags all the time. The whole pet hops while it walks.
const Eye = ({ x, y }) => <circle cx={x} cy={y} r="2.4" fill="#3b2f2a" />;
const Cheek = ({ x, y }) => <circle cx={x} cy={y} r="2.6" fill="#f7a8b8" opacity=".75" />;
const Shadow = ({ rx = 30 }) => <ellipse cx="50" cy="95" rx={rx} ry="3.5" fill="rgba(0,0,0,.16)" />;

const PETS = {
  dog: (
    <>
      <Shadow />
      <path className="pet-tail" d="M22 58 Q10 46 14 36" stroke="#a9724c" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="28" y="72" width="9" height="22" rx="4" fill="#a9724c" /><rect x="52" y="72" width="9" height="22" rx="4" fill="#a9724c" />
      <ellipse cx="46" cy="66" rx="28" ry="18" fill="#c08857" stroke="#8a5a34" strokeWidth="2" />
      <rect x="38" y="76" width="9" height="18" rx="4" fill="#c08857" stroke="#8a5a34" strokeWidth="1.5" /><rect x="62" y="76" width="9" height="18" rx="4" fill="#c08857" stroke="#8a5a34" strokeWidth="1.5" />
      <ellipse cx="42" cy="72" rx="14" ry="8" fill="#e8c9a0" opacity=".8" />
      <circle cx="72" cy="46" r="17" fill="#c08857" stroke="#8a5a34" strokeWidth="2" />
      <ellipse cx="60" cy="42" rx="7" ry="13" fill="#7a4f2f" transform="rotate(14 60 42)" />
      <ellipse cx="82" cy="53" rx="11" ry="8" fill="#f3dcb8" stroke="#8a5a34" strokeWidth="1.5" />
      <ellipse cx="90" cy="49" rx="4" ry="3.2" fill="#3b2f2a" />
      <Eye x="76" y="41" /><path d="M80 59 Q84 66 88 59" fill="#f48fb1" stroke="#c0445f" strokeWidth="1" />
    </>
  ),
  cat: (
    <>
      <Shadow rx="26" />
      <path className="pet-tail" d="M22 66 Q4 60 10 38 Q12 32 18 34" stroke="#f0a35a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="46" cy="68" rx="26" ry="17" fill="#f6b672" stroke="#c9822a" strokeWidth="2" />
      <rect x="32" y="76" width="9" height="18" rx="4" fill="#f6b672" stroke="#c9822a" strokeWidth="1.5" /><rect x="58" y="76" width="9" height="18" rx="4" fill="#f6b672" stroke="#c9822a" strokeWidth="1.5" />
      <path d="M32 58 L36 78 M44 54 L46 76 M56 56 L56 76" stroke="#e8893a" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="70" cy="48" r="16" fill="#f6b672" stroke="#c9822a" strokeWidth="2" />
      <path d="M56 40 L58 22 L68 34Z M72 34 L82 22 L84 42Z" fill="#f6b672" stroke="#c9822a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M59 34 L60 27 L65 33Z M76 33 L81 27 L81 36Z" fill="#f7a8b8" />
      <Eye x="64" y="46" /><Eye x="76" y="46" /><path d="M68 51 L72 51 L70 54Z" fill="#e0614e" />
      <path d="M70 54 Q66 59 62 56 M70 54 Q74 59 78 56" stroke="#3b2f2a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M52 52 H44 M52 56 H45 M88 52 H96 M88 56 H95" stroke="#8a5a34" strokeWidth="1.2" strokeLinecap="round" />
      <Cheek x="60" y="54" /><Cheek x="80" y="54" />
    </>
  ),
  pig: (
    <>
      <Shadow />
      <path className="pet-tail" d="M20 62 Q8 58 12 50 Q18 46 14 40" stroke="#f08ca8" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="28" y="74" width="10" height="20" rx="4" fill="#f4a3bb" stroke="#d9728f" strokeWidth="1.5" /><rect x="56" y="74" width="10" height="20" rx="4" fill="#f4a3bb" stroke="#d9728f" strokeWidth="1.5" />
      <ellipse cx="46" cy="64" rx="30" ry="20" fill="#f8b8cb" stroke="#d9728f" strokeWidth="2" />
      <rect x="38" y="76" width="10" height="18" rx="4" fill="#f8b8cb" stroke="#d9728f" strokeWidth="1.5" /><rect x="64" y="76" width="10" height="18" rx="4" fill="#f8b8cb" stroke="#d9728f" strokeWidth="1.5" />
      <circle cx="72" cy="52" r="17" fill="#f8b8cb" stroke="#d9728f" strokeWidth="2" />
      <path d="M58 40 L62 28 L72 38Z" fill="#f08ca8" stroke="#d9728f" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="86" cy="56" rx="9" ry="7" fill="#f08ca8" stroke="#d9728f" strokeWidth="1.5" />
      <circle cx="83" cy="56" r="1.8" fill="#9b3a58" /><circle cx="89" cy="56" r="1.8" fill="#9b3a58" />
      <Eye x="74" y="48" /><Cheek x="68" y="58" />
    </>
  ),
  bunny: (
    <>
      <Shadow rx="26" />
      <circle className="pet-tail" cx="22" cy="68" r="8" fill="#fff" stroke="#d9d2bd" strokeWidth="2" />
      <ellipse cx="46" cy="70" rx="26" ry="20" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <ellipse cx="64" cy="86" rx="14" ry="7" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <ellipse cx="38" cy="88" rx="12" ry="6" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <ellipse cx="68" cy="22" rx="6" ry="20" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" transform="rotate(-8 68 22)" />
      <ellipse cx="68" cy="23" rx="2.8" ry="14" fill="#f7a8b8" transform="rotate(-8 68 23)" />
      <ellipse cx="80" cy="26" rx="6" ry="19" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" transform="rotate(14 80 26)" />
      <ellipse cx="80" cy="27" rx="2.8" ry="13" fill="#f7a8b8" transform="rotate(14 80 27)" />
      <circle cx="74" cy="54" r="16" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <Eye x="78" y="50" /><circle cx="88" cy="56" r="2.6" fill="#f08ca8" /><Cheek x="70" y="58" />
      <path d="M85 59 Q88 62 91 59" stroke="#3b2f2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  ),
  chick: (
    <>
      <Shadow rx="20" />
      <path className="pet-tail" d="M24 56 L12 48 M24 62 L10 60" stroke="#f6c945" strokeWidth="5" strokeLinecap="round" />
      <path d="M44 80 V92 M56 80 V92 M38 92 H48 M50 92 H60" stroke="#f08a3c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="60" r="28" fill="#ffe27a" stroke="#d9a92a" strokeWidth="2.5" />
      <path className="pet-wing" d="M36 60 Q30 76 48 74 Q52 62 36 60Z" fill="#f6c945" stroke="#d9a92a" strokeWidth="1.5" />
      <path d="M72 56 L86 61 L72 66Z" fill="#f08a3c" stroke="#c9682a" strokeWidth="1.5" strokeLinejoin="round" />
      <Eye x="64" y="52" /><Cheek x="60" y="62" />
      <path d="M46 34 Q44 24 52 26 M54 33 Q56 22 62 27" stroke="#d9a92a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  duck: (
    <>
      <Shadow rx="26" />
      <path className="pet-tail" d="M20 60 Q8 52 14 46 Q22 50 28 58Z" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" strokeLinejoin="round" />
      <path d="M42 82 V93 M58 82 V93 M34 93 H46 M50 93 H62" stroke="#f08a3c" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="46" cy="66" rx="28" ry="18" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <path className="pet-wing" d="M28 62 Q26 80 50 78 Q54 62 28 62Z" fill="#f1ead2" stroke="#d9d2bd" strokeWidth="1.5" />
      <circle cx="70" cy="42" r="15" fill="#ffe27a" stroke="#d9a92a" strokeWidth="2" />
      <path d="M82 44 Q96 44 94 52 Q88 56 80 52Z" fill="#f08a3c" stroke="#c9682a" strokeWidth="1.5" strokeLinejoin="round" />
      <Eye x="72" y="38" /><Cheek x="68" y="50" />
    </>
  ),
  sheep: (
    <>
      <Shadow />
      <path className="pet-tail" d="M20 60 q-6 -4 0 -10 q6 4 0 10Z" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2" />
      <rect x="34" y="78" width="7" height="16" rx="3" fill="#4a3a35" /><rect x="52" y="78" width="7" height="16" rx="3" fill="#4a3a35" />
      <g fill="#fffdf6" stroke="#d9d2bd" strokeWidth="2">
        <circle cx="30" cy="62" r="14" /><circle cx="44" cy="54" r="16" /><circle cx="60" cy="60" r="15" /><circle cx="40" cy="72" r="14" /><circle cx="56" cy="74" r="13" />
      </g>
      <rect x="44" y="78" width="7" height="16" rx="3" fill="#4a3a35" /><rect x="62" y="78" width="7" height="16" rx="3" fill="#4a3a35" />
      <ellipse cx="76" cy="52" rx="13" ry="14" fill="#5a4a45" stroke="#3b2f2a" strokeWidth="2" />
      <ellipse cx="64" cy="48" rx="5" ry="8" fill="#5a4a45" stroke="#3b2f2a" strokeWidth="1.5" transform="rotate(30 64 48)" />
      <circle cx="78" cy="48" r="2.4" fill="#fff" /><circle cx="78.4" cy="48" r="1.2" fill="#000" /><Cheek x="82" y="58" />
      <path d="M70 36 Q76 30 82 36" stroke="#fffdf6" strokeWidth="6" fill="none" strokeLinecap="round" />
    </>
  ),
  turtle: (
    <>
      <Shadow rx="30" />
      <rect x="26" y="78" width="12" height="14" rx="5" fill="#8fc77a" stroke="#4f8a45" strokeWidth="1.5" /><rect x="58" y="78" width="12" height="14" rx="5" fill="#8fc77a" stroke="#4f8a45" strokeWidth="1.5" />
      <path className="pet-tail" d="M20 76 L8 80 L20 82Z" fill="#8fc77a" stroke="#4f8a45" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 82 Q20 36 50 36 Q80 36 80 82Z" fill="#6aa86a" stroke="#3f7a45" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 38 V82 M30 56 L70 56 M24 72 L76 72" stroke="#3f7a45" strokeWidth="2" opacity=".8" />
      <path d="M38 42 Q50 34 62 42 L58 56 H42Z" fill="#8fc77a" opacity=".55" />
      <circle cx="86" cy="64" r="11" fill="#8fc77a" stroke="#4f8a45" strokeWidth="2" />
      <Eye x="90" y="60" /><Cheek x="84" y="68" />
      <path d="M90 68 Q93 70 95 67" stroke="#3b2f2a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  ),
};

export function PetArt({ id, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label={id} focusable="false">
      <title>{id}</title>
      {PETS[id] ?? null}
    </svg>
  );
}

// ---------- walking around the yard

const hash = (text) => [...text].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const X = [8, 92];
const Y = [50, 94]; // the grass, below the fence
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const SPEED = { turtle: 3, chick: 7, duck: 6, sheep: 5, pig: 6, cat: 8, dog: 11, bunny: 10 }; // percent of the yard per second
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function RoamingPet({ id, name }) {
  const seed = hash(id);
  const start = { x: 14 + (seed % 70), y: 56 + ((seed >> 3) % 36), face: seed % 2 ? 1 : -1 };
  const here = useRef(start); // where the pet is, read outside React's render
  const [state, setState] = useState({ ...start, walking: false, ms: 0 });
  const [loved, setLoved] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (reduced()) return undefined; // people who prefer less motion get pets that stand still
    let alive = true;
    const speed = SPEED[id] ?? 6;
    const next = () => {
      if (!alive) return;
      const from = here.current;
      const x = clamp(from.x + rand(-34, 34), X);
      const y = clamp(from.y + rand(-14, 14), Y);
      const ms = Math.max(700, (Math.hypot((x - from.x) * 1.2, y - from.y) / speed) * 1000);
      const face = x >= from.x ? 1 : -1;
      here.current = { x, y, face };
      setState({ x, y, face, walking: true, ms });
      timer.current = setTimeout(() => {
        if (!alive) return;
        setState((s) => ({ ...s, walking: false }));
        timer.current = setTimeout(next, rand(1200, 4200)); // rest a little
      }, ms);
    };
    timer.current = setTimeout(next, rand(300, 2500));
    return () => { alive = false; clearTimeout(timer.current); };
  }, [id]);

  return (
    <button
      type="button"
      className={`yard__pet ${state.walking ? 'is-walking' : ''}`}
      style={{ left: `${state.x}%`, top: `${state.y}%`, zIndex: Math.round(state.y * 10), transitionDuration: state.walking ? `${state.ms}ms` : '0ms' }}
      aria-label={`${name}. Tap to say hello.`}
      title={name}
      onClick={() => setLoved((n) => n + 1)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="yard__pet-flip" style={{ transform: `scaleX(${state.face})` }}>
        <PetArt id={id} className="yard__pet-art" />
      </span>
      {loved > 0 && <span key={loved} className="yard__pet-heart" aria-hidden="true">{'\u2764\uFE0F'}</span>}
    </button>
  );
}

// All the pets the user owns, walking on the grass.
export default function YardPets({ pets }) {
  return pets.map((p) => <RoamingPet key={p.id} id={p.id} name={p.name} />);
}
