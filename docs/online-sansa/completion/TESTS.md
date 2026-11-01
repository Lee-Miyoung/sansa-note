# 실행한 검증 기록

2026-11-01 · Node 24 / 시스템 Chromium / 저장소 정적 파일 및 모의 Firebase. 운영 사용자의 데이터를 수정한 검사가 아닙니다.

| 검사 | 실제 결과 |
| --- | --- |
| `node tests/monastery-completion.cjs` | 통과 · 390×844, 메뉴 8개·여섯 입장/정좌/합장·선택/직접 입력·20개 사례·개인정보/기존 데이터 보존 |
| `SANSA_WIDTH=412 node tests/monastery-completion.cjs` | 통과 · 412×915 갤럭시 크기 Chromium, 실기기 아님 |
| `SANSA_WIDTH=820 node tests/monastery-completion.cjs` | 통과 · 820×1180 태블릿 크기 Chromium, iPad/WebKit 아님 |
| `SANSA_WIDTH=1440 node tests/monastery-completion.cjs` | 통과 · 1440×1000 PC 크기 Chromium |
| `node tests/dharma-hall.cjs` | 통과 · 기존 7단계·일시정지·계수 상한·퇴장 정지·무음·비전송 회귀 |
| `node tests/hall-experience.cjs` | 통과 · 320×568/390×844/768×1024/1440×1000, 핵심 정보 배치·도움말 키보드·직접 삼배·실제 요약·음원 탐색 비계수·108배·정시 중간 입장 |
| `node tests/hall-motion-media.cjs` | 통과 · 7개 독립 자세 캡처·회전/idle 루프 없음·계수·동작 감소·실제 염불 재생/정지·실제 단계 음량 |
| `node tests/hall-scheduled-entry.cjs` | 통과 · 시작 전 대기·직접 참여 제스처·절대 시계·개인 동작 비계수·종료 후 고민 처방 연결 |
| `node tests/online-sansa-browser.cjs` | 통과 · 4개 너비의 여섯 법당, 예상 시간 4종, 정시 입장/정지/자유 전환, 기록 비전송 |
| `node tests/online-sansa.cjs` | 통과 · 전각/본존/음원 제한·KST 요일/자정/일정·중단/예약 |
| `node tests/practice-studio.cjs` | 통과 · 실제 MP3 4종 디코딩·탐색·중단, 관리자 편집/타임라인/구간 반복/음량 슬라이더/모의 초안·게시·복원·검수 공유 동의 |
| `node tests/practice-config.cjs` | 통과 · 시퀀스·권리·안전·기존 규칙 경로 보존의 정적 비교. 에뮬레이터 통과라는 뜻 아님 |
| `node tests/oracle-quality-20.cjs` | 통과 · 신규 20건+변형/부정 10건·모호함·방식·환자 정체성·위기 우선 |
| `node tests/oracle-quality-30.cjs` | 통과 · 기존 30건·변형/부정 18건·모호 4·복합 1·긴급 3 |
| `node tests/oracle-matching.cjs` | 통과 · 기존 1,974+추가 1,000 예시 보존, 933 매칭/47 확인/20 안전·40 holdout 등 유지 |
| `node tests/oracle-browser.cjs` | 통과 · 상황/관계·확인 선택·안전·원문 비전송·기존 데이터 보존 |
| `node tests/presence/client.cjs` | 통과 · 모의 접속/원자적 예약/끊김/재연결/비활성/경쟁/UID 비노출/범위/TTL |
| `node tests/presence/ui.cjs` | 통과 · 모의 공개 집계 2→1·오래된 값 숨김. 운영 인원수가 아님 |
| `node tests/calm-design-audio.cjs` | 통과 · 기존 11개 마음 돌봄 카드·명상 소리·무음 진입·호흡/정지 |
| `node tests/unified-music.cjs` | 통과 · 기존 실제 음악·단일 플레이어·딥링크·공유·자동재생 없음 |
| `node tests/personal-collection-integration.cjs` | 통과 · MY 번호·계정 분리·재접속·사진/방문/소감 보존 |
| `node tests/gps-party-save.cjs` | 통과 · 승인/거부·계정 전환·서버 확인·기록/사진 보존 |
| `node tests/photo-backup-restore.cjs` | 통과 · 사진/EXIF·ZIP 백업·공유·복원/중복·손상 파일 보호 |
| `node tests/atlas-home-catalog.cjs` | 통과 · 390/820/1440 비밀도감·기존 배너/진입·실패/지연 대응 |
| `node tests/navigation-history.cjs` | 통과 · 390/1440 뒤로/앞으로·초안·목록 검색·필사 복귀. 고정 250ms 대신 실제 오버레이 해제 후 위치 복원을 기다리도록 검사 안정화 |

## 실행하지 못한 검사

- **WebKit:** 설치된 Playwright CLI로 설치 시도. `cdn.playwright.dev`와 `playwright.download.prss.microsoft.com`에서 `403 Domain forbidden`. iPhone/iPad 크기 WebKit 검사는 미수행입니다.
- **Firebase 규칙 에뮬레이터:** `demo-sansa-presence` 전용 실행을 시도했지만 `storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar` 다운로드 실패로 중단되었습니다. 보안 규칙의 실제 파서/권한 검사를 통과했다고 보고하지 않습니다.
- **운영 서버/실기기:** 운영 권한·실제 다중 접속·과금·Google 관리자·iPhone Safari/iPad/갤럭시 실기기·스피커/이어폰 청취·문화 전문 감수·사람 대상 사용성 조사는 미수행입니다.

## 화면 캡처의 해석

[갤러리](index.html)의 화면은 실제 프런트엔드 버튼을 자동으로 조작한 로컬 Chromium 결과입니다. 데이터 읽기/쓰기는 모의 SDK입니다. 공동 참여 숫자 캡처만은 테스트에서 rollout을 명시적으로 켠 모의 서버 스냅샷이며 화면에도 MOCK 성격을 표시합니다. 그 외 법당 캡처에는 ‘참여 인원 확인 중’이 보입니다. 운영 배포나 실기기 확인으로 대신 주장하지 않습니다.
