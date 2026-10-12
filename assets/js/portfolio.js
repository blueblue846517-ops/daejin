document.addEventListener('DOMContentLoaded', () => {
    const grids = Array.from(document.querySelectorAll('.photo-grid'));
    if (!grids.length) return;
    let signature = null, loading = false;
    async function refresh() {
        if (loading) return;
        loading = true;
        performance.mark('portfolio-list-start');
        try {
            const rows = await siteData.listPortfolios(16);
            performance.mark('portfolio-list-end');
            performance.measure('portfolio-list', 'portfolio-list-start', 'portfolio-list-end');
            const next = JSON.stringify(rows);
            if (next === signature) return;
            signature = next;
            for (const grid of grids) {
                const fragment = document.createDocumentFragment();
                for (const item of rows) {
                    const card = document.createElement('div'); card.className = 'photo-card gallery-trigger';
                    card.style.cursor = 'pointer'; card.dataset.portfolioId = item.id; card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', item.title);
                    const img = document.createElement('img'); img.alt = item.title; img.width = 640; img.height = 480; img.decoding = 'async';
                    img.loading = grid.getBoundingClientRect().top < innerHeight + 400 && fragment.childElementCount < 2 ? 'eager' : 'lazy';
                    if (siteData.safeImage(item.thumbnail_url || '')) img.src = item.thumbnail_url;
                    img.addEventListener('load', () => performance.mark('portfolio-image-visible:' + item.id), {once:true});
                    img.addEventListener('error', () => { img.alt = item.title + ' (사진을 불러오지 못했습니다)'; card.classList.add('portfolio-image-error'); });
                    const badge = document.createElement('div'); badge.className = 'album-badge';
                    badge.innerHTML = '<i class="fa-solid fa-camera"></i><span style="margin-left:5px;font-weight:bold;font-size:.9rem;"></span>';
                    badge.querySelector('span').textContent = item.title;
                    card.append(img, badge);
                    let busy = null;
                    const loadGallery = () => busy || (busy = siteData.gallery(item.id).then(images => {
                        if (!images.length) throw new Error('등록된 사진이 없습니다.');
                        card.dataset.gallery = JSON.stringify(images); if (!img.getAttribute('src')) img.src = images[0];
                    }).finally(() => { busy = null; }));
                    card.addEventListener('click', async e => {
                        if (card.dataset.gallery) return;
                        e.stopPropagation();
                        if (card.getAttribute('aria-busy') === 'true') return;
                        card.setAttribute('aria-busy', 'true');
                        try { await loadGallery(); card.click(); }
                        catch (error) { alert('사진을 불러오지 못했습니다. 다시 눌러 주세요.'); console.error(error); }
                        finally { card.removeAttribute('aria-busy'); }
                    });
                    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
                    if (!item.thumbnail_url) {
                        // Legacy compatibility only; normal flow uses one preview query and cached WebP URLs.
                        if ('IntersectionObserver' in window) {
                            const observer = new IntersectionObserver(entries => { if (entries.some(x => x.isIntersecting)) { observer.disconnect(); loadGallery().catch(console.error); } }, { rootMargin:'400px' });
                            observer.observe(card);
                        } else loadGallery().catch(console.error);
                    }
                    fragment.append(card);
                }
                if (!rows.length) { const empty = document.createElement('p'); empty.textContent = '등록된 시공 사례가 없습니다.'; fragment.append(empty); }
                grid.replaceChildren(fragment);
            }
        } catch (error) {
            console.error('Portfolio list load failed:', error);
            if (!signature) grids.forEach(grid => {
                const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = '시공 사례를 불러오지 못했습니다. 다시 시도'; retry.onclick = refresh;
                grid.replaceChildren(retry);
            });
        } finally { loading = false; }
    }
    refresh();
    window.addEventListener('storage', e => { if (e.key === 'portfolio-version') refresh(); });
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    setInterval(() => { if (!document.hidden) refresh(); }, 60000);
});
