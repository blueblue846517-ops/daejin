$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

$jsTarget = @'
                    // 1. 수파베이스로 데이터를 먼저 확실하게 전송합니다.
                    const { success } = await api.submitQuote(quoteData);
                    
                    if (!success) {
                        alert('수파베이스 저장 중 오류가 발생했습니다.');
                    }
                    
                    // 2. 수파베이스 전송 완료 후 구글 폼으로 전송(hero_hidden_iframe으로 전달)
                    heroFormSubmitted = true;
                    HTMLFormElement.prototype.submit.call(quoteForm);
'@

$jsReplace = @'
                    // 1. 수파베이스로 데이터를 먼저 확실하게 전송합니다.
                    const response = await api.submitQuote(quoteData);
                    
                    if (!response.success) {
                        alert('수파베이스 저장 오류:\n' + JSON.stringify(response.error));
                        console.error('Supabase Error:', response.error);
                    }
                    
                    // 2. 수파베이스 전송 완료 후 구글 폼으로 전송(hero_hidden_iframe으로 전달)
                    heroFormSubmitted = true;
                    HTMLFormElement.prototype.submit.call(quoteForm);
'@

$content = $content -replace [regex]::Escape($jsTarget), $jsReplace
Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Updated index.html to show verbose error."
