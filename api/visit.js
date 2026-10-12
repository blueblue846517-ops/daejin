// Vercel server function. The service role key must only be set in server environment variables.
const { isIP } = require('node:net');
module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control','no-store');
    if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
    const base = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return res.status(503).json({error:'방문 집계 서버 설정이 필요합니다.'});
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body || !/^[0-9a-f-]{36}$/i.test(body.sessionId || '')) return res.status(400).json({error:'Invalid session'});
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({error:'Invalid origin'});
        const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
        if (!isIP(ip)) return res.status(400).json({error:'Invalid address'});
        const url = new URL(body.url);
        if (url.host !== req.headers.host) return res.status(400).json({error:'Invalid URL'});
        const referrer = String(body.referrer || '').slice(0,2000);
        let refHost = ''; try { refHost = new URL(referrer).hostname; } catch (_) {}
        const domain = domain => refHost === domain || refHost.endsWith('.'+domain);
        let path = '직접 유입 (또는 알 수 없음)';
        if (url.searchParams.get('utm_source')?.includes('naver_ads') || ['n_clk','NVADID','n_ad'].some(k => url.searchParams.has(k))) path='네이버 광고';
        else if (domain('naver.com')) path='네이버 검색';
        else if (domain('google.com') || domain('google.co.kr')) path='구글 검색';
        else if (domain('instagram.com')) path='인스타그램';
        else if (domain('facebook.com')) path='페이스북';
        else if (domain('daum.net')) path='다음 검색';
        else if (refHost === url.hostname) path='내부 이동';
        else if (refHost) path='기타 외부 유입 ('+refHost+')';
        const response = await fetch(base+'/rest/v1/rpc/record_site_visit', {
            method:'POST', headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
            body:JSON.stringify({p_session:body.sessionId,p_ip:ip,p_path:path,p_referrer:referrer}), signal:AbortSignal.timeout(6000)
        });
        if (!response.ok) return res.status(502).json({error:'방문 기록을 저장하지 못했습니다.'});
        return res.status(200).json(await response.json());
    } catch (_) { return res.status(502).json({error:'방문 집계 요청을 완료하지 못했습니다.'}); }
};
