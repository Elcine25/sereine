// Service worker de Sereine (version web installable).
//
// - Pages : le réseau d'abord, pour toujours avoir la dernière version en ligne ;
//   sans connexion, on sert la dernière page gardée en cache.
// - Fichiers du build (/_expo/static, /assets) : leur nom change à chaque version,
//   on peut donc les garder en cache sans risque.
// - Le reste (icônes, manifeste…) : le cache tout de suite, mis à jour en arrière-plan.
//
// Change VERSION pour forcer le nettoyage des anciens caches.
const VERSION = 'sereine-v2';
const A_PRECHARGER = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// Garde une copie de la réponse si elle est valide (jamais une page d'erreur).
function garder(cle, reponse) {
  if (reponse.ok) {
    const copie = reponse.clone();
    caches.open(VERSION).then((cache) => cache.put(cle, copie));
  }
  return reponse;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(A_PRECHARGER)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== VERSION).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;
  // Serveur de développement (bundles Metro) : jamais de cache.
  if (url.pathname.endsWith('.bundle') || url.pathname.startsWith('/node_modules/')) return;
  // Statistiques Vercel : jamais de cache, pour toujours avoir le script à jour.
  if (url.pathname.startsWith('/_vercel/')) return;

  // Navigation (ouvrir l'app, changer de page) : réseau d'abord.
  // L'app n'a qu'une page HTML : hors connexion, toutes les adresses servent « / ».
  if (requete.mode === 'navigate') {
    event.respondWith(
      fetch(requete)
        .then((reponse) => garder('/', reponse))
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Fichiers du build, nommés avec une empreinte : cache d'abord.
  if (url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(requete).then((enCache) => enCache || fetch(requete).then((reponse) => garder(requete, reponse))),
    );
    return;
  }

  // Le reste : cache tout de suite, mise à jour en arrière-plan.
  event.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => garder(requete, reponse))
        .catch(() => enCache);
      return enCache || reseau;
    }),
  );
});
