# 실제 특징을 살린 대표 수채화 시스템

## 현재 반영 범위

최신 사찰 카탈로그는 111곳입니다. **개별 형태를 검토한 대표 일러스트 33곳과 건축물을 그리지 않은 공통 숲길 기본 이미지 1개**를 반영합니다. **나머지 78곳은 개별 건축 형태 검토가 남아 있습니다. 111곳 모두 고유 대표 그림이 완료된 것이 아닙니다.** 확인되지 않은 절에는 다른 절 그림이나 임의로 만든 건축물을 연결하지 않고 기본 숲길 그림을 사용합니다. 카드 위 준비·출처·수채화 배지는 표시하지 않습니다.

[전체 111곳의 검토 상태와 실제 연결 파일](coverage.csv)에 reviewed와 needs-form-verification을 구분했습니다. 생성만 된 미검증 시안은 GitHub Pages에 올리지 않습니다. 추가 사찰은 공식 사진/건축 설명의 형태 확인 → 텍스트 제작 사양 → 독립 원화 생성 → 지붕·배치·산세·대표 요소 대조 → 개별 WebP 등록 순서로 진행합니다.

사용자는 사진을 형태 확인용으로만 열람하도록 허용했습니다. 새 대표 그림은 사진을 이미지 생성 도구에 제공하거나 변환하지 않고 **텍스트 지시로 직접 제작**했습니다. 공식 참고 원본 파일은 저장소에 포함하지 않았으며 런타임에도 불러오지 않습니다. 남은 사찰의 현재 형태를 확인할 추가 자료와 검토가 필요합니다. 소재지가 다른 동명 사찰, 내부 유물 사진, 부속 암자만 있는 결과를 본전 외관 근거로 사용하지 않았습니다.

## 제작·형태 검토

따뜻한 아이보리·세이지·은은한 금빛에 소량의 연분홍을 사용합니다. 사진을 필터 처리하지 않으며 768×512 WebP(개별 160,000바이트 미만)를 사용합니다. 판넬로 생성한 원화는 기계적으로 분리·리사이즈했으며 의미 있는 건축 요소를 코드로 합성하지 않았습니다. 검토 대상의 공식 건축 사진은 텍스트 사양을 정리할 때만 별도로 열람했습니다.

갑사 철당간에 생성된 장식 보주·원판을 제거했고, 관룡사의 암릉은 독립된 뾰족 봉우리 대신 연속된 병풍바위로 수정했습니다. 예천 용문사 대장전과 칠장사 대웅전의 팔작처럼 생성된 지붕은 맞배로 고쳤습니다. 기존 시안의 허구 암벽 불상·하천·전각·다층탑은 반영하지 않았습니다. 고운사는 알려진 대웅보전의 구조에 한정하며 산불 이후 경내 전체의 임의 복원도를 만들지 않습니다.

