# 온라인 산사 자동 예불·2.5D 개선 · 2026-11-02

작업 시작 시 원격 main을 조회해 `8fb0f19`로 갱신한 뒤 수정했습니다. 원래 방문 기록·로그인·순례 인증·IndexedDB·사진·수호카드·Firebase 규칙을 변경하거나 초기화하지 않습니다. 운영 Firebase 설정을 쓰지 않고, 구버전 설정은 표시 시에만 새 레이어·기존 명호 파일과 호환됩니다.

## 자동 예불

`guided`는 한 번 시작하면 25/15/60/120/30/30/20초의 일곱 단계, 총 300초를 자동으로 진행합니다. 관리자 설정의 시간·연결 음원·음량·자막 시점을 사용합니다. 개인 자동 예불에서는 행동 대기·수동 전환 설정이 진행을 막지 않습니다. 정시·관리자 미리보기의 기존 시계와 설정은 유지합니다.

합장·삼배·염송·발원 표시는 선택 사항입니다. 프로그램 시계, 화면에 머무른 시간, 실제 음원 청취, 직접 확인한 수행 횟수는 별도로 관리합니다. 다음 단계로 이동해도 이미 직접 확인한 삼배 횟수를 지우지 않습니다. 다시 시작은 이번 프로그램의 참여 값을 명시적으로 새로 셉니다.

일시정지는 시계·음원·캐릭터 자세 전환을 함께 멈춥니다. 이전/다음·다시 시작·음량·설정·출처를 제공합니다. 발원문 적기는 개인 자동 예불을 멈추고, 작성 마침 버튼으로 재개합니다. 글은 전송하지 않습니다. 퇴장·다른 음원 시작 시 기존 단일 플레이어를 중단합니다. 자유 기도는 시간이 지나도 강제 전환하지 않고, 정시 예불은 한국시간의 절대 시계를 사용합니다.

[실제 시간 검사 기록](real-time-run.json)은 브라우저 시계를 가속하지 않은 5분 재생입니다. 일곱 단계 전체를 통과했고, 아무 참여 버튼도 누르지 않았으므로 합장·삼배·발원 값은 0/미참여였습니다. 가속 시계 검사와 구별합니다.

## 새 그림과 도상 참고

불상 전체가 보이는 1인칭 정좌 구도로 **건축 6개·불단 6개·공용 전경 1개**를 각각 새로 생성했습니다. 특정 사찰의 실물 재현물이 아닙니다. 원본 PNG 13개와 알파를 보존한 PC/모바일 WebP를 구분해 보관합니다. [자산 목록·해시](assets.json), [원화 설명](../../../images/online-sansa/layers/README.md).

아래 경로는 모두 `images/online-sansa/layers/` 아래입니다. 불단은 `-small.webp` 모바일 버전도 있습니다.

