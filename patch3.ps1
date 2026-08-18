$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

$content = $content -replace 'onload="if\(heroFormSubmitted\).*?"', 'onload="if(heroFormSubmitted) { const kw = sessionStorage.getItem(''inflow_keyword'') || ''''; window.location.href = ''thanks.html'' + (kw ? ''?keyword='' + encodeURIComponent(kw) : ''''); }"'

Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Iframe onload fixed"
