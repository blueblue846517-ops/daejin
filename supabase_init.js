// Supabase 초기화 설정
const SUPABASE_URL = 'https://ymgcvcmnwisszabcyisg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZ2N2Y21ud2lzc3phYmN5aXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA2NDksImV4cCI6MjEwMjU0NjY0OX0._ICc_P7jiNY07K7Omu0WII_XOQyoc85A3KCXrt35jI0';

// Supabase 클라이언트 전역 인스턴스
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 공통 유틸리티 기능
const api = {
    // 1. 방문자 통계 업데이트
    trackVisitor: async () => {
        // 이미 오늘 방문한 경우 세션 체크 (단순 방지)
        if (sessionStorage.getItem('visited_today')) return;
        
        let ip = null;
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ip = data.ip;
        } catch (e) {
            console.error('IP fetch failed:', e);
        }

        if (ip) {
            const { data: blocked } = await supabaseClient.from('blocked_ips').select('ip').eq('ip', ip).single();
            if (blocked) {
                document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f1f5f9; color:#334155; font-family:sans-serif;"><h1>접근이 차단되었습니다.</h1></div>';
                return;
            }
        }

        let inflowPath = '직접 유입 (또는 알 수 없음)';
        const ref = document.referrer.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('utm_source') && urlParams.get('utm_source').includes('naver_ads')) {
            inflowPath = '네이버 광고';
        } else if (urlParams.has('n_clk') || urlParams.has('NVADID')) {
            inflowPath = '네이버 광고';
        } else if (ref.includes('naver.com')) {
            inflowPath = '네이버 검색';
        } else if (ref.includes('google.com') || ref.includes('google.co.kr')) {
            inflowPath = '구글 검색';
        } else if (ref.includes('instagram.com')) {
            inflowPath = '인스타그램';
        } else if (ref.includes('facebook.com')) {
            inflowPath = '페이스북';
        } else if (ref.includes('daum.net')) {
            inflowPath = '다음 검색';
        } else if (ref && !ref.includes(window.location.hostname)) {
            try {
                inflowPath = '기타 외부 유입 (' + new URL(ref).hostname + ')';
            } catch(e) {}
        } else if (ref.includes(window.location.hostname)) {
            inflowPath = '내부 이동';
        }

        if (ip && inflowPath !== '내부 이동') {
            await supabaseClient.from('visit_logs').insert([{ ip: ip, path: inflowPath, referrer: document.referrer }]);
        }

        if (inflowPath !== '내부 이동') {
            const today = new Date().toISOString().split('T')[0];
            const { data: existing } = await supabaseClient
                .from('visitors')
                .select('visit_count')
                .eq('visit_date', today)
                .single();

            if (existing) {
                await supabaseClient.from('visitors').update({ visit_count: existing.visit_count + 1 }).eq('visit_date', today);
            } else {
                await supabaseClient.from('visitors').insert([{ visit_date: today, visit_count: 1 }]);
            }
        }
        
        sessionStorage.setItem('visited_today', 'true');
    },

    // 2. 견적 문의 폼 접수
    submitQuote: async (quoteData) => {
        const { error } = await supabaseClient
            .from('quotes')
            .insert([quoteData]);
        return { success: !error, error };
    },

    // 3. 동적 스크립트 불러오기 및 적용
    applySettings: async () => {
        const { data: settings } = await supabaseClient.from('settings').select('*');
        if (!settings) return;

        settings.forEach(setting => {
            if (setting.setting_key === 'head_script' && setting.setting_value) {
                document.head.insertAdjacentHTML('beforeend', setting.setting_value);
            } else if (setting.setting_key === 'body_script' && setting.setting_value) {
                document.body.insertAdjacentHTML('beforeend', setting.setting_value);
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
                let metaGoogle = document.querySelector('meta[name="google-site-verification"]');
                if (!metaGoogle) {
                    metaGoogle = document.createElement('meta');
                    metaGoogle.name = "google-site-verification";
                    document.head.appendChild(metaGoogle);
                }
                metaGoogle.content = setting.setting_value;
            } else if (setting.setting_key === 'seo_naver_verify' && setting.setting_value) {
                let metaNaver = document.querySelector('meta[name="naver-site-verification"]');
                if (!metaNaver) {
                    metaNaver = document.createElement('meta');
                    metaNaver.name = "naver-site-verification";
                    document.head.appendChild(metaNaver);
                }
                metaNaver.content = setting.setting_value;
            }
        });
    },

    // 4. 전면 팝업 렌더링
    renderPopup: async () => {
        // 이미 24시간 안보기 쿠키가 있는지 확인
        if (document.cookie.includes('hidePopup_24h=true')) return;

        const { data: popups } = await supabaseClient
            .from('popups')
            .select('*')
            .eq('is_active', true)
            .limit(1);
        
        if (popups && popups.length > 0) {
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
        sessionStorage.setItem('inflow_keyword', keyword);
    }
})();
