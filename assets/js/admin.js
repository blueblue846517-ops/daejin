document.addEventListener('DOMContentLoaded', () => {
            const loginForm = document.getElementById('loginForm');
            const loginScreen = document.getElementById('loginScreen');
            const dashboardScreen = document.getElementById('dashboardScreen');
            const loginError = document.getElementById('loginError');
            const logoutBtn = document.getElementById('logoutBtn');

            let activeAdmin = null;
            async function checkAuth() {
                try {
                    const user = await siteData.requireAdmin();
                    if (activeAdmin !== user.id) { activeAdmin = user.id; showDashboard(); }
                } catch (error) { activeAdmin = null; showLogin(); }
            }
            onSubmit(loginForm, async () => {
                const { error } = await supabaseClient.auth.signInWithPassword({
                    email: document.getElementById('adminId').value.trim(),
                    password: document.getElementById('adminPw').value
                });
                if (error) throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
                await siteData.requireAdmin();
                loginError.style.display = 'none';
                document.getElementById('adminPw').value = '';
                await checkAuth();
            });
            logoutBtn.addEventListener('click', async () => {
                const { error } = await supabaseClient.auth.signOut();
                if (error) return alert('로그아웃 실패: ' + error.message);
                activeAdmin = null; location.reload();
            });
            supabaseClient.auth.onAuthStateChange(() => { setTimeout(checkAuth, 0); });
            setTimeout(checkAuth, 0);

            // 모바일 메뉴 토글
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            const sidebarMenuContent = document.getElementById('sidebarMenuContent');
            if(mobileMenuToggle && sidebarMenuContent) {
                mobileMenuToggle.addEventListener('click', () => {
                    sidebarMenuContent.classList.toggle('open');
                });
            }

            function showDashboard() {
                loginScreen.style.display = 'none';
                dashboardScreen.style.display = 'block';
                loadAdminData().catch(reportError);
            }

            function showLogin() {
                dashboardScreen.style.display = 'none';
                loginScreen.style.display = 'flex';
                document.getElementById('adminId').value = '';
                document.getElementById('adminPw').value = '';
                loginError.style.display = 'none';
            }

            // 4. Tab Navigation
            document.querySelectorAll('.nav-link[data-target]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Update active state
                    document.querySelectorAll('.nav-link[data-target]').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Show target tab
                    const targetId = link.getAttribute('data-target');
                    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                    document.getElementById(targetId).classList.add('active');
                    
                    // Update title
                    document.getElementById('pageTitle').innerText = link.innerText;
                    if (targetId === 'tab-analytics') loadAnalytics().catch(reportError);
                    if (targetId === 'tab-seo' || targetId === 'tab-sms') loadSeoAndSmsSettings().catch(reportError);
                    if (targetId === 'tab-tracking' || targetId === 'tab-settings') loadSettingsAndPopups().catch(reportError);
                });
            });

                        // ======================================================
            // SUPABASE DATA LOADING & MANAGEMENT
                        // ======================================================

                        function reportError(error) { console.error(error); alert('처리하지 못했습니다: ' + (error.message || error)); }
            function onSubmit(form, handler) {
                form.addEventListener('submit', async e => {
                    e.preventDefault(); const button = form.querySelector('button[type="submit"]');
                    if (button.disabled) return; button.disabled = true;
                    try { await handler(e); } catch (error) { reportError(error); }
                    finally { button.disabled = false; }
                });
            }
            // --- Toast Notification ---
            function escapeHtml(value) {
                return String(value ?? '').replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]));
            }

            function showToast(message) {
                const toast = document.createElement('div');
                toast.innerText = message;
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.right = '20px';
                toast.style.backgroundColor = '#10b981';
                toast.style.color = '#fff';
                toast.style.padding = '12px 24px';
                toast.style.borderRadius = '8px';
                toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                toast.style.zIndex = '99999';
                toast.style.transition = 'opacity 0.3s';
                document.body.appendChild(toast);
                setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
            }

            // --- Quote Details & Admin Note ---
            window.openQuoteDetail = async (id) => {
                const { data, error } = await supabaseClient.from('quotes').select('*').eq('id', id).single();
                if (error || !data) return alert('데이터를 불러오지 못했습니다.');
                for (const key of ['name','phone','service','region','message','status']) data[key] = escapeHtml(data[key]);
                
                let infoHtml = '<p><strong>고객명/상호:</strong> ' + data.name + '</p>' +
'<p><strong>연락처:</strong> ' + data.phone + '</p>' +
'<p><strong>시공 항목:</strong> ' + data.service + '</p>' +
'<p><strong>지역/주소:</strong> ' + (data.region || '미입력') + '</p>' +
'<p><strong>상세 내용:</strong> ' + data.message + '</p>' +
'<p><strong>접수 일시:</strong> ' + new Date(data.created_at).toLocaleString() + '</p>' +
'<p><strong>현재 상태:</strong> <span class="status-badge">' + data.status + '</span> (최근 변경: ' + (data.status_updated_at ? new Date(data.status_updated_at).toLocaleString() : '-') + ')</p>';
                document.getElementById('quoteDetailInfo').innerHTML = infoHtml;
                document.getElementById('quoteAdminNote').value = data.admin_note || '';
                
                const historyUl = document.getElementById('quoteStatusHistory');
                historyUl.innerHTML = '';
                let history = [];
                try { history = typeof data.status_history === 'string' ? JSON.parse(data.status_history) : (data.status_history || []); } catch(e){}
                if (history.length === 0) {
                    historyUl.innerHTML = '<li>변경 이력이 없습니다.</li>';
                } else {
                    history.forEach(h => {
                        historyUl.innerHTML += '<li>[' + new Date(h.time).toLocaleString() + '] 상태 변경: <strong>' + escapeHtml(h.status) + '</strong></li>';
                    });
                }
                
                document.getElementById('saveQuoteNoteBtn').onclick = async () => { try {
                    const note = document.getElementById('quoteAdminNote').value;
                    siteData.unwrap(await supabaseClient.from('quotes').update({ admin_note: note }).eq('id', id).select('id').single(), true); const error = null;
                    if(!error) {
                        showToast('메모가 저장되었습니다.');
                        document.getElementById('quoteDetailModal').style.display = 'none';
                    } else {
                        alert('저장 실패: ' + error.message);
                    }
                } catch (error) { reportError(error); } };
                
                document.getElementById('quoteDetailModal').style.display = 'flex';
            };

            // 상태 변경 덮어쓰기 (히스토리 추가 로직 포함)
            window.updateQuoteStatus = async (id, status) => {
                const currentData = siteData.unwrap(await supabaseClient.from('quotes').select('status_history').eq('id', id).single(), true);
                let history = [];
                if(currentData) {
                    try { history = typeof currentData.status_history === 'string' ? JSON.parse(currentData.status_history) : (currentData.status_history || []); } catch(e){}
                }
                history.push({ status: status, time: new Date().toISOString() });
                
                const { error, data: updatedRows } = await supabaseClient.from('quotes').update({ 
                    status: status, 
                    status_history: history,
                    status_updated_at: new Date().toISOString()
                }).eq('id', id).select('id').single();
                siteData.unwrap({error, data:updatedRows}, true);
                if(!error) showToast('상태가 [' + status + ']로 변경되었습니다.');
                loadQuotes();
            };

            // --- SEO 및 알림 설정 로드/저장 ---
            async function loadSeoAndSmsSettings() {
                const settings = (await Promise.all([siteData.settings(), siteData.settings('private_settings')])).flat();
                if (settings) {
                    settings.forEach(s => {
                        if (s.setting_key === 'seo_title' && document.getElementById('seoTitle')) document.getElementById('seoTitle').value = s.setting_value;
                        if (s.setting_key === 'seo_desc' && document.getElementById('seoDesc')) document.getElementById('seoDesc').value = s.setting_value;
                        if (s.setting_key === 'seo_keywords' && document.getElementById('seoKeywords')) document.getElementById('seoKeywords').value = s.setting_value;
                        if (s.setting_key === 'ga_measurement_id' && document.getElementById('seoGoogleAnalytics')) document.getElementById('seoGoogleAnalytics').value = s.setting_value;
                        if (s.setting_key === 'kakao_js_key' && document.getElementById('seoKakaoJSKey')) document.getElementById('seoKakaoJSKey').value = s.setting_value;
                        
                        if (s.setting_key === 'seo_naver_verify' && document.getElementById('seoNaver')) document.getElementById('seoNaver').value = s.setting_value;
                        if (s.setting_key === 'seo_google_verify' && document.getElementById('seoGoogle')) document.getElementById('seoGoogle').value = s.setting_value;
                        
                        if (s.setting_key === 'sms_provider' && document.getElementById('smsProvider')) document.getElementById('smsProvider').value = s.setting_value;
                        if (s.setting_key === 'sms_api_key' && document.getElementById('smsApiKey')) document.getElementById('smsApiKey').value = s.setting_value;
                        if (s.setting_key === 'sms_sender' && document.getElementById('smsSender')) document.getElementById('smsSender').value = s.setting_value;
                        if (s.setting_key === 'sms_template_admin' && document.getElementById('smsTemplateAdmin')) document.getElementById('smsTemplateAdmin').value = s.setting_value;
                        if (s.setting_key === 'sms_template_user' && document.getElementById('smsTemplateUser')) document.getElementById('smsTemplateUser').value = s.setting_value;
                    });
                }
            }
            
            // DOMContentLoaded 바깥에서 현재 화면에 저장 이벤트를 연결합니다.
            // 이 스크립트는 DOMContentLoaded 이후 실행되므로 이벤트를 다시 기다리면 폼이 작동하지 않습니다.


            const seoForm = document.getElementById('seoForm');
            if (seoForm) {
                onSubmit(seoForm, async (e) => {
                    e.preventDefault();
                    await siteData.saveSettings([
                        { setting_key: 'seo_title', setting_value: document.getElementById('seoTitle').value },
                        { setting_key: 'seo_desc', setting_value: document.getElementById('seoDesc').value },
                        { setting_key: 'seo_keywords', setting_value: document.getElementById('seoKeywords').value },
                        { setting_key: 'ga_measurement_id', setting_value: document.getElementById('seoGoogleAnalytics').value },
                        { setting_key: 'kakao_js_key', setting_value: document.getElementById('seoKakaoJSKey').value }
                    ], 'settings');
                    const error = null;
                    if (error) {
                        alert('SEO 설정 저장 중 오류가 발생했습니다: ' + error.message);
                        return;
                    }
                    showToast('SEO 설정이 저장되었습니다. 검색 결과에 반영되기까지는 시간이 걸릴 수 있습니다.');
                });
            }

            const smsForm = document.getElementById('smsForm');
            if (smsForm) {
                onSubmit(smsForm, async (e) => {
                    e.preventDefault();
                    await siteData.saveSettings([
                        { setting_key: 'sms_provider', setting_value: document.getElementById('smsProvider').value },
                        { setting_key: 'sms_api_key', setting_value: document.getElementById('smsApiKey').value },
                        { setting_key: 'sms_sender', setting_value: document.getElementById('smsSender').value },
                        { setting_key: 'sms_template_admin', setting_value: document.getElementById('smsTemplateAdmin').value },
                        { setting_key: 'sms_template_user', setting_value: document.getElementById('smsTemplateUser').value }
                    ], 'private_settings');
                    const error = null;
                    if (error) {
                        alert('문자 설정 저장 중 오류가 발생했습니다: ' + error.message);
                        return;
                    }
                    showToast('문자 설정이 저장되었습니다. 자동 발송 서버 연결은 별도로 필요합니다.');
                });
            }

            async function loadAdminData() {
                const results = await Promise.allSettled([loadQuotes(), loadVisitors(), loadPortfolios(), loadSeoAndSmsSettings(), loadSettingsAndPopups()]);
                results.filter(r => r.status === 'rejected').forEach(r => reportError(r.reason));
            }

            // --- Quotes ---
            async function loadQuotes() {
                const quotes = [];
                for (let start = 0; ; start += 500) {
                    const batch = siteData.unwrap(await supabaseClient.from('quotes').select('*')
                        .order('created_at', {ascending:false}).order('id').range(start,start+499)) || [];
                    quotes.push(...batch); if (batch.length < 500) break;
                }

                document.getElementById('statNewQuotes').innerText = `${quotes.filter(q => q.status === '신규 접수' || q.status === '접수 대기' || q.status === '전화 연결').length} 건`;

                                const renderTable = (limit, targetId) => {
                    const tbody = document.getElementById(targetId);
                    tbody.innerHTML = '';
                    quotes.slice(0, limit).forEach(raw => {
                        const q = {...raw};
                        for (const key of ['name','phone','service','message','status']) q[key] = escapeHtml(q[key]);
                        const date = new Date(q.created_at).toLocaleDateString();
                        const isNew = (q.status === '신규 접수' || q.status === '접수 대기' || q.status === '전화 연결');
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${q.name}</strong></td>
                            <td>${q.phone}</td>
                            <td>
                                <div><span style="font-size:0.8rem; color:var(--admin-secondary); font-weight:bold;">[${q.service}]</span></div>
                                <div style="font-size:0.9rem; margin-top:4px;">${q.message}</div>
                            </td>
                            <td>${date}</td>
                            <td><span class="status-badge ${isNew ? 'status-new' : 'status-done'}">${q.status}</span></td>
                            ${limit > 5 ? `<td>
                                <select onchange="updateQuoteStatus('${q.id}', this.value)" style="padding:4px; max-width: 140px; font-size: 0.85rem;">
                                    <option value="신규 접수" ${q.status === '신규 접수' ? 'selected' : ''}>신규 접수</option>
                                    <option value="접수 대기" ${q.status === '접수 대기' ? 'selected' : ''}>접수 대기</option>
                                    <option value="유선 상담 완료" ${q.status === '유선 상담 완료' ? 'selected' : ''}>유선 상담 완료</option>
                                    <option value="현장 방문 견적 예정" ${q.status === '현장 방문 견적 예정' ? 'selected' : ''}>방문 견적 예정</option>
                                    <option value="시공 확정" ${q.status === '시공 확정' ? 'selected' : ''}>시공 확정</option>
                                    <option value="시공 완료" ${q.status === '시공 완료' ? 'selected' : ''}>시공 완료</option>
                                    <option value="보증/사후관리(AS)" ${q.status === '보증/사후관리(AS)' ? 'selected' : ''}>사후관리(AS)</option>
                                </select>
                                <button onclick="openQuoteDetail('${q.id}')" class="btn-secondary" style="margin-left:5px; padding: 4px 8px; font-size: 0.85rem;">상세·메모</button>
                                <button onclick="deleteQuote('${q.id}')" style="margin-left:5px; padding: 4px 8px; font-size: 0.85rem; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;">삭제</button>
                                </td>` : ''}
                        `;
                        tbody.appendChild(tr);
                    });
                };

                renderTable(5, 'previewQuotesTable'); // Dashboard preview
                renderTable(Math.max(6, quotes.length), 'allQuotesTable'); // Full list
                renderKeywordStats(quotes);
            }

            function renderKeywordStats(quotes) {
                const keywordMap = {};
                let totalWithKeyword = 0;

                // 정규식을 사용하여 '[유입 키워드: OOO]' 형태에서 OOO 추출
                const regex = /\[유입 키워드:\s*(.*?)\]/;
                
                quotes.forEach(q => {
                    if (q.message) {
                        const match = q.message.match(regex);
                        if (match && match[1]) {
                            const kw = match[1].trim();
                            if (kw) {
                                keywordMap[kw] = (keywordMap[kw] || 0) + 1;
                                totalWithKeyword++;
                            }
                        }
                    }
                });

                const container = document.getElementById('keywordChartContainer');
                
                if (totalWithKeyword === 0) {
                    container.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">아직 키워드를 통해 유입된 견적 문의 데이터가 없습니다.</p>';
                    return;
                }

                // 많이 들어온 순으로 정렬
                const sortedKeywords = Object.entries(keywordMap).sort((a, b) => b[1] - a[1]);
                
                let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
                
                // 최고값(100% 바) 기준점 설정
                const maxCount = sortedKeywords[0][1];

                sortedKeywords.forEach(([kw, count]) => {
                    const percentage = Math.round((count / maxCount) * 100);
                    const realPercentage = Math.round((count / totalWithKeyword) * 100);
                    
                    html += `
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span style="font-weight: 600; color: #1e293b;">${escapeHtml(kw)}</span>
                                <span style="color: #64748b;">${count}건 <span style="font-size:0.8rem;">(${realPercentage}%)</span></span>
                            </div>
                            <div style="width: 100%; background-color: #f1f5f9; border-radius: 4px; height: 12px; overflow: hidden;">
                                <div style="width: ${percentage}%; background-color: #3b82f6; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                html += `<div style="margin-top: 15px; font-size: 0.8rem; color: #94a3b8; text-align: right;">키워드 유입 총 문의: ${totalWithKeyword}건</div>`;
                
                container.innerHTML = html;
            }

            /* old updateQuoteStatus removed */

            window.deleteQuote = async (id) => {
                if(confirm('정말 삭제하시겠습니까?')) {
                    await siteData.remove('quotes', id);
                    loadQuotes();
                }
            };

            // --- Visitors ---
            async function loadVisitors() {
                const from = new Date(); from.setDate(from.getDate() - 6);
                const { data: visitors, error } = await supabaseClient.from('visitors').select('visit_date,visit_count').gte('visit_date',api.getSeoulDateString(from));
                if (error) throw error; if (!visitors) return;

                const today = api.getSeoulDateString();
                const todayData = visitors.find(v => v.visit_date === today);
                document.getElementById('statTodayVisits').innerText = `${todayData ? todayData.visit_count : 0} 명`;

                // Calculate this week
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 6);
                const weekStart = api.getSeoulDateString(weekAgo);
                const weekVisits = visitors
                    .filter(v => v.visit_date >= weekStart && v.visit_date <= today)
                    .reduce((sum, v) => sum + v.visit_count, 0);
                document.getElementById('statWeekVisits').innerText = `${weekVisits} 명`;
            }

            // --- Portfolios ---
            window.currentPortfolios = [];
            async function loadPortfolios() {
                const portfolios = [];
                for (let start = 0; ; start += 100) {
                    const batch = siteData.unwrap(await supabaseClient.from('portfolios')
                        .select('id,title,display_order,created_at,updated_at,thumbnail_url')
                        .order('display_order', {ascending:true, nullsFirst:false}).order('created_at', {ascending:false}).order('id')
                        .range(start, start + 99)) || [];
                    portfolios.push(...batch); if (batch.length < 100) break;
                }
                window.currentPortfolios = portfolios;
                const list = document.getElementById('portfolioList');
                list.replaceChildren();
                if (!portfolios.length) { list.textContent = '아직 등록된 시공 사례가 없습니다.'; return; }
                portfolios.forEach((p, index) => {
                    const div = document.createElement('div'); div.className = 'portfolio-item';
                    const id = p.id;
                    div.innerHTML = `
                        <img src="${escapeHtml(siteData.safeImage(p.thumbnail_url || '') || 'assets/images/logo.png')}" alt="${escapeHtml(p.title)}" loading="lazy" decoding="async">
                        <input type="text" id="title_${id}" value="${escapeHtml(p.title)}" style="width:100%;padding:6px;margin-bottom:10px;box-sizing:border-box;">
                        <input type="file" id="append_img_${id}" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="width:100%;font-size:.75rem;">
                        <select id="image_mode_${id}" style="margin:8px 0;width:100%;"><option value="append">기존 사진에 추가</option><option value="replace">선택한 사진으로 전체 교체</option></select>
                        <details><summary>기존 사진 확인·선택 삭제</summary><div id="images_${id}"></div></details>
                        <div style="display:flex;justify-content:space-between;margin-top:10px;">
                            <div><button type="button" onclick="movePortfolio(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <button type="button" onclick="movePortfolio(${index}, 'down')" ${index === portfolios.length - 1 ? 'disabled' : ''}>▼</button></div>
                            <div><button type="button" onclick="updatePortfolio('${id}')" id="update_btn_${id}" class="btn-primary">저장</button>
                            <button type="button" onclick="deletePortfolio('${id}')" class="btn-danger">삭제</button></div>
                        </div>`;
                    div.querySelector('details').addEventListener('toggle', async e => {
                        if (!e.target.open || p.editorImages) return;
                        const target = document.getElementById('images_' + id); target.textContent = '사진을 불러오는 중입니다...';
                        try {
                            const loaded = await siteData.gallery(id); p.editorImages = loaded;
                            target.replaceChildren();
                            loaded.forEach((url, i) => {
                                const label = document.createElement('label'); label.style.display = 'block';
                                const img = document.createElement('img'); img.src = url; img.loading = 'lazy'; img.alt = p.title;
                                const box = document.createElement('input'); box.type = 'checkbox'; box.dataset.removeImage = i;
                                label.append(img, box, document.createTextNode(' 이 사진 삭제')); target.append(label);
                            });
                        } catch (error) { target.textContent = '사진 조회 실패. 닫았다가 다시 열어 주세요.'; reportError(error); }
                    });
                    list.append(div);
                });
            }
            window.updatePortfolio = async id => {
                const title = document.getElementById('title_' + id).value.trim();
                if (!title) throw new Error('제목을 입력해 주세요.');
                const input = document.getElementById('append_img_' + id);
                const button = document.getElementById('update_btn_' + id);
                if (button.disabled) return;
                const item = window.currentPortfolios.find(p => String(p.id) === String(id));
                const removed = new Set(Array.from(document.querySelectorAll(`#images_${CSS.escape(String(id))} input:checked`), box => Number(box.dataset.removeImage)));
                const replacing = document.getElementById('image_mode_' + id).value === 'replace';
                if (replacing && !input.files.length) throw new Error('교체할 사진을 선택해 주세요.');
                button.disabled = true; button.textContent = '저장 중...';
                try {
                    const values = { title };
                    if (input.files.length || removed.size) {
                        const previous = item.editorImages || await siteData.gallery(id);
                        const kept = replacing ? [] : previous.filter((_,i) => !removed.has(i));
                        const uploaded = input.files.length ? await siteData.uploadImages(Array.from(input.files)) : {urls:[],thumbnail:null};
                        const all = [...kept, ...uploaded.urls];
                        if (!all.length) throw new Error('시공 사례에는 사진이 한 장 이상 필요합니다.');
                        values.image_data = JSON.stringify(all);
                        values.thumbnail_url = kept.length ? (kept[0] === previous[0] ? item.thumbnail_url : kept[0]) : uploaded.thumbnail;
                        // A legacy remaining image may be large; generate a small Storage preview without changing the original.
                        if (kept.length && (!values.thumbnail_url || kept[0] !== previous[0])) {
                            const response = await fetch(kept[0]); if (!response.ok) throw new Error('대표 사진을 읽을 수 없습니다.');
                            const result = await siteData.uploadImages([await response.blob()]); values.thumbnail_url = result.thumbnail;
                        }
                    }
                    let query = supabaseClient.from('portfolios').update(values).eq('id',id);
                    if (item.updated_at) query = query.eq('updated_at', item.updated_at);
                    siteData.unwrap(await query.select('id').single(), true);
                    siteData.changed(); await loadPortfolios(); showToast('시공 사례가 저장되었습니다.');
                } finally { button.disabled = false; button.textContent = '저장'; }
            };
            let movingPortfolio = false;
            window.movePortfolio = async (index, direction) => {
                if (movingPortfolio) return;
                const list = window.currentPortfolios;
                const other = direction === 'up' ? index - 1 : index + 1;
                if (other < 0 || other >= list.length) return;
                movingPortfolio = true;
                try {
                    siteData.unwrap(await supabaseClient.rpc('move_portfolio', {p_id:String(list[index].id), p_target_id:String(list[other].id)}));
                    siteData.changed(); await loadPortfolios();
                } finally { movingPortfolio = false; }
            };
            onSubmit(document.getElementById('portfolioForm'), async e => {
                const title = document.getElementById('pfTitle').value.trim();
                const files = Array.from(document.getElementById('pfImage').files);
                if (!title || !files.length) throw new Error('제목과 사진을 입력해 주세요.');
                const uploaded = await siteData.uploadImages(files);
                siteData.unwrap(await supabaseClient.from('portfolios').insert([{title, image_data:JSON.stringify(uploaded.urls), thumbnail_url:uploaded.thumbnail}]).select('id').single(), true);
                siteData.changed(); e.target.reset(); await loadPortfolios(); showToast('시공 사례가 등록되었습니다.');
            });
            window.deletePortfolio = async id => {
                if (!confirm('삭제하면 홈페이지에서도 사라집니다. 삭제하시겠습니까?')) return;
                await siteData.remove('portfolios', id); siteData.changed(); await loadPortfolios(); showToast('시공 사례가 삭제되었습니다.');
            };

            // --- Settings & Popups ---
            async function loadSettingsAndPopups() {
                // Settings
                const settings = await siteData.settings();
                if (settings) {
                    settings.forEach(s => {
                        if (s.setting_key === 'head_script') document.getElementById('headScript').value = s.setting_value;
                        if (s.setting_key === 'body_script') document.getElementById('bodyScript').value = s.setting_value;
                        if (s.setting_key === 'conversion_script') document.getElementById('convScript').value = s.setting_value;
                        if (s.setting_key === 'seo_google_verify' && document.getElementById('seoGoogle')) document.getElementById('seoGoogle').value = s.setting_value;
                        if (s.setting_key === 'seo_naver_verify' && document.getElementById('seoNaver')) document.getElementById('seoNaver').value = s.setting_value;
                    });
                }

                // Popups (we use a single active popup logic for simplicity)
                const popups = siteData.unwrap(await supabaseClient.from('popups').select('*').order('id').limit(1));
                if (popups && popups.length > 0) {
                    const p = popups[0];
                    document.getElementById('popupActive').checked = p.is_active;
                    document.getElementById('popupTitle').value = p.title;
                    document.getElementById('popupContent').value = p.content;
                    // Save popup ID to form dataset for updating
                    document.getElementById('popupForm').dataset.popupId = p.id;
                }
            }

            onSubmit(document.getElementById('settingsForm'), async (e) => {
                e.preventDefault();
                const head = document.getElementById('headScript').value;
                const body = document.getElementById('bodyScript').value;
                const conv = document.getElementById('convScript').value;
                const googleVerify = document.getElementById('seoGoogle').value;
                const naverVerify = document.getElementById('seoNaver').value;

                await siteData.saveSettings([
                    { setting_key: 'head_script', setting_value: head },
                    { setting_key: 'body_script', setting_value: body },
                    { setting_key: 'conversion_script', setting_value: conv },
                    { setting_key: 'seo_google_verify', setting_value: googleVerify },
                    { setting_key: 'seo_naver_verify', setting_value: naverVerify }
                ], 'settings');
                    const error = null;
                if (error) {
                    alert('스크립트 설정 저장 중 오류가 발생했습니다: ' + error.message);
                    return;
                }
                showToast('스크립트 설정이 저장되었습니다.');
            });

            onSubmit(document.getElementById('popupForm'), async (e) => {
                e.preventDefault();
                const isActive = document.getElementById('popupActive').checked;
                const title = document.getElementById('popupTitle').value;
                const content = document.getElementById('popupContent').value;
                const popupId = document.getElementById('popupForm').dataset.popupId;

                if (popupId) {
                    siteData.unwrap(await supabaseClient.from('popups').update({ title, content, is_active: isActive }).eq('id', popupId).select('id').single(), true);
                } else {
                    const saved = siteData.unwrap(await supabaseClient.from('popups').insert([{ title, content, is_active: isActive }]).select('id').single(), true);
                    document.getElementById('popupForm').dataset.popupId = saved.id;
                }
                alert('팝업 설정이 저장되었습니다.');
                loadSettingsAndPopups();
            });

            // --- Analytics & IP Blocking ---
            async function loadAnalytics() {
                // 1. Inflow Stats
                const logs = [];
                let logsError = null;
                for (let start = 0; ; start += 1000) {
                    const { data: batch, error } = await supabaseClient
                        .from('visit_logs')
                        .select('path, ip, created_at')
                        .order('created_at', { ascending: false })
                        .range(start, start + 999);
                    if (error) {
                        logsError = error;
                        break;
                    }
                    logs.push(...(batch || []));
                    if (!batch || batch.length < 1000) break;
                }

                if (!logsError) {
                    // 유입경로 집계
                    const pathCounts = {};
                    // 다접속 IP 집계
                    const ipStats = {};

                    logs.forEach(log => {
                        const path = log.path || '알 수 없음';
                        pathCounts[path] = (pathCounts[path] || 0) + 1;
                        
                        if (log.ip && /^[0-9a-fA-F:.]+$/.test(log.ip)) {
                            if (!ipStats[log.ip]) {
                                ipStats[log.ip] = { count: 0, last_visit: log.created_at };
                            }
                            ipStats[log.ip].count += 1;
                            if (new Date(log.created_at) > new Date(ipStats[log.ip].last_visit)) {
                                ipStats[log.ip].last_visit = log.created_at;
                            }
                        }
                    });

                    // 유입경로 표 렌더링
                    const inflowTbody = document.getElementById('inflowStatsTable');
                    inflowTbody.innerHTML = '';
                    const sortedPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]);
                    if (sortedPaths.length === 0) {
                        inflowTbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#64748b;">아직 기록된 방문이 없습니다.</td></tr>';
                    } else {
                        sortedPaths.forEach(([path, count]) => {
                            inflowTbody.innerHTML += `<tr>
                                <td>${escapeHtml(path)}</td>
                                <td>${count}회</td>
                            </tr>`;
                        });
                    }

                    // 다접속 IP 표 렌더링 (2회 이상 접속한 IP만 표시)
                    const multiIpTbody = document.getElementById('multiIpTable');
                    multiIpTbody.innerHTML = '';
                    const sortedIps = Object.entries(ipStats)
                        .filter(([ip, stat]) => stat.count >= 2)
                        .sort((a, b) => b[1].count - a[1].count);
                    
                    if (sortedIps.length === 0) {
                        multiIpTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">다접속 IP 기록이 없습니다.</td></tr>';
                    } else {
                        sortedIps.slice(0, 50).forEach(([ip, stat]) => {
                            multiIpTbody.innerHTML += `<tr>
                                <td><strong>${escapeHtml(ip)}</strong></td>
                                <td>${stat.count}회</td>
                                <td>${new Date(stat.last_visit).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                                <td>
                                    <button onclick="blockIp('${ip}')" class="btn-danger" style="padding: 4px 8px; font-size: 0.85rem;">차단하기</button>
                                </td>
                            </tr>`;
                        });
                    }
                } else if (logsError) {
                    document.getElementById('inflowStatsTable').innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">데이터를 불러올 수 없습니다. (visit_logs 테이블 확인 필요)</td></tr>';
                    document.getElementById('multiIpTable').innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">데이터를 불러올 수 없습니다.</td></tr>';
                }

                // 2. Blocked IPs
                const { data: blocked, error: blockedError } = await supabaseClient
                    .from('blocked_ips')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                const blockedTbody = document.getElementById('blockedIpTable');
                if (!blockedError && blocked) {
                    blockedTbody.innerHTML = '';
                    if (blocked.length === 0) {
                        blockedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b;">차단된 IP가 없습니다.</td></tr>';
                    } else {
                        blocked.filter(b => /^[0-9a-fA-F:.]+$/.test(b.ip)).forEach(b => {
                            blockedTbody.innerHTML += `<tr>
                                <td><strong>${escapeHtml(b.ip)}</strong></td>
                                <td>${new Date(b.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                                <td>${escapeHtml(b.memo || '-')}</td>
                                <td>
                                    <button onclick="unblockIp('${b.ip}')" class="btn-primary" style="padding: 4px 8px; font-size: 0.85rem;">차단 해제</button>
                                </td>
                            </tr>`;
                        });
                    }
                } else if (blockedError) {
                    blockedTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">데이터를 불러올 수 없습니다. (blocked_ips 테이블 확인 필요)</td></tr>';
                }
            }

            window.blockIp = async (ip) => {
                const memo = prompt(`[${ip}] 차단 사유(메모)를 입력하세요. (선택사항)`);
                if (memo !== null) {
                    const { error } = await supabaseClient.from('blocked_ips').insert([{ ip: ip, memo: memo }]);
                    if (!error) {
                        alert('해당 IP가 차단되었습니다.');
                        loadAnalytics();
                    } else {
                        alert('차단 실패: ' + error.message);
                    }
                }
            };

            window.unblockIp = async (ip) => {
                if (confirm(`[${ip}] 차단을 해제하시겠습니까?`)) {
                    const { error, data } = await supabaseClient.from('blocked_ips').delete().eq('ip', ip).select('ip').single();
                    siteData.unwrap({error,data}, true);
                    if (!error) {
                        alert('차단이 해제되었습니다.');
                        loadAnalytics();
                    } else {
                        alert('해제 실패: ' + error.message);
                    }
                }
            };

            for (const name of ['openQuoteDetail','updateQuoteStatus','deleteQuote','updatePortfolio','movePortfolio','deletePortfolio','blockIp','unblockIp']) {
                const original = window[name];
                window[name] = async (...args) => { try { await siteData.requireAdmin(); return await original(...args); } catch (error) { reportError(error); } };
            }
        });
