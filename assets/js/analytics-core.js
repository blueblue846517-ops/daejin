(function (root) {
    'use strict';
    const hosts = ['www.daejinwnc.com', 'daejinwnc.com', 'daejin-str.vercel.app'];
    const fields = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
    const clicks = ['gclid','gbraid','wbraid','n_clk','n_ad','n_ad_group','n_campaign','n_keyword','n_keyword_id','n_media','n_query','NVADID'];
    const trim = value => String(value || '').slice(0, 300);
    function url(value) { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u : null; } catch (_) { return null; } }
    function clean(value) {
        const u = url(value); if (!u) return '';
        const q = new URLSearchParams();
        [...fields, ...clicks, 'id'].forEach(k => { if (u.searchParams.has(k)) q.set(k, trim(u.searchParams.get(k))); });
        return (u.origin + u.pathname + (q.size ? '?' + q : '')).slice(0, 2000);
    }
    function attribution(href, referrer) {
        const u = url(href); const r = url(referrer); const p = u?.searchParams || new URLSearchParams();
        const host = r?.hostname || ''; const under = domain => host === domain || host.endsWith('.' + domain);
        const utm = Object.fromEntries(fields.map(k => [k, trim(p.get(k))]));
        const ids = Object.fromEntries(clicks.filter(k => p.has(k)).map(k => [k, trim(p.get(k))]));
        const us = utm.utm_source.toLowerCase(); const um = utm.utm_medium.toLowerCase();
        let source = 'unknown', medium = 'unknown', keyword = utm.utm_term || trim(p.get('n_keyword'));
        const paid = /^(cpc|ppc|paid|paidsearch|paid_search|display|cpm)$/.test(um);
        if (us) { source = /^(naver|naver_ads)$/.test(us) ? 'naver' : /^(google|google_ads)$/.test(us) ? 'google' : us === 'daum' ? 'daum' : us;
            const adId = source === 'google' ? ids.gclid || ids.gbraid || ids.wbraid : source === 'naver' ? ids.n_clk || ids.n_ad || ids.NVADID : false;
            medium = paid || us.endsWith('_ads') || adId ? 'paid' : um === 'organic' ? 'organic' : um || 'unknown';
        } else if (ids.gclid || ids.gbraid || ids.wbraid) { source = 'google'; medium = 'paid'; }
        else if (ids.n_clk || ids.n_ad || ids.NVADID) { source = 'naver'; medium = 'paid'; }
        else if (under('naver.com')) { source = 'naver'; medium = /^(m\.)?search\.naver\.com$/.test(host) || host === 'www.naver.com' ? 'organic' : 'referral'; }
        else if (/^(www\.|search\.)?google\.(com|co\.kr)$/.test(host)) { source = 'google'; medium = 'organic'; }
        else if (under('daum.net')) { source = 'daum'; medium = host.includes('search.') || host === 'www.daum.net' ? 'organic' : 'referral'; }
        else if (r && !hosts.includes(host) && host !== u?.hostname) { source = host; medium = 'referral'; }
        else if (!referrer) { source = 'direct'; medium = 'direct'; }
        if (!keyword && medium === 'organic' && r) keyword = trim(r.searchParams.get(source === 'naver' ? 'query' : 'q'));
        return {source, medium, keyword, keyword_status: keyword ? 'provided' : ['organic','paid'].includes(medium) ? 'unavailable' : 'not_applicable',
            landing_url: clean(href), referrer: r ? r.origin + r.pathname : '', ...utm, click_ids: ids};
    }
    function label(a) {
        if (a.source === 'direct') return '직접 방문';
        if (a.source === 'naver' && ['paid','organic'].includes(a.medium)) return a.medium === 'paid' ? '네이버 유료 광고' : '네이버 자연 검색';
        if (a.source === 'google' && ['paid','organic'].includes(a.medium)) return a.medium === 'paid' ? '구글 유료 광고' : '구글 자연 검색';
        if (a.source === 'daum' && a.medium === 'organic') return '다음 검색';
        return a.medium === 'referral' || (a.source !== 'unknown' && a.medium !== 'unknown') ? '기타 외부 사이트' : '출처 확인 불가';
    }
    const day = value => new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0,10);
    const shift = (value, n) => new Date(Date.parse(value + 'T00:00:00Z') + n * 86400000).toISOString().slice(0,10);
    const bounds = (start,end) => [new Date(start+'T00:00:00+09:00').toISOString(),new Date(shift(end,1)+'T00:00:00+09:00').toISOString()];
    function summarize(rows) {
        const sessions = new Map(), visitors = new Set(), daily = {}, sources = {}, keywords = {};
        const totals = {page_view:0,phone_click:0,quote_click:0,quote_submit:0};
        for (const row of rows) {
            if (row.tracking_version !== 2) continue;
            if (Object.hasOwn(totals,row.event_type)) totals[row.event_type]++;
            const d = day(row.created_at); daily[d] ||= {sessions:new Set(),views:0};
            daily[d].sessions.add(row.session_id); if (row.event_type === 'page_view') daily[d].views++;
            visitors.add(row.visitor_id);
            if (!sessions.has(row.session_id)) sessions.set(row.session_id,row);
        }
        for (const row of sessions.values()) {
            const key = label(row); sources[key] = (sources[key] || 0) + 1;
            const word = row.keyword || (['organic','paid'].includes(row.medium) ? '검색어 확인 불가' : '검색 유입 아님 / 미제공');
            keywords[word] = (keywords[word] || 0) + 1;
        }
        return {...totals,sessions:sessions.size,visitors:visitors.size,sources,keywords,
            daily:Object.fromEntries(Object.entries(daily).map(([d,v])=>[d,{sessions:v.sessions.size,views:v.views}]))};
    }
    const value = {hosts,fields,clicks,clean,attribution,label,day,shift,bounds,summarize};
    if (typeof module === 'object') module.exports = value; else root.AnalyticsCore = value;
})(typeof window !== 'undefined' ? window : this);
