﻿/* 一瓶生活记录 · Service Worker（本地缓存，加速打开）
   策略：
   - index.html（入口）网络优先、失败回退缓存 → 永远拿到最新页面（新版本号资源随之更新）
   - 其余同源静态资源缓存优先、miss 时下载并缓存 → 日常打开秒开
   版本号：改 app.js/styles.css 等资源时，把 CACHE 名 bump 一次即可（旧缓存自动清理）
*/
const CACHE = "lifewb-20260917el";
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css?v=20260917el",
  "./app.js?v=20260917el",
  "./foods_base.js?v=20260917el",
  "./vue.global.prod.js",
  "./lunar.js",
  "./plantlib.js",
  "./manifest.webmanifest?v=20260811cw",
  "./icons/工作平台.svg?v=20260917el",
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

/* 页面导航请求：网络优先。单独处理，避免把 HTML 当普通资源缓存优先（否则永远拿不到新版） */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== location.origin) return;

  /* 导航请求：优先按 request.mode 判断，退化到扩展名判断（兼容各浏览器） */
  const isNavigate = req.mode === "navigate" || !/\.[a-z0-9]+(\?|$)/i.test(url.pathname);
  if (isNavigate) {
    e.respondWith(
      fetch(req, { cache: "no-store" })
        .then((r) => {
          if (r && r.ok) {
            const cl = r.clone();
            /* 用 waitUntil 保住缓存写入，防止 SW 被回收导致 put 中断 */
            e.waitUntil(caches.open(CACHE).then((c) => c.put(req, cl)).catch(() => {}));
          }
          return r;
        })
        .catch(() =>
          caches.match(req)
            .then((m) => m || caches.match("./index.html"))
            .then((m) => m || new Response("离线且无缓存", { status: 503, headers: { "Content-Type": "text/plain;charset=utf-8" } }))
        )
    );
    return;
  }

  // 其余静态资源：缓存优先
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((r) => {
        if (r && r.ok) {
          const cl = r.clone();
          e.waitUntil(caches.open(CACHE).then((c) => c.put(req, cl)).catch(() => {}));
        }
        return r;
      });
    })
  );
});
