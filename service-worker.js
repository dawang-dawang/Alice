/* 一瓶生活记录 · Service Worker（本地缓存，加速打开）
   策略：
   - index.html（入口）网络优先、失败回退缓存 → 永远拿到最新页面（新版本号资源随之更新）
   - 其余同源静态资源缓存优先、miss 时下载并缓存 → 日常打开秒开
   版本号：改 app.js/styles.css 等资源时，把 CACHE 名 bump 一次即可（旧缓存自动清理）
*/
const CACHE = "lifewb-20260818dj";
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css?v=20260818dj",
  "./app.js?v=20260818dj",
  "./vue.global.prod.js",
  "./lunar.js",
  "./plantlib.js",
  "./manifest.webmanifest?v=20260811cw",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("lifewb-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isHtml = !/\.[a-z0-9]+(\?|$)/i.test(url.pathname);
  if (isHtml) {
    // 页面：网络优先，离线时回退缓存
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cl = r.clone();
          caches.open(CACHE).then((c) => c.put(req, cl));
          return r;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }
  // 资源：缓存优先
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((r) => {
        if (r && r.ok) {
          const cl = r.clone();
          caches.open(CACHE).then((c) => c.put(req, cl));
        }
        return r;
      });
    })
  );
});
