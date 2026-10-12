document.addEventListener('DOMContentLoaded', async () => {
            // 원격 기능은 서로 기다리지 않도록 동시에 시작합니다.
            if (typeof api !== 'undefined') {
                Promise.allSettled([
                    api.trackVisitor(),
                    api.applySettings(),
                    api.renderPopup()
                ]);
            }

            // 2. 견적 폼 전송 이벤트 가로채기
            const quoteForm = document.getElementById('heroQuoteForm');
            if (quoteForm) {
                // 기존 인라인 onclick 경고창 제거
                const submitBtn = quoteForm.querySelector('button');
                if (submitBtn) submitBtn.removeAttribute('onclick');

                quoteForm.addEventListener('submit', async e => {
                    e.preventDefault();
                    if (quoteForm.dataset.submitting === 'true') return;
                    quoteForm.dataset.submitting = 'true';
                    const button = quoteForm.querySelector('button[type="submit"]');
                    button.disabled = true;
                    try {
                        const formData = new FormData(quoteForm);
                        let keyword = ''; try { keyword = sessionStorage.getItem('inflow_keyword') || ''; } catch (_) {}
                        const message = formData.get('entry.1618498056');
                        const result = await api.submitQuote({
                            name: formData.get('entry.2116052852'), phone: formData.get('entry.876771347'),
                            service: formData.get('entry.1558582620'),
                            message: keyword ? '[유입 키워드: ' + keyword + ']\n' + message : message,
                            status: '신규 접수'
                        });
                        if (!result.success) throw result.error;
                    } catch (error) { console.error('사이트 문의 저장 실패. 기존 Google Forms 접수를 계속합니다.', error); }
                    try { sessionStorage.setItem('quote_conversion_pending', crypto.randomUUID()); } catch (_) {}
                    heroFormSubmitted = true;
                    HTMLFormElement.prototype.submit.call(quoteForm);
                    setTimeout(() => { quoteForm.dataset.submitting = 'false'; button.disabled = false; }, 15000);
                });
            }

            // 3. 전화번호 클릭 (모바일) 이벤트 가로채기
            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(link => {
                link.addEventListener('click', async (e) => {
                    const phoneNum = link.getAttribute('href').replace('tel:', '');
                    if (typeof window.gtag === 'function') window.gtag('event', 'phone_click', {link_url: link.href});
                });
            });


        });
