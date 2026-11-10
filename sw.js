const CACHE = "mitfahr-v17";
const ASSETS = [
  "/mitfahrboerse/",
  "/mitfahrboerse/index.html",
  "/mitfahrboerse/manifest.json"
];

try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
  firebase.initializeApp({
    apiKey: "AIzaSyDQ1dvk4CNCd6oRecFKJ3U3deToiZLIcv8",
    authDomain: "mitfahrb.firebaseapp.com",
    projectId: "mitfahrb",
    storageBucket: "mitfahrb.firebasestorage.app",
    messagingSenderId: "955235206407",
    appId: "1:955235206407:web:b6c6705c7f75dde538f1a2"
  });
  const messaging = firebase.messaging();
  // Push bei geschlossener/im Hintergrund liegender App (Data-Nachrichten)
  messaging.onBackgroundMessage(p => {
    const d = p.data || {};
    return self.registration.showNotification(d.title || "MitfahrApp", {
      body: d.body || "",
      icon: "/mitfahrboerse/icon-192.png",
      badge: "/mitfahrboerse/icon-192.png",
      tag: d.tag || "mitfahr",
      data: { url: d.url || "/mitfahrboerse/", open: d.open || "" }
    });
  });
} catch (err) { /* offline: Push-Teil überspringen, App-Cache funktioniert weiter */ }

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = e.notification.data || {};
  const url = d.url || "/mitfahrboerse/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes("/mitfahrboerse/") && "focus" in c) {
          c.postMessage({ type: "open", open: d.open || "" });
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first: Updates erscheinen sofort, Cache nur als Offline-Fallback
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
