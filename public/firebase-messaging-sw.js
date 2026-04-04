// Firebase Cloud Messaging Service Worker
// This file must be at the root of your public folder

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config - hardcoded because service workers cannot access env vars
firebase.initializeApp({
  apiKey: "AIzaSyCzqRisoaBjOwPgefLTdVszx7I5J1iQX9o",
  authDomain: "dashboard-impulsionai-mkt.firebaseapp.com",
  projectId: "dashboard-impulsionai-mkt",
  storageBucket: "dashboard-impulsionai-mkt.firebasestorage.app",
  messagingSenderId: "273537569477",
  appId: "1:273537569477:web:952881348ae20dfda3d6ac",
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
