// Service Worker de la PWA: precache del app shell y navegación SPA sin interceptar llamadas de API
declare const self: {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  location: { origin: string };
  clients: { claim: () => Promise<void> };
  skipWaiting: () => Promise<void>;
  addEventListener: (tipo: string, fn: (evento: any) => void) => void;
};

const NOMBRE_CACHE = 'mantenimiento-app-shell-v1';

// Recursos estáticos inyectados en tiempo de compilación por vite-plugin-pwa (requiere self.__WB_MANIFEST)
const manifiesto = self.__WB_MANIFEST || [];
const urlsParaPrecaching = manifiesto.map((entrada: { url: string } | string) =>
  typeof entrada === 'string' ? entrada : entrada.url,
);

self.addEventListener('install', (evento: any) => {
  evento.waitUntil(
    caches
      .open(NOMBRE_CACHE)
      .then((cache) => cache.addAll(urlsParaPrecaching))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento: any) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.map((clave) => {
            if (clave !== NOMBRE_CACHE) {
              return caches.delete(clave);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento: any) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  // NUNCA interceptar llamadas a la API ni peticiones que no sean GET
  if (peticion.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  // Solo gestionar peticiones del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navegación SPA: servir index.html precacheado si no hay red
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion).catch(async () => {
        const respuestaIndex = await caches.match('/index.html');
        if (respuestaIndex) return respuestaIndex;
        const coincidencia = await caches.match('/');
        return coincidencia || Response.error();
      }),
    );
    return;
  }

  // Recursos estáticos del app shell: responder desde caché primero, luego red
  evento.respondWith(
    caches.match(peticion).then((respuestaEnCache) => {
      if (respuestaEnCache) {
        return respuestaEnCache;
      }
      return fetch(peticion);
    }),
  );
});

export {};
