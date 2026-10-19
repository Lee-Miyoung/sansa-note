# 모바일 첫 진입 로딩 개선

기준: main `4678c9c3e32c02f921e4975e4ca6b4741531b992`.

## 측정과 최소 변경

- head의 Firebase compat 4개와 jsPDF가 HTML 파싱을 막았다. `defer`로 병렬 다운로드하고 문서 파싱 뒤 원래 순서대로 실행한다. 기존 DOMContentLoaded 초기화, SDK 버전, Firebase 설정/규칙/데이터 처리 코드는 그대로다.
- 서비스워커가 첫 설치 때 사용하지 않은 대용량 음악·영상·옛 사진까지 받았고, 같은 홈 문서를 `/`와 `/index.html`로 두 번 받았다. 설치 목록에서 중복 문서와 미디어를 제외했다. 미디어 파일은 모두 보존하며, 실제 사용 시 기존 fetch 처리로 캐시한다.
- 한 번도 내려받지 않은 음악은 최초 오프라인 방문에서 재생할 수 없다. 사용 후 캐시된 음악의 오프라인 재사용과 앱 셸의 오프라인 폴백을 검사했다. 로그인/순례/사진/108 카드/비밀도감의 저장 경로는 변경하지 않았다.

## 통제 실험 결과

`node tests/mobile-startup-perf.cjs [baseline-directory]`.
기준 디렉터리에는 기준 커밋의 index.html과 sw.js만 두고, 나머지 파일은 현재 체크아웃에서 읽는다. Git worktree는 필요 없다.

390×844 Chromium, CPU 4배 감속, 외부 SDK는 각각 2초 뒤 빈 JS 응답으로 대체, 외부 폰트 차단. 로컬 파일 응답, 새 컨텍스트 3회 중앙값이다. SDK가 비어 있으므로 load 뒤 startLocalMode를 호출한다. 실제 Firebase 인증, 이동통신 속도, 실기기 또는 운영 Core Web Vitals 측정이 아니다. FCP는 초기 셸 표시이며 홈 사용 가능 시점과 같지 않다.

| 항목 | 수정 전 | 수정 후 |
|---|---:|---:|
| FCP | 2,432ms | 552ms |
| DOMContentLoaded | 2,757ms | 2,474ms |
| 관측한 LCP | 3,428ms | 3,160ms |
| 워커 스크립트 및 설치 요청 수 | 31 | 19 |
| 로컬 설치 응답 본문 합계(압축 전) | 25,754,580 bytes | 4,951,205 bytes |
| 설치 중 요청하는 음악·영상 수 | 6 | 0 |

설치 본문 합계는 약 81% 감소했다. 페이지 자체가 요청하는 이미지/영상, 외부 SDK·폰트까지 포함한 전체 페이지 트래픽 수치는 아니다. 특히 홈 준비와 LCP의 개선은 FCP의 개선보다 작다. 초기 중간 집계는 테스트 첫 문서 응답을 누락했으며, 표는 실제 홈 HTML을 포함해 바로잡은 최종 집계다.

## 검사 결과

- `tests/mobile-startup.cjs`: 390/820/1440px, 응답 순서를 뒤섞어도 SDK 실행 순서 보존, DOMContentLoaded와 인증 콜백을 통한 자동 게스트 홈 진입, PDF 생성자 준비, 108개 카드, 기존 개인 사진 URL·방문 메모·stage 보존. 실제 로컬 서비스워커로 설치 중 미디어 미요청, 사용한 음악 캐시/오프라인 재조회, 오프라인 셸 폴백 통과.
- `tests/home-photo-regression.cjs`: 390/1440px, 고정 사찰과 개인 사진·방문 기록 보존, 개인 DB 사진 덮어쓰기 방지 통과.
- `tests/navigation-nesting.cjs`: 수호카드 상세와 게임의 뒤로/앞으로/닫기 통과.
- `tests/atlas-episodes.cjs`: 320/390/412/768/820/1440px, 해인사·불국사 12장면/6문제/3카드/기록과 재열기, 사용자 A/B 분리 모의, 기존 순례·108 fixture 보존 통과.
- `tests/atlas-publication-ui.cjs`: 390/820/1440px, 공개 상태 복원/서버 확인/실패·오프라인 처리 모의 통과.
- `tests/public-atlas-worker.cjs`: 실제 워커 전환과 비밀도감 응답 비캐시 통과.
- `tests/integrated-tabs-meditation.cjs`: 390/820/412/1440px, 창 닫기·기록·8개 실제 MP3 재생/중지/단일 음원·56초 호흡 통과.
- `tests/navigation-history.cjs`: 390/1440px, 뒤로/앞으로·초안·사찰/산 검색 복귀·필사 기록 통과.
- `tests/wellness-actions.cjs`: 실패. `cardCoverMedia(null, 'temple', '검증 사찰')`의 수채화 대체 이미지에 옛 문자열 ‘실제 사진 준비 중’을 기대하는 단언이다. 원본 main의 index.html을 제공한 동일 검사도 동일 지점에서 실패했다. 기존 문구 기대값과 현재 이미지 표현의 불일치로 이번 수정에 의한 회귀가 아니다. 테스트를 건너뛰거나 단언을 수정하지 않았다. 실패 뒤에 있는 필사 검사는 이 실행에서 미실행이며 별도 navigation-history에서 필사 기록을 검증했다.

실제 운영 Firebase 개인 데이터에 쓰기/삭제를 하지 않았다. 실제 사용자 로그인·Safari·실제 휴대폰 속도는 미검증이다. 운영 사이트와 GitHub API의 TLS 검증 HTTP 접근은 확인했지만, Chromium은 환경 프록시 CA 신뢰 문제로 운영 실측을 시작하지 못했다. 인증서 검증을 끄지 않았다.

## 재사용 환경

Node 24, Python 3, 시스템 Chromium과 Playwright 1.58.2(`/workspace/.sansa-tools/node_modules`)를 사용한다. SDK/워커 회귀는 이 고정 Playwright 버전으로도 통과했다. 통제 성능 표는 기본 제공 Playwright 1.62.1로 실행했다.

설치 및 시작 절차와 운영 확인용 네트워크 도메인은 클라우드 설정 초안에 저장한다. 설정 저장/환경 게시와 GitHub Pages 앱 배포는 별도다. Pages 대상은 API로 확인한 `main`, `/`이다.
