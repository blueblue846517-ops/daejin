(function () {
    'use strict';
    const C = window.AnalyticsCore;
    const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } };
    const write = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch (_) {} };
    let memory, memoryVisitor, started = false, queue = Promise.resolve();
    const enabled = () => C.hosts.includes(location.hostname) && !location.pathname.endsWith('/admin.html') && !read('daejin_analytics_optout');
    async function context() {
        const update = () => {
            const now = Date.now(); let visitor = read('daejin_visitor') || memoryVisitor;
            if (!visitor || visitor.expires < now) { visitor = {id:crypto.randomUUID(),expires:now+180*86400000}; write('daejin_visitor',visitor); }
            memoryVisitor = visitor;
            let session = read('daejin_session') || memory;
            if (!session || now-session.last > 1800000 || session.last > now) session = {id:crypto.randomUUID(),visitor:visitor.id,first:C.attribution(location.href,document.referrer)};
            session.last = now; memory = session; write('daejin_session',session);
            let referrer='';try { const r=new URL(document.referrer);referrer=r.origin+r.pathname; } catch (_) {}
            return {...session.first,first_referrer:session.first.referrer,referrer,session_id:session.id,visitor_id:session.visitor,page_url:C.clean(location.href)};
        };
        return navigator.locks ? navigator.locks.request('daejin-analytics',update) : update();
    }
    async function payload(type) {
        if (!enabled()) return null;
        const {data} = await supabaseClient.auth.getSession();
        if (data.session?.user?.app_metadata?.role === 'admin') return null;
        return {...await context(),event_id:crypto.randomUUID(),event_type:type};
    }
    async function send(p) {
        if (!p) return;
        for (let attempt=0;attempt<2;attempt++) {
            try {
                const {data} = await supabaseClient.auth.getSession();
                const response = await fetch(SUPABASE_URL+'/rest/v1/rpc/record_analytics_event',{
                    method:'POST',keepalive:true,signal:AbortSignal.timeout(8000),
                    headers:{'Content-Type':'application/json',apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+(data.session?.access_token||SUPABASE_ANON_KEY)},
                    body:JSON.stringify({p_event:p})
                });
                if (response.ok) return;
                throw new Error('방문 기록 응답 '+response.status);
            } catch (e) { if (attempt || !/fetch|network|timeout|abort/i.test(e.message)) throw e; }
        }
    }
    const lastClick = {};
    function record(type) {
        if (type !== 'page_view' && Date.now()-(lastClick[type]||0)<800) return Promise.resolve();
        lastClick[type] = Date.now();
        queue = queue.then(async()=>send(await payload(type))).catch(e=>console.warn('방문 기록 저장 실패:',e.message));
        return queue;
    }
    window.siteAnalytics = {
        context, payload, record,
        start() {
            if (started) return queue; started=true;
            document.addEventListener('click',e=>{
                const link = e.target.closest('a'); if (!link) return;
                if (link.getAttribute('href')?.startsWith('tel:')) record('phone_click');
                else if (link.matches('[data-quote-click],a[href="#contact"],a[href="#heroQuoteForm"]')) record('quote_click');
            });
            const form = document.getElementById('heroQuoteForm');
            form?.addEventListener('submit',()=>record('quote_click'));
            window.addEventListener('pageshow',e=>{if(e.persisted) record('page_view');});
            return record('page_view');
        },
        async submitQuote(quote) {
            let pending;
            try { pending = JSON.parse(sessionStorage.getItem('daejin_quote_pending')); } catch (_) {}
            // Keep only an identifier in storage, never the contact details.
            const bytes = new TextEncoder().encode(JSON.stringify(quote));
            const signature = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
            const id = pending?.signature === signature ? pending.id : crypto.randomUUID();
            try { sessionStorage.setItem('daejin_quote_pending',JSON.stringify({id,signature})); } catch (_) {}
            const event = await payload('quote_submit');
            const {error} = await supabaseClient.rpc('submit_site_quote_v2',{p_submission:id,p_quote:quote,p_event:event});
            if (!error) { try { sessionStorage.removeItem('daejin_quote_pending'); sessionStorage.setItem('quote_conversion_pending',id); } catch (_) {} }
            return {success:!error,error};
        }
    };
    document.addEventListener('DOMContentLoaded',()=>window.siteAnalytics.start());
})();
