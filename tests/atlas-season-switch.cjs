const fs=require('fs'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
const catalog=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json'));
(async()=>{const engine=process.env.SANSA_BROWSER==='webkit'?webkit:chromium,b=await engine.launch(engine===webkit?{executablePath:'/workspace/.sansa-webkit-run'}:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
for(const width of [320,390,412,820,1440]){
const p=await b.newPage({viewport:{width,height:1000},hasTouch:width<1000,serviceWorkers:'block'}),requests=[];p.on('request',r=>requests.push(new URL(r.url()).pathname));await route(p);
await p.addInitScript(()=>localStorage.setItem('sansaAtlasHomeSeason_v1','02'));
await p.goto('https://sansanote.com/');await p.waitForFunction(()=>document.querySelector('#homeAtlasEntry').dataset.catalogReady==='true');await p.evaluate(()=>startLocalMode());
assert(await p.locator('[data-season="02"]').isHidden(),'unknown publication must not expose season2');
assert.equal(await p.locator('[aria-selected="true"][data-season]').getAttribute('data-season'),'01');
await p.evaluate(()=>{auth=mockAuth;db=mockDB});await p.waitForFunction(()=>document.querySelector('#homeAtlasEntry').dataset.publicationConfirmed==='true');
await p.waitForFunction(()=>document.querySelector('[data-season="02"]').getAttribute('aria-selected')==='true');
const shown=await p.locator('.home-atlas-card').evaluateAll(es=>es.map(e=>e.getAttribute('href')));assert.deepEqual(shown,catalog.filter(e=>e.season==='02').map(e=>e.href));
assert((await p.locator('#homeAtlasEntry').boundingBox()).height<=294,'season2 remains compact');
assert.equal(await p.locator('.pilgrim-collection-home-position > #homeAtlasEntry + .hero-108-journey').count(),1);
assert(await p.locator('.home-atlas-card img').evaluateAll(es=>es.every(e=>getComputedStyle(e).objectFit==='contain')));
await p.locator('#homeAtlasEntry').scrollIntoViewIfNeeded();await p.locator('[data-season="01"]').click();await p.locator('[data-season="02"]').focus();await p.keyboard.press('Enter');
await p.locator('#homeAtlasNext').click();await p.waitForFunction(()=>document.querySelector('[data-atlas-slide="1"]').getAttribute('aria-current')==='true');
assert((await p.locator('#homeAtlasPage').innerText()).endsWith('/ 10'));
await p.evaluate(()=>{const path='shared/secretAtlasPublication/haeinsa-001';mockRecords[path]={public:false,updatedAt:100};mockListeners.get(path)({val:()=>mockRecords[path]})});
assert(await p.locator('#homeAtlasEntry').isHidden());assert.equal(await p.locator('[aria-selected="true"][data-season]').getAttribute('data-season'),'01');
await p.evaluate(()=>{const path='shared/secretAtlasPublication/haeinsa-001';mockRecords[path]={public:true,updatedAt:101};mockListeners.get(path)({val:()=>mockRecords[path]})});
assert(await p.locator('#homeAtlasEntry').isVisible());assert.equal(await p.locator('[aria-selected="true"][data-season]').getAttribute('data-season'),'02');
assert.equal(await p.evaluate(()=>localStorage.getItem('sansaAtlasHomeSeason_v1')),'02');
assert(!requests.some(u=>/\/atlas\/.*\/(scene-|card-|content\.js)/.test(u)),'home must not load story payload');
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
console.log('PASS',process.env.SANSA_BROWSER||'chromium',width,'season selection,remembered preference,publication gate,true/false/null,small images,height,adjacency,arrow,no story preload');await p.close();
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
