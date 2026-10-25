# 실제 사용자 오류 5가지 수정 · 2026-10-25

기준 main: `33dbb4dc4bd91081a847110a42b97d3966682ede`.

| 항목 | 확인한 원인 | 수정 | 검증 |
|---|---|---|---|
| 개인 산사 도감 | 화면 메모리의 destinations만 순회하며 서버 기록 조회 완료를 기다리지 않음. 설정에만 진입 버튼이 있고 기존 목록 모달보다 낮은 z-index로 가려질 수 있음 | 계정 destinations와 personalTempleCards를 함께 조회, 인증된 개인 사찰만 표시. 기존 서버 번호 우선, 없는 번호만 기존 거래 방식으로 복구. 홈·절 둘러보기에서 같은 도감으로 이동, 상위 모달 표시 | 모의 일반회원 연주암 MY001 → 목록 → 같은 카드 → 새로고침·재로그인, MY002, 재발급 중복 방지, 계정 분리, 숨긴 개인 사찰, 목록 모달 위에서 실제 클릭 |
| 시즌 2 / 특별편 | 4개 사찰터가 시즌02에 등록되어 있었고 표시 번호와 내부 번호가 결합됨 | 별도 displayNumber와 시즌03 메타데이터. 기존 ID·number·episodeNo·URL 유지. [시즌1][시즌2][특별편] | 실제 홈 카드 URL 목록과 10/10/4 분류, 각 독립 페이지 표시 번호, 관리자 비공개 설정, 스와이프·화살표·키보드 |
| 신규 4화 | 독립 회차 파일 없음 | 운주사021·용주사022·선암사023·선운사024 신규 ID, 표시17~20화. 48장면·24문제·12카드, 독립 수채화64장과 WebP128개 | WebKit390/820, Chromium412/1440에서 12장면 이미지 디코딩·슬라이더·전체화면·다음·6정답·3카드·소감·재접속 복원. SHA256와 파일 크기, 출처 확인 |
| 파주 보광사 | 상세 지도에는 동명 구분 항목이 없었고 기존 좌표를 사용. GPS는 이름으로 저장한 관리자 확정점·캐시를 먼저 사용 | 국가유산청의 파주 주소·좌표를 동일 고유 장소 기준으로 지도·길찾기·거리·GPS에 적용. 서울의 이름 같은 개인 장소와 구분. 잘못된 공유/개인 원본은 일괄 덮어쓰지 않음 | 잘못된 서울 캐시·관리자 기준점을 넣어도 파주 지도 좌표·목적지 사용. 실제 GPS 콜백 흐름에서 서울 거부, 파주 12초 머무름 승인. 재접속, 방문·사진·소감 보존 |
| 사진 ZIP | 비동기 생성 뒤 자동 a.click()에 의존. 초기 백업 범위·0장·저장 상태 안내 부족 | 생성·SHA256/CRC 확인 후 파일명·용량과 직접 ZIP 저장 링크 제공. 지원 시 파일 공유, 취소 안내. 로컬 사진만 포함함을 명시 | 모의 일반회원 Chromium/WebKit 실제 ZIP 다운로드→새 프로필 복원→이미지 디코딩·장소 ID 연결. 중복·손상 ZIP·0장·공유 취소, 사용자 클릭 시 공유 시작 확인 |

## 검증 범위

자동 검사는 운영 사이트와 같은 파일을 로컬 라우팅하고 모의 Firebase 일반회원/관리자를 사용했습니다. 운영 사용자의 계정에 로그인하거나 운영 Firebase 기록을 조회·수정하지 않았습니다. 실제 아이폰·아이패드·갤럭시 및 파일 앱/실제 OS 공유 화면은 검사하지 않았습니다. Web Share API는 사용자 클릭 활성화와 취소 경로를 모의 검사했고, ZIP 다운로드는 브라우저에서 실제 파일을 받아 새 프로필로 복원했습니다.

