const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const pages = require('./services-content.cjs');
const catalog = require('../assets/js/service-catalog.js');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const routes = JSON.parse(read('vercel.json')).rewrites;
const titles = new Set(), descriptions = new Set();
for (const page of pages) {
 const html = read('services/'+page.slug+'.html');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.equal((html.match(/<body[ >]/g)||[]).length,1);
 assert.equal((html.match(/id="heroQuoteForm"/g)||[]).length,1);
 assert(html.includes('data-seo-source="static"'));
 assert(html.includes(`<link rel="canonical" href="https://www.daejinwnc.com/services/${page.slug}">`));
 assert.equal((html.match(/<title>/g)||[]).length,1);
 titles.add(html.match(/<title>(.*?)<\/title>/)[1]); descriptions.add(page.description);
 assert(html.includes('action="https://docs.google.com/forms/'));
 assert(html.includes("location.href='/thanks.html'"));
 const faq = html.match(/id="faq">([\s\S]*?)<\/section>/)[1];
 assert.equal((faq.match(/<details>/g)||[]).length,6);
 for (const id of ['overview','symptoms','process','guide','cases','faq','estimate']) assert(html.includes(`id="${id}"`));
 const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert(schema['@graph'].some(x=>x['@type']==='Service'&&x.name===page.name));
 assert(!schema['@graph'].some(x=>x.aggregateRating));
 assert(routes.some(r=>r.source==='/services/'+page.slug&&r.destination==='/services/'+page.slug+'.html'));
 assert(read('sitemap.xml').includes('https://www.daejinwnc.com/services/'+page.slug));
 assert(read('index.html').includes(`class="area-card" href="/services/${page.slug}"`));
 for(const m of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)(?:[?#][^"]*)?"/g)) assert(fs.existsSync(path.join(root,m[1])),m[1]);
 for(const m of html.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/g)) if(!m[1].includes('ld+json')) new vm.Script(m[2]);
}
assert.equal(titles.size,5); assert.equal(descriptions.size,5);
assert.deepEqual(catalog.match('강남 주차장 누수 현장'),[],'Do not infer epoxy from parking location');
assert.deepEqual(catalog.match('옥상 방수공사'),[],'Do not infer urethane from roof alone');
assert.deepEqual(catalog.match('상가 에폭시 바닥 도장').map(x=>x.slug),['epoxy','painting']);
assert.deepEqual(catalog.match('지하 인젝션 방수').map(x=>x.slug),['injection']);

// Small DOM stub tests error/empty/success UI isolation without touching production data.
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.textContent='';}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return k==='src'?this.src||null:this.attrs[k]||null;}
 addEventListener(k,f){this.events[k]=f;}
 querySelector(){return null;}
}
const flush = () => new Promise(resolve=>setImmediate(resolve));
async function caseScenario(rows,error=false) {
 const grid=new Element();let ready;let calls=0;
 const document={body:{dataset:{service:'epoxy'}},getElementById:id=>id==='serviceCases'?grid:null,addEventListener:(_,f)=>ready=f,createElement:t=>new Element(t),createDocumentFragment:()=>new Element('fragment')};
 const context={document,window:{},serviceCatalog:catalog,siteData:{listPortfolios:async()=>{calls++;if(error)throw Error('offline');return rows;},safeImage:v=>/^javascript:/i.test(v)?'':v,gallery:async()=>[]}};
 vm.runInNewContext(read('assets/js/service-page.js'),context); ready();await flush();
 assert.equal(grid.attrs['aria-busy'],'false');assert.equal(calls,1);return grid;
}
async function quoteScenario(fail) {
 let ready,handler,submits=0,writes=0;
 const button={disabled:false,removeAttribute(){}};
 const form={dataset:{},querySelector:()=>button,addEventListener:(_,f)=>handler=f};
 const context={document:{addEventListener:(_,f)=>ready=f,getElementById:()=>form,querySelectorAll:()=>[]},window:{},console:{error(){}},sessionStorage:{getItem:()=>''},setTimeout(){},FormData:class{get(k){return k==='entry.1558582620'?'인젝션 방수':'test';}},HTMLFormElement:{prototype:{submit(){submits++;}}},api:{trackVisitor(){},applySettings(){},renderPopup(){},submitQuote:async()=>{writes++;return fail?{success:false,error:Error('offline')}:{success:true};}}};
 vm.runInNewContext(read('assets/js/public-page.js'),context);await ready();
 await handler({preventDefault(){}});await handler({preventDefault(){}});
 assert.equal(writes,1,'duplicate submit blocked');assert.equal(submits,1,'existing Forms handoff preserved');assert.equal(context.heroFormSubmitted,true);
}
(async()=>{
 const ok=await caseScenario([{id:1,title:'에폭시 바닥공사',thumbnail_url:'/assets/images/service_epoxy.jpg'},{id:2,title:'옥상 방수'}]);
 assert.equal(ok.children[0].children.length,1);
 const empty=await caseScenario([]);assert(empty.children[0].children[0].textContent.includes('없습니다'));
 const error=await caseScenario([],true);assert(error.children[0].textContent.includes('불러오지 못했습니다'));assert.equal(error.children[1].tag,'button');
 await quoteScenario(false);await quoteScenario(true);
 for(const p of pages){const response=await fetch('http://127.0.0.1:4173/services/'+p.slug);assert.equal(response.status,200);assert((await response.text()).includes(p.intro));}
 assert.equal((await fetch('http://127.0.0.1:4173/services/not-a-service')).status,404);
 console.log('PASS: 5 static pages, SEO, assets, rewrites, 30 FAQs, conservative case matching, case success/empty/error, quote success/failure/duplicate guard, HTTP 200 + unknown 404.');
})().catch(e=>{console.error(e);process.exitCode=1;});
