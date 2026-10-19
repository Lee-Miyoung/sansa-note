# 아이폰 Chrome 검색 후 진입 멈춤 대응

사용자 증상: PC/iPad는 정상, 아이폰 Chrome에서 Google 검색 결과를 누른 뒤에도 검색 결과 화면에 로딩 표시가 계속 남음. 기준 커밋 `1ca2a3e`.

## 확인한 경로와 수정

- 기존 앱은 `#app`을 숨긴 뒤 DOMContentLoaded/Firebase 인증 콜백을 기다렸다. 외부 폰트 CSS나 defer SDK 응답이 멈추면 초기화가 진행되지 않았고, 인증 콜백과 사용자 프로필 저장에도 무제한 대기가 있었다. 이는 재현한 실패 경로이며, 실제 휴대폰의 모든 네트워크 지연 원인을 입증한 것은 아니다.
- 폰트 CSS는 선택적 비동기 로딩으로 바꾸었다. Firebase SDK는 `scripts/startup-cloud.js`가 동적으로 병렬 다운로드하되 의존 순서대로 실행한다. 이제 외부 SDK/폰트가 DOMContentLoaded를 막지 않는다.
- 인증 연결이 끝나지 않으면 DOMContentLoaded 후 1.5초에 로컬 둘러보기 홈을 열고 연결 지연을 표시한다. Firebase의 저장된 로그인 세션을 삭제하거나 로그아웃하지 않는다. 늦은 계정 복원 시 기기 기록과 계정 기록을 섞지 않는다. 입력창이 열려 있으면 저장 위치를 갑자기 전환하지 않고 계정 화면을 다시 여는 안내를 표시한다.
- 계정 프로필 확인/최근 접속 저장은 홈 실행 후 진행한다. 기존 Firebase 설정, 규칙, 사용자 데이터 경로는 그대로다. 사진·방문 기록·수호카드의 데이터 구조도 그대로다.
- jsPDF는 순례집 생성 시 내려받고 기다린다. Firebase가 멈춰 있어도 PDF 스크립트는 독립적으로 로드한다. 연결 실패 시 입력 내용을 보존하고 다시 시도할 수 있다.
- 서비스워커는 window.load 대신 DOMContentLoaded에 등록한다. 저장된 페이지가 있으면 네트워크가 2초 넘게 응답하지 않을 때 캐시 페이지를 열고, 뒤에서 최신 페이지를 저장한다. 정상 네트워크 HTML은 본문 전체 캐시 완료를 기다리지 않고 바로 스트리밍한다. 첫 방문에 저장된 페이지가 없다면 실제 HTTP 응답 자체를 대신할 수는 없다.

## 서버 설정 확인

GitHub Pages는 main, `/`에서 배포한다. HTTPS 인증서는 sansanote.com과 www.sansanote.com에 정상 발급되어 있었다. 처음에는 `https_enforced:false`, HTTP `/` 응답은 200이어서 페이지 안의 JS 전환에 의존했다. 브라우저는 앞부분의 전환 스크립트를 읽자마자 이동할 수 있으므로 2.2MB 전체를 반드시 두 번 받는다고 해석하면 안 된다.

연결된 GitHub 인증으로 설정 변경은 403(권한 부족)이었다. 사용자가 Enforce HTTPS를 켠 후 API의 `https_enforced:true`, HTTP→HTTPS 301 및 검색 쿼리 유지, HTTPS www→apex 301을 확인했다. DNS 상태 API는 연결 권한 부족으로 403이었다. 설정 화면의 ‘DNS Check in Progress’만으로 DNS 오류라고 판단하거나 DNS 레코드를 바꾸지 않았다.

## 재현 및 검사

모든 브라우저 기능 검사는 로컬 파일/인증/DB fixture를 사용하며 실제 운영 Firebase에 쓰지 않는다.

- `tests/mobile-startup-resilience.cjs`: 아이폰 Chrome UA, 390×844. SDK 중단·SDK 오류·인증 콜백 지연 뒤 계정 복원·입력 중 계정 복원·프로필 응답 중단의 5가지 조건. 폰트 CSS 연결도 모든 조건에서 계속 중단시킨다. 원본 HTML은 Chromium과 WebKit 모두 5초 제한 내 홈을 열지 못한다. 수정본은 두 엔진 모두 5조건 통과. 측정한 홈 관측 시각은 Chromium 약 0.5~2.2초, WebKit 약 2.0~3.7초이며 로컬 기계에서의 모의 검사이고 실제 휴대폰 속도가 아니다.
- 위 검사는 startLocalMode를 수동 호출하지 않는다. 기존 사진 URL/방문 메모/세션 sentinel 유지, 늦은 로그인 시 기기 기록의 계정 혼입 방지, 입력 중 기록의 로컬 저장 유지, 미사용 PDF 미요청 및 Firebase 중단 중 PDF 독립 로딩을 확인했다.
- `tests/mobile-navigation-worker.cjs`: 실제 서비스워커와 HTTP 서버. 검색 결과 fixture에서 이동할 때 6초 지연 응답보다 먼저 저장된 페이지 표시, 지연 응답의 실제 캐시 저장 완료, 그 뒤 오프라인 새로고침에서 갱신 문서 표시, 개인 로컬 데이터 유지, 정상 HTML의 첫 부분을 본문 전체 캐시 완료 전에 표시하는 것 통과.
- `tests/mobile-startup.cjs`, `tests/home-photo-regression.cjs`, `tests/navigation-history.cjs`, `tests/navigation-nesting.cjs`, `tests/atlas-episodes.cjs`, `tests/atlas-publication-ui.cjs`, `tests/public-atlas-worker.cjs`, `tests/integrated-tabs-meditation.cjs` 통과. 108 카드/해인사·불국사/계정 분리/사진·순례/필사/8종 실제 음원/기존 창 전환을 포함한다.
- 앞선 작업에서 확인한 wellness-actions의 옛 사진 대체 문구 단언 불일치는 이번에 변경하지 않았다.

## WebKit 재현 환경과 한계

Playwright 1.58.2의 WebKit 26.0(v2248)을 공식 배포 경로에서 받았다. 필요한 Debian trixie 라이브러리는 공식 서명된 apt 인덱스와 체크섬 검증으로 내려받아 `/workspace/.sansa-webkit-libs/root`에 추출했다. 관리자 권한 설치 도구가 없어 시스템 파일 대신 로컬 라이브러리 경로를 사용하는 `/workspace/.sansa-webkit-run` 래퍼를 준비했다. 다운로드된 브라우저 파일은 수정하지 않았다. 실제 테스트 명령은 다음과 같다.

```sh
cd /workspace/sansa-note
NODE_PATH=/workspace/.sansa-tools/node_modules \
SANSA_BROWSER=webkit \
SANSA_WEBKIT_EXECUTABLE_PATH=/workspace/.sansa-webkit-run \
node tests/mobile-startup-resilience.cjs
```

Linux WebKit 모의 검사를 실제 iPhone Chrome/Google 검색/셀룰러 DNS/TLS 검증으로 해석하지 않는다. 해당 실물 휴대폰의 검색 클릭 경로는 배포 후 사용자 확인이 필요하다. 데이터/사이트 저장소 삭제는 요구하지 않는다.
