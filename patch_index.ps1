$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Replace iframe onload
$iframeTarget = @"
onload="if(heroFormSubmitted) {alert('견적 문의가 성공적으로 접수되었습니다. 담당자가 곧 연락드리겠습니다.'); document.getElementById('heroQuoteForm').reset(); heroFormSubmitted=false;}"
"@
$iframeReplace = @"
onload="if(heroFormSubmitted) { const kw = sessionStorage.getItem('inflow_keyword') || ''; window.location.href = 'thanks.html' + (kw ? '?keyword=' + encodeURIComponent(kw) : ''); }"
"@
$content = $content.Replace($iframeTarget, $iframeReplace)

# Replace JS message extraction
$jsTarget = @"
                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: formData.get('entry.1618498056'),
                        status: '신규 접수'
                    };
"@
$jsReplace = @"
                    const keyword = sessionStorage.getItem('inflow_keyword');
                    const baseMessage = formData.get('entry.1618498056');
                    const finalMessage = keyword ? `[유입 키워드: ` + keyword + `]\n` + baseMessage : baseMessage;

                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: finalMessage,
                        status: '신규 접수'
                    };
"@
$content = $content.Replace($jsTarget, $jsReplace)

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Modified index.html"
