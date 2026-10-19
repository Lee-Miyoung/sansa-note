# 홈 회차 목록과 독립 에피소드

`episodes.json`은 홈에 필요한 `id`, `number`, `temple`, `title`, `href`, `thumbnail` 6개 필드만 담습니다. 본문·퀴즈·카드·계정 기록은 넣지 않습니다. 제목·링크는 DOM의 textContent/href로 만들며 원고 HTML을 홈에 주입하지 않습니다. 최초에는 인접 썸네일만 로드합니다.

4화 이후 추가 순서:

1. `/atlas/<slug>/`에 독립 `index.html`, `content.js`, `images/`, 그림 설명을 만듭니다. 기존 1화 `/atlas/`와 2화 `/atlas/bulguksa/`를 이동하지 않습니다.
2. `content.js`의 `id`는 `<slug>-004`, `episodeNo`는 `004`처럼 고정합니다. 저장 ID는 발행 후 바꾸지 않습니다. 본문은 12장면, 퀴즈 6문제, 카드 3장입니다. `templeName`, `artBase`, `cover`도 지정합니다. 기본 그림 형식은 WebP이며 `artFormat: 'svg'`를 쓰면 표지 이외 그림은 SVG를 사용합니다.
3. 독립 페이지는 로컬 `content.js`, `/atlas/auth-loader.js`, `/atlas/bootstrap.js`를 읽습니다. 읽기 동작은 Firebase 연결을 기다리지 않습니다. 공통 설정은 `/atlas/firebase-config.json`이며 홈의 공개 설정과 동기화되어야 합니다. 비밀 값은 넣지 않습니다.
4. `episodes.json`에 한 행만 추가합니다. 홈 index.html에 회차별 마크업, 본문, 카드 또는 스크립트를 추가하지 않습니다. 현재 슬라이드 컨테이너/공통 렌더러/공개 설정의 기존 경로도 바꾸지 않습니다. `home-publication.js`의 기존 설정 키는 호환성을 위해 유지합니다.
5. `tests/atlas-episodes.cjs`의 독립 회차 목록에 검사를 등록하고, catalog/offline-startup/해당 회차 검사와 기존 회차 회귀 검사를 실행합니다. 홈에서 해당 회차 본문·카드 파일 요청이 없는지도 검사합니다.

`users/<uid>/secretAtlas/<episode-id>` 및 `sansaSecretAtlas_v1:<owner>:<episode-id>`를 사용하므로 기존 회차/사용자 기록을 이전하거나 초기화할 필요가 없습니다. 모의 검사와 운영 Firebase 저장 검증은 구분합니다. 역사 원문 검증 상태도 기능 통과와 별도로 표시합니다.
