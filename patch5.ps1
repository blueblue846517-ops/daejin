$filePath = ".\index.html"
$content = Get-Content -Path $filePath -Raw -Encoding UTF8
$content = $content -replace 'HTMLFormElement\.prototype\.submit\.call\(quoteForm\);', "heroFormSubmitted = true;`n                    HTMLFormElement.prototype.submit.call(quoteForm);"
Set-Content -Path $filePath -Value $content -Encoding UTF8
Write-Host "Injected heroFormSubmitted=true;"
