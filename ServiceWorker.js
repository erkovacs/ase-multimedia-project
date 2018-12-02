const sw = {};
sw.assets = [
  "./2_1078_KOVACS_Erik.html",
  "./media/images/icons/icon-72x72.png",
  "./lib/css/bootstrap.min.css",
  "./2_1078_KOVACS_Erik.css",
  "./lib/font-awesome-4.7.0/css/font-awesome.min.css",
  "./lib/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0",
  "./lib/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf?v=4.7.0 ",
  "./2_1078_KOVACS_Erik.js"
];

sw.cacheFirst = async req => {
  const cachedResponse = await caches.match(req);
  return cachedResponse || fetch(req);
};

sw.networkFirst = async req => {
  const cache = await caches.open("appNetworkCache");
  try {
    const res = await fetch(req);
    cache.put(req, res);
    return res;
  } catch (e) {
    return cache.match(req);
  }
};

sw.cacheVideos = async cache => {
  const metadataJSON = await fetch("./media/metadata/metadata.json");
  const metadata = await metadataJSON.json();
  metadata.videos.forEach(video => {
    cache.addAll([video.src, video.thumbnail]);
  });
};

self.addEventListener("install", async event => {
  const cache = await caches.open("appAssetsCache");
  cache.addAll(sw.assets);
  sw.cacheVideos(cache);
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    event.respondWith(sw.cacheFirst(req));
  } else {
    event.respondWith(sw.networkFirst(req));
  }
});