| 법당 | 새 본존·불단 | 새 건축 배경 | 구별 요소와 기존 프로젝트 참고자료 |
| --- | --- | --- | --- |
| 대웅전 | `daewung-altar.webp` | `architecture.webp` | 석가모니불·오른손 촉지인 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0028328) |
| 극락전 | `geungnak-altar.webp` | `geungnak-architecture.webp` | 아미타불·선정인·붉은 광배 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0034298) |
| 관음전 | `gwanum-altar.webp` | `gwanum-architecture.webp` | 화불 보관·연꽃·보살 장엄 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0004915) |
| 문수 기도실 | `munsu-altar.webp` | `munsu-architecture.webp` | 보관·경책을 받친 연꽃·사자 장식 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0019535) |
| 약사전 | `yaksa-altar.webp` | `yaksa-architecture.webp` | 약그릇을 받친 여래상 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0035327) |
| 지장전 | `jijang-altar.webp` | `jijang-architecture.webp` | 삭발·승려 복식·석장·보주 · [한국민족문화대백과](https://encykorea.aks.ac.kr/Article/E0054346) |

이 표의 문헌은 기존 프로젝트의 문화 출처를 계승합니다. 이번 실행 환경에서 백과 사이트 접속은 네트워크 정책의 403 응답으로 차단되어 원문을 새로 대조하지 못했습니다. 생성 원화의 얼굴·손·지물·구별·경계와 합성 화면을 직접 보았으며, 전문가의 도상 감수·개별 문화재와의 일치 검증으로 보고하지 않습니다.

## 입체 공간과 캐릭터

그림 하나를 확대하지 않습니다. `.shrine-architecture`, `.shrine-altar`, `.shrine-foreground` 세 개의 실제 이미지 평면을 서로 다른 깊이로 배치합니다. 각 법당의 다른 건축·본존과 공용 전경을 합칩니다. 불단은 `contain`으로 도상 전체를 보존합니다. 입장 시 각 평면이 1.8초 동안 다른 비율로 이동해 방석 가까이 앉는 시점을 만들며, 이후 단계별로 정해진 안정된 위치에 멈춥니다. 무한 줌·흔들림·반짝임은 없습니다. 동작 감소에서는 이동 없이 같은 기능을 씁니다.

무념스님은 그림 밖 작은 안내 영역에 있습니다. 삼배 안내는 해당 구간에 세 차례 자세 프레임을 보여주고 실제 계수는 하지 않습니다. 108배도 합장·상체 숙이기·무릎 앉기·몸 낮추기·돌아오기 이미지로 움직입니다. 몸 전체 회전은 사용하지 않습니다. 일시정지·퇴장 시 프레임 타이머를 멈춥니다.

## 모바일 전후 비교

모바일 390×844의 작업 시작 main과 최종 버전을 같은 테스트 환경에서 캡처했습니다. 비교 스크립트는 구버전 HTML·JS·설정을 실제 Git 객체에서 읽으며 구버전에 새 2.5D 모듈이 없는지도 검사합니다.

| 화면 | 이전 | 개선 |
| --- | --- | --- |
| 법당 선택 | [이전](before-selection.jpg) | [개선](after-selection.jpg) |
| 입장 전 | [이전](before-arrival.jpg) | [개선](after-arrival.jpg) |
| 방석에 앉기 | [이전](before-seated.jpg) | [개선](after-seated.jpg) |
| 삼배 | [이전](before-bows.jpg) | [개선](after-bows.jpg) |
| 명호 듣기 | [이전](before-listening.jpg) | [개선](after-listening.jpg) |
| 완료 | [이전](before-completed.jpg) | [개선](after-completed.jpg) |

새 장면·안내·하단 제어를 하나의 화면에 배치했습니다. 긴 문수 법당 제목이 닫기 버튼과 겹치지 않도록 제목 폭과 줄바꿈도 제한했습니다. 모바일 그림을 보려고 긴 설명을 스크롤할 필요가 없습니다. 보조 설정·출처와 긴 요약은 별도 내부 스크롤입니다. `VisualViewport`, `100dvh`, 안전 영역을 사용하며 [420px 높이·90px 오프셋 모의 검사](visual-viewport-420.jpg)와 [가로 화면](landscape.jpg)을 확인했습니다.

## 음원과 시간

이번 작업은 새 음성을 합성하거나 MP3를 늘이지 않습니다. 최신 main에 실제로 있던 법당별 `recitation-{id}.mp3` 여섯 개(약 50~56초), 기존 실제 종·목탁·염불 파일을 유지합니다. 명호는 화면에 **AI 합성 음성**으로 표시합니다. [합성 음성의 모델·권리 설명](../../../audio/dharma-hall/SYNTHETIC-VOICE.md), [현장 녹음 출처](../../../audio/dharma-hall/SOURCES.md).

120초 명호 단계와 실제 파일 길이를 구분합니다. 기본은 한 번 재생 후 남은 구간을 조용히 머물며, 현재/전체 음원 시간을 따로 표시합니다. [실제 음원 종료 후 고요한 단계](audio-ended-silence.jpg). 관리자 단계 편집에 반복 선택을 추가했고 기본은 꺼짐입니다. 반복 선택 시 프로그램 경과 시간과 실제 음원 구간 길이로 위치를 계산합니다. 음성 속도 변경은 없습니다. 파일 재생 실패·차단 시 해당 단계는 무음으로 계속하고 상태를 알립니다.

실제 브라우저에서 MP3를 디코딩하여 종료와 단계 독립성·선택 반복·일시정지·재시작을 확인했습니다. 이어폰·스마트폰 스피커에서의 실청 및 합성 발음·의식 적합성 전문가 검수는 미수행입니다. 임의의 편집 구간을 관리자가 반복할 때는 경계를 별도로 청취해야 합니다.

## 실행 검사와 한계

- `tests/automatic-ritual-real.cjs`: 실제 300초 단일 시작·일곱 단계·실제 파일 재생·완료·미실행 수행 0회·사용자 쓰기 없음.
- `tests/automatic-ritual.cjs`: 320×568, 390×844, 412×915, 820×1180, 1440×900. 단계 자동 전환·일시정지/재개·이전/다음·재시작 단일 타이머·발원 입력 중지·음원 실패 시 무음 완료·여섯 다른 레이어·동작 감소.
- `tests/ritual-audio-sync.cjs`: 실제 AI MP3 디코딩·종료 후 같은 단계에서 고요히 대기·120초 시계·선택 반복의 위치·합성 표시.
- `tests/ritual-layout-free.cjs`: 높이/오프셋 모의 변화·가로 전환·하단 제어/닫기·자유 기도 무한 대기·직접 삼배·108배 프레임과 회전 없음·비저장.
- `tests/ritual-comparison.cjs`: 구 main/최종 화면 여섯 종류 비교 캡처, 별도 육안 확인.
- 기존 `online-sansa.cjs`, `practice-config.cjs`, `online-sansa-browser.cjs`, `hall-scheduled-entry.cjs`, `practice-studio.cjs`, `navigation-history.cjs`, `unified-music.cjs`: 문화/설정 검증·여섯 법당·구 설정/늦은 SDK·정시/자유·관리자 모의 편집/게시·기존 음악/뒤로가기 회귀.

중간 검사에서 퇴장 감시 중복, 정시 참여 버튼 숨김, 긴 제목 겹침을 발견해 수정했습니다. 최종 통과 결과와 원본 자료는 이 폴더에 보관합니다. 실제 Firebase에 쓰는 검사는 하지 않습니다. 가상 Firebase 모의 검사에서 사용자 쓰기는 없었습니다. 기존 데이터의 운영 내용에 접근하거나 수정하지 않았습니다.

실제 휴대폰·저사양 실기기 검사는 하지 않았습니다. 이 환경에는 Playwright WebKit 실행 파일이 설치되어 있지 않고 다운로드 호스트도 허용 목록에 없어 모바일 WebKit 검사를 실행하지 못했습니다. Chromium의 아이폰 크기·Viewport 모의 검사를 실제 iPhone Safari 검사로 보고하지 않습니다.

## 변경 파일

- 진행/설정: `scripts/dharma-hall.js`, `scripts/hall-experience.js`, `scripts/practice-config.js`, `scripts/sansa-core.js`, `scripts/online-sansa.js`, `data/online-sansa.json`.
- 새 공간/UX: `scripts/automatic-ritual.js`, `styles/automatic-ritual.css`, `images/online-sansa/layers/`의 원본·반응형 자산.
- 관리자: `admin-practice/studio.js`, `admin-practice/online-sansa.js`, `admin-practice/index.html`.
- 연결/캐시: `index.html`, `sw.js`.
- 검사: 위 신규 `automatic-ritual*`·`ritual-*` 테스트와 이 보고서/캡처/해시. 기존 과거 보고서의 캡처는 덮어쓰지 않습니다.

최종 커밋 SHA와 GitHub Pages의 실제 배포·운영 파일 대조 결과는 작업 최종 응답에 명시합니다.
