
const cacheKeyMap = {};
const alwaysCache = [];
const loadingKeys = [];
const options = {};

self.addEventListener('install',  event => {
 console.log('installing');
 event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    console.log('activating');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch',  async event => {
  event.respondWith(async function(){
     const cachedKeys = Object.keys(cacheKeyMap).filter(k=>loadingKeys.includes(k));
     const cacheName = cachedKeys.length? [...cachedKeys, ...alwaysCache].find(k=>cacheKeyMap[k].some(m=>m==event.request.url||(m.test&&m.test(event.request.url)))) : null;

     if(options.debug)
     console.log(cacheName,cacheKeyMap,event.request.url);

     return cacheName?(await caches.match(event.request) || await fetch(event.request).then(resp=>{const response = resp.clone(); caches.open(cacheName).then(cache=>cache.put(event.request.url, response));return resp})):await fetch(event.request)

 }())
  });


self.addEventListener('message', async event => {
    console.log('Message event', event.data);
    switch (event.data.operation) {

        case 'OPTIONS':
          Object.keys(event.data.options).forEach(k=>setOptions(Object.assign(event.data.options[k], {operation:k})));

        break;
        default: setOptions(event.data)

    }
});

function setOptions(event){
  switch (event.operation) {
  case 'SET_OPTIONS':
    Object.assign(options,event.options);
  break;
  case 'ADD_ALWAYSCACHE':
    if(event.clearKeys) alwaysCache.length=0;
    event.alwaysCache.forEach(k=>{if(!alwaysCache.includes(k))alwaysCache.push(k)});
  break;
  case 'REMOVE_ALWAYSCACHE':
    alwaysCache = alwaysCache.filter(k=>event.alwaysCache instanceof Array?!event.alwaysCache.includes(k):k!=event.alwaysCache)
  break;
  case 'ADD_CACHEDKEYS':
    const keys = Object.keys(cacheKeyMap);
    Object.entries(event.cachedKeys).forEach(([k,v])=>{
      if(!keys.includes(k))cacheKeyMap[k]=v
    });
  break;
  case 'REMOVE_CACHEDKEYS':
    Object.entries(event.cachedKeys).forEach(([k,v])=>{
    delete cacheKeyMap[k]
    caches.delete(k)})
  break;
  case 'ADD_LOADINGKEYS':
    if(event.clearKeys) loadingKeys.length=0;
    event.loadingKeys.forEach(k=>{if(!loadingKeys.includes(k))loadingKeys.push(k)});
  break;
  case 'REMOVE_LOADINGKEYS':
    loadingKeys = loadingKeys.filter(k=>event.loadingKeys instanceof Array?!event.loadingKeys.includes(k):k!=event.loadingKeys)
``}
}
