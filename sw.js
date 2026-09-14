// 산사노트 서비스워커 - 오프라인에서도 기본 화면/소리/이미지가 뜨도록 캐싱해요.
// index.html은 앱 로직이 전부 들어있는 핵심 파일이라, 온라인일 때는 항상 서버의
// 최신 버전을 먼저 쓰고, 오프라인일 때만 캐시로 대체하도록 바꿨어요.
// (예전 방식은 캐시가 있으면 무조건 캐시부터 보여줘서, 파일을 새로 올려도
//  사용자 화면에는 계속 옛날 버전이 남아있는 문제가 있었습니다.)
const CACHE_VERSION = 'sansanote-v2';

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

// 네트워크 요청 시 "서버가 새 버전을 갖고 있다"는 걸 확실히 알리기 위해,
// 캐시 무시하고 매번 서버에 직접 물어보게 하는 옵션을 붙여요.
function freshFetch(request){
  return fetch(request, { cache: 'no-store' });
}

// index.html(및 페이지 이동 요청)인지 판별
function isAppShellRequest(request){
  if(request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname.endsWith('/');
}

// 설치: 핵심 파일들을 미리 받아서 저장해둬요.
// 파일 하나라도 없으면 전체가 실패하니, 하나씩 개별적으로 시도해서
// 있는 파일만 캐싱되게 해요 (없는 파일 때문에 전체가 깨지지 않도록).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return Promise.all(
        CORE_ASSETS.map(url =>
          freshFetch(url).then(res=>{
            if(res && res.status===200) return cache.put(url, res);
          }).catch(err => {
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

// 요청 가로채기
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  // index.html(앱 껍데기)은 "네트워크 우선" — 온라인이면 항상 서버의 최신 버전을 먼저 시도하고,
  // 실패했을 때(오프라인 등)만 캐시로 대체해요. 이래야 새로 배포한 수정사항이 바로 보입니다.
  if(isAppShellRequest(event.request)){
    event.respondWith(
      freshFetch(event.request).then(response => {
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(()=> caches.match(event.request))
    );
    return;
  }

  // 그 외 이미지·소리 같은 정적 파일은 기존처럼 "캐시 우선 + 백그라운드 갱신" 유지
  // (자주 안 바뀌는 파일들이라 오프라인 대응이 더 중요해요.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(()=> cached);
      return cached || networkFetch;
    })
  );
});