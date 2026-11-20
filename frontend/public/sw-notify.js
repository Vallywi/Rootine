// Loaded by the generated service worker (see importScripts in vite.config.js).

// A push from the server (session finished). It arrives even when the app is closed or the phone is locked.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* use the defaults below */ }
  event.waitUntil((async () => {
    // If Rootine is open and in front, the app already rings its own bell.
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.some((c) => c.visibilityState === 'visible' && c.focused)) return;
    await self.registration.showNotification(data.title || 'Rootine', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'rootine',
      vibrate: [250, 100, 250, 100, 400],
      requireInteraction: true, // stays until tapped
      renotify: true,
    });
  })());
});

// Tapping a Rootine notification opens the app, or brings the open tab to the front.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow('/');
  })());
});
