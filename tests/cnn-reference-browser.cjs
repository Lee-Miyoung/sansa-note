const assert=require('node:assert/strict'),fs=require('node:fs');
const{chromium}=require('playwright');const{fullRoute,login}=require('./unified-fixtures.cjs');
const ref=require('../data/cnn-temple-reference.json'),adds=require('../data/cnn-temple-additions.json');const names=ref.groups.flatMap(g=>g.names);const out='docs/courses/cnn-reference';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report=[];try{
 for(const width of[390,1440]){
  const p=await browser.newPage({viewport:{width,height:960},serviceWorkers:'block'});await fullRoute(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('https://sansanote.com/');await p.waitForFunction(()=>typeof PACKS!=='undefined'&&auth&&window.SansaPlaceIdentity);
  await p.evaluate(()=>{mockRecords['users/A/destinations']={keep:{name:'화엄사',region:'전라',stage:1,notes:'그대로 남을 메모',photos:{old:{url:'preserved-original-photo'}},visits:{v:{verified:true,ts:123}}},custom:{name:'나만의 절',region:'기타',notes:'내가 쓴 기록',photos:{},visits:{}}};});await login(p);
  const before=await p.evaluate(()=>JSON.stringify(mockRecords['users/A/destinations']));const initialWrites=await p.evaluate(()=>[...mockWrites]);
  const state=await p.evaluate(()=>({official:SANSA_GUARDIAN_108.length,all:resolvePackData(PACKS.find(p=>p.key==='cnn_beautiful_temples')).map(p=>p.name),groups:PACKS.filter(p=>p.key.startsWith('cnn_')).map(p=>({key:p.key,count:resolvePackData(p).length})),extra:PACKS.find(p=>p.key==='cnn_beautiful_temples').names.filter(n=>!SANSA_GUARDIAN_108.includes(n))}));
  assert.equal(state.official,108);assert.deepEqual(state.all,names);assert.equal(state.groups.length,6);assert.equal(state.extra.length,9);
  await p.evaluate(()=>{openPackOverlay();openPackDetail('cnn_beautiful_temples')});assert.equal(await p.locator('#packList .pack-detail-place').count(),37);assert((await p.locator('#packList .pack-source-note').innerText()).includes('사용자 제공'));
  await p.screenshot({path:`${out}/course-${width}.jpg`,type:'jpeg',quality:83});await p.evaluate(()=>closePackOverlay());
  for(const a of adds){
   await p.evaluate(name=>{openCatalogOverlay('temple');document.getElementById('catalogSearch').value=name;renderCatalogOverlay()},a.name);
   const catalogText=await p.locator('#catalogList').innerText();assert(catalogText.includes(a.name)&&catalogText.includes('기타 사찰'));assert((await p.locator('#catalogCount').innerText()).includes('선정 0곳'));
   const id=await p.evaluate(name=>SansaPlaceIdentity.find(MASTER_BY_NAME[name],'temple')?.id,a.name);assert.equal(id,'temple:'+a.name);
   await p.evaluate(name=>openTempleFromCatalog(name),a.name);await p.waitForFunction(name=>document.getElementById('detailOverlay').classList.contains('show')&&document.getElementById('dName').textContent.includes(name),a.name);
   await p.waitForFunction(()=>document.querySelectorAll('#dVisitTips .visit-tip-card').length===2);const im=p.locator('#dCoverPhotos img').first();await im.evaluate(i=>i.decode());assert((await im.getAttribute('src')).includes('cnn-'+a.slug+'.webp'));assert((await im.evaluate(i=>i.naturalWidth))>=480);
   await p.screenshot({path:`${out}/${a.slug}-${width}.jpg`,type:'jpeg',quality:83});await p.evaluate(()=>closeDetail());
  }
  assert.equal(await p.evaluate(()=>JSON.stringify(mockRecords['users/A/destinations'])),before,'viewing is read-only');assert.deepEqual(await p.evaluate(()=>mockWrites),initialWrites);
  await p.evaluate(()=>{openPackOverlay();openCourseProgressDetail('cnn_beautiful_temples')});assert((await p.locator('#courseProgressRoute').innerText()).includes('사용자 제공'));await p.screenshot({path:`${out}/progress-${width}.jpg`,type:'jpeg',quality:83});
  // Explicit add action reuses existing records; repeated action cannot duplicate places.
  await p.evaluate(async()=>{await loadPack('cnn_beautiful_temples')});await p.waitForFunction(names=>names.every(n=>getTempleEntriesByName(n).length>0),names);
  const counts=await p.evaluate(names=>Object.fromEntries(names.map(n=>[n,getTempleEntriesByName(n).length])),names);await p.evaluate(async()=>{await loadPack('cnn_beautiful_temples')});const again=await p.evaluate(names=>Object.fromEntries(names.map(n=>[n,getTempleEntriesByName(n).length])),names);assert.deepEqual(again,counts);
  const oldRecords=await p.evaluate(()=>({keep:mockRecords['users/A/destinations'].keep,custom:mockRecords['users/A/destinations'].custom}));assert.equal(JSON.stringify(oldRecords),before);assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  report.push({width,course:37,regions:5,extra:9,newImages:8,readOnlyBrowsing:true,duplicateSafeAdd:true,recordsPreserved:true});await p.close();console.log('PASS',width,'37 places, five regions, nine extras, eight decoded new covers+tips, real detail flow, source note, read-only browse, duplicate-safe explicit load, old records preserved');
 }
 fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify({report,realDevice:false},null,2)+'\n');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
