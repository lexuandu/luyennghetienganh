const CACHE_NAME = 'kinh-chanh-tinh-tan-smart-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './IPA.txt',
    './subtitle.srt',
    './audio.mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // 1. Với file âm thanh (.mp3): Ưu tiên lấy từ bộ nhớ máy cho nhanh (Cache-First)
    if (url.endsWith('.mp3')) {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
        return;
    }

    // 2. Với file code (index.html) và phụ đề (.srt, .txt): 
    // Có mạng là tải bản mới nhất về và tự cập nhật bộ nhớ (Network-First)
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Khi tắt mạng (Offline), tự động lấy bản đã lưu trong máy ra chạy
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});
