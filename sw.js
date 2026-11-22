/* Mihrap service worker: makes the site installable (Add to Home screen) and keeps the
 * screensaver running when the connection drops.
 * - The page, its code and data are fetched fresh first (so updates arrive at once) and the
 *   last good copy is used offline.
 * - Slides, fonts, home photos and icons are kept once loaded (cache first).
 * - Audio is left to the browser: cached responses can break seeking/range requests.
 * - Other sites (prayer-time APIs, adhan photos) are not touched.
 */
var CACHE = "mihrap-v1";

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(["./", "./index.html"]).catch(function () { });
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("mihrap-") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function cacheFirst(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response && response.ok && response.status === 200) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function networkFirst(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      if (response && response.ok && response.status === 200) cache.put(request, response.clone());
      return response;
    }).catch(function () {
      return cache.match(request, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (request.mode !== "navigate") return Response.error();
        return cache.match("./index.html").then(function (page) { return page || Response.error(); });
      });
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;            // APIs and adhan photos: untouched
  if (url.pathname.indexOf("/audio/") >= 0) return;           // audio: browser handles ranges
  if (request.headers.get("range")) return;
  if (/\/(slides|fonts|home|icons)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));                   // page, js, css, data
});
