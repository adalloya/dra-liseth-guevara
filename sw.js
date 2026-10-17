// Service Worker para CRD OrthoAI Suite (PWA Standalone & Offline Support)
const CACHE_NAME = "crd-ortho-v1.1";
const STATIC_ASSETS = [
  "./",
  "./ortho-labs.html",
  "./index.html",
  "./manifest.json",
  "./ortho-hub-manifest.json",
  "./ortho-hub-logo.png",
  "./ortho-hub-icon-192.png",
  "./ortho-hub-icon-512.png",
  "./ortho-hub-apple-icon.png",
  "./ortho-hub-thumbnail.png"
];

// Instalación: Precarga de recursos clave
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de versiones obsoletas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First con Fallback a Cache (óptimo para webapps clínicas)
self.addEventListener("fetch", (event) => {
  // Ignorar peticiones que no sean GET o externas de APIs / Supabase / Google
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // No interceptar llamadas a API de Google Calendar, Gemini o Supabase
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("generativelanguage.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Si es navegación a página HTML y no hay red, servir ortho-labs.html
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("./ortho-labs.html");
          }
        });
      })
  );
});
