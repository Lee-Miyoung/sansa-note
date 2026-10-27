# 미완료 콘텐츠 실제 제작 결과 · 2026-10-27

기준 main `200cbb9`. 기존 버전을 변경 없이 재배포하지 않았습니다. 실제 새 원화·WebP·썸네일과 방문팁 데이터를 추가했고, 기존 검증 완료분은 재제작하지 않았습니다.

| 항목 | 기존 완료 | 신규 완료 | 최종 완료 | 미완료 |
|---|---:|---:|---:|---:|
| 방문팁 | 107 | 3 | 110 | 1 |
| 사찰 그림 | 103 | 7 | 110 | 1 |
| 산 그림 | 56 | 41 | 97 | 3 |

미완료 항목을 완료 수에 포함하지 않았습니다. 생성 도구는 실제 이용 가능했고 새 원화 48장과 압축본·썸네일 96개 파일을 제작했습니다. 원본 참조 사진은 게시하거나 생성 도구에 전달하지 않았습니다. 사진을 직접 변환하거나 다른 장소의 그림을 복사하지 않았습니다.

## 새 방문팁 데이터

파일: `data/visit-tips.json` ([신규 3건만 보기](new-visit-tips.json)).

### 약천사

- **지붕을 세 번 따라가요**: 큰 법당의 지붕이 위로 층층이 이어져요. 앞마당에서 전체 모습을 본 다음, 가까이에서 처마 아래 단청과 붉은 기둥을 살펴보세요.
- **넓은 마당과 전각의 크기**: 법당 앞의 넓은 마당에서는 계단과 전각의 규모를 함께 볼 수 있어요. 가까이에서 본 문과 멀리서 본 건물의 비례를 비교해 보세요.

