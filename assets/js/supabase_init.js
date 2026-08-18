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
        
        const today = new Date().toISOString().split('T')[0];
        
        // 오늘 날짜 데이터가 있는지 확인
        const { data: existing } = await supabaseClient
            .from('visitors')
            .select('visit_count')
            .eq('visit_date', today)
            .single();

        if (existing) {
            // 있으면 count + 1
            await supabaseClient
                .from('visitors')
                .update({ visit_count: existing.visit_count + 1 })
                .eq('visit_date', today);
        } else {
            // 없으면 새로 삽입
            await supabaseClient
                .from('visitors')
                .insert([{ visit_date: today, visit_count: 1 }]);
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
                const scriptEl = document.createElement('script');
                scriptEl.innerHTML = setting.setting_value;
                document.head.appendChild(scriptEl);
            } else if (setting.setting_key === 'body_script' && setting.setting_value) {
                const scriptEl = document.createElement('script');
                scriptEl.innerHTML = setting.setting_value;
                document.body.appendChild(scriptEl);
            }
        });
    },

    // 4. 전면 팝업 렌더링
    renderPopup: async () => {
        const { data: popups } = await supabaseClient
            .from('popups')
            .select('*')
            .eq('is_active', true)
            .limit(1);
        
        if (popups && popups.length > 0) {
            const popup = popups[0];
            const popupHtml = `
                <div id="sitePopupOverlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 99999; display: flex; justify-content: center; align-items: center;">
                    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                        <button onclick="document.getElementById('sitePopupOverlay').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                        <h2 style="margin-top: 0; color: #0f172a; font-size: 1.5rem; margin-bottom: 15px;">${popup.title}</h2>
                        <div style="color: #334155; line-height: 1.6;">${popup.content}</div>
                        <div style="text-align: right; margin-top: 20px;">
                            <button onclick="document.getElementById('sitePopupOverlay').remove()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">닫기</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', popupHtml);
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
