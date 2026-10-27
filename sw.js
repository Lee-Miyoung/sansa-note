// 산사노트 서비스워커
// index.html은 온라인일 때 항상 최신 버전을 먼저 가져오고,
// 오프라인일 때만 캐시를 사용합니다.

const CACHE_VERSION = 'sansanote-v25-oracle-match-20261027';

// 첫 방문에는 작은 앱 셸만 준비합니다. 사진·음악·영상은 사용 시 아래 fetch
// 핸들러가 캐시하므로 불필요한 다운로드가 첫 화면과 회선을 다투지 않습니다.
// ./ 와 ./index.html 은 같은 문서이므로 설치 때 한 번만 받습니다.
const CORE_ASSETS = [
  './scripts/place-identity.js?v=20261027-static',
  './scripts/temple-covers.js?v=20261027-static',
  './scripts/mountain-covers.js?v=20261027-static',
  './scripts/visit-tips.js?v=20261027-static',
  './',
  './scripts/startup-cloud.js?v=20261019-resilient',
  './scripts/navigation.js?v=20261026-ui',
  './scripts/game-viewport.js?v=20261017',
  './scripts/meditation-sounds.js?v=20261018',
  './styles/game-viewport.css?v=20261017',
  './styles/wellness.css?v=20261018-integrated',
  './styles/brand-ui.css?v=20261018-integrated',
  './styles/copy-brand.css?v=20261017',
  './images/brand/wellness/companion-activities-v2.webp',
  './images/brand/wellness/emotion-faces.webp',
  './images/brand/wellness/activity-settings.webp',
  './images/brand/monks/monk-meditation.png',
  './audio/meditation/catalog.json',
  './scripts/wellness-effects.js?v=20261018-integrated',
  './images/brand/wellness/companion-poses.webp',
  './images/brand/wellness/props/card-moktak.webp',
  './copy/index.html',
  './copy/style.css'
];


// 네트워크에서 항상 최신 파일 요청
function freshFetch(request) {
  return fetch(request, {
    cache: 'no-store'
  });
}


// index.html 또는 페이지 이동 요청인지 확인
function isAppShellRequest(request) {
  if (request.mode === 'navigate') {
    return true;
  }

  const url = new URL(request.url);

  return (
    url.pathname.endsWith('/index.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  );
}


// 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)

      .then(cache => {
        return Promise.all(
          CORE_ASSETS.map(url =>
            freshFetch(url)

              .then(response => {
                if (
                  response &&
                  response.status === 200
                ) {
                  return cache.put(
                    url,
                    response
                  );
                }
              })

              .catch(err => {
                console.warn(
                  '캐싱 실패(무시하고 계속):',
                  url,
                  err
                );
              })
          )
        );
      })

      .then(() => {
        return self.skipWaiting();
      })
  );
});


// 활성화
// 예전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()

      .then(keys => {
        return Promise.all(
          keys

            .filter(
              key =>
                key.startsWith('sansanote-') && key !== CACHE_VERSION
            )

            .map(
              key =>
                caches.delete(key)
            )
        );
      })

      .then(() => {
        return self.clients.claim();
      })
  );
});


// 네트워크 요청 처리
self.addEventListener('fetch', event => {
  if (
    event.request.method !== 'GET'
  ) {
    return;
  }


  // Episode metadata is tiny and must reflect new releases immediately.
  // It contains no progress, story content, or account data.
  if(['/scripts/atlas/episodes.json','/scripts/atlas/seasons.json'].includes(new URL(event.request.url).pathname)){
    event.respondWith(fetch(event.request, {cache:'no-store'}));
    return;
  }

  /*
   * index.html / 페이지 이동
   *
   * 네트워크 우선
   *
   * 새 버전이 있으면 즉시 가져오고,
   * 인터넷이 끊기거나 페이지 응답이 오래 걸리면 저장된 페이지 사용
   */
  if (
    isAppShellRequest(
      event.request
    )
  ) {
    // A flaky mobile connection can stay pending without rejecting. Keep the
    // network-first policy, but let a previously saved page open after 2 seconds.
    const cachedPage = caches.match(event.request).then(cached =>
      cached || caches.match('./index.html').then(index => index || caches.match('./'))
    ).catch(()=>undefined);
    const networkPage = freshFetch(event.request);
    // Clone immediately, then cache in the background. Never wait for the whole
    // HTML body to be stored before allowing the browser to display its stream.
    event.waitUntil(networkPage.then(response => {
      if(response && response.status === 200){
        const clone = response.clone();
        return caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
      }
    }).catch(()=>{}));
    event.respondWith((async () => {
      const cached = await cachedPage;
      if(!cached) return networkPage;
      let timer;
      try{
        return await Promise.race([
          networkPage.catch(()=>cached),
          new Promise(resolve => { timer = setTimeout(()=>resolve(cached), 2000); })
        ]);
      }finally{ clearTimeout(timer); }
    })());

    return;
  }


  /*
   * 이미지 / 음악 / 영상 등 정적 파일
   *
   * 캐시 우선
   * +
   * 백그라운드에서 최신 파일 갱신
   */
  event.respondWith(
    caches
      .match(
        event.request
      )

      .then(cached => {
        const networkFetch =
          fetch(
            event.request
          )

            .then(response => {
              if (
                response &&
                response.status === 200
              ) {
                const clone =
                  response.clone();

                caches
                  .open(
                    CACHE_VERSION
                  )

                  .then(cache => {
                    return cache.put(
                      event.request,
                      clone
                    );
                  })

                  .catch(() => {});
              }

              return response;
            })

            .catch(() => {
              return cached;
            });


        return (
          cached ||
          networkFetch
        );
      })
  );
});
