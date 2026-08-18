## 프로젝트 개요

* 본 프로젝트는 **(주)대진특수방수**의 공식 홈페이지 디자인 틀(프레임워크)입니다.  
**심미성 높은 맞춤형 컬러 팔레트**: 신뢰감 있는 딥 네이비(`--color-primary`), 청량한 시안(`--color-accent`), 강조용 골드(`--color-accent-gold`)를 조화롭게 구성.
* **가독성 높은 타이포그래피**: Google Fonts 및 **Pretendard**, **Outfit** 폰트 적용.
* **인터랙티브 기능**: 자동 재생 히어로 카루셀, 시공사례 필터링, 시공법 상세 정보 모달, 온라인 무료 견적 신청 폼 및 모바일 반응형 햄버거 메뉴.

\---

## 폴더 및 파일 구조

```text
c:\\Users\\user\\Desktop\\daejin\\
├── index.html                # 메인 홈페이지 HTML (SEO 최적화 완료)
├── README.md                 # 사용 및 수정 안내 문서
└── assets/
    ├── css/
    │   └── styles.css        # 전체 디자인 시스템 및 반응형 CSS
    ├── js/
    │   └── script.js         # 슬라이더, 팝업 모달, 폼 검증 자바스크립트
    └── images/               # 시공사례 및 배너 샘플 이미지
        ├── hero.png          # 히어로 배너 샘플
        ├── case\_roof.png     # 옥상/쿨루프 방수 시공 샘플
        └── case\_wall.png     # 외벽/균열/인젝션 시공 샘플
```

\---

## 사진 및 로고 추가/수정 방법 (추후 작업 가이드)

### 1\. 기업 로고(Logo) 교체 방법

현재 `index.html` 상단 헤더 영역에는 세련된 방수 심볼 아이콘과 텍스트 형태의 로고가 배치되어 있습니다.
추후 이미지 파일 로고를 추가하려면 `index.html`의 71\~78번째 줄 주변 코드를 아래와 같이 이미지 마크업으로 변경하시면 됩니다.

```html
<!-- 기존 텍스트 로고 코드 -->
<a href="#" class="logo">
    <div class="logo-icon"><i class="fa-solid fa-shield-halved"></i></div>
    <div class="logo-text-box">
        <h1 class="logo-title">대진특수방수</h1>
        <span class="logo-sub">DAEJIN SPECIAL WATERPROOFING</span>
    </div>
</a>

<!-- 이미지 로고 교체 예시 -->
<a href="#" class="logo">
    <img src="assets/images/logo.png" alt="대진특수방수 로고" style="height: 48px;">
</a>
```

### 2\. 현장 시공사례 사진 교체 방법

* `assets/images/` 폴더 내에 실제 현장 촬영 사진(예: `my\_roof\_case1.jpg`)을 복사합니다.
* `index.html` 파일 내 `<section class="portfolio-section" id="portfolio">` 영역의 `<img>` 태그 경로(`src="assets/images/case\_roof.png"`)를 원하는 파일명으로 교체합니다.

### 3\. 회사 연락처 및 주소 정보 업데이트

* `index.html` 상단의 텍스트(전화번호 `052-246-8804`, `010-3609-0527` 등) 및 하단 `<footer class="footer">` 영역의 상호명, 대표자명, 사업자등록번호, 주소를 실제 정보로 수정해 주시면 됩니다.

\---

## 홈페이지 실행 방법

별도의 서버 설치 없이 PC 브라우저(Chrome, Edge, Safari 등)에서 `index.html` 파일을 더블클릭하여 즉시 디자인과 모션을 확인하실 수 있습니다.

