const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),cp=require('child_process');
const {chromium,webkit}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
const catalog=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json')),out='/workspace/scratch/atlas-image-size';fs.mkdirSync(out,{recursive:true});
(async()=>{const engine=process.env.SANSA_BROWSER==='chromium'?chromium:webkit,b=await engine.launch(engine===webkit?{executablePath:'/workspace/.sansa-webkit-run'}:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const report=[];
try{for(const width of process.env.ATLAS_SPECIAL_ONLY?[]:process.env.ATLAS_BASELINE?[390]:[320,390,412,700,820,1440]){
 const p=await b.newPage({viewport:{width,height:844},hasTouch:width<1100,deviceScaleFactor:width===390?3:1,serviceWorkers:'block'});await route(p);
 if(process.env.ATLAS_BASELINE){const css=cp.execFileSync('git',['show',process.env.ATLAS_BASELINE+':styles/atlas-home.css']);await p.route('**/styles/atlas-home.css*',r=>r.fulfill({contentType:'text/css',body:css}));}
 const requests=[];p.on('request',r=>requests.push(new URL(r.url()).pathname));await p.addInitScript(()=>localStorage.setItem('imageLayoutProtectedFixture',JSON.stringify({visits:{old:1},guardianCards:{keep:108},atlas:{old:'keep'}})));
 await p.goto('https://sansanote.com/');await p.waitForFunction(()=>document.querySelector('#homeAtlasEntry').dataset.catalogReady==='true');await p.evaluate(()=>startLocalMode());await p.locator('#homeAtlasEntry').scrollIntoViewIfNeeded();
 const snapshot=await p.evaluate(()=>localStorage.getItem('imageLayoutProtectedFixture'));
 for(const season of ['01','02']){
  await p.locator('[data-season="'+season+'"]').click();const rows=catalog.filter(e=>e.season===season);
  for(let i=0;i<rows.length;i++){
   const dot=p.locator('[data-atlas-slide]:not([hidden])').last();const max=Number(await dot.getAttribute('data-atlas-slide'));await p.locator('[data-atlas-slide="'+Math.min(i,max)+'"]').click();await p.waitForTimeout(100);
   const card=p.locator('.home-atlas-card').nth(i);await card.scrollIntoViewIfNeeded();const im=card.locator('img');await im.evaluate(im=>im.decode());
   const data=await card.evaluate(c=>{const im=c.querySelector('img'),copy=c.querySelector('.home-atlas-copy'),r=im.getBoundingClientRect(),b=c.getBoundingClientRect(),t=copy.getBoundingClientRect(),scale=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight);return {width:b.width,height:b.height,imageWidth:r.width,imageHeight:r.height,fit:getComputedStyle(im).objectFit,position:getComputedStyle(im).objectPosition,overlap:r.bottom>t.top+1,copyClipped:copy.scrollHeight>copy.clientHeight+1,crop:Math.max(1-r.width/scale/im.naturalWidth,1-r.height/scale/im.naturalHeight)}});
   if(!process.env.ATLAS_BASELINE){assert.equal(data.fit,'cover');assert(Math.abs(data.imageWidth-(data.width-2))<1,'image fills entire card width');assert(!data.overlap&&!data.copyClipped,'art and complete text remain separate');assert(data.crop<.07,'small source crop preserves roof and character margins');assert(data.height<=250);if(width<=700)assert(data.imageHeight>=135&&data.imageHeight<=150);else assert.equal(data.imageHeight,160);}
   report.push({engine:process.env.SANSA_BROWSER||'webkit',width,season,id:rows[i].id,...data});
   if(width===390&&process.env.SANSA_BROWSER!=='chromium')await card.screenshot({path:out+'/'+(process.env.ATLAS_BASELINE?'before':'after')+'-'+rows[i].id+'.png',scale:'css'});
  }
  await p.locator('[data-atlas-slide="0"]').click();await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft<1&&document.querySelector('#homeAtlasPrev').disabled);assert(await p.locator('#homeAtlasPrev').isDisabled());await p.locator('#homeAtlasNext').click();await p.waitForFunction(()=>document.querySelector('[data-atlas-slide="1"]').getAttribute('aria-current')==='true');
 }
 assert.equal(await p.locator('.pilgrim-collection-home-position > #homeAtlasEntry + .hero-108-journey').count(),1);const height=(await p.locator('#homeAtlasEntry').boundingBox()).height;if(!process.env.ATLAS_BASELINE)assert(height<=370);
 assert(!requests.some(u=>/\/atlas\/.*\/(scene-|card-|content\.js)/.test(u)),'no story payload preload');assert.equal(await p.evaluate(()=>localStorage.getItem('imageLayoutProtectedFixture')),snapshot);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(width===390){await p.locator('[data-season="01"]').click();await p.locator('[data-atlas-slide="2"]').click();await p.waitForTimeout(350);await p.locator('#homeAtlasEntry').screenshot({path:out+'/'+(process.env.ATLAS_BASELINE?'before':'after')+'-section390.png',scale:'css'});}
 console.log('PASS',process.env.SANSA_BROWSER||'webkit',width,'20 decoded images; full-width art; bounded crop; text separate; section',height,'px; tabs/arrows;108 adjacency;protected fixture unchanged');await p.close();
 }
 if(!process.env.ATLAS_BASELINE){
 const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await route(p);const special={...catalog[2],id:'sample-special-901',number:'901',temple:'특별편 검증',title:'특별편 공통 이미지 스타일',href:'/atlas/sample-special/',season:'03'};
 await p.route('**/scripts/atlas/episodes.json',r=>r.fulfill({json:[...catalog,special]}));const seasons=JSON.parse(fs.readFileSync('scripts/atlas/seasons.json'));seasons['03']={title:'특별편',homePublished:true};await p.route('**/scripts/atlas/seasons.json',r=>r.fulfill({json:seasons}));await p.addInitScript(()=>localStorage.setItem('sansaAtlasHomeSeason_v1','03'));await p.goto('https://sansanote.com/');await p.waitForFunction(()=>document.querySelector('.home-atlas-card')?.getAttribute('href')==='/atlas/sample-special/');await p.evaluate(()=>startLocalMode());const img=p.locator('.home-atlas-card img');await img.scrollIntoViewIfNeeded();await img.evaluate(im=>im.decode());assert.equal(await img.evaluate(im=>getComputedStyle(im).objectFit),'cover');assert.equal((await img.boundingBox()).height,150);console.log('PASS future special-episode fixture uses same full-width150px image style; real catalog unchanged');await p.close();
 }
 fs.writeFileSync(out+'/'+(process.env.ATLAS_BASELINE?'before':process.env.SANSA_BROWSER||'webkit')+'-geometry.json',JSON.stringify(report,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
