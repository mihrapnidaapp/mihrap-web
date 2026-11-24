/* /sw.js — retires the old root service worker. The Mihrap web app now lives in /mihrap/
 * (with its own worker, /mihrap/sw.js, and its own cache names). Keep this file: if it were
 * removed, browsers would keep running the old cached worker.
 * Only the old app's caches are deleted, never the new /mihrap/ ones.
 */
var OLD_CACHES = ["mihrap-v1", "mihrap-audio-v1"];

self.addEventListener("install", function () { self.skipWaiting(); });

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all(OLD_CACHES.map(function (name) { return caches["delete"](name); }))
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: "window" }); })
      .then(function (clients) { clients.forEach(function (c) { c.navigate(c.url); }); })
  );
});
