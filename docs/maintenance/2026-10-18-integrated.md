# 산사노트 통합 수정 검증 기록 — 2026-10-18

복구 기준: `8972701e719f4603edefe4d907841a89382ad8d8` (작업 전 운영 main).
복구 태그: `backup/pre-integrated-fix-20261018` (원격 저장소에 확보).
작업 브랜치: `fix/sansa-tabs-meditation-atlas`.
대상 운영 주소: https://sansanote.com/ 및 https://sansanote.com/admin-atlas/ .

## 실제 수정 범위

- `index.html`: 호흡 헤더/본문/문구 명상의 기존 캐릭터를 공식 `images/brand/monks/monk-meditation.png`로 교체. 기존 ambient.mp3 자동 경로와 단계별 합성 종 호출 제거. 호흡 시간·카운트 상수는 변경 없음. 문구 명상은 한 차례 종료 시 음원도 종료.
- `scripts/navigation.js`: X 닫기와 뒤로가기 분리, 확정된 닫기 상태를 저장 스냅샷/경로에서도 정리, 빠른 여러 닫기 처리, 중복 이력 건너뛰기. 기존 닫기 핸들러의 타이머 정리·저장 전 소감 확인은 유지.
- `scripts/meditation-sounds.js`: 합성 4종을 실제 녹음/음악 8종의 단일 HTMLAudio 플레이어로 교체. 무음 진입, 명시적 선택/재생, 12초 미리듣기, 재생·일시정지·정지·음량, 시간 종료, 음원 전환/다른 기능/페이지 숨김 시 중지. 기존 재생목록이 켜져 있을 때 명상 진입/명상 재생 시 일시정지하여 겹침 방지. 재생 위치/사용자 기록은 초기화하지 않음.
- `scripts/wellness-effects.js`, `styles/wellness.css`, `styles/brand-ui.css`: 공식 무념스님 contain 표시, 들숨의 작은 확대/멈춤 유지/날숨 이완, 동작 줄이기 설정 존중, 음원 제어 반응형 배치.
- `audio/meditation/`: 8개 실제 MP3, `catalog.json`, `LICENSES.txt`. 약 7.3MiB 전체이며 사용자가 재생할 때 해당 1개만 불러옴.
- `docs/audio/LICENSES.md`, `docs/audio/license-evidence.json`: 제작자·출처·라이선스·원본 URL·편집·파일 해시와 당시 Commons 라이선스 메타데이터 보존.
- `admin-atlas/bootstrap.js`, `index.html`, `atlas.css`, 신규 `review-runtime.js`, `review.enc`: 로그인 준비와 비공개 연결 검사를 분리. LOCAL 인증 저장 실패 시 SESSION/NONE으로 대체(익명 로그인 활성화 아님). 워커 준비 실패가 로그인 버튼을 막지 않으며 비공개 자료는 안전한 연결 확인 후에만 접근. 실패 시 다시 확인 버튼. 서버 재조회는 AbortController로 Safari 호환.
- 검토실 지도/굿즈 전용 화면·진입·실행 코드 제거. 사용하지 않는 **관리자 검토실** 굿즈 삽화 2개만 삭제. 메인 지도, 카드 3장의 원본/작은 이미지 및 기존 원고/사용자 기록 유지.
- `review-runtime.js`: 기존 인증된 원고를 메모리에서 짧은 사실+창작 대화+질문으로 재구성. 원래 draft와 진행/감상/카드 데이터에 덮어쓰기 없음. 일부 학술적인 추리 문구도 쉽게 다듬되 문제 ID와 정답 인덱스는 보존. 기존 관리자 자료는 재등록 불필요. 기존 비밀 등록 링크/키는 공개하지 않음.
- 화살표: 원형 버튼 padding/line-height를 명시하고 중앙 SVG 사용. 원과 SVG의 가로/세로 중심 오차 <0.1 CSS px 자동 검사.
- 관련 테스트: `tests/integrated-tabs-meditation.cjs`, `tests/navigation-history.cjs`, `tests/calm-design-audio.cjs`, `tools/test-admin-atlas*.cjs`.

## 추가 요청: 탐색·코스·홈 배경

