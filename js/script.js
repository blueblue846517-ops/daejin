/**
 * ==========================================================================
 * 대진특수방수 (DAEJIN SPECIAL WATERPROOFING) - INTERACTIVE SCRIPT
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initStickyHeader();
    initPortfolioFilter();
    initQuoteForm();
    initModals();
    initMobileMenu();
    initPhotoGallery();
});

/**
 * 1. Hero Carousel Slider Logic
 */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    let currentSlide = 0;
    let slideInterval;
    const intervalTime = 6000;

    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (dots[i]) dots[i].classList.remove('active');
        });

        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    function startTimer() {
        stopTimer();
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    function stopTimer() {
        if (slideInterval) clearInterval(slideInterval);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startTimer();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startTimer();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            startTimer();
        });
    });

    // Pause on hover
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopTimer);
        heroSection.addEventListener('mouseleave', startTimer);
    }

    startTimer();
}

/**
 * 2. Sticky Header & Floating Top Button
 */
function initStickyHeader() {
    const header = document.querySelector('.header');
    const fabTop = document.getElementById('fabTop');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY || window.pageYOffset;

        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        if (fabTop) {
            if (scrollY > 400) {
                fabTop.classList.add('visible');
            } else {
                fabTop.classList.remove('visible');
            }
        }
    });

    if (fabTop) {
        fabTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * 3. Construction Cases Portfolio Filtering
 */
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.portfolio-card');

    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 200);
                }
            });
        });
    });
}

/**
 * 4. Free Estimate Quote Form Submission
 */
function initQuoteForm() {
    const form = document.getElementById('quoteForm');
    const modal = document.getElementById('successModal');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic form verification
        const name = form.querySelector('[name="name"]').value.trim();
        const phone = form.querySelector('[name="phone"]').value.trim();

        if (!name || !phone) {
            alert('성함과 연락처를 입력해주세요.');
            return;
        }

        // Display Success Modal
        if (modal) {
            const clientNameElem = document.getElementById('modalClientName');
            if (clientNameElem) clientNameElem.textContent = `${name} 고객님`;
            modal.classList.add('active');
            form.reset();
        } else {
            alert('견적 문의가 접수되었습니다. 1시간 이내에 연락드리겠습니다.');
            form.reset();
        }
    });
}

/**
 * 5. Interactive Modals (Method Details & Close buttons)
 */
function initModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    const closeBtns = document.querySelectorAll('.btn-close-modal, .btn-close-trigger');
    const methodBtns = document.querySelectorAll('.btn-method-detail');
    const methodModal = document.getElementById('methodModal');

    // Method modal details dictionary
    const methodData = {
        'coolroof': {
            title: '쿨루프·차열방수 공법 특장점',
            desc: '특수 고반사 안료가 배합된 쿨루프 도막 방수재를 도포하여 태양 태양열 및 자외선의 90% 이상을 반사시키는 첨단 공법입니다.',
            details: [
                '여름철 건물 옥상 표면 온도를 최대 15℃ 이상 낮추어 실내 냉방 에너지 비용 약 20~30% 절감',
                '자외선 열화로 인한 방수층 손상을 막아 일반 우레탄 대비 수명 2배 이상 연장',
                '친환경 고기능성 차열 소재 사용으로 도심 열섬 현상 완화 효과'
            ]
        },
        'injection': {
            title: '고압 인젝션 주입·우레탄 방수 특장점',
            desc: '콘크리트 외벽, 옥상, 지하 구조물 등의 균열 및 미세 크랙 내부까지 특수 발포 우레탄 수지를 고압 주입 기계로 충진하여 누수 원인을 완벽히 밀폐합니다.',
            details: [
                '콘크리트 심부 크랙 및 진행형 균열까지 수축·팽창에 유연하게 대응하여 재누수 방지',
                '물이 흐르는 상태(활동성 누수 현장)에서도 반응 경화하는 최첨단 방수 소재 활용',
                '엘리베이터 피트, 지하 주차장 및 터널 누수에 최고의 차수 성능 발휘'
            ]
        },
        'polyurea': {
            title: '폴리우레아 초속경 특수방수 특장점',
            desc: '이액형 수지를 120℃ 고온 고압 전용 장비를 이용해 스프레이 코팅하는 특수 공법으로 10초 이내에 경화되며 초고강도 인장성능을 가집니다.',
            details: [
                '일반 도포 방수제 대비 10배 이상의 이음새 없는 내마모성 및 인장 강도 제공',
                '도포 후 10초~1분 이내 즉시 보행 및 사용 가능하여 공사 기간 획기적 단축',
                '공장 지붕, 주차장 바닥, 저수조, 야외 수영장 및 물놀이장 등 특수 하중 시설 특화'
            ]
        },
        'condensation': {
            title: '결로·단열 및 곰팡이 방지 공법 특장점',
            desc: '외부와 내부의 심한 온도차로 발생하는 결로 현상과 곰팡이를 근본적으로 차단하는 복합 열차단 단열 시스템입니다.',
            details: [
                '초박막 진공 세라믹 단열재 및 항균 곰팡이 방지 방수 마감 코팅 시공',
                '외벽 냉기 유입을 차단하고 쾌적한 실내 환경 유지 및 건축물 결로 원천 차단',
                '인체 무해 친환경 자재 사용으로 주택, 아파트, 상업시설 실내외 안전 시공'
            ]
        }
    };

    methodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-method');
            const data = methodData[type];
            if (data && methodModal) {
                document.getElementById('methodModalTitle').textContent = data.title;
                document.getElementById('methodModalDesc').textContent = data.desc;

                const listElem = document.getElementById('methodModalList');
                listElem.innerHTML = '';
                data.details.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fa-solid fa-check text-cyan" style="margin-right:8px;"></i> ${item}`;
                    li.style.marginBottom = '12px';
                    li.style.fontSize = '0.95rem';
                    li.style.color = '#334155';
                    listElem.appendChild(li);
                });

                methodModal.classList.add('active');
            }
        });
    });

    // Terms of Service Modal Open
    const openTermsBtn = document.getElementById('openTermsBtn');
    const termsModal = document.getElementById('termsModal');
    if (openTermsBtn && termsModal) {
        openTermsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.classList.add('active');
        });
    }

    // Privacy Policy Modal Open
    const openPrivacyBtn = document.getElementById('openPrivacyBtn');
    const privacyModal = document.getElementById('privacyModal');
    if (openPrivacyBtn && privacyModal) {
        openPrivacyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.classList.add('active');
        });
    }

    // Email Rejection Modal Open
    const openEmailBtn = document.getElementById('openEmailBtn');
    const emailModal = document.getElementById('emailModal');
    if (openEmailBtn && emailModal) {
        openEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            emailModal.classList.add('active');
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(m => m.classList.remove('active'));
        });
    });

    // Close modal on background click
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

