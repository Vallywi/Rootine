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

export function alertDone(session, settings) {
  if (settings.soundEnabled) bell();
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
