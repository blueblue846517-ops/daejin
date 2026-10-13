// Supabase 초기화 설정
const SUPABASE_URL = 'https://ymgcvcmnwisszabcyisg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZ2N2Y21ud2lzc3phYmN5aXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA2NDksImV4cCI6MjEwMjU0NjY0OX0._ICc_P7jiNY07K7Omu0WII_XOQyoc85A3KCXrt35jI0';

// Supabase 클라이언트 전역 인스턴스
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        if (options.signal) {
            if (options.signal.aborted) controller.abort();
            else options.signal.addEventListener('abort', () => controller.abort(), {once:true});
        }
        return fetch(url, {...options, signal:controller.signal}).finally(() => clearTimeout(timer));
    } }
});

// 한국 시간대 기준 날짜 문자열(YYYY-MM-DD)
function getSeoulDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

// 설정에 저장된 HTML에서 script 요소를 새로 만들어 실제로 실행되게 삽입합니다.
async function appendConfiguredMarkup(target, html) {
    const template = document.createElement('template'); template.innerHTML = html;
    const scripts = Array.from(template.content.querySelectorAll('script'));
    const saved = scripts.map(node => ({node, marker:document.createComment('configured-script')}));
    saved.forEach(({node,marker}) => node.replaceWith(marker));
    target.appendChild(template.content);
    for (const {node,marker} of saved) {
        const script = document.createElement('script');
        for (const attribute of Array.from(node.attributes)) script.setAttribute(attribute.name,attribute.value);
        script.textContent = node.textContent;
        if (script.src) {
            await new Promise(resolve => {
                const timeout = setTimeout(resolve,8000);
                const done = () => { clearTimeout(timeout); resolve(); };
                script.onload = done; script.onerror = done; marker.replaceWith(script);
            });
        } else marker.replaceWith(script);
    }
}

