# 법당 · 마음 처방 운영실

운영실 경로: `/admin-practice/`. 관리자 Google 계정은 기존 산사노트 운영 계정과 동일합니다. 이메일·인증 여부·Google 공급자·토큰 프로젝트 및 issuer를 검사하며, 실제 공개 반영/검수 열람 권한은 서버 규칙이 제어합니다. 개인 데이터 요청을 캐시하지 않는 전용 서비스워커 연결이 준비되어야 운영실에 들어갈 수 있습니다.

## 예불 편집과 반영

단계명·안내·할 행동·시작/종료 시각·음원·파일 오프셋·음원 시작 시점·자막 구간·말풍선 구간·무념스님 문구·동작·자동 전환을 편집합니다. 시각은 초 단위이며 자막/말풍선/음원 시작은 전체 예불 시계 기준입니다. 오프셋만 파일 기준입니다. 단계 구간의 빈틈·겹침, 파일을 벗어나는 오프셋, 미검증 음원, 잘못된 자막·말풍선을 검증합니다.

재생 미리보기는 일반 사용자와 같은 플레이어를 사용합니다. 구간 반복, 재생 중 ‘여기서 자막 시작 / 무념스님 안내 / 연결 음원 시작’ 찍기를 지원합니다. 이 변경은 편집본에만 적용되며 다시 미리보기를 열어 확인합니다. 자동 전환을 해제하면 현재 단계 끝에서 멈추고 사용자가 다음 단계로 이동합니다.

1. 임시 저장: `users/{관리자 uid}/practiceStudio/draft`에만 저장합니다.
2. 최종 반영: `shared/practiceExperience/current`에 새 revision을 조건부 transaction으로 씁니다. 다른 편집자의 변경을 덮어쓰지 않고 충돌을 알립니다. 새 창/다음 입장부터 적용되며 재생 중인 세션은 설정을 바꾸지 않습니다.
3. 반영 전후 설정과 결과는 관리자 본인의 `practiceStudio/history`에 기록합니다. 서버를 다시 읽어 내용을 확인한 경우에만 반영 성공을 표시합니다. 서버 쓰기가 거부되면 성공으로 표시하지 않습니다.
4. JSON 내보내기/가져오기로 `data/practice-experience.json`에 사용할 검증된 배포 파일도 관리할 수 있습니다. 파일 내보내기는 실제 배포가 아닙니다.

## 즉문즉답과 검수

기존 104개 세부 상황을 보존하고 반복 약속 취소·말실수 사과·관계 경계·자녀 대화·배우자 경청·의료비 부담·과거 선택 후회·가족 죄책감·기본 일상 기능 저하의 9개 유형을 추가해 113개로 확장했습니다. 1,974개 기존 예시와 1,000개 추가 예시를 보존했습니다. 새 파이프라인은 세부 상황 → 상위 고민 분야 → 감정 단서 → 답변 방식 → 공감 요약/핵심 정리/실천 제안입니다. 감정은 입력의 표현에서 찾은 단서이며 진단이 아닙니다. 모호한 고민은 확인 질문을 유지하고, 위기 상황은 일반 조언보다 안전 안내를 우선합니다.

- 사용자는 답변 방식을 선택할 수 있습니다. 랜덤으로 다른 고민의 답변을 끼워 넣지 않습니다.
- 싫은 소리를 못하고 참는 표현, 자기 탓을 반복하는 표현을 추가 인식합니다. 사용자가 쓴 내용을 먼저 짧게 요약하며 화면에는 분야·감정·답변 방식을 표시합니다.
- 기본 동작에서는 고민 원문을 전송하거나 저장하지 않습니다. 사용자가 **명시적으로 공유 동의 + Google 로그인 + 보내기**를 선택한 경우에만 원문·분류·표시된 답변을 `shared/oracleReviewInbox/{uid}/{id}`에 저장합니다. 개인정보를 지우라는 안내를 제공합니다. 익명 입력은 수집하지 않습니다.
- 운영실은 동의 로그만 읽어 비슷한 고민 유형으로 묶고, 부적절/애매함/좋음 검수와 대체 답변·방식을 저장합니다. 검수 결과는 관리자 개인 경로의 `practiceStudio/reviews`에 기록합니다. 해당 유형별 미검수·부적절·애매함 건수를 표시합니다.
- 등록한 우선 답변은 최종 반영 전에는 사용자에게 노출하지 않습니다. 공개 반영 자료에는 원문 로그나 사용자 uid를 넣지 않습니다. 위기 안전 안내는 대체 답변으로 덮어쓸 수 없습니다.

