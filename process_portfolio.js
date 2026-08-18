const fs = require('fs');
let html = fs.readFileSync('c:\\Users\\user\\Desktop\\daejin\\portfolio.html', 'utf8');

// Remove Hero
html = html.replace(/<!-- ==========================================================================\r?\n\s*HERO CAROUSEL SECTION[\s\S]*?<!-- ==========================================================================\r?\n\s*4 CORE SERVICE PILLARS/g, '<!-- ==========================================================================\n       4 CORE SERVICE PILLARS');

// Handle double commented blocks if any
html = html.replace(/<!-- ==========================================================================\r?\n\r?\n\s*<!-- ==========================================================================/g, '<!-- ==========================================================================');

// Remove About and Methods (Service section to Portfolio)
html = html.replace(/<main>\r?\n\s*<section class="service-section" id="about">[\s\S]*?<!-- ==========================================================================\r?\n\s*CONSTRUCTION CASES PORTFOLIO/g, '<main>\n\n    <!-- ==========================================================================\n       CONSTRUCTION CASES PORTFOLIO');

// Remove Process section
html = html.replace(/<!-- ==========================================================================\r?\n\s*5-STEP CONSTRUCTION PROCESS[\s\S]*?<\/main>/g, '</main>');

// Update Title
html = html.replace(/<title>대진특수방수<\/title>/g, '<title>주요 시공 사례 - 대진특수방수</title>');

// Remove navigation links to about, methods, portfolio and point to index.html
html = html.replace(/<nav>\r?\n\s*<ul class="nav-list">[\s\S]*?<\/ul>\r?\n\s*<\/nav>/g, `<nav>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="index.html#about" class="nav-link">
                            <span>회사소개</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="index.html#methods" class="nav-link">
                            <span>시공 분야</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="portfolio.html" class="nav-link">
                            <span>시공사례</span>
                        </a>
                    </li>
                </ul>
            </nav>`);

// Change logo link to index.html
html = html.replace(/<a href="#" class="logo"/g, '<a href="index.html" class="logo"');

fs.writeFileSync('c:\\Users\\user\\Desktop\\daejin\\portfolio.html', html);
console.log('portfolio.html processed successfully');
