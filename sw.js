/**
 * pwa/sw.js · 极简 Service Worker
 *
 * 职责:
 *   1. 缓存静态资源(index.html / manifest.json / icons)让 PWA 离线可开
 *   2. 不缓存 MiniMax API 响应(图片大、URL 24h 过期,缓存浪费)
 *   3. 不缓存任何 user data(用户头像存 localStorage,不在 SW 层)
 *
 * 缓存策略:cache-first for static;network-only for everything else
 */

const CACHE_NAME = 'jingkan-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 同源静态 → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((resp) => {
          // 只 cache GET + 200 的同源响应
          if (event.request.method === 'GET' && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // 跨域(MiniMax API)→ network-only,失败让浏览器自己处理
  // (CORS 错误会冒到 fetch 异常里,我们 UI 层 catch 并显示"需要 CORS 代理"提示)
});
