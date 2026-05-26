/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request, url }) => request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      const cachedAppShell = await caches.match('/index.html', { ignoreSearch: true });
      return cachedAppShell || Response.error();
    }
  }
);

registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly(), 'GET');

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json() as {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'MindfulLife', {
    body: payload.body || 'Open MindfulLife to continue your daily reflection.',
    data: { url: payload.url || '/reflection' },
    tag: payload.tag || 'mindfullife-reminder',
    icon: '/icons/mindfullife-icon.svg',
    badge: '/icons/mindfullife-icon.svg',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/reflection';

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const matchingClient = windowClients.find((client) => client.url.startsWith(self.location.origin));

    if (matchingClient) {
      await matchingClient.focus();
      matchingClient.postMessage({ type: 'mindfullife:navigate', url: targetUrl });
      return;
    }

    await self.clients.openWindow(targetUrl);
  })());
});
