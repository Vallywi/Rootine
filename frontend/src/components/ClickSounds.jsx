import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { popSound } from '../lib/alerts.js';

const TAPPABLE = 'button, a[href], summary, select, [role="tab"], [role="button"], input[type="checkbox"], input[type="radio"], input[type="file"], label.seg, .seg label';

// A small cute "pop" on every tap of a button, link, tab, or switch. Follows the sound setting.
export default function ClickSounds() {
  const { settings } = useAuth();
  const ref = useRef(settings);
  ref.current = settings;
  useEffect(() => {
    let last = 0;
    const onClick = (e) => {
      const el = e.target instanceof Element ? e.target.closest(TAPPABLE) : null;
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const now = performance.now();
      if (now - last < 80) return; // a label and its checkbox both fire a click
      last = now;
      popSound(ref.current, el.matches('input[type="checkbox"], input[type="radio"], [role="tab"], .seg label'));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
