$lines = Get-Content -Path ".\index.html" -Encoding UTF8
$startIdx = -1
$endIdx = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "quoteForm\.addEventListener\('submit'") {
        $startIdx = $i
        break
    }
}

if ($startIdx -ge 0) {
    for ($i = $startIdx; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*\}\);\s*$") {
            $endIdx = $i
            break
        }
    }
}

if ($startIdx -ge 0 -and $endIdx -ge 0) {
    $newLines = @(
        "                quoteForm.addEventListener('submit', async (e) => {",
        "                    // 구글 폼 정상 작동을 위해 e.preventDefault() 를 호출하지 않습니다.",
        "                    // 백그라운드에서 수파베이스에도 동시에 전송합니다.",
        "                    ",
        "                    const formData = new FormData(quoteForm);",
        "                    const quoteData = {",
        "                        name: formData.get('entry.2116052852'),",
        "                        phone: formData.get('entry.876771347'),",
        "                        service: formData.get('entry.1558582620'),",
        "                        message: formData.get('entry.1618498056'),",
        "                        status: '신규 접수'",
        "                    };",
        "",
        "                    const { success } = await api.submitQuote(quoteData);",
        "                    ",
        "                    if (success) {",
        "                        // 구글폼 iframe에서 자체적으로 alert을 띄우므로 여기서 중복으로 띄우지 않습니다.",
        "                        // 전환 추적 스크립트 실행 (DB 설정에서 가져옴)",
        "                        const { data: settings } = await supabaseClient.from('settings').select('setting_value').eq('setting_key', 'conversion_script').single();",
        "                        if (settings && settings.setting_value) {",
        "                            try {",
        "                                eval(settings.setting_value);",
        "                            } catch (e) {",
        "                                console.error('Conversion script error:', e);",
        "                            }",
        "                        }",
        "                    } else {",
        "                        console.error('수파베이스 데이터 전송 실패');",
        "                    }",
        "                });"
    )
    
    $pre = $lines[0..($startIdx - 1)]
    $post = if ($endIdx -lt ($lines.Count - 1)) { $lines[($endIdx + 1)..($lines.Count - 1)] } else { @() }
    
    $finalLines = $pre + $newLines + $post
    Set-Content -Path ".\index.html" -Value $finalLines -Encoding UTF8
    Write-Host "Replaced successfully"
} else {
    Write-Host "Indices not found: Start=$startIdx End=$endIdx"
}
