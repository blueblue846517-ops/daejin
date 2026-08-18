$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

$jsTarget = @"
                quoteForm.addEventListener('submit', async (e) => {
                    // 구글 폼 정상 작동을 위해 e.preventDefault() 를 호출하지 않습니다.
                    // 백그라운드에서 수파베이스에도 동시에 전송합니다.
                    
                    const formData = new FormData(quoteForm);
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

$jsReplace = @"
                quoteForm.addEventListener('submit', async (e) => {
                    // 수파베이스 저장이 중간에 끊기지 않도록 먼저 기본 동작을 막습니다.
                    e.preventDefault();
                    
                    const formData = new FormData(quoteForm);
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

                    // 1. 수파베이스로 데이터를 먼저 확실하게 전송합니다.
                    const { success } = await api.submitQuote(quoteData);
                    
                    // 2. 수파베이스 전송이 완료된 후 구글 폼으로 데이터를 전송합니다.
                    // (이때 이벤트 리스너 무한 루프를 막기 위해 프로토타입의 submit을 직접 호출합니다)
                    HTMLFormElement.prototype.submit.call(quoteForm);
                });
"@

$content = $content.Replace($jsTarget, $jsReplace)

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Replaced JS block in index.html"