/**
 * 6. Mobile Hamburger Menu Drawer
 */
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!mobileBtn || !navList) return;

    mobileBtn.addEventListener('click', () => {
        const isVisible = navList.style.display === 'flex';
        if (isVisible) {
            navList.style.display = 'none';
        } else {
            navList.style.display = 'flex';
            navList.style.flexDirection = 'column';
            navList.style.position = 'absolute';
            navList.style.top = '80px';
            navList.style.left = '0';
            navList.style.width = '100%';
            navList.style.background = '#ffffff';
            navList.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            navList.style.padding = '20px';
            navList.style.gap = '15px';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navList.style.display = 'none';
            }
        });
    });
}

/**
 * 7. Photo Gallery Carousel Lightbox (시공사례 사진 슬라이더)
 */
function initPhotoGallery() {
    const triggers = document.querySelectorAll('.gallery-trigger');
    const modal = document.getElementById('photoGalleryModal');
    const slideImg = document.getElementById('gallerySlideImg');
    const counter = document.getElementById('galleryCounter');
    const closeBtn = document.getElementById('galleryCloseBtn');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');

    if (!triggers.length || !modal) return;

    let currentGallery = [];
    let currentIndex = 0;

    function showImage(index) {
        if (!currentGallery.length) return;
        currentIndex = (index + currentGallery.length) % currentGallery.length;
        if (slideImg) {
            slideImg.style.opacity = '0';
            setTimeout(() => {
                slideImg.src = currentGallery[currentIndex];
                slideImg.style.opacity = '1';
            }, 100);
        }
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
        }
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const data = trigger.getAttribute('data-gallery');
            if (!data) return;
            try {
                currentGallery = JSON.parse(data);
                if (currentGallery && currentGallery.length) {
                    currentIndex = 0;
                    showImage(currentIndex);
                    modal.classList.add('active');
                }
            } catch (e) {
                console.error('Gallery JSON error:', e);
            }
        });
    });

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIndex + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIndex - 1);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('gallery-modal-box')) {
            modal.classList.remove('active');
        }
    });

    // Keyboard navigation (Left, Right, Escape)
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'ArrowRight') {
            showImage(currentIndex + 1);
        } else if (e.key === 'ArrowLeft') {
            showImage(currentIndex - 1);
        } else if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            showImage(currentIndex + 1);
        } else if (touchEndX > touchStartX + threshold) {
            showImage(currentIndex - 1);
        }
    }
}

