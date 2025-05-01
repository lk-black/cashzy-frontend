const CACHE_NAME = 'cashzy-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/logologin.png',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  } else if (event.tag === 'sync-campaigns') {
    event.waitUntil(syncCampaigns());
  }
});

// Periodic Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/logologin.png',
    badge: '/logologin.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/logologin.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Cashzy', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Fetch event with offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Return the offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background sync functions
async function syncExpenses() {
  const expenses = await getExpensesFromIndexedDB();
  try {
    await fetch('/api/sync-expenses', {
      method: 'POST',
      body: JSON.stringify(expenses)
    });
  } catch (error) {
    throw new Error('Failed to sync expenses');
  }
}

async function syncCampaigns() {
  const campaigns = await getCampaignsFromIndexedDB();
  try {
    await fetch('/api/sync-campaigns', {
      method: 'POST',
      body: JSON.stringify(campaigns)
    });
  } catch (error) {
    throw new Error('Failed to sync campaigns');
  }
}

// Periodic sync function
async function checkForUpdates() {
  try {
    const response = await fetch('/api/check-updates');
    const data = await response.json();
    
    if (data.hasUpdates) {
      self.registration.showNotification('Atualização disponível', {
        body: 'Há uma nova versão do Cashzy disponível',
        icon: '/logologin.png',
        actions: [
          {
            action: 'update',
            title: 'Atualizar agora'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}