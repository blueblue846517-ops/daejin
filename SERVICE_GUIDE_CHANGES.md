# 시공 가이드 개편 — 2026-10-21

## 변경 사항
- 5개 시공 페이지의 제목을 시공명 / 시공가이드 두 줄로 정리.
- 상단 영문 표시, 소개 슬로건, 안내 문단, 아래로 이동 링크, 이미지 캡션, 적용 공간·장점·유의사항 카드 및 메인 복귀 링크 삭제.
- 공법 비교표를 읽기 쉬운 카드로 변경. 시공 프로세스는 단계명과 핵심 설명으로 축약.
- 우레탄: 일반 우레탄 / 고경질 우레탄·논슬립 / 습기 배출 공법의 세 카드 및 개별 이미지.
- 우레탄 공정: 바탕면 정리 → 하도 도포 → 우레탄 실란트 균열 보수 → 중도 도포 → 중도 2차 도포 → 상도.
- 보수공사: 트렌치(배수로) 교체, 샷시 교체·보수, 타일 보수 중심으로 소개·공정·점검·FAQ 교체.
- 홈페이지·회사소개·시공사례·시공 가이드의 상단 시공 분야에 5개 하위 메뉴 추가. 마우스 접근, 펼침 버튼, 키보드 및 모바일 메뉴 지원.

## 작업 위치와 배포
최신 GitHub main을 별도 작업 폴더에 받아 수정했습니다. 바탕화면의 이전 소스는 덮어쓰지 않았습니다.
수정된 정적 HTML도 포함되므로 Node 빌드 없이 기존 방식으로 배포할 수 있습니다.
향후 문구 수정은 scripts/services-content.cjs, 공통 구조는 scripts/build-services.cjs에서 수정한 뒤 `node scripts/build-services.cjs`로 생성합니다.
운영 사이트 배포 및 브라우저 동작 테스트는 수행하지 않았습니다. 정적 페이지 생성 명령은 정상 완료했습니다.

## 생성 이미지
내장 image_gen(text-to-image)으로 각각 생성한 설명용 이미지입니다. 실제 시공 실적으로 표시하지 않으며 페이지에 AI 생성 예시임을 안내합니다.
선택한 이미지를 960×720 WebP로 저장했습니다.
- assets/images/services/urethane-coating.webp: 녹색 옥상 우레탄 도막과 롤러 작업자, 자연광의 실제적인 시공 예시.
- assets/images/services/urethane-parking.webp: 고경질 우레탄 마감의 옥상 주차장, 전경에 논슬립 질감, 흰 주차선.
- assets/images/services/urethane-vent.webp: 옥상 바닥의 구멍에 고무 배출관을 설치하는 장면. 시공 상세 설계도는 아닙니다.

각 이미지 프롬프트의 공통 조건: photorealistic construction service guide illustration, Korean commercial rooftop, landscape 4:3, natural daylight, realistic material textures, no text or watermark, illustrative example rather than actual contractor portfolio.
원본 PNG는 Codex generated_images 폴더에 보존했습니다. 사진을 바꾸려면 위 세 WebP를 같은 비율로 교체하면 됩니다.