## 필요한 서버 규칙과 남은 배포

`shared-rules-additions.json`은 **새 `shared.practiceExperience`와 `shared.oracleReviewInbox` 하위 규칙만** 담습니다. 현행 운영 규칙을 먼저 읽고 이 두 하위 경로만 추가해야 합니다. 기존 규칙 전체를 이 파일로 대체해서는 안 됩니다. `tests/practice-studio-rules/database.rules.json`은 저장소에 문서화된 기존 규칙을 바탕으로 만든 **테스트용 병합본**이며, 현행 운영 서버와 같다고 보장하지 않습니다.

규칙은 공개 설정에 검증된 관리자만 쓰기, 로그는 로그인한 본인의 최초 생성+동의만 허용, 로그 읽기는 검증된 관리자만 허용, 기존 기록의 소유권은 유지하도록 작성했습니다. 실제 운영 규칙은 이 작업에서 배포하지 않았습니다. 규칙 적용 전에는 새 최종 반영과 공유 로그 저장이 거부될 수 있으며 UI는 이를 실패로 안내합니다. 정적 기본 체험과 브라우저 내부 답변은 이용할 수 있습니다.

실제 운영 규칙 배포에는 대상 프로젝트의 Firebase 관리 권한이 필요합니다. 환경에 주입된 Google 자격 증명의 존재를 확인하고 현행 규칙 읽기를 실제 시도했으나 Firebase 인증에 실패했습니다. 운영 관리 권한은 확인되지 않았습니다. 자격 증명 값이나 파일 내용은 열람·출력하지 않았습니다. GitHub Git 인증을 Firebase 관리 권한으로 간주하지 않습니다.

## 검사

```sh
node tests/practice-config.cjs
node tests/oracle-matching.cjs
node tests/oracle-browser.cjs
node tests/dharma-hall.cjs
node tests/practice-studio.cjs
node tests/calm-design-audio.cjs
node tests/unified-music.cjs
```

서버 규칙 검사(운영 프로젝트와 분리한 데모 에뮬레이터):

```sh
npm install --prefix /tmp/sansa-practice-rules --no-save --no-package-lock @firebase/rules-unit-testing@6.0.0 firebase@13.0.0 firebase-tools@15.34.0
NODE_PATH=/tmp/sansa-practice-rules/node_modules /tmp/sansa-practice-rules/node_modules/.bin/firebase emulators:exec --only database --project demo-sansa-practice-studio --config tests/practice-studio-rules/firebase.json 'NODE_PATH=/tmp/sansa-practice-rules/node_modules node tests/practice-studio-rules/test.cjs'
```

2026-11-01: npm 설치는 완료했습니다. 에뮬레이터 JAR 다운로드 도메인 `storage.googleapis.com`은 현재 실행 정책에서 차단되어 **서버 규칙 검사는 아직 실행되지 않았습니다**. 기존 `gongu.copyright.or.kr` 허용을 보존하고 추가 도메인을 환경 초안에 저장했습니다. 환경 설정을 저장·적용한 뒤 위 명령을 다시 실행해야 합니다. 모의 브라우저 테스트 통과를 서버 규칙 검증으로 취급하지 않습니다.

## 사용자 제공 대표 답변 30선

`data/oracle-quality-30.json`에 가상의 고민·참고 답변·예상 유형을 보존했습니다. 사용자의 실제 고민 로그가 아닙니다. 운영실은 기본 검수 자료로 이 사례들을 불러와 참고 답변, 현재 반영본, 편집본, 자동 분류 일치를 함께 표시합니다. 적합/부분 적합/부적합은 관리자가 별도로 판정하며 결과와 이전·이후 답변을 관리자 본인의 `qualityReviews` 및 `qualityReviewHistory`에 원자적으로 저장합니다. 자동 분류 일치를 문구의 품질 검수 완료로 표시하지 않습니다.

`node tests/oracle-quality-30.cjs`는 대표 30건, 다른 표현·오타·사실 서술·부정문 18건, 모호한 입력 4건, 복합 고민 1건, 긴급 안전 3건을 검사합니다. 의료비·경청·모욕 사례에는 관련된 구체적 행동이 있는지도 확인합니다. 기존 1,000개 자료는 변경하지 않았으며, 그중 반복 약속 취소 1건은 기존 친구 거리 유형의 명시적 하위 유형인 `friend_reliability`로 더 구체화했습니다.
