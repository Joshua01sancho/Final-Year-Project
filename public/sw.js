// Service Worker for E-Vote System
const CACHE_NAME = 'e-vote-v1';
const urlsToCache = [
  '/',
  '/auth/login',
  '/user/dashboard',
  '/user/vote',
  '/admin/elections',
  '/admin/analytics',
  '/styles/globals.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline votes
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-votes') {
    event.waitUntil(syncOfflineVotes());
  }
});

// Sync offline votes when connection is restored
async function syncOfflineVotes() {
  try {
    const offlineVotes = await getOfflineVotes();
    
    for (const vote of offlineVotes) {
      try {
        // Attempt to submit the vote
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vote.data),
        });

        if (response.ok) {
          // Remove from offline storage if successful
          await removeOfflineVote(vote.id);
        }
      } catch (error) {
        console.error('Failed to sync vote:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing offline votes:', error);
  }
}

// IndexedDB operations for offline votes
async function getOfflineVotes() {
  return new Promise((resolve) => {
    const request = indexedDB.open('E-Vote-Offline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineVotes')) {
        db.createObjectStore('offlineVotes', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineVotes'], 'readonly');
      const store = transaction.objectStore('offlineVotes');
      const getRequest = store.getAll();
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result || []);
      };
    };

    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removeOfflineVote(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('E-Vote-Offline', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineVotes'], 'readwrite');
      const store = transaction.objectStore('offlineVotes');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
    };
  });
}

// Push notifications for election updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New election update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Election',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('E-Vote System', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/user/vote')
    );
  }
}); 