- 절 둘러보기 헤더는 기존 공식 `monk-prayer.png`, 산 둘러보기는 `monk-walking.png`를 contain으로 표시합니다.
- 기존 41개 코스 모두에 주제에 맞는 공식 무념스님(걷기·독서·명상·합장·연꽃·미소)을 배치했습니다. 코스 배열/사찰 목록/등록·제거·방문 현황 기능은 변경하지 않았습니다.
- 새 `images/brand/wellness/activity-settings.webp`는 생성한 3×4 수채화 배경 시트(약 407KiB)입니다. 찻자리·연못·목조 방·글쓰기·숲길·쉼터·저녁 마당·모래정원·종이 공방·음악 공간·노을 테라스가 각각 11개 카드에 대응합니다. 마지막 해안 셀은 예비이며 노출하지 않습니다. 생성 요청에서 사람/캐릭터/글자를 제외했고, 기존 전경 `companion-activities-v2.webp` 및 포즈 CSS는 그대로 유지했습니다. 카드 높이는 변경하지 않았습니다.
- `tests/companion-backgrounds.cjs`: 320/390/412/768/820/1440px에서 11개 서로 다른 배경 실제 디코딩, 기존 전경 자산 유지, 컴팩트 높이, 탐색 헤더 포즈, 41개 코스·추가/정보 버튼 수 보존, 코스 상세 복귀·이미지 contain·가로 넘침 검사 통과. 390/1440px 스크린샷도 육안 확인했습니다.
- `sw.js`: 변경 파일의 버전/새 배경·음원 목록만 캐시 목록에 반영했습니다. 음원 8개를 미리 전부 내려받지 않으며 사용자 데이터 저장소는 건드리지 않습니다.

## X 오류 원인과 결과

공통 click 캡처가 X/close 함수를 모두 `history.back()`으로 가로챘습니다. 예를 들어 고민 결과 화면에서 X를 누르면 고민 선택 화면이 복원되어 창이 남았습니다. X는 기존 닫기 핸들러를 실제 실행하고 부모 클릭 전파를 막습니다. 닫기 확인이 취소되면 기록 정리를 하지 않습니다. 닫기가 확정되면 메모리·세션 저장 스냅샷의 화면 ID와 하위 경로를 정리해 뒤로/앞으로/새로고침으로 되살아나지 않게 합니다. 일반 뒤로가기와 입력 초안 복원은 유지합니다.

## 확보한 실제 음원

모두 Wikimedia Commons에서 실제 다운로드했고, 각 파일의 상업적 이용/재배포가 허용된 라이선스 정보를 확인했습니다. 유튜브에서 추출하거나 가짜 URL/빈 파일을 사용하지 않았습니다. CC BY-SA 편집본은 같은 라이선스로 제공합니다. 출처와 편집 내용은 앱의 선택 음원 안내에도 표시합니다.

| 제목 | 제작자 | 라이선스 |
|---|---|---|
| 산사의 새벽 | Robert EA Harvey | CC BY-SA 4.0 |
| 숲에 내리는 비 | Robert EA Harvey | CC BY-SA 4.0 |
| 계곡의 물소리 | jackthemurray | CC0 1.0 |
| 깊은 숲 | Gravity Sound | CC BY 4.0 |
| 잔잔한 피아노 (Evening Fall) | Kevin MacLeod | CC BY 3.0 |
| 싱잉볼 | Valera N. Trubin | CC BY 4.0 |
| 고요한 밤 (Dordogne pond) | Glaneur de sons | CC BY 3.0 |
| 마음의 쉼 (Organic Meditations One) | Kevin MacLeod | CC BY 3.0 |

각각 실제 27~90초 구간이며 반복 재생됩니다. 짧은 발췌·음량 정규화 목표 -25 LUFS·1초 시작/끝 페이드·44.1kHz/128kbps MP3로 변환했습니다. 8개 모두 ffmpeg 전체 디코딩 성공 및 무음 파일이 아님을 확인했습니다(peak -2.8~-17.5dBFS). 브라우저에서 실제 MP3 로드/시간 진행/일시정지/재개/중지를 확인했으며, 이는 사람의 청감 평가나 실제 휴대폰 스피커 검사를 뜻하지 않습니다. 제목 ‘산사의 새벽’은 분위기명이며 한국 사찰 현장 녹음으로 주장하지 않습니다. 대나무 숲·별도 종소리를 가짜 파일로 채우지 않고 실제 확보한 8종으로 구성했습니다.

## 자동 검사 결과

모든 아래 검사는 실행한 Chromium/모의 환경에 대한 결과입니다.

