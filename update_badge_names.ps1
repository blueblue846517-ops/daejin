$files = @("c:\Users\병서\Desktop\daejin\index.html", "c:\Users\병서\Desktop\daejin\portfolio.html")

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    
    # We want to replace <span>NUMBER</span> with <span>NAME</span> based on the alt tag.
    # The pattern matches the img tag with its alt, followed by the album-badge div, the i tag, and the span tag.
    $pattern = 'alt="시공사례\s+(.*?)\s+대표 사진".*?<div class="album-badge">\s*<i class="fa-regular fa-images"></i>\s*<span>\d+</span>'
    
    $content = [regex]::Replace($content, '(?s)alt="시공사례\s+(.*?)\s+대표 사진"(.*?)<div class="album-badge">\s*<i class="fa-regular fa-images"></i>\s*<span>\d+</span>', 'alt="시공사례 $1 대표 사진"$2<div class="album-badge">`n                            <i class="fa-regular fa-images"></i>`n                            <span>$1</span>')
    
    Set-Content -Path $file -Value $content -Encoding UTF8
}
Write-Host "Replaced span text with image names."
