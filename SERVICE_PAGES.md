# 공정별 전문 상세 페이지 — 2026-10-20

## 구조와 콘텐츠

기존 사이트는 프레임워크 없는 정적 HTML/CSS/JavaScript 사이트입니다. 기존 구조에 맞춰 HTML을 사전 생성합니다. 서비스 설명·비교표·단계·FAQ·문의 폼은 초기 HTML에 포함되며, Supabase 로딩이나 JavaScript 실행이 없어도 핵심 설명을 읽을 수 있습니다.

| URL | 주요 콘텐츠 및 SEO 타깃 |
| --- | --- |
| https://www.daejinwnc.com/services/urethane | 옥상 우레탄 방수, 노출·비노출 비교, 바탕 정리·하도·중도·상도, 들뜸·배수·유지관리 |
| https://www.daejinwnc.com/services/epoxy | 지하주차장 에폭시, 코팅·라이닝 비교, 연삭·균열 보수, 차량 통행·양생·미끄럼·수분 |
| https://www.daejinwnc.com/services/injection | 인젝션 방수, 지하·콘크리트 균열 누수, 주입재 선택, 재누수와 적용 한계 |
| https://www.daejinwnc.com/services/painting | 내외부 도장, 외벽 도장공사, 도료·바탕 선택, 균열·박리·변색·환기 |
| https://www.daejinwnc.com/services/repair | 건물 보수공사, 콘크리트 균열·손상, 바닥 철거·복구, 누수 관련 보수와 진단 범위 |

페이지마다 FAQ 6개, 견적 산정 요소, 전화 상담, 현장 방문 견적 안내, 기존 빠른 견적 폼, 관련 공정 내부 링크가 있습니다. 사용자 최종 요청에 따라 메인·회사소개·상세 페이지의 시공 지역 안내 문구와 사례 사진 아래 추가 안내 링크를 제거했습니다. 고정 공사비·기간·보증이나 미확인 자격·실적을 추가하지 않았습니다. 일반 에폭시 도장을 누수 방수와 구분하고, 인젝션의 적용 한계와 구조 진단 필요성을 설명했습니다.

## 수정한 기존 파일

- `index.html`: 기존 카드의 사진·제목·배치를 유지하면서 5개 공정 링크 추가. 인젝션 설명의 확정적 효과 표현 수정. 시공 지역 안내 제거와 스타일 캐시 버전 갱신.
- `assets/css/styles.css`: 링크 카드 키보드 포커스 스타일.
- `about.html`: 시공 지역 안내 문구 제거 및 소개 내용에 맞게 제목·설명 정리.
- `sitemap.xml`: 신규 5개 URL 추가, 메인과 회사소개 실제 수정일 갱신.

## 신규 파일

- `services/urethane.html`, `services/epoxy.html`, `services/injection.html`, `services/painting.html`, `services/repair.html`: 배포할 정적 페이지.
- `assets/css/services.css`: 기존 녹색 브랜드 토큰을 사용한 상세 페이지 스타일, 모바일 문의 바.
- `assets/js/service-catalog.js`: 기존 사례 제목에서 확인할 수 있는 공정만 분류.
- `assets/js/service-page.js`: 공정별 사례 로딩·갤러리·오류/빈 상태·기존 개인정보 모달 연결.
- `assets/images/services/{urethane,epoxy,injection,painting,repair}-{640,1200}.webp`: 기존 대표 이미지에서 만든 총 10개 반응형 이미지. 약 24–157KB/장. 공정 안내 이미지로 표시하며 회사 실적으로 주장하지 않음.
- `vercel.json`: 지정한 5개 서비스 경로만 HTML로 연결하는 rewrite. 기존 API·관리자·HTML 경로를 포괄적으로 바꾸지 않음.
- `scripts/services-content.cjs`: 공정별 콘텐츠 원본.
- `scripts/build-services.cjs`: 콘텐츠와 기존 공통 영역에서 정적 HTML 생성.
- `scripts/optimize-service-images.cjs`: sharp를 이용한 대표 이미지 WebP 생성.
- `scripts/preview-services.cjs`: Vercel rewrite와 동일한 경로를 제공하는 로컬 확인 서버.
- `scripts/test-services.cjs`: 구조·SEO·라우팅·사례 분류·오류 상태·문의 전달 검증.
- `SERVICE_PAGES.md`: 작업·유지관리 기록.

로컬 전용: `.service-backup/`에는 작업 전 GitHub 파일을 보관했습니다. `service-proof/`에는 확인 화면을 보관합니다. 이 두 폴더는 배포 대상이 아닙니다.

## 기존 기능과 데이터 연동

Supabase 테이블·정책·관리자 코드는 수정하지 않습니다. 기존 `siteData.listPortfolios` / `siteData.gallery`를 사용하며, 사례 영역 근처에 도달했을 때만 조회합니다. 이미지가 없는 기존 행은 해당 사례의 실제 사진 목록에서 첫 사진을 표시합니다. 조회 오류와 빈 목록은 안내를 표시하고 본문·문의 기능을 유지합니다.

현재 데이터에 공정 분류 필드가 없어 제목을 기준으로 보수적으로 분류합니다. 예를 들어 ‘옥상방수’만 적힌 사례를 우레탄 사례로 간주하지 않으며, ‘주차장’만 있는 사례를 에폭시로 간주하지 않습니다. 우레탄·에폭시가 명시된 공개 사례가 없는 경우 빈 상태가 정상입니다. 위치는 별도 데이터 필드가 없어 제목에 있는 확인된 내용만 그대로 표시합니다.

