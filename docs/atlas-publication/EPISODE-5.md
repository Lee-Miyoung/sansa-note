# Season 01 / Episode 005 — 양양 낙산사

대상: 강원특별자치도 양양 낙산사. 회차 ID `naksansa-005`, 주소 `/atlas/naksansa/`, 제목 **바다 위 붉은 연꽃의 비밀**. 기준 main: `99b7b26bdf83df813622ac090e66a133564a2e05`.

## 변경 파일

`atlas/naksansa/`, `scripts/atlas/episodes.json`, `scripts/atlas/seasons.json`, `scripts/atlas/home-carousel.js`, `styles/atlas-home.css`, `index.html`, `atlas/bootstrap.js`, `atlas/renderer.js`, `atlas/site.css`, `atlas/index.html`, `atlas/bulguksa/index.html`, `atlas/tongdosa/index.html`, `atlas/songgwangsa/index.html`, `sw.js`, `tests/atlas-episodes.cjs`, `tests/atlas-home-catalog.cjs`, `tests/atlas-reader-resources.cjs`, `tests/mobile-navigation-worker.cjs`, `tests/atlas-season.cjs`, `tests/naksansa-mobile.cjs` 및 이 검증 문서/성능 측정 JSON.

## 구현과 데이터 보존

- 기존 공통 bootstrap / renderer / store를 재사용한 12장면·6문제·3카드. 전체화면 및 고정 이전·다음·닫기 버튼도 기존 기능을 재사용한다.
- 1~4화 content.js, 이미지, 저장 ID와 `atlas/store.js`는 변경하지 않았다. 새 회차도 `sansaSecretAtlas_v1:<owner>:naksansa-005`, `users/<uid>/secretAtlas/naksansa-005`에만 기록한다.
- Firebase 운영 데이터·규칙·설정, 순례·지도·GPS·사진·108 수호카드 코드를 변경하지 않았다. 테스트의 계정/진행 기록 쓰기는 로컬 mock만 사용했으며 운영 계정이나 운영 사용자 데이터에 접근하지 않았다. 게스트/로그인 기록 자동 병합을 도입하지 않았다.
- 홈페이지 공개 정책은 기존 `shared/secretAtlasPublication/haeinsa-001`의 전역 공개 설정 그대로다. 새 회차별 공개 설정이나 접근제어를 임의로 만들지 않았다. 홈을 숨겨도 독립 페이지 주소는 공개될 수 있다.

## 시즌과 홈페이지

- 기존 배열 `scripts/atlas/episodes.json`을 유지하고 각 회차에 `season: "01"`을 추가했다. 시즌 제목의 원본은 `scripts/atlas/seasons.json` 한 곳이다. 시즌 2는 이 파일과 회차의 연결값으로 확장할 수 있다. 기존 클라이언트의 배열 파싱과 주소를 유지한다.
- 시즌 요청은 홈 카드/회차 시작/로그인을 막지 않는다. 홈 대표 영역, 모든 회차 시작 화면과 이야기 소개·진행 표시만 시즌을 표기한다. 각 본문 장면에는 반복하지 않는다.
- `#homeAtlasEntry`를 기존 메인 소개 그리드 바로 아래로 이동했다. 기존 전역 메뉴/로그인/순례 버튼과 검색 기능을 유지하고 대표 영역에 기존 검색 동작으로 가는 버튼을 제공한다.
- 크림/세이지 배경, 큰 제목과 대표 그림, 모바일 1장·태블릿 2장·PC 3장 카드. 터치·키보드·화살표·페이지 표시를 유지한다. 대표 그림은 첫 회차의 기존 작은 썸네일 URL을 재사용해 추가 대형 이미지 요청이 없다.
- 홈에는 메타데이터와 작은 썸네일만 연결한다. 새 회차 본문·퀴즈·카드·장면 이미지를 홈에서 요청하지 않는다. 12개 회차를 넣은 확장 검사에서도 초기 이미지 URL은 모바일/태블릿 2개, PC 3개로 제한된다.
- 루트 서비스 워커는 두 메타데이터 파일을 network/no-store로 처리하고 버전을 올렸다. 기존 저장 데이터는 지우지 않는다. `/atlas/`의 별도 transport 및 Firebase 대기와 분리된 읽기 시작 방식을 유지한다.

