// A burst of little sparkles, flowers, and hearts. Decorative only. Hidden when the user prefers less motion.
const PIECES = ['✨', '🌸', '💛', '⭐', '🌿', '🎉', '💚', '🌼'];

export default function Confetti({ count = 18 }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            '--a': `${(i / count) * 360 + (i % 3) * 8}deg`,
            '--d': `${95 + (i % 4) * 30}px`,
            '--delay': `${(i % 5) * 45}ms`,
            '--spin': `${(i % 2 ? 1 : -1) * (160 + i * 25)}deg`,
          }}
        >
          {PIECES[i % PIECES.length]}
        </span>
      ))}
    </div>
  );
}
