import { useEffect, useState } from 'react';
import { useTimer } from './TimerContext.jsx';
import { PLANTS } from '../components/Plant.jsx';

// What the small timers (the floating card and the pop-out window) need to show, worked out in one place.
export function useTimerView() {
  const t = useTimer();
  const { session, result } = t;
  const running = !!session && (session.status === 'active' || session.status === 'paused');
  const waiting = !running && !!result && result.kind === 'focus' && result.status === 'completed' && !result.collected;
  const breakDone = !running && !!result && result.kind !== 'focus' && result.status === 'completed';
  const [thanks, setThanks] = useState(false);

  // A short "added to your garden" flash after collecting.
  useEffect(() => {
    if (!result?.collected) { setThanks(false); return undefined; }
    setThanks(true);
    const id = setTimeout(() => setThanks(false), 3500);
    return () => clearTimeout(id);
  }, [result?.collected, result?.session?.id]);

  const focus = running && session.kind === 'focus';
  const paused = running && session.status === 'paused';
  const percent = running ? Math.max(0, Math.min(1, 1 - t.remainingMs / (session.plannedSeconds * 1000))) : 1;
  const plantName = result?.session?.plantType ? PLANTS[result.session.plantType].name : 'plant';

  const counting = t.countdown !== null && t.countdown !== undefined;
  let label;
  if (counting) label = t.countdown > 0 ? `Get ready: ${t.countdown}` : 'Go!';
  else if (running) label = `${focus ? (paused ? 'Paused' : 'Focusing') : session.kind === 'long_break' ? 'Long break' : 'Short break'}${session.taskTitle ? ` · ${session.taskTitle}` : ''}`;
  else if (waiting) label = `Your ${plantName.toLowerCase()} is fully grown!`;
  else if (thanks) label = 'Added to your garden!';
  else label = 'Break is over';

  const nearEnd = running && !!t.nearEnd;
  return { nearEnd, t, session, result, running, waiting, breakDone, thanks, focus, paused, percent, plantName, label, counting, any: running || waiting || breakDone || thanks || counting };
}
