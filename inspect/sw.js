/* =====================================================================
   GrúaXpert · App del inspector · service worker
   La versión la pone build.py con la huella de index.html: cada cambio
   de la app instala una caché nueva sola. No hay número que recordar.
   ===================================================================== */
const CACHE = "gx-inspector-e3c58aac4e";
const BASE = [
  "./", "./manifest.webmanifest",
  "/assets/fonts/pjs-400.woff2", "/assets/fonts/pjs-600.woff2", "/assets/fonts/pjs-700.woff2", "/assets/fonts/pjs-800.woff2", "/assets/fonts/bricolage.woff2",
  "/assets/img/logo-240.webp", "/assets/img/logo-blanco-480.webp", "/assets/img/icono-192.png", "/assets/img/icono-512.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith("gx-inspector-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Sólo lo propio y sólo GET: lo del servidor (sesión, comandos, fotos)
  // nunca sale de la caché.
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // La página: primero la red (para tomar la versión nueva), y si no hay
  // señal, la del teléfono.
  // Sólo se guarda una respuesta buena y directa (ni errores ni
  // redirecciones: el servidor manda /inspect/index.html a /inspect/).
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok && !r.redirected && r.type === "basic") { const c = r.clone(); caches.open(CACHE).then((x) => x.put("./", c)); }
      return r;
    }).catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
