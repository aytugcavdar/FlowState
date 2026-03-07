// ============================================================
// Service Worker — Çevrimdışı destek
// Cache-first strateji ile statik varlıkları önbelleğe alır.
// ============================================================

const CACHE_NAME = 'flowstate-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Install — Statik varlıkları önbelleğe al ──────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Yeni SW'ı hemen aktive et
  self.skipWaiting();
});

// ─── Activate — Eski cache'leri temizle ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Tüm sekmeleri kontrol et
  self.clients.claim();
});

// ─── Fetch — Cache-first, network fallback ──────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API çağrıları için network-first
  if (request.url.includes('/functions/') || request.url.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Başarılı yanıtları önbelleğe al
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML sayfaları için Network-First (Her zaman en güncel sürümü almalı)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Statik varlıklar (JS, CSS, Resimler) için cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Sadece başarılı GET yanıtlarını önbelleğe al
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
