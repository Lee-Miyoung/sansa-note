// 산사노트 서비스워커 - 오프라인에서도 기본 화면/소리/이미지가 뜨도록 캐싱해요.
// 파일을 바꿀 때마다 아래 버전 숫자를 하나씩 올려주세요. 안 올리면 사용자 브라우저에 예전 캐시가 계속 남아있을 수 있어요.
const CACHE_VERSION = 'sansanote-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './hero.jpg',
  './IMG_4423.png',
  './IMG_4425.png',
  './IMG_4438.png',
  './IMG_4439.png',
  './IMG_4440.png',
  './bg-video.mp4',
  './ambient.mp3',
  './moktak-hit.mp3',
  './song1.mp3',
  './song2.mp3',
  './song3.mp3'
];

// 설치: 핵심 파일들을 미리 받아서 저장해둬요.
// 파일 하나라도 없으면 전체가 실패하니, 하나씩 개별적으로 시도해서
// 있는 파일만 캐싱되게 해요 (없는 파일 때문에 전체가 깨지지 않도록).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return Promise.all(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('캐싱 실패(무시하고 계속):', url, err);
          })
        )
      );
    }).then(()=> self.skipWaiting())
  );
});

// 활성화: 예전 버전 캐시는 지워요.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

// 요청 가로채기: 캐시에 있으면 캐시부터 보여주고(오프라인 대응),
// 없으면 네트워크로 가져온 뒤 캐시에도 저장해둬요.
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(()=> cached);
      // 캐시가 있으면 캐시를 먼저 즉시 보여주고, 없으면 네트워크 응답을 기다려요.
      return cached || networkFetch;
    })
  );
});
