/* 離線支援：網站檔案先上網抓最新的，沒網路時用存下來的版本 */
const CACHE = 'vocab-studio-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === self.location.origin;
  const sdk = u.hostname === 'www.gstatic.com' && u.pathname.includes('/firebasejs/');
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!same && !sdk && !font) return;  // 資料庫、AI 等連線不經過快取
  const cacheFirst = sdk || font || /\.png$/.test(u.pathname) || (u.pathname.includes('/data/') && u.search.includes('v='));
  if (cacheFirst){
    e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }));
    return;
  }
  e.respondWith(fetch(r).then(res => { if (res.ok){ const cl = res.clone(); caches.open(CACHE).then(c => c.put(r, cl)); } return res; })
    .catch(() => caches.match(r, {ignoreSearch: true}).then(hit => hit || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
