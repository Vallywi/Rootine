// Loaded by the generated service worker (see importScripts in vite.config.js).
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