- 기존 20개 회차 content.js는 기준 커밋과 바이트 단위로 동일합니다. URL·내부 회차 번호·저장 ID도 동일합니다.
- store.js의 IndexedDB 이름·버전·스키마를 바꾸지 않았습니다. 구 버전 사진 코드에서 저장한 Blob의 SHA256·소유자·MY001·방문 기록·소감이 업데이트 후 그대로이고 이미지 디코딩도 통과했습니다.
- 공식108 목록·수호카드·기존 사진·GPS 저장 경로를 초기화하지 않습니다. 개인 번호는 로그인 계정의 기존 personalTempleCards 경로에만 추가하며 기존 번호를 유지합니다.
- 홈에는 경량 메타데이터와 인접 썸네일만 로드합니다. 24편 본문·장면·퀴즈·카드는 선로딩하지 않습니다. 390px 홈 영역은 3개 탭 포함 약369px, 이미지150px입니다. PC는 이미지160px입니다.
- 이미지64장은 모두 생성 후 검토했고 운주사 석조불감의 옆벽과 승선교 홍예 아래 용머리 위치를 수정했습니다. 실제 사진·실측 복원도라는 표시는 하지 않습니다.

## 역사 자료 검토

각 회차의 ‘역사 자료 보기’와 CREDITS.html에 원문 링크와 검토 범위를 수록했습니다. 국가유산청 상세 페이지의 별도 안내판/국가유산 설명도 읽었습니다. 원본 참고 사진은 재배포하지 않습니다.

- 운주사: [와형 석조여래불](https://encykorea.aks.ac.kr/Article/E0075284), [석조불감](https://encykorea.aks.ac.kr/Article/E0040381), [원형 다층석탑](https://encykorea.aks.ac.kr/Article/E0040382). 좌불·입불 형상을 한 두 와불과 천불천탑 전승을 구분했습니다.
- 용주사: [사찰 역사](https://encykorea.aks.ac.kr/Article/E0039674), [대웅보전](https://encykorea.aks.ac.kr/Article/E0076951). 1789년 현륭원 이장과 1790년 건립, 3칸 단층 전각과 문언의 일을 구분했습니다.
- 선암사: [승선교](https://encykorea.aks.ac.kr/Article/E0028796), [호암 약휴](https://encykorea.aks.ac.kr/Article/E0035388). 강선루는 다리 위가 아니라 너머에 있고 관음보살·용머리 제거 이야기는 전승입니다.
- 선운사: [마애불](https://encykorea.aks.ac.kr/Article/E0028834), [국가유산청 안내판](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1123512000000), [손화중](https://encykorea.aks.ac.kr/Article/E0030591). 안내판의 1892년 비기 이야기는 전설로 소개합니다. 원문마다 높이와 옛 전각 해석이 달라 크기를 단정하지 않았습니다. 고려시대로 보는 조각과 조선 후기 동학 활동을 분리했습니다.
- 보광사: [국가유산청 보광사대웅보전](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=2113100830000)의 주소 ‘경기 파주시 광탄면 보광로474번길87’과 지도 호출 좌표를 확인했습니다. 위도37.7529977350211, 경도126.91994400383. 공식 108의 보광사에만 적용하며 서울의 별도 장소 ID를 합치지 않습니다.

## 실행한 검사

`personal-collection-integration.cjs`, `photo-backup-restore.cjs`, `photo-update-preserves.cjs`, `bogwangsa-location.cjs`, `gps-party-save.cjs`, `device-photo-accounts.cjs`, `home-photo-regression.cjs`, `atlas-four-new.cjs`, `atlas-season2-content.cjs`, `atlas-season.cjs`, `atlas-season-switch.cjs`, `atlas-home-catalog.cjs`, `atlas-home-images.cjs`, `mobile-navigation-worker.cjs`.

[개인 도감 화면](personal-webkit.webp) · [ZIP 저장 단계](backup-webkit.webp) · [신규 회차 예시](reader-webkit.webp)