## 역사 검토

장면별 원문 링크와 설명은 `content.js`의 sources 및 독자용 ‘역사 자료 보기’에 있다. 글은 원문을 복사하지 않고 새로 썼다.

| 주제 | 대조한 자료 | 반영 |
| --- | --- | --- |
| 의상 창건·낙산 이름·관음 신앙 | [낙산사](https://encykorea.aks.ac.kr/Article/E0011589) | 항목별 창건 연도 차이가 있어 특정 연도 대신 신라 시대 창건 전승으로 표현 |
| 푸른 새·붉은 연꽃·관음굴 | [낙산 홍련암](https://encykorea.aks.ac.kr/Article/E0064043) | 의상과 연결된 전승임을 4·5장면 및 자료에서 명시. 별도의 고려 유자량 파랑새 이야기와 섞지 않음 |
| 육각 정자·1925년 조성 | [의상대](https://encykorea.aks.ac.kr/Article/E0043252), [국가유산포털](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=2113200480000) | 신라 때 정자가 그대로 남았다고 설명하지 않음. 두 공개 설명에는 후대 수리의 상세 연혁이 없어 현존 목재가 모두 1925년 것이라고 단정하지 않음 |
| 원통보전 관음보살 봉안 | [양양 낙산사 건칠 관음보살 좌상](https://encykorea.aks.ac.kr/Article/E0067091) | 원통보전의 기능만 대조. 이 항목의 산불 이전 동종 현존 표현을 현재 사실로 사용하지 않음 |
| 산불·발굴·재건 | [양양 낙산사 일원](https://encykorea.aks.ac.kr/Article/E0070978), 낙산사 항목 | 2005-04-05 산불, 조사 뒤 2007·2009년 여러 전각 재건. 모든 건물이 소실되었다거나 신라 목재가 모두 남았다고 일반화하지 않음 |
| 동종 소실 | [양양 낙산사 동종](https://encykorea.aks.ac.kr/Article/E0011592) | 2005년 산불에 녹아 소실된 사실 |

의상과 무념스님의 표정·동작, 방문객의 사연과 대사는 이해를 돕는 창작이다. 역사 인물의 실제 발언이나 특정 날의 현장 기록으로 제시하지 않는다.

## 그림

표지 1 + 본문 12 + 카드 3 = 독립 수채화 16점, 각 작은/큰 WebP 총 32개. 그림 파일과 실제 크기·SHA-256은 `/atlas/naksansa/images/manifest.json`에 기록한다. 생성 원본 PNG는 사이트에 넣지 않는다. WebP 총량은 4,950,530B이고 휴대폰 장면별 파일은 36,000~52,502B이다.

실제 사진과 비교해 홍련암의 청기와·좁은 정면·절벽과 축대, 의상대 육각 구조, 원통보전의 기둥/문/지붕을 검수했다. 원통보전을 해안 암자로 그린 구도와 신라 전승에 현대 정자가 등장한 초안은 교체했다. 일러스트는 건축 실측 복원도가 아니다. 참고 사진은 배포하거나 hotlink하지 않는다. 출처/저작자/이용 조건/변경 사항은 독자용 `/atlas/naksansa/CREDITS.html`에 기록했다. 새 그림은 CC BY-SA 4.0으로 제공한다.

휴대폰(650px 이하)에는 480px WebP를 사용한다. 초기에는 현재 장면만 요청하고 읽지 않은 11장면을 미리 받지 않는다. 네트워크 실패 시 기존의 제한된 재시도와 수동 재시도 기능을 유지한다.

## 성능 측정

`episode-5-performance.json`: 390×844 Chromium, CPU 4배 제한, SDK 응답 2초 지연/빈 응답, 외부 폰트 차단, 로컬 파일, 서비스 워커 제외. 이전 main과 변경판을 번갈아 각 3회 측정했다. 실제 기기·통신망·운영 Firebase/CWV 수치가 아니다.

- FCP 중앙값: 기존 492ms → 변경 456ms. DOMContentLoaded 중앙값: 764ms → 764ms. 작은 표본의 변동 범위이므로 성능 향상을 단정하지 않는다.
- 초기 카드 썸네일 URL: 2 → 2. 홈에서 5화 경로 요청: 0. 같은 조건에서 전송한 총 바이트 증가: 5,224B.
- 기존 홈의 큰 index.html과 다른 콘텐츠 다운로드는 남아 있다. 이번 작업에서 전체 홈페이지를 다시 쓰거나 기존 콘텐츠를 삭제하지 않았다.
- 120회 장면 교체 뒤 화면에 reader/image 각 1개 유지. Galaxy Chromium DOM 노드는 GC 후 197 → 209, 이벤트 리스너 51 → 51. 메모리 사용량 전체를 측정한 값은 아니다.

## 자동 검증

실제 기기는 사용하지 않았다. PC Chromium, iPhone Safari 계열 WebKit(390px, DPR3), iPad WebKit(820px, DPR2), Galaxy Chrome 계열 Chromium(412px, DPR2.625) 에뮬레이션을 사용했다. 좁은 320px부터 1440px까지 기존 회차도 확인한다.

명령 공통: `NODE_PATH=/workspace/.sansa-tools/node_modules`.

- `node tests/atlas-episodes.cjs`: 1~5화 각 12장면/6정답/3카드, 장면 슬라이더, 메모/새로고침, 회차별 저장, 뒤로/닫기, 터치·키보드 캐러셀 및 모의 A/B 계정 기록 보호. 여러 카드가 보이는 새 디자인에 맞춰 이동 거리를 카드 간격으로 검증하고, 관성 스크롤 정착 뒤 이전 버튼을 검사한다.
- `node tests/naksansa-mobile.cjs`: WebKit 390/820 전체 읽기·퀴즈·이미지 디코딩, 네 기존 회차의 실제 형식 카드/위치/메모 복원, A/B/게스트 분리, 잘못된 회차 원고 거부.
- `node tests/atlas-reading-controls.cjs`: 4종 환경에서 모든 회차의 고정 조작부, 전체화면 대체 UI, 카드 건너뛰기 방지, 닫기 및 pageerror 없음.
- `ATLAS_EPISODE_PATH=/atlas/naksansa/ node tests/atlas-reader-resources.cjs`: 미방문 장면 preload 없음, 작은 retina 이미지, DOM 유지, 실제 Chromium fullscreen 및 빠른 토글 경합.
- `node tests/atlas-season.cjs`: 1~5화 시즌 표기, 소개의 진행 상태, 본문 미반복.
- `node tests/atlas-home-catalog.cjs` 및 `SANSA_BROWSER=webkit ...`: 5/12개 목록, 390/820/1440, 반응형 페이지 이동, 제한된 썸네일, 본문 preload 없음, 메타데이터 실패/시즌 요청 정지에도 읽기 가능.
- `node tests/atlas-offline-startup.cjs`: Firebase SDK가 계속 대기해도 모든 회차 읽기 시작 및 홈 HTML 불러오지 않음.
- `ATLAS_EPISODE_PATH=/atlas/naksansa/ node tests/tongdosa-transport.cjs`: 실제 root→atlas worker 전환, 오래된 runtime cache 우회, 기존 진행 기록 유지.
- `node tests/mobile-navigation-worker.cjs`: HTML streaming/캐시 fallback, 검색 결과에서 정지 응답 시 진입, 갱신·오프라인 재방문, 두 메타데이터 최신값.
- `node tests/atlas-publication-ui.cjs`: 기존 관리자 전역 공개 설정 및 저장 확인·오프라인 동작.
- `node tests/home-photo-regression.cjs`, `node tests/navigation-history.cjs`, `node tests/mobile-startup-resilience.cjs`: 기존 사진/방문 기록·절/산 검색·명상/호흡/마이페이지 이동·저장 초안·Firebase 지연에도 홈 조작 보존.

위 자동 검증은 모두 통과했다. 원시 결과는 `episode-5-validation.txt`에 보존한다. 배포는 기존 GitHub Pages main 자동 배포를 사용하며, 완료 뒤 공개 파일 55개의 바이트와 TLS 검증한 실제 배포 파일을 WebKit에서 다시 확인한다. 실제 배포 결과/Actions 링크는 작업 최종 보고에 제공한다.
