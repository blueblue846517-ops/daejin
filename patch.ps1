$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

$target = @"
                quoteForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(quoteForm);
                    const quoteData = {
                        name: formData.get('name'),
                        phone: formData.get('phone'),
                        service: formData.get('service'),
                        message: formData.get('message'),
                        status: '신규 접수'
                    };

                    const { success } = await api.submitQuote(quoteData);
                    
                    if (success) {
                        alert('견적 문의가 성공적으로 접수되었습니다. 담당자가 곧 연락드리겠습니다.');
                        quoteForm.reset();
                        
                        // 전환 추적 스크립트 실행 (DB 설정에서 가져옴)
                        const { data: settings } = await supabaseClient.from('settings').select('setting_value').eq('setting_key', 'conversion_script').single();
                        if (settings && settings.setting_value) {
                            try {
                                eval(settings.setting_value);
                            } catch (e) {
                                console.error('Conversion script error:', e);
                            }
                        }
                    } else {
                        alert('접속 중 오류가 발생했습니다. 다시 시도해 주세요.');
                    }
                });
"@

$replacement = @"
                quoteForm.addEventListener('submit', async (e) => {
                    // 구글 폼 정상 작동을 위해 e.preventDefault() 를 호출하지 않습니다.
                    // 백그라운드에서 수파베이스에도 동시에 전송합니다.
                    
                    const formData = new FormData(quoteForm);
                    const quoteData = {
                        name: formData.get('entry.2116052852'),
                        phone: formData.get('entry.876771347'),
                        service: formData.get('entry.1558582620'),
                        message: formData.get('entry.1618498056'),
                        status: '신규 접수'
                    };

                    const { success } = await api.submitQuote(quoteData);
                    
                    if (success) {
                        // 구글폼 iframe에서 자체적으로 alert을 띄우므로 여기서 중복으로 띄우지 않습니다.
                        // 전환 추적 스크립트 실행 (DB 설정에서 가져옴)
                        const { data: settings } = await supabaseClient.from('settings').select('setting_value').eq('setting_key', 'conversion_script').single();
                        if (settings && settings.setting_value) {
                            try {
                                eval(settings.setting_value);
                            } catch (e) {
                                console.error('Conversion script error:', e);
                            }
                        }
                    } else {
                        console.error('수파베이스 데이터 전송 실패');
                    }
                });
"@

if ($content -match [regex]::Escape($target)) {
    $content = $content -replace [regex]::Escape($target), $replacement
    Set-Content -Path $filePath -Value $content -Encoding UTF8
    Write-Host "Success"
} else {
    Write-Host "Target not found"
}
