// Firebase Cloud Messaging Service Worker
// This file must be at the root of your public folder

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config will be injected via query params or hardcoded
// For security, we use a minimal config here - the full config is in the main app
firebase.initializeApp({
  apiKey: self.location.search.includes('apiKey') 
    ? new URLSearchParams(self.location.search).get('apiKey')
    : '',
  authDomain: self.location.search.includes('authDomain')
    ? new URLSearchParams(self.location.search).get('authDomain')
    : '',
  projectId: self.location.search.includes('projectId')
    ? new URLSearchParams(self.location.search).get('projectId')
    : '',
  storageBucket: self.location.search.includes('storageBucket')
    ? new URLSearchParams(self.location.search).get('storageBucket')
    : '',
  messagingSenderId: self.location.search.includes('messagingSenderId')
    ? new URLSearchParams(self.location.search).get('messagingSenderId')
    : '',
  appId: self.location.search.includes('appId')
    ? new URLSearchParams(self.location.search).get('appId')
    : '',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.jpg',
    badge: '/icons/icon-192x192.jpg',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app or focus existing window
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (event.notification.data?.url) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
