$lines = Get-Content "c:\Users\user\Desktop\daejin\index.html" -Encoding UTF8
$beforeIdx = -1
$afterIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "<!-- Sharp-cornered Photo Gallery Grid") {
        $beforeIdx = $i - 2
        break
    }
}
for ($i = $beforeIdx; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "5-STEP CONSTRUCTION PROCESS") {
        $afterIdx = $i - 1
        break
    }
}
$before = $lines[0..$beforeIdx] -join "`r`n"
$after = $lines[$afterIdx..($lines.Count - 1)] -join "`r`n"
$replacement = "        </section>`r`n`r`n        <!-- ==========================================================================`r`n           CONSTRUCTION CASES PORTFOLIO (시공사례 쇼케이스)`r`n           ========================================================================== -->`r`n        <section class=`"portfolio-section`" id=`"portfolio`">`r`n            <div class=`"container`">`r`n                <div class=`"section-header`">`r`n                    <h2 class=`"section-title`">주요 시공 사례</h2>`r`n                </div>`r`n`r`n                <!-- Sharp-cornered Photo Gallery Grid (동적 렌더링을 위해 비워둠) -->`r`n                <div class=`"photo-grid`">`r`n                    <div style=`"grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 50px 0; font-size: 0.9rem;`">`r`n                        시공 사례를 불러오는 중입니다...`r`n                    </div>`r`n                </div>`r`n                `r`n                <!-- 시공사례 더보기 버튼 -->`r`n                <div style=`"text-align: center; margin-top: 4rem;`">`r`n                    <a href=`"portfolio.html`" style=`"display: inline-block; padding: 1rem 3rem; background-color: var(--color-primary-light); color: #fff; text-decoration: none; font-weight: 700; font-size: 1.1rem; border-radius: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s ease;`" onmouseover=`"this.style.backgroundColor='var(--color-primary)'; this.style.transform='translateY(-2px)';`" onmouseout=`"this.style.backgroundColor='var(--color-primary-light)'; this.style.transform='none';`">`r`n                        시공사례 더보기 &rarr;`r`n                    </a>`r`n                </div>`r`n            </div>`r`n        </section>`r`n"
$finalContent = $before + "`r`n" + $replacement + "`r`n" + $after
Set-Content "c:\Users\user\Desktop\daejin\index.html" -Value $finalContent -Encoding UTF8
