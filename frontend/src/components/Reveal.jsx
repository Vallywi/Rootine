import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './GrowingPlant.jsx';

// Fades and slides its content in when it scrolls into view.
// Shown at once for people who prefer less motion, or when the browser cannot tell.
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => prefersReducedMotion() || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (shown) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);

  return <Tag ref={ref} className={`reveal ${shown ? 'is-in' : ''} ${className}`} {...rest}>{children}</Tag>;
}
