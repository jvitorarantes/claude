// Service worker da Roça Feliz: deixa o jogo abrir mesmo sem internet.
// Sempre tenta a internet primeiro (assim a versão nova chega na hora) e só usa a cópia guardada
// quando está sem conexão. O Firebase e as fontes do Google não passam por aqui.
const CACHE = 'roca-feliz';
const BASICO = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICO)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res.ok) {
        const copia = res.clone();
        // guarda sem o ?t= e o ?atualizar= (que mudam toda hora); o ?v= dos scripts fica
        const chave = url.searchParams.has('t') || url.searchParams.has('atualizar') ? url.origin + url.pathname : req;
        caches.open(CACHE).then(c => c.put(chave, copia)).catch(() => {});
      }
      return res;
    } catch (err) {
      const c = await caches.open(CACHE);
      return (await c.match(req)) || (await c.match(req, { ignoreSearch: true }))
        || (req.mode === 'navigate' ? (await c.match('index.html')) || (await c.match('./')) : undefined)
        || Response.error();
    }
  })());
});
