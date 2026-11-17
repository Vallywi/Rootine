// Three layers: the in-app banner (always, shown by the Focus screen), an optional soft sound,
// and an optional browser notification. Each fails quietly if the browser does not support it.
let audioCtx;

function beep() {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.15, t + i * 0.22 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.22 + 0.4);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t + i * 0.22);
      osc.stop(t + i * 0.22 + 0.45);
    });
  } catch { /* sound is optional */ }
}

export const notificationsSupported = () => typeof Notification !== 'undefined';

export function alertDone(session, settings) {
  if (settings.soundEnabled) beep();
  if (settings.notificationsEnabled && notificationsSupported() && Notification.permission === 'granted') {
    try {
      const focus = session.kind === 'focus';
      new Notification(focus ? 'Your plant is fully grown!' : 'Break is over', {
        body: focus ? 'Nice focus. Take a break when you are ready.' : 'Ready for the next focus session?',
        icon: '/icons/icon-192.png',
        tag: `rootine-${session.id}`, // the same tag replaces a duplicate instead of stacking
      });
    } catch { /* some browsers only allow notifications from a service worker */ }
  }
}

// One gentle "almost there" tick shortly before a session ends.
export function alertSoon(session, settings) {
  if (settings.soundEnabled) {
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    } catch { /* sound is optional */ }
  }
  if (settings.notificationsEnabled && notificationsSupported() && Notification.permission === 'granted') {
    try {
      new Notification('Almost there', {
        body: session.kind === 'focus' ? 'Your plant is almost fully grown.' : 'Your break is almost over.',
        icon: '/icons/icon-192.png',
        tag: `rootine-soon-${session.id}`,
      });
    } catch { /* some browsers only allow notifications from a service worker */ }
  }
}

export async function askNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}