// 공통 유틸리티 기능
const api = {
    getSeoulDateString,

    // 1. 방문자 통계 업데이트
    trackVisitor: async () => {
        return window.siteAnalytics?.start();
    },

    // 2. 견적 문의 폼 접수
    submitQuote: async (quoteData) => {
        if (!window.siteAnalytics) return {success:false,error:new Error('문의 저장 모듈을 불러오지 못했습니다.')};
        return window.siteAnalytics.submitQuote(quoteData);
    },

    // 3. 동적 스크립트 불러오기 및 적용
    applySettings: async () => {
        const { data: settings, error } = await supabaseClient.from('settings').select('setting_key,setting_value').in('setting_key', ['head_script','body_script','seo_title','seo_desc','seo_keywords','ga_measurement_id','kakao_js_key','seo_google_verify','seo_naver_verify']);
        if (error) throw error;
        if (!settings) return;

        for (const setting of settings) {
            if (setting.setting_key === 'head_script' && setting.setting_value) {
                await appendConfiguredMarkup(document.head, setting.setting_value);
            } else if (setting.setting_key === 'body_script' && setting.setting_value) {
                await appendConfiguredMarkup(document.body, setting.setting_value);
            } else if (setting.setting_key === 'seo_title' && setting.setting_value) {
                document.title = setting.setting_value;
                const ogTitle = document.querySelector('meta[property="og:title"]');
                if (ogTitle) ogTitle.content = setting.setting_value;
            } else if (setting.setting_key === 'seo_desc' && setting.setting_value) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (!metaDesc) {
                    metaDesc = document.createElement('meta');
                    metaDesc.name = "description";
                    document.head.appendChild(metaDesc);
                }
                metaDesc.content = setting.setting_value;
                
                const ogDesc = document.querySelector('meta[property="og:description"]');
                if (ogDesc) ogDesc.content = setting.setting_value;
            } else if (setting.setting_key === 'seo_keywords' && setting.setting_value) {
                let metaKeywords = document.querySelector('meta[name="keywords"]');
                if (!metaKeywords) {
                    metaKeywords = document.createElement('meta');
                    metaKeywords.name = "keywords";
                    document.head.appendChild(metaKeywords);
                }
                metaKeywords.content = setting.setting_value;
            } else if (setting.setting_key === 'ga_measurement_id' && setting.setting_value) {
                // 구글 애널리틱스 스크립트 추가
                const gaId = setting.setting_value;
                if (!/^G-[A-Z0-9]+$/.test(gaId)) continue;
                const gaScript = document.createElement('script');
                gaScript.async = true;
                gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
                document.head.appendChild(gaScript);

                const gaInit = document.createElement('script');
                gaInit.innerHTML = `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaId}');
                `;
                document.head.appendChild(gaInit);
            } else if (setting.setting_key === 'kakao_js_key' && setting.setting_value) {
                // 카카오 SDK 및 초기화 스크립트 추가
                const kakaoId = setting.setting_value;
                // 기존 스크립트가 없을 때만 추가
                if (!document.getElementById('kakao-sdk')) {
                    const kakaoScript = document.createElement('script');
                    kakaoScript.id = 'kakao-sdk';
                    kakaoScript.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
                    kakaoScript.onload = () => {
                        if (window.Kakao && !Kakao.isInitialized()) {
                            Kakao.init(kakaoId);
                        }
                    };
                    document.head.appendChild(kakaoScript);
                }
            } else if (setting.setting_key === 'seo_google_verify' && setting.setting_value) {
                let val = setting.setting_value;
                const match = val.match(/content=["']([^"']+)["']/i);
                if (match) val = match[1];

                let metaGoogle = document.querySelector('meta[name="google-site-verification"]');
                if (!metaGoogle) {
                    metaGoogle = document.createElement('meta');
                    metaGoogle.name = "google-site-verification";
                    document.head.appendChild(metaGoogle);
                }
                metaGoogle.content = val;
            } else if (setting.setting_key === 'seo_naver_verify' && setting.setting_value) {
                let val = setting.setting_value;
                const match = val.match(/content=["']([^"']+)["']/i);
                if (match) val = match[1];

                let metaNaver = document.querySelector('meta[name="naver-site-verification"]');
                if (!metaNaver) {
                    metaNaver = document.createElement('meta');
                    metaNaver.name = "naver-site-verification";
                    document.head.appendChild(metaNaver);
                }
                metaNaver.content = val;
            }
        }
    },

    // 4. 전면 팝업 렌더링
    renderPopup: async () => {
        // 이미 24시간 안보기 쿠키가 있는지 확인
        if (document.cookie.includes('hidePopup_24h=true')) return;

        const { data: popups } = await supabaseClient
            .from('popups')
            .select('*')
            .order('id').limit(1);
        
        if (popups && popups.length > 0 && popups[0].is_active) {
            const popup = popups[0];
            const popupHtml = `
                <div id="sitePopupOverlay" style="position: fixed; top: 100px; left: 20px; z-index: 99999;">
                    <div style="background: white; padding: 0; border: 1px solid #1e293b; max-width: 400px; width: 90vw; position: relative; box-shadow: 5px 5px 15px rgba(0,0,0,0.3); border-radius: 0;">
                        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
                            <h2 style="margin-top: 0; color: #0f172a; font-size: 1.25rem; margin-bottom: 15px;">${popup.title}</h2>
                            <div style="color: #334155; line-height: 1.6; font-size: 0.95rem;">${popup.content}</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; padding: 10px 15px;">
                            <label style="font-size: 0.85rem; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 5px; margin: 0;">
                                <input type="checkbox" id="hidePopup24hCheckbox"> 24시간 동안 보지 않기
                            </label>
                            <button onclick="window.closeSitePopup()" style="background: #334155; color: white; border: none; padding: 6px 15px; border-radius: 0; cursor: pointer; font-size: 0.9rem;">닫기</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', popupHtml);
            
            window.closeSitePopup = function() {
                const cb = document.getElementById('hidePopup24hCheckbox');
                if (cb && cb.checked) {
                    const d = new Date();
                    d.setTime(d.getTime() + (24*60*60*1000));
                    document.cookie = "hidePopup_24h=true;expires=" + d.toUTCString() + ";path=/";
                }
                const popup = document.getElementById('sitePopupOverlay');
                if (popup) popup.remove();
            };
        }
    }
};

// 스크립트 로드 시 자동으로 URL 파라미터를 분석하여 유입 키워드 캡처 및 저장
(function captureInflowKeyword() {
    const params = new URLSearchParams(window.location.search);
    // 주요 검색어 파라미터 감지 (광고 플랫폼 및 커스텀 파라미터)
    const keyword = params.get('keyword') || params.get('utm_term') || params.get('query') || params.get('nvkwd');
    if (keyword) {
        try { sessionStorage.setItem('inflow_keyword', keyword); } catch (_) {}
    }
})();