| 카탈로그 ID | 지역 | 실제 연결 파일 |
|---|---|---|
| temple:각연사 | 충청 | temple-각연사.webp |
| temple:갑사 | 충청 | temple-갑사.webp |
| temple:갓바위(선본사) | 경상 | temple-갓바위(선본사).webp |
| temple:개심사 | 충청 | temple-개심사.webp |
| temple:개암사 | 전라 | temple-개암사.webp |
| temple:건봉사 | 강원 | temple-건봉사.webp |
| temple:고운사 | 경상 | temple-고운사.webp |
| temple:관룡사 | 경상 | temple-관룡사.webp |
| temple:관음사 | 제주 | temple-관음사.webp |
| temple:낙산사 | 강원 | temple-낙산사.webp |
| temple:동화사 | 경상 | temple-동화사.webp |
| temple:문수사 | 충청 | temple-문수사.webp |
| temple:백양사 | 전라 | temple-백양사.webp |
| temple:범어사 | 경상 | temple-범어사.webp |
| temple:벽송사 | 경상 | temple-벽송사.webp |
| temple:보문사 | 수도권 | temple-보문사.webp |
| temple:봉정사 | 경상 | temple-봉정사.webp |
| temple:불국사 | 경상 | temple-불국사.webp |
| temple:불영사 | 경상 | temple-불영사.webp |
| temple:석굴암 | 경상 | temple-석굴암.webp |
| temple:송광사 | 전라 | temple-송광사.webp |
| temple:신륵사 | 수도권 | temple-신륵사.webp |
| temple:옥천사 | 경상 | temple-옥천사.webp |
| temple:완주 송광사 | 전라 | temple-완주 송광사.webp |
| temple:용문사(양평) | 수도권 | temple-용문사(양평).webp |
| temple:용문사(예천) | 경상 | temple-용문사(예천).webp |
| temple:은해사 | 경상 | temple-은해사.webp |
| temple:직지사 | 경상 | temple-직지사.webp |
| temple:천은사 | 전라 | temple-천은사.webp |
| temple:칠장사 | 수도권 | temple-칠장사.webp |
| temple:통도사 | 경상 | temple-통도사.webp |
| temple:파계사 | 경상 | temple-파계사.webp |
| temple:해인사 | 경상 | temple-해인사.webp |

images/temple-covers/manifest.json에 ID·지역·파일·크기·SHA-256·제작 방식·검토한 형태와 근거를 남깁니다. 검토 기록은 실측 복원도나 현장 조사 완료를 뜻하지 않습니다. 기존 사진 기반 7개 파일과 크레딧 페이지는 이전 캐시/URL의 호환과 해당 자료의 권리 고지를 위해 남기지만 새 대표 이미지 시스템에서는 참조하지 않습니다.

## 앱 연결과 기존 데이터 보호

- scripts/temple-covers.js는 정확한 NFC 사찰명+지역을 매칭합니다. 사용자 Firebase 키를 변경하거나 이미지 경로를 사용자 데이터에 저장하지 않습니다.
- cardCoverMedia, 목록 catalogThumbHtml, 상세 renderAutoCoverPhotos가 같은 레지스트리 자산을 사용합니다. 목록/홈 3:2, 상세 object-fit:contain으로 전체 그림을 유지합니다.
- 사찰 대표 이미지는 Wikipedia/Commons/Openverse 검색·대기열·자동 교체·재시도를 사용하지 않습니다. 해당 기능을 공유하는 **산 사진**은 유지합니다. 지도 좌표 조회를 사진 검색과 혼동해 차단하지 않습니다.
- 사용자 photos, photoOrder, 방문·앨범·108 수호카드·현장 인증 경로는 수정/삭제하지 않습니다. renderPhotos와 상세의 개인 사진 영역은 그대로입니다. 이전 자동 사진 메타데이터도 초기화하지 않습니다.
- 개별 그림이 없거나 등록되지 않은 절은 default-watercolor.webp를 사용합니다. 로컬 파일 로딩 실패에도 스크립트에 내장한 작은 숲길 WebP로 전환하여 사진 검색·깨진 박스가 생기지 않게 합니다.
- 목록/홈은 lazy loading, 상세 대표는 eager/high priority이며 고정 비율로 레이아웃 이동을 줄입니다.

## 검증

tests/temple-covers.cjs: Chromium 320/390/412/768/820/1440px에서 모든 111개 목록 매핑, 검토된 그림 파일·해시·중복 방지·용량·실제 디코딩, 잘못된 지역 매칭 거부, 동일 자산의 상세 사용, 3:2/글씨 비겹침/contain, 외부 사진 검색 없음, 배지 없음, 커스텀 절 기본 그림, 실패 시 내장 WebP, 사용자 사진·방문 fixture 보존을 검사합니다. 기존 목록 상세/산 사진·홈/수호카드/게임 이동 검사도 수행합니다. 물리 iPhone/iPad Safari·Galaxy 검증과 실제 운영 계정 검사는 별도입니다.
