const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
const manifest=JSON.parse(fs.readFileSync('images/temple-covers/manifest.json'));
assert(manifest.length>=8);for(const field of['id','src','sha256'])assert.equal(new Set(manifest.map(x=>x[field])).size,manifest.length);
for(const m of manifest){const bytes=fs.readFileSync('.'+m.src);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);assert(bytes.length<160000);assert.equal(m.generatedFromPhotos,false);assert.equal(m.creation,'original-watercolor-from-text');assert(m.review.features&&m.review.basis);}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of[320,390,412,768,820,1440]){
 const p=await b.newPage({serviceWorkers:'block',viewport:{width,height:1000},hasTouch:width<1000});await route(p);
 const photoRequests=[];p.on('request',r=>{if(/openverse|commons.wikimedia|ko.wikipedia/.test(r.url())&&/imageinfo|pageimages|thumbnail|photos/.test(r.url()))photoRequests.push(r.url());});
 await p.addInitScript(()=>{localStorage.setItem('sansanote_main_pinned_temples_v7',JSON.stringify(['해인사','관음사','개암사']));localStorage.setItem('travelDiaryLocalData',JSON.stringify({haeinsa:{name:'해인사',region:'경상',stage:2,photos:{mine:{url:'https://images.test/precious-user.jpg'}},coverPhotos:['https://images.test/old-auto.jpg'],visits:{v:{note:'지킬 방문 기록',verified:true}}},jeju:{name:'관음사',region:'제주',stage:0},buan:{name:'개암사',region:'전라',stage:1}}));});
 await p.goto('https://sansanote.com/');await p.evaluate(()=>startLocalMode());const originals=await p.evaluate(()=>JSON.stringify(destinations));
 const pinned=p.locator('#mainPinnedGrid img[data-temple-cover-id]');assert.equal(await pinned.count(),3);await p.locator('#mainPinnedGrid').scrollIntoViewIfNeeded();await pinned.evaluateAll(es=>Promise.all(es.map(e=>e.decode())));assert(await pinned.evaluateAll(es=>es.every(e=>e.loading==='lazy'&&getComputedStyle(e).transitionDuration==='0s')));
 assert.equal(await p.evaluate(()=>sansaTempleCovers.find({name:'관음사',region:'수도권'})),null);assert.equal(await p.evaluate(()=>sansaTempleCovers.find({name:'개암사',region:'경상'})),null);assert(await p.evaluate(()=>sansaTempleCovers.resolve({name:'내가 추가한 절',region:'기타'}).isDefault));
 await p.evaluate(()=>{patchVisibleCover('haeinsa','https://images.test/wrong.jpg','temple','해인사');schedulePhotoHydration('temple',Object.entries(destinations));});
 const haeinsa=manifest.find(m=>m.name==='해인사');assert.equal(await pinned.first().getAttribute('src'),'.'+haeinsa.src);
 assert.equal(await p.evaluate(()=>firstPhotoUrl(destinations.haeinsa)),'https://images.test/precious-user.jpg');
 assert.equal(await p.evaluate(()=>sansaTempleCovers.find({name:'송광사',region:'전라',locationHint:'완주'}).id),'temple:완주 송광사');assert.equal(await p.evaluate(()=>sansaTempleCovers.find({name:'용문사',region:'경상',locationHint:'예천'}).id),'temple:용문사(예천)');assert.equal(await p.evaluate(()=>sansaTempleCovers.find({name:'용문사',region:'경상'})),null);
 await p.evaluate(()=>openCatalogOverlay('temple'));assert.equal(await p.locator('#catalogList .catalog-thumb').count(),111);
 const catalog=await p.locator('#catalogList .catalog-thumb').evaluateAll(es=>es.map(e=>({id:e.dataset.photoId,src:decodeURIComponent(new URL(e.querySelector('img').getAttribute('src'),location.href).pathname),lazy:e.querySelector('img').loading,text:e.innerText})));
 assert.equal(new Set(catalog.map(x=>x.id)).size,111);for(const x of catalog){const m=manifest.find(m=>m.id===x.id);assert.equal(x.src,m?.src||'/images/temple-covers/default-watercolor.webp');assert.equal(x.lazy,'lazy');assert(!/출처|준비|일러스트/.test(x.text));}
 assert.equal(await p.locator('.temple-cover-credit,.temple-art-information').count(),0);assert.equal(await p.locator('#detailOverlay .modal-body').evaluate(e=>e.firstElementChild.id),'dCoverPhotos');assert(!(await p.locator('#detailOverlay').textContent()).includes('자동으로 찾은 사진'));
 for(const m of manifest){
  await p.locator('#catalogSearch').fill(m.name);await p.waitForTimeout(120);const im=p.locator('#catalogList [data-temple-cover-id="'+m.id+'"]');assert.equal(await im.count(),1);await im.scrollIntoViewIfNeeded();await im.evaluate(e=>e.decode());const box=await im.boundingBox();assert(Math.abs(box.width/box.height-1.5)<.02);
  assert(await im.evaluate(e=>e.parentElement.getBoundingClientRect().right<=e.closest('.catalog-card').querySelector('.catalog-copy').getBoundingClientRect().left+1));
  await p.evaluate(m=>renderAutoCoverPhotos('dCoverPhotos',{name:m.name,region:m.region,coverPhotos:['https://images.test/old-auto.jpg']}),m);
  const detail=p.locator('#dCoverPhotos img');assert.equal(await detail.getAttribute('src'),'.'+m.src);await detail.evaluate(e=>e.decode());assert.equal(await detail.evaluate(e=>getComputedStyle(e).objectFit),'contain');
  if(width===390&&['해인사','갑사','개암사','불국사'].includes(m.name))await p.locator('#catalogOverlay .modal').screenshot({path:'/tmp/temple-cover-'+m.name+'-390.png'});
 }
 await p.evaluate(()=>renderAutoCoverPhotos('dCoverPhotos',{name:'새로운 사찰',region:'기타'}));assert((await p.locator('#dCoverPhotos img').getAttribute('src')).endsWith('default-watercolor.webp'));
 await p.evaluate(()=>closeCatalogOverlay());await p.locator('#mainPinnedGrid').scrollIntoViewIfNeeded();const failing=p.locator('#mainPinnedGrid img[data-temple-cover-id="temple:관음사"]');await failing.evaluate(e=>sansaTempleCovers.failed(e));await failing.evaluate(e=>e.decode());assert((await failing.getAttribute('src')).startsWith('data:image/webp;base64,'));
 assert.equal(await p.evaluate(()=>JSON.stringify(destinations)),originals);assert.deepEqual(photoRequests,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 console.log('PASS covers',width,manifest.length,'reviewed identities + default for pending/custom; 111 catalog mappings, same detail asset, no photo search/labels, local fallback, user photos/visits unchanged');await p.close();
}await b.close();})().catch(e=>{console.error(e);process.exit(1)});
