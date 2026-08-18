$idxLines = Get-Content -Path ".\index.html" -Encoding UTF8
$topLines = $idxLines[0..905]

$scriptBlock = Get-Content -Path ".\script_block.txt" -Encoding UTF8

$finalContent = $topLines + $scriptBlock
Set-Content -Path ".\index.html" -Value $finalContent -Encoding UTF8
Write-Host "Rebuilt index.html safely!"
