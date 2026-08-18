$idxLines = Get-Content -Path "c:\Users\ë³‘ì„œ\Desktop\daejin\index.html" -Encoding UTF8
$topLines = $idxLines[0..905]

$indexScript = @'
    <!-- Supabase Integration for Index Page -->
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            // 1. ê³µí†µ ë¡œì§ ?¤í–‰ (ë°©ë¬¸??ê¸°ë¡, ?¤ì • ?ìš©, ?ì—… ?Œë”ë§?
            if (typeof api !== 'undefined') {
                await api.trackVisitor();
                await api.applySettings();
                await api.renderPopup();
            }

            // 2. ê²¬ì  ???„ì†¡ ?´ë²¤??ê°€ë¡œì±„ê¸?            const quoteForm = document.getElementById('heroQuoteForm');
            if (quoteForm) {
                // ê¸°ì¡´ ?¸ë¼??onclick ê²½ê³ ì°??œê±°
                const submitBtn = quoteForm.querySelector('button');
                if (submitBtn) submitBtn.removeAttribute('onclick');

                quoteForm.addEventListener('submit', async (e) => {
                    // ?˜íŒŒë² ì´???€?¥ì´ ì¤‘ê°„???Šê¸°ì§€ ?Šë„ë¡?ë¨¼ì? ê¸°ë³¸ ?™ì‘??ë§‰ìŠµ?ˆë‹¤.
                    e.preventDefault();
                    
                    const formData = new FormData(quoteForm);
                    const keyword = sessionStorage.getItem('inflow_keyword');
                    const baseMessage = formData.get('entry.1618498056');
                    const finalMessage = keyword ? '[? ì… ?¤ì›Œ?? ' + keyword + ']\n' + baseMessage : baseMessage;

                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: finalMessage,
                        status: '? ê·œ ?‘ìˆ˜'
                    };

                    // 1. ?˜íŒŒë² ì´?¤ë¡œ ?°ì´?°ë? ë¨¼ì? ?•ì‹¤?˜ê²Œ ?„ì†¡?©ë‹ˆ??
                    const response = await api.submitQuote(quoteData);
                    
                    if (!response.success) {
                        alert('?˜íŒŒë² ì´???€???¤ë¥˜:\n' + JSON.stringify(response.error));
                        console.error('Supabase Error:', response.error);
                    }
                    
                    // 2. ?˜íŒŒë² ì´???„ì†¡ ?„ë£Œ ??êµ¬ê? ?¼ìœ¼ë¡??„ì†¡(hero_hidden_iframe?¼ë¡œ ?„ë‹¬)
                    heroFormSubmitted = true;
                    HTMLFormElement.prototype.submit.call(quoteForm);
                });
            }

            // 3. ?„í™”ë²ˆí˜¸ ?´ë¦­ (ëª¨ë°”?? ?´ë²¤??ê°€ë¡œì±„ê¸?            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(link => {
                link.addEventListener('click', async (e) => {
                    const phoneNum = link.getAttribute('href').replace('tel:', '');
                    await api.submitQuote({
                        name: '?„í™”ë¬¸ì˜',
                        phone: phoneNum,
                        service: 'ë¹ ë¥¸ ?„í™” ?ë‹´',
                        message: 'ëª¨ë°”?¼ì—???„í™”ê±¸ê¸° ë²„íŠ¼???´ë¦­?ˆìŠµ?ˆë‹¤.',
                        status: '? ê·œ ?‘ìˆ˜'
                    });
                });
            });
        });
    </script>
</body>
</html>
'@

$finalContent = $topLines + $indexScript.Split([Environment]::NewLine)
Set-Content -Path "c:\Users\ë³‘ì„œ\Desktop\daejin\index.html" -Value $finalContent -Encoding UTF8
Write-Host "Fixed JS block!"
