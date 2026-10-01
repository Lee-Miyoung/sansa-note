// 산사노트 서비스워커
// index.html은 온라인일 때 항상 최신 버전을 먼저 가져오고,
// 오프라인일 때만 캐시를 사용합니다.

const CACHE_VERSION = 'sansanote-v4';

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
                key !== CACHE_VERSION
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


  /*
   * index.html / 페이지 이동
   *
   * 네트워크 우선
   *
   * 새 버전이 있으면 즉시 가져오고,
   * 인터넷이 끊긴 경우에만 캐시 사용
   */
  if (
    isAppShellRequest(
      event.request
    )
  ) {
    event.respondWith(
      freshFetch(
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
              .open(CACHE_VERSION)

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

        .catch(async () => {
          return (
            await caches.match(
              event.request
            ) ||

            await caches.match(
              './index.html'
            ) ||

            await caches.match(
              './'
            )
          );
        })
    );

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
