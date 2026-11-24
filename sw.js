/* Mihrap service worker: makes the site installable (Add to Home screen) and keeps the
 * screensaver running when the connection drops.
 * - The page, its code and data are fetched fresh first (so updates arrive at once) and the
 *   last good copy is used offline.
 * - Slides, fonts, home photos and icons are kept once loaded (cache first).
 * - Audio: the page stores the chosen adhan set, dua, reminder and tesbihat recordings in
 *   AUDIO; they are served from there (byte ranges answered by slicing) so the adhan plays
 *   offline. Recordings not stored yet come from the network as before. On Apple WebKit
 *   (iPhone, iPad, Mac Safari) audio is left to the browser: serving it from here stops playback.
 * - Other sites (prayer-time APIs, adhan photos) are not touched.
 */
var CACHE = "mihrap-v1";
var AUDIO = "mihrap-audio-v1";
var UA = self.navigator ? self.navigator.userAgent : "";
var APPLE_WEBKIT = /iPhone|iPad|iPod/.test(UA) ||
  (/Macintosh/.test(UA) && /Safari/.test(UA) && !/Chrome|Chromium|Edg|Firefox/.test(UA));

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(["./", "./index.html"]).catch(function () { });
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("mihrap-") === 0 && k !== CACHE && k !== AUDIO; })
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
  if (url.pathname.indexOf("/audio/") >= 0) {
    if (APPLE_WEBKIT) return;                                 // Safari streams audio itself (see app.js)
    event.respondWith(audioResponse(request));
    return;
  }
  if (request.headers.get("range")) return;
  if (/\/(slides|fonts|home|icons)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));                   // page, js, css, data
});

// A stored recording, whole or the byte range the media element asks for; otherwise the network.
function audioResponse(request) {
  var key = request.url.split("#")[0];
  return caches.open(AUDIO).then(function (cache) {
    return cache.match(key).then(function (hit) {
      if (!hit) return fetch(request);
      var range = request.headers.get("range");
      if (!range) return hit;
      return hit.blob().then(function (blob) {
        var m = /bytes=(\d*)-(\d*)/.exec(range);
        var size = blob.size;
        var start = m && m[1] ? parseInt(m[1], 10) : 0;
        var end = m && m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
        if (m && !m[1] && m[2]) { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; }
        if (start >= size) {
          return new Response("", { status: 416, headers: { "Content-Range": "bytes */" + size } });
        }
        return new Response(blob.slice(start, end + 1), {
          status: 206,
          statusText: "Partial Content",
          headers: {
            "Content-Type": hit.headers.get("Content-Type") || "audio/mpeg",
            "Content-Range": "bytes " + start + "-" + end + "/" + size,
            "Content-Length": String(end - start + 1),
            "Accept-Ranges": "bytes"
          }
        });
      });
    });
  }).catch(function () { return fetch(request); });
}
