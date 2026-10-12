/* Shared data access. Public anon key is not an admin credential; RLS is mandatory. */
window.siteData = (() => {
    const pending = new Map();
    function unwrap(result, requireRow = false) {
        if (result.error) throw result.error;
        if (requireRow && (!result.data || (Array.isArray(result.data) && !result.data.length))) {
            throw new Error('저장된 행이 없습니다. 권한 또는 삭제 여부를 확인해 주세요.');
        }
        return result.data;
    }
    function once(key, task) {
        if (!pending.has(key)) pending.set(key, Promise.resolve().then(task).finally(() => pending.delete(key)));
        return pending.get(key);
    }
    function images(value) {
        let parsed = value;
        if (typeof value === 'string') { try { parsed = JSON.parse(value); } catch (_) {} }
        return (Array.isArray(parsed) ? parsed : [parsed]).filter(v => typeof v === 'string' && safeImage(v));
    }
    function safeImage(value) {
        if (/^data:image\/(jpeg|png|webp|gif);base64,/i.test(value)) return value;
        try { const url = new URL(value, location.href); return ['https:', 'http:'].includes(url.protocol) ? value : ''; } catch (_) { return ''; }
    }
    const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    async function requireAdmin() {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error || !data.user) throw new Error('관리자 로그인이 필요합니다.');
        const result = await supabaseClient.rpc('is_site_admin');
        if (result.error || result.data !== true) throw new Error('관리자 권한이 없거나 권한 설정 SQL이 적용되지 않았습니다.');
        return data.user;
    }
    async function listPortfolios(limit = 16) {
        return once('portfolio-list:' + limit, async () => {
            let result = await supabaseClient.from('portfolios')
                .select('id,title,display_order,created_at,updated_at,thumbnail_url')
                .order('display_order', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false }).order('id', { ascending: true }).limit(limit);
            // Compatibility while the additive migration is awaiting application.
            if (result.error && ['42703','PGRST204'].includes(result.error.code)) {
                result = await supabaseClient.from('portfolios').select('id,title,display_order,created_at')
                    .order('display_order', { ascending: true, nullsFirst: false })
                    .order('created_at', { ascending: false }).order('id', { ascending: true }).limit(limit);
            }
            return unwrap(result) || [];
        });
    }
    async function gallery(id) {
        return once('gallery:' + id, async () => images(unwrap(await supabaseClient.from('portfolios')
            .select('image_data').eq('id', id).single(), true).image_data));
    }
    async function settings(table = 'settings') {
        return once('settings:' + table, async () => unwrap(await supabaseClient.from(table).select('setting_key,setting_value')) || []);
    }
    async function saveSettings(rows, table = 'settings') {
        await requireAdmin();
        const saved = unwrap(await supabaseClient.from(table).upsert(rows, { onConflict: 'setting_key' }).select('setting_key'), true);
        if (saved.length !== rows.length) throw new Error('일부 설정이 저장되지 않았습니다.');
        return saved;
    }
    async function remove(table, id) {
        await requireAdmin();
        return unwrap(await supabaseClient.from(table).delete().eq('id', id).select('id').single(), true);
    }
    async function resizeImage(file, maxSide, quality) {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 20 * 1024 * 1024) throw new Error('20MB 이하 JPG, PNG, WebP, GIF 이미지를 선택해 주세요.');
        let bitmap;
        if (window.createImageBitmap) bitmap = await createImageBitmap(file);
        else {
            const url = URL.createObjectURL(file);
            bitmap = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')); }; img.src = url; });
        }
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        if (bitmap.close) bitmap.close();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        if (!blob) throw new Error('이미지 압축에 실패했습니다.');
        return blob;
    }
    async function uploadImages(files) {
        const user = await requireAdmin();
        if (files.length > 20) throw new Error('한 번에 사진을 20장 이하로 선택해 주세요.');
        const urls = []; let thumbnail = null;
        for (const file of files) {
            const blob = await resizeImage(file, 1600, 0.82);
            const extension = blob.type === 'image/webp' ? 'webp' : 'png';
            const object = `${user.id}/${crypto.randomUUID()}.${extension}`;
            unwrap(await supabaseClient.storage.from('portfolio-images').upload(object, blob, {contentType: blob.type, cacheControl:'31536000', upsert:false}));
            urls.push(supabaseClient.storage.from('portfolio-images').getPublicUrl(object).data.publicUrl);
            if (!thumbnail) {
                const thumb = await resizeImage(file, 640, 0.76);
                const thumbPath = `${user.id}/${crypto.randomUUID()}-thumb.${thumb.type === 'image/webp' ? 'webp' : 'png'}`;
                unwrap(await supabaseClient.storage.from('portfolio-images').upload(thumbPath, thumb, {contentType:thumb.type, cacheControl:'31536000', upsert:false}));
                thumbnail = supabaseClient.storage.from('portfolio-images').getPublicUrl(thumbPath).data.publicUrl;
            }
        }
        return { urls, thumbnail };
    }
    function changed() { try { localStorage.setItem('portfolio-version', String(Date.now())); } catch (_) {} }
    return { unwrap, once, images, safeImage, escape, requireAdmin, listPortfolios, gallery, settings, saveSettings, remove, uploadImages, changed };
})();