- 출처: [약천사1.jpeg · Wikimedia Commons 공개 라이선스 사진](https://commons.wikimedia.org/wiki/File:%EC%95%BD%EC%B2%9C%EC%82%AC1.jpeg), 확인 2026-10-27

### 원당사

- **현재 이름과 옛 절터 구분**: 오층석탑의 현재 소재지는 불탑사예요. 자료에 나오는 ‘옛 원당사지’와 현재 사찰 이름을 구분하고, 석탑을 보려면 불탑사의 위치를 확인해 주세요.
- **제주의 돌로 만든 탑**: 불탑사 오층석탑은 기단부터 위쪽 부재까지 현무암으로 만들었어요. 다른 지역의 밝은 화강암 탑과 달리, 돌의 색과 표면을 가까이 살펴보는 재미가 있어요.

- 출처: [제주 불탑사 오층석탑 · 한국민족문화대백과사전](https://encykorea.aks.ac.kr/Article/E0025044), 확인 2026-10-27

### 해동용궁사

- **바다가 법당의 배경**: 전각 바로 아래로 해안 바위와 바다가 이어져요. 지붕만 보기보다 석축·바위·파도가 만나는 사찰의 배치를 함께 살펴보세요.
- **돌난간을 따라 보는 풍경**: 밝은 돌난간이 전각 앞과 바다 쪽 가장자리를 따라 이어져요. 난간 안쪽의 관람 공간과 그 너머 바위 해안을 나누어 보면 이 절의 자리가 더 잘 보여요.

- 출처: [Haedong Yonggungsa Temple, Busan, South Korea.jpg · Wikimedia Commons 공개 라이선스 사진](https://commons.wikimedia.org/wiki/File:Haedong_Yonggungsa_Temple,_Busan,_South_Korea.jpg), 확인 2026-10-27

## 신규 그림 48곳 및 파일

기존 107개 방문팁, 159개 작품 레코드, 원본·썸네일 317개 파일의 이전 해시를 비교해 보존했습니다. 산 그림에는 문헌에서 확인한 지형·식생·수계에 바탕을 둔 감성 수채화가 포함됩니다. 특정 지점의 정확한 실경이나 정밀 지형 복원도로 표시하지 않습니다. 사진 근거가 있는 경우에도 새로운 구도의 창작 그림입니다.

원당사 항목의 기존 설명은 오층석탑을 가리키고 있었습니다. 국가유산 T-1187과 AKS 본문·참고문헌을 대조해 **현재 불탑사에 있는 옛 원당사지 관련 석탑**임을 확인했습니다. 그림·팁·상세화면에 이 관계를 명시했으며 현재 원당사 전각을 임의로 재현하지 않았습니다. 기존 장소 ID와 사용자 기록은 유지했습니다.

| 장소 | 지역 | 대표 특징 | 새 원본 파일 | 출처 |
|---|---|---|---|---|
| 봉정암 | 강원 | 설악산 바위 위 오층석탑 | `/images/temple-covers/completed-봉정암.webp` | [자료](https://commons.wikimedia.org/wiki/File:%EB%B4%89%EC%A0%95%EC%95%94%EC%84%9D%ED%83%91.jpg) |
| 삼광사 | 경상 | 금빛 이층 처마와 부산 도심의 배경 | `/images/temple-covers/completed-삼광사.webp` | [자료](https://commons.wikimedia.org/wiki/File:Samgwangsa_temple,_Busan.jpg) |
| 약천사 | 제주 | 세 겹 지붕의 큰 법당 | `/images/temple-covers/completed-약천사.webp` | [자료](https://commons.wikimedia.org/wiki/File:%EC%95%BD%EC%B2%9C%EC%82%AC1.jpeg) |
| 원당사 | 제주 | 옛 원당사지 관련 불탑사 현무암 오층석탑 | `/images/temple-covers/completed-원당사.webp` | [자료](https://commons.wikimedia.org/wiki/File:Five_layers_stone_pagoda.jpg) |
| 청평사 | 강원 | 회전문과 오봉산 산자락 | `/images/temple-covers/completed-청평사.webp` | [자료](https://commons.wikimedia.org/wiki/File:BRINKHOFF_CHUNCHEON_2.JPG) |
| 해동용궁사 | 경상 | 해안 석축·전각·바위와 파도 | `/images/temple-covers/completed-해동용궁사.webp` | [자료](https://commons.wikimedia.org/wiki/File:Haedong_Yonggungsa_Temple,_Busan,_South_Korea.jpg) |
| 향일암 | 전라 | 해탈문 바위 틈길 | `/images/temple-covers/completed-향일암.webp` | [자료](https://commons.wikimedia.org/wiki/File:Haetalmun_of_Hyangiram_in_2017.jpg) |
| 가리왕산 | 강원 | 고산 연봉과 자작나무·주목 | `/images/mountain-covers/completed-가리왕산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000149) |
| 가야산(서산) | 충청 | 석문봉 일대의 토르와 바위 능선 | `/images/mountain-covers/completed-가야산(서산).webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000273) |
| 가지산 | 경상 | 화강암 암봉과 갈라지는 능선 | `/images/mountain-covers/completed-가지산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000364) |
| 간월산 | 경상 | 가파른 능선과 좁고 깊은 계곡 | `/images/mountain-covers/completed-간월산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000563) |
| 감악산 | 수도권 | 파주·양주·연천의 바위 능선 | `/images/mountain-covers/completed-감악산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000789) |
| 검단산 | 수도권 | 넓은 정상 지대와 팔당 수계 | `/images/mountain-covers/completed-검단산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0002061) |
| 계방산 | 강원 | 겨울 주목·소나무와 고산 능선 | `/images/mountain-covers/completed-계방산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0003140) |
| 광덕산 | 강원 | 화천·철원·포천의 연봉과 분수계 | `/images/mountain-covers/completed-광덕산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0005089) |
| 국망봉 | 수도권 | 포천·가평의 연결된 고산 연봉 | `/images/mountain-covers/completed-국망봉.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0060191) |
| 남산 | 수도권 | 서울의 낮은 산지와 남산타워 | `/images/mountain-covers/completed-남산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0011947) |
| 모악산 | 전라 | 북동·남서 주능선과 참나무·소나무 숲 | `/images/mountain-covers/completed-모악산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0018517) |
| 민둥산 | 강원 | 정선의 억새군락과 산지 | `/images/mountain-covers/completed-민둥산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0050384) |
| 민주지산 | 충청 | 호상편마암과 연결된 산지·계류 | `/images/mountain-covers/completed-민주지산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0020299) |
| 방태산 | 강원 | 이단폭포 | `/images/mountain-covers/completed-방태산.webp` | [자료](https://commons.wikimedia.org/wiki/File:When_Autumn_Comes_To_Korea_(125962645).jpeg) |
| 백덕산 | 강원 | 험한 고산 능선과 분기하는 계곡 | `/images/mountain-covers/completed-백덕산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0022041) |
| 백운산 | 전라 | 광양 산체에서 남쪽으로 뻗는 네 지맥 | `/images/mountain-covers/completed-백운산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0005181) |
| 변산 | 전라 | 내변산의 유문암 계곡과 암반 계류 | `/images/mountain-covers/completed-변산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0022922) |
| 비슬산 | 경상 | 돌강인 암괴류 | `/images/mountain-covers/completed-비슬산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0025184) |
| 연인산 | 수도권 | 잣나무·참나무 숲과 용추계곡 설정 | `/images/mountain-covers/completed-연인산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0079424) |
| 오봉산 | 강원 | 청평사 뒤쪽의 춘천 오봉산 산자락 | `/images/mountain-covers/completed-오봉산.webp` | [자료](https://commons.wikimedia.org/wiki/File:BRINKHOFF_CHUNCHEON_2.JPG) |
| 용문산 | 수도권 | 편마암 산체와 수목이 적은 정상부 | `/images/mountain-covers/completed-용문산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0039487) |
| 운악산 | 수도권 | 포천·가평의 산지와 계곡 설정 | `/images/mountain-covers/completed-운악산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0040336) |
| 월악산 | 충청 | 화강암 산체·능선·계곡 설정 | `/images/mountain-covers/completed-월악산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0041025) |
| 월출산 | 전라 | 영암 북쪽의 가파른 돌산 | `/images/mountain-covers/completed-월출산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0041086) |
| 유명산 | 수도권 | 겨울 정상 개활지와 산릉 조망 | `/images/mountain-covers/completed-유명산.webp` | [자료](https://commons.wikimedia.org/wiki/File:Panoramic_View_at_Peak_of_Yumyeong_Mountain_20090110.jpg) |
| 육백산 | 강원 | 고위평탄면과 재조림 숲 | `/images/mountain-covers/completed-육백산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0042099) |
| 인왕산 | 수도권 | 노출 화강암과 능선의 성곽 | `/images/mountain-covers/completed-인왕산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0046977) |
| 장산 | 경상 | 부산의 원추형 산체·쌍봉·애추 | `/images/mountain-covers/completed-장산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0067026) |
| 종남산 | 전라 | 완주 소양천 충적평야와 둘러싼 산지 | `/images/mountain-covers/completed-종남산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0039000) |
| 지리망산 | 경상 | 통영 사량도의 지리산 연계 암릉 경관 | `/images/mountain-covers/completed-지리망산.webp` | [자료](https://commons.wikimedia.org/wiki/File:Saryang_Island,_South_Korea.jpg) |
| 천관산 | 전라 | 토르·핵석과 억새 지형 | `/images/mountain-covers/completed-천관산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0055778) |
| 청계산 | 수도권 | 흙으로 덮인 낮은 편마암 산지 | `/images/mountain-covers/completed-청계산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0056245) |
| 청량산 | 경상 | 봉화의 암봉·단애와 능선 | `/images/mountain-covers/completed-청량산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0056392) |
| 청옥산 | 강원 | 동해·삼척의 소나무 산지와 무릉 수계 | `/images/mountain-covers/completed-청옥산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0056563) |
| 축령산(남양주) | 수도권 | 잣나무 숲·기암절벽·계곡 | `/images/mountain-covers/completed-축령산(남양주).webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000401) |
| 치악산 | 강원 | 남북 산릉과 가파른 서쪽 계곡 | `/images/mountain-covers/completed-치악산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0058372) |
| 칠갑산 | 충청 | 정상에서 방사상으로 뻗는 능선·수계 | `/images/mountain-covers/completed-칠갑산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0058441) |
| 태화산 | 수도권 | 광주 도척의 연봉과 좁은 곡저평야 | `/images/mountain-covers/completed-태화산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0005267) |
| 팔영산 | 전라 | 고흥의 여덟 암봉 지형 | `/images/mountain-covers/completed-팔영산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0059763) |
| 화야산 | 수도권 | 가평·양평의 산지와 북류 수계 | `/images/mountain-covers/completed-화야산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0000401) |
| 황장산 | 경상 | 문경 북부 고산지와 금천 발원 계곡 | `/images/mountain-covers/completed-황장산.webp` | [자료](https://encykorea.aks.ac.kr/Article/E0019400) |

모든 원본은 1200×800 WebP, 썸네일은 480×320 WebP입니다. 썸네일 경로·해시와 원화 제작 사양은 [새 파일 전체 목록](new-content-files.csv)과 [제작·출처 기록](artwork-worklog.json)에 있습니다. 새 원본 185KB, 썸네일 55KB를 목표 상한으로 압축했습니다.

## 미완료: 구체적 차단 원인과 다음 입력

### temple:휴휴암

양양군 관광·한국관광공사·사찰 사이트 후보 연결이 실행환경 프록시에서 403으로 거부됨. Commons에서는 휴휴암으로 확정할 수 있는 사진을 찾지 못했고, 낙산사 관음상 사진은 다른 사찰이므로 제외. 양양군 문헌에는 휴휴암의 구체 전각·조형물 정보가 없어 팁과 그림을 보류함.

확인·대조한 대체 자료:

- https://tour.yangyang.go.kr/
- https://korean.visitkorea.or.kr/
- https://english.visitkorea.or.kr/
- https://encykorea.aks.ac.kr/Article/E0035648
- https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Hyuhyuam
- https://github.com/TourLabOrganization/Tour-Navigator-App/blob/ef02ad84924728eddd9856baed46a44d37cfb0a1/assets/tour-places.csv

필요한 입력: 현남면 광진리 휴휴암임을 확인할 수 있는 공식 소개 본문(현재 URL 포함), 전경·대표 조형물·너럭바위의 직접 촬영 또는 공개 라이선스 사진과 장소·권리 정보. 낙산사 사진은 불가.

제작하지 않은 파일: `/images/temple-covers/completed-휴휴암.webp` 및 `-small.webp`.

### mountain:대야산

AKS 직접 검색에 대응 지형 항목이 없고, 문경시·괴산군 문헌의 인근 계곡을 대야산의 특정 지형으로 확정할 근거가 부족함. Commons 대체 검색의 Untitled Panoramio 사진은 한국 대야산 자료가 아니어서 제외. 문경·괴산 공식 관광 사이트 연결은 프록시 403.

확인·대조한 대체 자료:

- https://www.gbmg.go.kr/tour/main.do
- https://www.goesan.go.kr/tour/index.do
- https://encykorea.aks.ac.kr/Article/E0019400
- https://encykorea.aks.ac.kr/Article/E0005386
- https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Daeyasan

필요한 입력: 문경·괴산 대야산으로 소재지가 확인되는 공식 지형 설명 또는 능선·암반·용추계곡 전경의 사용 허용 사진. 인근의 다른 용추폭포와 구분할 수 있는 표기 필요.

제작하지 않은 파일: `/images/mountain-covers/completed-대야산.webp` 및 `-small.webp`.

### mountain:축령산

장성 축령산의 편백림·대표 지형을 명시하는 열람 가능한 자료를 확보하지 못함. 장성군 문헌과 Commons 대체 검색을 확인했으나 해당 산의 경관 대조에 부족. 남양주 축령산의 잣나무·암벽 자료는 다른 장소이므로 사용하지 않음. 장성군 관광·산림휴양 포털은 프록시 403.

확인·대조한 대체 자료:

- https://www.jangseong.go.kr/home/tour
- https://www.foresttrip.go.kr/
- https://encykorea.aks.ac.kr/Article/E0048561
- https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Jangseong%20forest

필요한 입력: 장성 서삼면 축령산 치유의 숲의 공식 수종·지형 소개 또는 장소와 이용 조건이 확인되는 편백림·산세 사진. 남양주·가평의 동명 산 자료는 불가.

제작하지 않은 파일: `/images/mountain-covers/completed-축령산.webp` 및 `-small.webp`.

### mountain:팔봉산

홍천군 문헌에서 홍천 소재지는 확인했으나 대표 암봉의 배치를 충분히 대조하지 못함. Commons의 제5경 팔봉산 사진은 서산시 제공 자료로 확인되어 홍천 팔봉산용으로 사용하지 않음. 홍천군 공식 관광 페이지는 프록시 403.

확인·대조한 대체 자료:

- https://www.hongcheon.go.kr/tour/index.do
- https://encykorea.aks.ac.kr/Article/E0064461
- https://commons.wikimedia.org/wiki/File:%EC%A0%9C5%EA%B2%BD_%ED%8C%94%EB%B4%89%EC%82%B0.jpg

필요한 입력: 강원 홍천군 서면 팔봉산과 홍천강의 관계가 확인되는 전경 또는 공식 지형 설명. 서산 팔봉산·감자축제 자료와 구별되는 장소 표기 및 사진 사용 조건 필요.

제작하지 않은 파일: `/images/mountain-covers/completed-팔봉산.webp` 및 `-small.webp`.

공식 사이트 후보의 `Tunnel connection failed: 403 Forbidden`은 실행환경의 프록시 연결 단계에서 발생했습니다. 이를 해당 사찰·기관의 실제 웹 서버 오류나 폐쇄로 단정하지 않았습니다. Commons의 429 요청 제한은 호출 간격을 늘리고 해당 요청 묶음을 중단해 대응했습니다. 읽지 못한 공식 본문을 읽은 것처럼 인용하지 않았습니다.

## 검증

- `python3 tests/catalog-preservation.py`: 기존 완료 레코드·317개 파일 보호와 초기 JS gzip 예산.
- `python3 tests/catalog-image-audit.py`: 모든 실제 작품의 파일 존재·디코딩·해시·썸네일 대응·시각적 유사도.
- `tests/catalog-complete.cjs`: 211개 장소와 별도 사용자 2곳의 목록·상세 이미지, 111개 팁, 동명 장소, 초기 미리 로딩 방지, 모의 사용자 사진·메모·GPS·MY·비밀도감 기록 보존.
- PC Chromium 1440, 갤럭시 크기 Chromium 412, 아이폰 크기 WebKit 390, 아이패드 크기 WebKit 820. 실제 기기는 사용하지 않았습니다. 실행 결과는 같은 폴더의 test JSON·로그에 기록합니다.
- 공개 그림 레지스트리 JS gzip 추정값은 9,156 → 10,182바이트(약 1KB 증가)입니다. 이 수치는 실제 휴대폰 회선의 로딩 시간 측정값이 아닙니다. 방문팁·전체 출처 원고·원본 전체 이미지·새 라이브러리를 홈페이지에서 미리 로딩하지 않습니다.

Firebase 운영 데이터·규칙, 사용자 사진, GPS 인증, 수호카드, MY 번호, 비밀도감 저장 구조를 수정·삭제·초기화하지 않았습니다. 공개 콘텐츠·표시·캐시 버전만 추가·갱신했습니다.

운영 배포 결과는 새 커밋과 GitHub Pages 실행으로 별도 확인합니다.

### 실제 통과 결과

| 환경 | 방문팁 데이터 | 그림 디코딩 | 목록 배치 | 결과 |
|---|---:|---:|---:|---|
| Chromium · PC 1440 | 111 | 207 | 213 | 통과 |
| Chromium · 모바일 412 | 111 | 207 | 213 | 통과 |
| WebKit · 아이폰 크기 390 | 111 | 207 | 213 | 통과 |
| WebKit · 아이패드 크기 820 | 111 | 207 | 213 | 통과 |

111개 팁 중 검증 완료 110개·보류 1개입니다. 목록 213개는 기본 장소 211개와 사용자 장소 모의 데이터 2개이며, 그림 보류 4개와 사용자 장소 2개는 중립 안내로 표시했습니다. 실기기 테스트는 하지 않았습니다.

기존 방문팁 107개·그림 레코드 159개·원본/썸네일 317개 파일의 해시 보존 검사 통과. 전체 207작품 SHA 중복 없음. 원본 21,321쌍과 좌우 반전 21,321쌍 dHash 검사에서 유사 후보 0개(256비트 해밍거리 22 이하). 사진·세션·GPS 기록·서비스워커·기존 비밀도감 회귀 검사 통과.

신규 콘텐츠 상세 화면도 두 브라우저에서 검사했습니다. 수채화의 큰 상하 여백은 대표 그림 영역만 3:2 비율로 조정했고, 사용자 사진 레이아웃은 유지했습니다. 원당사의 옛 절터/현 불탑사 설명 및 산 그림의 실경 정밀 재현 아님 안내를 제공합니다. 검사 로그와 화면은 [validation](validation/)에 있습니다.