- `tests/integrated-tabs-meditation.cjs`: 390/820/412/1440px. 터치·마우스 X, 저장 이력에서 제거, 뒤로/앞으로/새로고침 후 미복원, 다시 열기, 빠른 정방향/역방향 닫기, 저장 전 소감 확인 취소, 기존 로컬 방문/사진 구조/점수 유지. 공식 캐릭터 이미지 디코딩/contain, 기존 수식관 56초와 단계/완료, 8개 실제 MP3 디코딩·재생·일시정지·재개·정지·볼륨·시간 종료·다른 기능 이동·재생목록과 겹침 방지, 12초 미리듣기 종료. 화면 가로 넘침 없음.
- `tests/navigation-history.cjs`: 390/1440px. 내부 뒤로/앞으로, 완전한 X 닫기, 마이페이지/발원문 초안, 사찰/산 검색 복귀, 필사 문서 복귀.
- `tests/navigation-nesting.cjs`: 수호카드 목록/상세·게임·브라우저 이력과 외부 이전 페이지 보존.
- `tests/navigation-context.cjs`: 검색 스크롤, 확대된 게임과 순위/게임 뒤로가기 순서, 일반 확대 유지.
- `tests/wellness-layout.cjs`: 320/390/768/1440px에서 기존 10개 기능 창 열기/닫기·헤더·화면 경계·필사 페이지 배치.
- `tests/wellness-actions.cjs`: 390/1440px에서 목탁, 호흡, 고민, 염불, 발원문, 부적, 기존 플레이리스트·게임 점수·필사 기록 회귀.
- `tests/calm-design-audio.cjs`: 320/390/768/1440px에서 홈 11개 기능 카드·캐릭터·필사 108 표시와 무음 호흡 진입.
- `tests/home-photo-regression.cjs`: 390/1440px에서 홈에 고정한 절만 표시·이름·사용자 사진/방문 fixture 유지, 검색 사진이 개인 DB를 덮어쓰지 않음.
- `tools/test-admin-atlas.cjs`: 320/390/768/1440px. 인증/DB 모의. 비관리자 원고 요청 없음, 잘못된 키 쓰기 없음, 기존/신규 비공개 원고 호환, 12장면/6문제/3카드/감상·서버 재조회, 지도/굿즈 진입 없음, 새 문구 표시, 중앙 화살표, 내부 X 완전 종료. 일반 사용자끼리의 실제 Firebase 접근 차단 검사를 대신하지 않음.
- `tools/test-admin-atlas-auth.cjs`: LOCAL 저장 차단, 워커 등록 실패, 워커 없음, 잘못된 이메일/토큰 프로젝트 5개 조건 모의. 로그인 버튼 준비와 비공개 자료 읽기 제한 확인.
- `tools/test-admin-atlas-worker.cjs`: 기존 루트 워커에서 검토실 전용 워커로 전환, 비공개 응답 비캐시, 초기 키 URL 제거 및 탭 세션 보존. Firebase는 모의.
- 코드 비교: 기존 Firebase Web 설정과 호흡 시간/사이클 상수 불변. Firebase 규칙 파일 변경 없음. 실제 Firebase 사용자 데이터 읽기/쓰기·삭제/초기화 작업 실행 없음.

## 실제 기기·역사 검증의 한계

| 대상 | 확인한 범위 | 아직 미검증 |
|---|---|---|
| PC Chrome | 시스템 Chromium 자동 기능·MP3 검사 | 사용자의 실제 PC Chrome/Google 계정 |
| 아이폰 Safari | 390px 터치·로그인 준비 실패 조건 모의 | 실제 Safari·Google 로그인·기기 복원 |
| 아이패드 Safari | 820px 터치 및 768px 배치 | 실제 iPad Safari·Google 로그인 |
| 갤럭시 Chrome | 412px Chromium 터치·MP3 검사 | 실제 갤럭시 단말 |

WebKit 브라우저 다운로드는 기본/승격 환경에서 모두 네트워크 403(Domain forbidden)으로 차단되었습니다. Safari 엔진 검사/실기 검사를 완료했다고 주장하지 않습니다. 실제 관리자 로그인·운영 DB 저장/복원은 사용자 직접 확인 대기입니다. 운영 Firebase 규칙은 변경하지 않았으며 실제 계정 간 차단을 검증했다고 주장하지 않습니다.

UNESCO·국가유산포털·해인사 공식 원문 요청 역시 403으로 차단되어 공식 원문 전부 대조는 미완료입니다. Commons의 Tripitaka Koreana 사진 설명에서 13세기 목판·해인사 소장 같은 기초 설명은 읽었으나 이것으로 모든 원고가 검증되었다고 판단하지 않았습니다. 세부 수종 비율·확정 운송 경로 등의 단정은 새 이야기에서 제외하고 검토 중 표시는 유지합니다. 삽화와 무념스님 대사는 창작으로 구분합니다. 기존 공개 PR의 과거 원고 노출 이력까지 비공개가 된 것은 아닙니다.

배포 후에는 Pages 상태, 실제 운영 파일의 해시/커밋, 새 음원 HTTP 응답과 기존 홈의 주요 구조를 별도로 확인합니다. 실제 로그인 미검증 항목은 배포 성공과 구분합니다.
