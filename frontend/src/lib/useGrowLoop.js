import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../components/GrowingPlant.jsx';

// Loops 0 -> 1 -> pause -> 0, so a visitor can watch a seed grow into a flower.
// Stays fully grown for people who prefer less motion.
export function useGrowLoop(growMs = 9000, holdMs = 2500) {
  const [value, setValue] = useState(prefersReducedMotion() ? 1 : 0);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) % (growMs + holdMs);
      setValue(Math.min(1, t / growMs));
    }, 120);
    return () => clearInterval(id);
  }, [growMs, holdMs]);
  return value;
}
