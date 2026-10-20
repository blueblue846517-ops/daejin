const fs = require('node:fs');
const path = require('node:path');
const pages = require('./services-content.cjs');
const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const origin = 'https://www.daejinwnc.com';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absolute = s => s.replace(/(src|href)="(assets\/|index\.html|about\.html|admin\.html)/g, '$1="/$2');
const header = absolute(home.match(/<header class="header">[\s\S]*?<\/header>/)[0]).replace('<h1 class="logo-title">','<span class="logo-title">').replace('</h1>','</span>');
const footer = absolute(home.match(/<footer class="footer"[\s\S]*?<\/footer>/)[0]);
// Reuse the site's legal dialogs, gallery and quote delivery rather than introduce a second system.
const legalStart = home.indexOf('<div class="modal-overlay" id="termsModal"');
const galleryEnd = home.indexOf('<script src="assets/js/script.js"');
if (legalStart < 0 || galleryEnd < 0) throw new Error('Existing dialogs not found');
const dialogs = absolute(home.slice(legalStart, galleryEnd));
const originalForm = home.match(/<form [^>]*id="heroQuoteForm"[\s\S]*?<\/form>/)[0];
const business = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(x => x['@type'] === 'HomeAndConstructionBusiness');
const cards = pairs => pairs.map(([a,b]) => `<article class="svc-card"><h3>${esc(a)}</h3><p>${esc(b)}</p></article>`).join('\n');
const sectionHeading = (n,title,desc='') => `<div class="svc-section-heading"><span class="svc-eyebrow">${n}</span><h2>${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div>`;
const buttons = '<div class="svc-actions"><a class="svc-button" href="tel:010-5345-8465">전화 상담 010-5345-8465</a><a class="svc-button svc-button-outline" href="#estimate">빠른 견적 문의 ↗</a></div>';
fs.mkdirSync(path.join(root,'services'), {recursive:true});
for (const p of pages) {
 const url = `${origin}/services/${p.slug}`;
 const graph = [
  {...business, '@id':origin+'/#organization', url:origin+'/'},
  {'@type':'Service','@id':url+'#service',name:p.name,description:p.description,url,provider:{'@id':origin+'/#organization'},areaServed:business.areaServed},
  {'@type':'WebPage','@id':url+'#webpage',name:p.title,description:p.description,url,inLanguage:'ko-KR',mainEntity:{'@id':url+'#service'},breadcrumb:{'@id':url+'#breadcrumb'}},
  {'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'홈',item:origin+'/'},{'@type':'ListItem',position:2,name:p.name,item:url}]}
 ];
 // FAQ remains accessible HTML. No claim of Google FAQ rich-result eligibility.
 let form = originalForm;
 const selected = {urethane:'옥상 우레탄 방수',epoxy:'지하주차장 방수',injection:'인젝션 방수',painting:'기타 보수 공사',repair:'기타 보수 공사'}[p.slug];
 form = form.replace('disabled selected','disabled').replace(`value="${selected}"`, `value="${selected}" selected`);
 form = form.replace('<input type="text"','<label>이름 / 상호명<input autocomplete="name" type="text"').replace('<input type="tel"','</label><label>연락처<input autocomplete="tel" type="tel"').replace('<select name=', '</label><label>시공 항목<select name=').replace('</select>','</select></label>').replace('<textarea name=', '<label>현장 위치와 문의 내용<textarea name=').replace('</textarea>','</textarea></label>');
 form = form.replace('required></textarea>',`required>${esc(p.name)} 상담 요청\n</textarea>`);
 const html = `<!DOCTYPE html>
<html lang="ko" data-seo-source="static">
<head>
 <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}">
 <link rel="canonical" href="${url}">
 <meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="대진특수방수">
 <meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${url}">
 <meta property="og:image" content="${origin}/assets/images/services/${p.slug}-1200.webp"><meta property="og:image:alt" content="${esc(p.alt)}">
 <link rel="icon" href="/assets/images/favicon.png">
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
 <link rel="stylesheet" href="/assets/css/styles.css?v=20261020"><link rel="stylesheet" href="/assets/css/services.css?v=20261020">
 <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>
</head>
<body class="service-page" data-service="${p.slug}">
<a class="svc-skip" href="#main">본문 바로가기</a>
${header}
<main id="main">
 <section class="svc-hero">
  <div class="container svc-breadcrumb"><a href="/">홈</a><span aria-hidden="true">/</span><a href="/#methods">시공 분야</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></div>
  <div class="container svc-hero-grid">
   <div class="svc-hero-copy"><span class="svc-eyebrow">DAEJIN · 시공 가이드</span><h1>${esc(p.name)}</h1><p class="svc-lead">${esc(p.lead)}</p><p>공법의 차이부터 시공 과정, 현장 점검까지.<br>공사를 의뢰하기 전 필요한 정보를 확인하세요.</p>${buttons}<a class="svc-down" href="#overview">공법 자세히 알아보기 ↓</a></div>
   <figure><img src="/assets/images/services/${p.slug}-1200.webp" srcset="/assets/images/services/${p.slug}-640.webp 640w, /assets/images/services/${p.slug}-1200.webp 1200w" sizes="(max-width: 760px) 100vw, 52vw" width="1200" height="900" alt="${esc(p.alt)}" fetchpriority="high"><figcaption>${esc(p.name)} · 공정 안내 이미지</figcaption></figure>
  </div>
 </section>
 <nav class="svc-toc" aria-label="페이지 목차"><div class="container"><a href="#overview">공정 소개</a><a href="#symptoms">현장 증상</a><a href="#process">시공 과정</a><a href="#guide">시공 가이드</a><a href="#cases">시공 사례</a><a href="#faq">FAQ</a><a href="#estimate">견적 문의</a></div></nav>
 <section class="svc-section container" id="overview">${sectionHeading('01 · UNDERSTAND',p.name+'란?',p.intro)}<div class="svc-grid">${cards(p.features)}</div><div class="svc-comparison"><h3>${esc(p.compareTitle)}</h3><div class="svc-table-wrap"><table><caption class="svc-sr">${esc(p.compareTitle)} 비교</caption><thead><tr><th scope="col">구분</th><th scope="col">특징</th><th scope="col">확인할 점</th></tr></thead><tbody>${p.compare.map(row=>`<tr><th scope="row">${esc(row[0])}</th><td>${esc(row[1])}</td><td>${esc(row[2])}</td></tr>`).join('')}</tbody></table></div></div></section>
 <section class="svc-band" id="symptoms"><div class="container svc-split">${sectionHeading('02 · CHECK','이런 상황이라면 점검이 필요합니다','겉으로 보이는 증상과 실제 원인은 다를 수 있습니다. 반복되는 문제는 원인부터 확인합니다.')}<ul class="svc-symptoms">${p.symptoms.map(s=>`<li><span aria-hidden="true">↗</span>${esc(s)}</li>`).join('')}</ul></div></section>
 <section class="svc-section container" id="process">${sectionHeading('03 · PROCESS','시공은 이렇게 진행합니다','일반적인 공정 안내입니다. 현장 조건, 선정한 자재와 제조사 시방에 따라 순서·횟수·두께·양생 조건이 달라집니다.')}<ol class="svc-steps">${p.steps.map((s,i)=>`<li><span class="svc-step-number" aria-hidden="true">0${i+1}</span><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><p class="svc-reason">${esc(s[2])}</p><p class="svc-note"><strong>확인할 점</strong> ${esc(s[3])}</p></div></li>`).join('')}</ol></section>
 <section class="svc-band" id="guide"><div class="container svc-section">${sectionHeading('04 · GUIDE','의뢰 전, 함께 확인할 것')}<div class="svc-grid">${cards(p.guide)}</div><aside class="svc-maintenance"><h3>시공 후 관리와 하자 원인</h3><p>${esc(p.care)}</p></aside></div></section>
 <section class="svc-section container" id="cases">${sectionHeading('05 · WORK','관련 시공 사례','홈페이지에 등록된 사례 중 공정이 확인되는 현장을 안내합니다. 사진을 선택하면 해당 현장의 등록 사진을 볼 수 있습니다.')}<div id="serviceCases" class="svc-cases" aria-busy="true"><p role="status">관련 시공 사례를 불러오고 있습니다.</p></div><noscript><p>시공 사진은 JavaScript를 켜면 확인할 수 있습니다. 공법 설명과 문의 전화는 그대로 이용할 수 있습니다.</p></noscript><a class="svc-text-link" href="/#portfolio">전체 시공 사례 보기 ↗</a></section>
 <section class="svc-band" id="faq"><div class="container svc-section svc-faq">${sectionHeading('06 · FAQ','자주 묻는 질문')}<div>${p.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>
 <section class="svc-section container svc-estimate" id="estimate"><div>${sectionHeading('07 · CONTACT','현장에 맞는 공사, 상담부터 시작하세요','대진특수방수는 현장 상태와 필요한 공정 범위를 확인한 뒤 정확한 견적을 안내합니다. 위치·증상·기존 보수 이력을 알려주시면 상담에 도움이 됩니다.')}<a class="svc-phone" href="tel:010-5345-8465">010-5345-8465</a><p>평일 08:00–18:00 · 전화 상담 / 현장 방문 견적 문의</p></div><div class="svc-quote"><h3>빠른 견적 문의</h3><p>현장 위치와 증상을 남겨주시면 상담에 참고하겠습니다.</p><script>var heroFormSubmitted=false;</script><iframe name="hero_hidden_iframe" id="hero_hidden_iframe" title="견적 접수 처리" hidden onload="if(heroFormSubmitted) { var kw=''; try {kw=sessionStorage.getItem('inflow_keyword')||'';} catch(e){} location.href='/thanks.html'+(kw?'?keyword='+encodeURIComponent(kw):''); }"></iframe>${form}<p class="svc-small">입력한 이름·연락처·문의 내용은 견적 상담을 위해 접수됩니다. <a href="#" id="servicePrivacyLink">개인정보처리방침 확인</a></p></div></section>
 <nav class="svc-other container" aria-label="다른 시공 분야"><h2>다른 시공 분야도 살펴보세요</h2><div>${pages.filter(x=>x!==p).map(x=>`<a href="/services/${x.slug}">${esc(x.name)} ↗</a>`).join('')}</div><a href="/#methods">← 메인페이지로 돌아가기</a></nav>
 <aside class="svc-sources container"><details><summary>기술 참고자료 및 안내 기준</summary><p>일반 공법을 설명하기 위한 제조사 자료입니다. 특정 제품의 사용이나 회사의 해당 제품 인증·파트너십을 의미하지 않습니다. 실제 시공은 선정 자재의 최신 시방을 따릅니다.</p><ul>${p.sources.map(([label,href])=>`<li><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></li>`).join('')}</ul></details></aside>
</main>
${footer}
${dialogs}
<div class="svc-mobile-contact"><a href="tel:010-5345-8465">전화 상담</a><a href="#estimate">빠른 견적 문의</a></div>
<script defer src="/assets/js/script.js"></script><script defer src="/assets/vendor/supabase.min.js"></script><script defer src="/assets/js/supabase_init.js?v=20261016"></script>
<script defer src="/assets/js/analytics-core.js?v=20261012"></script><script defer src="/assets/js/analytics.js?v=20261012"></script><script defer src="/assets/js/site-data.js?v=12"></script>
<script defer src="/assets/js/service-catalog.js?v=20261020"></script><script defer src="/assets/js/service-page.js?v=20261020"></script><script defer src="/assets/js/public-page.js?v=20261012"></script>
</body></html>`;
 fs.writeFileSync(path.join(root,'services',p.slug+'.html'),html);
}
console.log('Generated 5 static service pages.');
