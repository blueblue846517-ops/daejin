document.addEventListener('DOMContentLoaded', () => {
    const privacy = document.getElementById('servicePrivacyLink');
    if (privacy) privacy.addEventListener('click', e => { e.preventDefault(); document.getElementById('openPrivacyBtn')?.click(); });
    const grid = document.getElementById('serviceCases');
    if (!grid) return;
    const slug = document.body.dataset.service;
    const safeURL = value => {
        if (!value || !siteData.safeImage(value)) return '';
        // Old uploads sometimes contain root-relative-in-practice local asset paths.
        if (/^assets\//.test(value)) return '/' + value;
        if (/^[\w.-]+\.(jpg|jpeg|png|webp)$/i.test(value)) return '/' + value;
        return value;
    };
    async function refresh() {
        grid.setAttribute('aria-busy','true');
        try {
            const rows = await siteData.listPortfolios(1000);
            const selected = rows.filter(row => serviceCatalog.match(row.title).some(x => x.slug === slug)).slice(0,6);
            const fragment = document.createDocumentFragment();
            for (const row of selected) {
                const card = document.createElement('article'); card.className = 'svc-case';
                const button = document.createElement('button'); button.type = 'button'; button.className = 'gallery-trigger';
                button.setAttribute('aria-label', row.title + ' 사진 보기');
                const image = document.createElement('img'); image.alt = row.title; image.width = 640; image.height = 480; image.loading = 'lazy'; image.decoding = 'async';
                if (safeURL(row.thumbnail_url)) image.src = safeURL(row.thumbnail_url);
                image.addEventListener('error', () => { image.hidden = true; });
                if (!image.getAttribute('src')) image.hidden = true;
                const title = document.createElement('h3'); title.textContent = row.title;
                button.append(image,title);
                let galleryRequest;
                const loadImages = () => galleryRequest || (galleryRequest = siteData.gallery(row.id).then(values => {
                    const images = values.map(safeURL).filter(Boolean);
                    if (!images.length) throw new Error('No photos');
                    button.dataset.gallery = JSON.stringify(images);
                    if (!image.getAttribute('src')) { image.src = images[0]; image.hidden = false; }
                    return images;
                }).finally(() => { galleryRequest = null; }));
                button.addEventListener('click', async event => {
                    if (button.dataset.gallery) return;
                    event.stopPropagation();
                    if (button.disabled) return;
                    button.disabled = true;
                    try {
                        await loadImages();
                        button.disabled = false; button.click();
                    } catch (_) {
                        let message = card.querySelector('[role="status"]');
                        if (!message) { message = document.createElement('p'); message.setAttribute('role','status'); card.append(message); }
                        message.textContent = '사진을 불러오지 못했습니다. 잠시 후 다시 선택해 주세요.';
                    } finally { button.disabled = false; }
                });
                // Legacy rows have no thumbnail_url. Fetch only these selected, visible-section albums.
                if (!image.getAttribute('src')) loadImages().catch(() => { image.hidden = true; });
                card.append(button); fragment.append(card);
            }
            if (!selected.length) { const empty = document.createElement('p'); empty.textContent = '현재 이 공정으로 확인된 공개 시공 사례가 없습니다. 현장과 유사한 공사에 대해서는 전화로 상담해 주세요.'; fragment.append(empty); }
            grid.replaceChildren(fragment);
        } catch (_) {
            const message = document.createElement('p'); message.setAttribute('role','status'); message.textContent = '시공 사례를 불러오지 못했습니다. 공정 안내와 견적 문의는 계속 이용하실 수 있습니다.';
            const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'svc-button'; retry.textContent = '시공 사례 다시 불러오기'; retry.addEventListener('click',refresh);
            grid.replaceChildren(message,retry);
        } finally { grid.setAttribute('aria-busy','false'); }
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) {observer.disconnect(); refresh();} }, {rootMargin:'400px'});
        observer.observe(grid);
    } else refresh();
});
