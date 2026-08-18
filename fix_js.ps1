$idxLines = Get-Content -Path ".\index.html" -Encoding UTF8
$topLines = $idxLines[0..906]

$indexScript = @'
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
                    const finalMessage = keyword ? '[유입 키워드: ' + keyword + ']\n' + baseMessage : baseMessage;

                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: finalMessage,
                        status: '신규 접수'
                    };

                    // 1. 수파베이스로 데이터를 먼저 확실하게 전송합니다.
                    const response = await api.submitQuote(quoteData);
                    
                    if (!response.success) {
                        alert('수파베이스 저장 오류:\n' + JSON.stringify(response.error));
                        console.error('Supabase Error:', response.error);
                    }
                    
                    // 2. 수파베이스 전송 완료 후 구글 폼으로 전송(hero_hidden_iframe으로 전달)
                    heroFormSubmitted = true;
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
        });
    </script>
</body>
</html>
'@

$finalContent = $topLines + $indexScript.Split([Environment]::NewLine)
Set-Content -Path ".\index.html" -Value $finalContent -Encoding UTF8
Write-Host "Fixed JS comments!"
