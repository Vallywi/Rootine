// Three layers: the in-app banner (always, shown by the Focus screen), an optional soft sound,
// and an optional browser notification. Each fails quietly if the browser does not support it.
let audioCtx;

function ctx() {
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume?.();
  return audioCtx;
}

// A loud bell: a few sine partials that fade out slowly, struck twice.
function bell() {
  try {
    const ac = ctx();
    const master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(ac.destination);
    [0, 0.9].forEach((start) => {
      const t = ac.currentTime + start;
      [[880, 0.5, 2.6], [2429, 0.28, 1.6], [4752, 0.16, 1.0], [7858, 0.08, 0.6]].forEach(([freq, level, decay]) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(level, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + decay + 0.05);
      });
    });
  } catch { /* sound is optional */ }
}

// One clear beep for each of the last 10 seconds. The last three are higher and louder.
export function tickSound(secondsLeft, settings) {
  if (!settings.soundEnabled) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;
    const urgent = secondsLeft <= 3;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = urgent ? 1320 : 990;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(urgent ? 0.35 : 0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch { /* sound is optional */ }
}

export const notificationsSupported = () => typeof Notification !== 'undefined';

const canNotify = (settings) => settings.notificationsEnabled && notificationsSupported() && Notification.permission === 'granted';

// Phones (Android Chrome) only allow notifications through the service worker, so try that first.
// Resolves to true when a notification was handed to the browser.
async function show(title, options) {
  try {
    // `ready` waits for the service worker to be active (getRegistration can be empty right after install).
    const reg = await Promise.race([navigator.serviceWorker?.ready, new Promise((r) => setTimeout(r, 3000))]);
    if (reg?.showNotification) { await reg.showNotification(title, options); return true; }
  } catch { /* fall back below */ }
  try { new Notification(title, options); return true; } catch { return false; /* notifications are optional */ }
}

export async function testNotification() {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  return show('Rootine test', { body: 'Notifications are working.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'rootine-test', vibrate: [200, 100, 200] });
}

async function closeByTag(tag) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    (await reg?.getNotifications?.({ tag }))?.forEach((n) => n.close());
  } catch { /* nothing to close */ }
}

const clock = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Shown when a session starts or resumes, so the end time is on the lock screen. Silent.
export function notifyRunning(session, settings) {
  if (!canNotify(settings) || !session.targetAt) return;
  const focus = session.kind === 'focus';
  show(focus ? `Focus until ${clock(session.targetAt)}` : `Break until ${clock(session.targetAt)}`, {
    body: focus ? 'Your plant is growing. Rootine will tell you when it is done.' : 'Rest up. Rootine will tell you when it is over.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'rootine-running',
    silent: true,
  });
}

export function clearRunning() { closeByTag('rootine-running'); }

export function alertDone(session, settings) {
  if (settings.soundEnabled) bell();
  clearRunning();
  if (canNotify(settings)) {
    const focus = session.kind === 'focus';
    show(focus ? 'Your plant is fully grown!' : 'Break is over', {
      body: focus ? 'Nice focus. Take a break when you are ready.' : 'Ready for the next focus session?',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `rootine-${session.id}`, // the same tag replaces a duplicate instead of stacking
      vibrate: [250, 100, 250, 100, 400],
      requireInteraction: true, // stays until tapped
    });
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
  if (canNotify(settings)) {
    show('Almost there', {
      body: session.kind === 'focus' ? 'Your plant is almost fully grown.' : 'Your break is almost over.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `rootine-soon-${session.id}`,
      vibrate: [150, 80, 150],
    });
  }
}

export async function askNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

// Repeats the bell while a finished plant waits to be collected (or a break is over).
export function ringBell(settings) {
  if (settings.soundEnabled) bell();
}

// A tiny cute "pop" for taps and clicks.
export function popSound(settings, high = false) {
  if (!settings.soundEnabled) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    const from = high ? 700 : 520;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(from * 1.8, t + 0.07);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch { /* sound is optional */ }
}
// "3, 2, 1" before the next round: a clear mid beep for each number.
export function countSound(n, settings) {
  if (!settings.soundEnabled) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 600 + (3 - n) * 80; // 3 is lowest, 1 is a bit higher
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  } catch { /* sound is optional */ }
}

// "GO!": a bright rising chord.
export function goSound(settings) {
  if (!settings.soundEnabled) return;
  try {
    const ac = ctx();
    const t = ac.currentTime;
    [[880, 0], [1108, 0.05], [1318, 0.1], [1760, 0.15]].forEach(([freq, delay]) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.32, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.9);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 0.95);
    });
  } catch { /* sound is optional */ }
}