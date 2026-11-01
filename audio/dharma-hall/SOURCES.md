# 온라인 법당 음원 조사 상태

현재 앱에 연결된 법당 음원: **없음**. 후보 페이지의 CC BY 표시·저작자·실제 파일을 확인하지 못했으므로 재생 목록에 등록하지 않았습니다. 기존 명상 음원과 극락왕생 플레이리스트는 그대로 유지합니다.

| 후보 | 원본 상세 페이지 | 상태 |
| --- | --- | --- |
| 염불소리1 | https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200275&wrtSn=13254274 | 접근 차단으로 저작자·파일·라이선스 미확인 |
| 절 법당 종소리 | https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200020&wrtSn=13254523 | 미확인 |
| 목탁3 | https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200020&wrtSn=13253417 | 미확인 |
| 사찰 풍경소리 | https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200020&wrtSn=13220756 | 미확인 |
| 선운사 저녁예불 | https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200020&wrtSn=13372495 | 이용조건과 허락 미확인 · 사용하지 않음 |

2026-11-01: 첫 번째 상세 페이지를 HTTPS 프록시로 요청했으나 HTTP 403. 도메인 허용 요청은 환경 설정 초안에 저장했으며 현재 실행 환경에는 아직 적용되지 않았습니다. 다른 후보의 개별 파일 접근을 검증한 것으로 해석하지 않습니다.

## 등록 전 필수 확인

1. 각 상세 페이지에서 원저작자, 라이선스 버전, 다운로드 파일의 적용 범위를 확인하고 근거를 기록합니다. 미확인 권리정보는 추정하지 않습니다.
2. 원본 파일과 SHA-256, 재생 길이, 출처 URL, 라이선스 URL을 기록합니다. 로컬 MP3로 최적화한 경우 변환·트리밍·음량 보정 내역을 표시합니다.
3. 실제 녹음의 잔향을 보존하고 종의 끝 울림을 자르지 않습니다. 염불·효과음은 반복하지 않습니다. 스마트폰 스피커와 이어폰에서 음량을 비교합니다.
4. 실파일 디코딩 및 브라우저 시간 진행, iPhone Safari 실기기 재생을 확인합니다.
5. `catalog.json`에는 검증이 끝난 항목만 추가합니다. 필수 필드: `id`, `title`, `kind` (`chant`, `bell`, `moktak`, `instrumental`), `src` (`./audio/dharma-hall/<id>.mp3`), `creator`, `source`, `license`, `changes`, `description`, `verified: true`. 라이선스 URL·파일 해시·길이 등 근거도 함께 기록합니다.

전통 악기 연주곡은 아직 확보하거나 제작하지 않았습니다. 합성 효과음을 실제 사찰 녹음으로 대체 표시하지 않습니다.
