<script>
        document.addEventListener('DOMContentLoaded', async () => {
            // 1. 공통 로직 실행 (방문자 기록, 설정 적용, 팝업 렌더링)
            if (typeof api !== 'undefined') {
                await api.trackVisitor();
                await api.applySettings();
                await api.renderPopup();
            }

            // 2. 견적 폼 전송 이벤트 가로채기
            const quoteForm = document.getElementById('heroQuoteForm');
            if (quoteForm) {
                // 기존 인라인 onclick 경고창 제거
                const submitBtn = quoteForm.querySelector('button');
                if (submitBtn) submitBtn.removeAttribute('onclick');

                quoteForm.addEventListener('submit', async (e) => {
                    // 수파베이스 저장이 중간에 끊기지 않도록 먼저 기본 동작을 막습니다.
                    e.preventDefault();
                    
                    const formData = new FormData(quoteForm);
                    const keyword = sessionStorage.getItem('inflow_keyword');
                    const baseMessage = formData.get('entry.1618498056');
                    const finalMessage = keyword ? [유입 키워드:  + keyword + ]\n + baseMessage : baseMessage;

                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: finalMessage,
                        status: '신규 접수'
                    };

                    // 1. 수파베이스로 데이터를 먼저 확실하게 전송합니다.
                    const { success } = await api.submitQuote(quoteData);
                    
                    if (!success) {
                        alert('수파베이스 저장 중 오류가 발생했습니다.');
                    }
                    
                    // 2. 수파베이스 전송 완료 후 구글 폼으로 전송(hero_hidden_iframe으로 전달)
                    HTMLFormElement.prototype.submit.call(quoteForm);
                });
            }

            // 3. 전화번호 클릭 (모바일) 이벤트 가로채기
            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(link => {
                link.addEventListener('click', async (e) => {
                    const phoneNum = link.getAttribute('href').replace('tel:', '');
                    await api.submitQuote({
                        name: '전화문의',
                        phone: phoneNum,
                        service: '빠른 전화 상담',
                        message: '모바일에서 전화걸기 버튼을 클릭했습니다.',
                        status: '신규 접수'
                    });
                });
            });

            // 4. 포트폴리오(시공 사례) 동적 렌더링
            const photoGrids = document.querySelectorAll('.photo-grid');
            if (photoGrids.length > 0 && typeof supabaseClient !== 'undefined') {
                const { data: portfolios } = await supabaseClient.from('portfolios').select('*');
                
                if (portfolios && portfolios.length > 0) {
                    portfolios.sort((a, b) => {
                        const orderA = a.display_order !== undefined ? a.display_order : 999;
                        const orderB = b.display_order !== undefined ? b.display_order : 999;
                        if (orderA !== orderB) return orderA - orderB;
                        return new Date(b.created_at) - new Date(a.created_at);
                    });

                    photoGrids.forEach(grid => {
                        grid.innerHTML = ''; // 기존 자리표시자 제거
                        // 최대 6개까지만 메인 화면에 렌더링 (또는 원하는 개수)
                        const displayItems = portfolios.slice(0, 8);
                        displayItems.forEach(item => {
                            const card = document.createElement('div');
                            card.className = 'photo-card gallery-trigger';
                            card.style.cursor = 'pointer';
                            card.setAttribute('data-gallery', JSON.stringify([item.image_data]));
                            
                            card.innerHTML = `
                                <img src="${item.image_data}" alt="${item.title}">
                                <div class="album-badge">
                                    <i class="fa-solid fa-camera"></i>
                                    <span style="margin-left: 5px; font-weight: bold; font-size: 0.9rem;">${item.title}</span>
                                </div>
                            `;
                            grid.appendChild(card);
                        });
                    });
                } else {
                    // 데이터가 없을 경우
                    photoGrids.forEach(grid => {
                        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 50px 0; font-size: 0.9rem;">등록된 시공 사례가 없습니다.</div>';
                    });
                }
            }
        });
    </script>