기존 사례는 독립 상세 URL 대신 사진 모달을 사용합니다. 상세 페이지도 같은 갤러리를 재사용합니다. 사용자 최종 요청에 따라 사진 아래 개별 안내 링크는 넣지 않으며, 사례 섹션 하단의 전체 사례 이동과 메인 시공 분야 카드·상세 페이지 하단의 공정 간 탐색을 제공합니다. 기존 메인 사례 스크립트는 원래 상태로 유지합니다.

문의는 기존 `heroQuoteForm`의 Google Forms action·필드명과 `public-page.js`의 Supabase 저장 및 Forms 전달 로직을 재사용합니다. 완료 이동만 `/thanks.html` 절대 경로로 연결합니다. 실제 고객 문의·SMS를 발생시키는 운영 제출은 테스트하지 않았습니다.

## 검증

- `node scripts/check-source.cjs`: 전체 13개 JavaScript 문법 및 기존 주요 4개 페이지 자산 검사 통과.
- `node scripts/test-services.cjs`: 5개 페이지 단일 H1·고유 메타·canonical·JSON-LD·자산·30개 FAQ·사이트맵·기존 폼 경로 통과.
- 모의 데이터 검사: 관련 사례 선택, 무관한 사례 제외, 빈 목록, 통신 실패와 재시도 UI, 문의 저장 성공/실패와 기존 Forms 전달 및 중복 제출 방지 통과.
- 로컬 HTTP: 5개 직접 경로 200, 알 수 없는 서비스 경로 404. JS 없이 응답 HTML에 핵심 콘텐츠 포함.
- 브라우저: 390px 모바일 5개 페이지 H1 1개·FAQ 6개·가로 넘침 없음. 메인 카드 이동, 내부 공정 이동, 새로고침 및 뒤로가기 확인.
- 데스크톱 1280px에서도 5개 페이지 가로 넘침 없음. 기존 개인정보 안내 모달 열기와 갤러리 다음 사진 이동 확인.
- 실제 Supabase 읽기: 인젝션·도장·보수 관련 제목 확인, 인젝션 현장 5장 갤러리 열기 성공. 데이터 쓰기 없음.
- 메타는 `data-seo-source="static"`으로 기존 전역 SEO 설정의 덮어쓰기를 방지합니다. 구조화 데이터는 기존 사업자 정보, Service, WebPage, BreadcrumbList만 사용합니다. 리뷰·별점·검증되지 않은 보증은 추가하지 않았습니다.
- 검색엔진의 실제 색인과 순위, 네이버 계정 내 수집 상태, 실제 휴대폰 기기 및 운영 문의 전달은 별도 확인 대상입니다.

## 운영 배포 확인

2026-10-20 GitHub main 반영 후 Vercel 배포 성공을 확인했습니다. 구현 커밋: https://github.com/blueblue846517-ops/daejin/commit/a5cafe9ddce6a929537a8bd94302870193fac659

운영 사이트의 5개 서비스 URL 모두 HTTP 200이며, 응답 HTML과 모바일용 WebP가 로컬 배포본과 일치했습니다. 메인·회사소개·사이트맵·robots.txt 역시 운영 파일과 로컬 파일이 일치했습니다. 운영 우레탄 페이지에서 제목·canonical·단일 H1·대표 이미지 로딩과 시공 지역 안내 삭제를 확인했습니다. 모든 페이지의 핵심 설명은 초기 HTML에 포함됩니다.

실제 문의 제출·전화 연결, 관리자 계정의 데이터 변경은 수행하지 않았습니다. 네이버와 구글의 실제 색인 완료나 검색 순위는 아직 확인되지 않았습니다.

## 네이버 서치어드바이저 후속 작업

1. 배포 후 등록된 `https://www.daejinwnc.com/` 속성의 소유확인 상태를 확인합니다. 기존 메인 네이버 인증 태그는 유지했습니다.
2. 요청 → 사이트맵 제출에서 `https://www.daejinwnc.com/sitemap.xml` 제출/처리 상태를 확인합니다. 이미 등록된 경우 변경된 파일을 읽는지 확인합니다.
3. 신규 5개 URL을 웹 페이지 수집 요청에 제출합니다.
4. 웹 페이지 최적화 검사에서 제목·설명·수집 가능 여부를 확인하고, 이후 수집·색인 현황을 확인합니다. 요청 접수와 검색 노출은 구분합니다.

공식 안내: https://searchadvisor.naver.com/guide/ 및 https://searchadvisor.naver.com/grow

## 유지관리

콘텐츠 수정: `scripts/services-content.cjs` 편집 → `node scripts/build-services.cjs` → 생성된 HTML을 함께 배포합니다. 기존 헤더·푸터·문의 폼·약관 모달은 빌드 시 메인에서 복사하므로 공통 영역 변경 후 재생성합니다. 기존 공통 JavaScript는 재사용합니다.

대표 이미지 변경 시 `sharp`를 사용할 수 있는 Node 환경에서 `node scripts/optimize-service-images.cjs`를 실행합니다. 평상시 배포에는 Node 빌드나 새 패키지 설치가 필요 없으며 생성된 HTML과 WebP를 그대로 배포합니다.

로컬 미리보기: `node scripts/preview-services.cjs` 실행 후 `http://127.0.0.1:4173/services/urethane` 접속. 테스트는 미리보기 서버 실행 상태에서 수행합니다.
