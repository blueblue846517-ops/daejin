(function () {
    'use strict';
    const C=window.AnalyticsCore, el=id=>document.getElementById(id);
    const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const types={page_view:'페이지 조회',phone_click:'전화 버튼 클릭',quote_click:'견적 문의 클릭',quote_submit:'견적 저장 성공'};
    let rows=[],request=0,bound=false,page=0;
    async function query(start,end) {
        const [from,endTime]=C.bounds(start,end); const to=new Date(Math.min(Date.parse(endTime),Date.now())).toISOString(); const result=[];
        for (let offset=0;offset<100000;) {
            const {data,error,count}=await supabaseClient.from('visit_logs').select('id,event_type,session_id,visitor_id,event_data,created_at,tracking_version',{count:'exact'})
                .eq('tracking_version',2).gte('created_at',from).lt('created_at',to).order('created_at').order('id').range(offset,offset+999);
            if(error) throw error;
            if(count>100000)throw new Error('기록이 10만 건을 초과합니다. 날짜 범위를 줄여 주세요.');
            result.push(...data.map(r=>({...r.event_data,...r})));
            if(count!==null && result.length>=count) return result;
            if(!data.length) { if(count>result.length)throw new Error('조회 중 기록이 변경되었습니다. 다시 조회해 주세요.');return result; }
            offset+=data.length;
        }
        throw new Error('기록이 10만 건을 초과합니다. 날짜 범위를 줄여 주세요. 일부 데이터로 통계를 표시하지 않습니다.');
    }
    function table(id,data,cols) { el(id).innerHTML=data.length?data.map(row=>'<tr>'+row.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join(''):`<tr><td colspan="${cols}">해당 기간에 수집된 기록이 없습니다.</td></tr>`; }
    function details() {
        const term=el('analyticsSearch').value.trim().toLowerCase();
        const filtered=rows.filter(r=>[r.source,r.medium,r.keyword,r.utm_campaign,r.landing_url,r.session_id,types[r.event_type]].join(' ').toLowerCase().includes(term)).reverse();
        const max=Math.max(0,Math.ceil(filtered.length/50)-1); page=Math.min(page,max);
        table('analyticsDetails',filtered.slice(page*50,page*50+50).map(r=>[
            new Date(r.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}),types[r.event_type],C.label(r)+' ('+r.source+')',r.medium,
            r.keyword||(['organic','paid'].includes(r.medium)?'검색어 확인 불가':'—'),r.landing_url,r.utm_campaign||'—',r.session_id,
            r.page_url,r.referrer||'미제공',r.utm_source||'—',r.utm_medium||'—',r.utm_term||'—',r.utm_content||'—',JSON.stringify(r.click_ids||{})]),15);
        el('analyticsPage').textContent=`${filtered.length}건 · ${page+1}/${max+1}쪽 (검색은 상세 기록에만 적용)`;
        el('analyticsPrev').disabled=page===0; el('analyticsNext').disabled=page===max;
    }
    async function load() {
        bind(); const token=++request; el('analyticsStatus').textContent='실제 방문 기록 조회 중…';
        try {
            const start=el('analyticsStart').value,end=el('analyticsEnd').value;
            if(!start||!end||start>end||Date.parse(end)-Date.parse(start)>30*86400000) throw new Error('최대 31일 범위로 날짜를 선택해 주세요.');
            const [from,to]=C.bounds(start,end);
            const [data,quotes]=await Promise.all([query(start,end),supabaseClient.from('quotes').select('id',{count:'exact',head:true}).not('submission_id','is',null).gte('created_at',from).lt('created_at',to)]);
            if(quotes.error)throw quotes.error;
            if(quotes.count===null)throw new Error('견적 저장 건수를 확인하지 못했습니다.');
            if(token!==request)return; rows=data; page=0;
            const summary=C.summarize(rows);
            el('analyticsKpis').innerHTML=[['방문 세션',summary.sessions,'회'],['페이지 조회',summary.page_view,'회'],['순 방문자(익명 브라우저)',summary.visitors,'명'],['전화 버튼 클릭',summary.phone_click,'회'],['견적 문의 클릭',summary.quote_click,'회'],['견적 저장 성공',quotes.count,'건']]
                .map(([name,value,unit])=>`<div class="stat-card"><div class="stat-info"><h3>${name}</h3><div class="stat-value">${value.toLocaleString()} ${unit}</div></div></div>`).join('');
            const labels=['네이버 자연 검색','네이버 유료 광고','구글 자연 검색','구글 유료 광고','다음 검색','기타 외부 사이트','직접 방문','출처 확인 불가'];
            table('inflowStatsTable',labels.map(label=>[label,summary.sources[label]||0,summary.sessions?((summary.sources[label]||0)/summary.sessions*100).toFixed(1)+'%':'—']),3);
            table('analyticsKeywords',Object.entries(summary.keywords).sort((a,b)=>b[1]-a[1]),2);
            const days=[]; for(let d=start;d<=end;d=C.shift(d,1))days.push([d,summary.daily[d]?.sessions||0,summary.daily[d]?.views||0]);
            table('analyticsDaily',days,3); details();
            el('analyticsStatus').textContent=`한국 시간 ${start} ~ ${end} · ${rows.length.toLocaleString()}개 실제 이벤트. 견적 ${quotes.count}건 중 유입 연결 ${summary.quote_submit}건. 새 수집 방식 적용 후 기록만 집계합니다.`;
        } catch(e) {
            if(token!==request)return; rows=[]; el('analyticsKpis').replaceChildren();
            ['inflowStatsTable','analyticsKeywords','analyticsDaily','analyticsDetails'].forEach(id=>{el(id).innerHTML='<tr><td colspan="15">조회 실패 — 통계를 0으로 간주하지 마세요.</td></tr>';});
            el('analyticsStatus').textContent='조회 실패: '+e.message+' (로그인 권한 및 20261012_analytics.sql 적용 여부 확인)';
        }
    }
    function bind() {
        if(bound)return; bound=true;
        const today=C.day(new Date()); el('analyticsStart').value=C.shift(today,-6);el('analyticsEnd').value=today;
        el('analyticsFilters').addEventListener('submit',e=>{e.preventDefault();load();});
        ['analyticsStart','analyticsEnd'].forEach(id=>el(id).addEventListener('change',()=>{el('analyticsRange').value='custom';}));
        el('analyticsRange').addEventListener('change',()=>{
            const today=C.day(new Date());
            const value=el('analyticsRange').value;if(value==='custom')return;
            el('analyticsStart').value=value==='yesterday'?C.shift(today,-1):C.shift(today,1-Number(value));
            el('analyticsEnd').value=value==='yesterday'?C.shift(today,-1):today;load();
        });
        el('analyticsSearch').addEventListener('input',()=>{page=0;details();});
        el('analyticsPrev').addEventListener('click',()=>{page--;details();});
        el('analyticsNext').addEventListener('click',()=>{page++;details();});
    }
    async function home() {
        const today=C.day(new Date());
        try {
            const data=await query(C.shift(today,-6),today); const a=C.summarize(data.filter(r=>C.day(r.created_at)===today));
            const b=C.summarize(data.filter(r=>C.day(r.created_at)===C.shift(today,-1)));
            el('statTodayVisits').textContent=a.sessions+' 회';el('statWeekVisits').textContent=C.summarize(data).sessions+' 회';
            el('analyticsToday').textContent=`오늘 페이지 조회 ${a.page_view}회 · 순 방문자 ${a.visitors}명(익명 브라우저) · 전일 세션 대비 ${b.sessions?((a.sessions-b.sessions)/b.sessions*100).toFixed(1)+'%':a.sessions?'비교 불가(전일 0)':'변화 없음(양일 0)'}`;
        } catch(e) {el('statTodayVisits').textContent='조회 실패';el('statWeekVisits').textContent='조회 실패';el('analyticsToday').textContent=e.message;}
    }
    window.adminAnalytics={load,home,query};
})();
