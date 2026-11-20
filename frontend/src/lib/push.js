import * as api from './api.js';

// Web Push: lets the server notify this phone or browser when a session ends, even if Rootine is closed.
export const pushSupported = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof PushManager !== 'undefined' && typeof Notification !== 'undefined';

const toBytes = (base64Url) => {
  const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const ready = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('The app is not ready yet.')), 5000))]);

// Subscribes this device and tells the server. Safe to call again. Returns true when push is on.
export async function enablePush() {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try {
    const { enabled, publicKey } = await api.get('/push/key');
    if (!enabled) return false;
    const reg = await ready();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) });
    await api.post('/push/subscribe', sub.toJSON());
    return true;
  } catch {
    return false; // push is an extra: the in-app alerts still work
  }
}

export async function disablePush() {
  if (!pushSupported()) return;
  try {
    const sub = await (await ready()).pushManager.getSubscription();
    if (!sub) return;
    await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  } catch { /* nothing to remove */ }
}
