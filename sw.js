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

// Notificações: o programinha de avisos manda pelo Firebase Cloud Messaging e elas chegam aqui.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { data: { body: e.data && e.data.text() } }; }
  const n = Object.assign({}, d.notification || {}, d.data || {});
  e.waitUntil((async () => {
    // com o jogo aberto na tela, os avisos já aparecem dentro dele
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (abertas.some(c => c.visibilityState === 'visible' && c.focused)) return;
    await self.registration.showNotification(n.title || 'Roça Feliz', {
      body: n.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
      tag: n.tag || 'roca-feliz', renotify: true, data: { link: n.link || './' },
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abertas) if ('focus' in c) return c.focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.link) || './');
  })());
});
