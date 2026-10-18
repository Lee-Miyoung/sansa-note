// Offline integration checks. Private review/key inputs must stay outside Git.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const key=fs.readFileSync(process.argv[3],'utf8').trim(),bundle=fs.readFileSync(process.argv[2],'utf8'),repo=path.resolve(__dirname,'..');
const claims={aud:'travel-diary-c0676',iss:'https://securetoken.google.com/travel-diary-c0676',email:'song4mi12@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}};
const sdk=`(()=>{
 const claims=${JSON.stringify(claims)};let cb;window.mockReads=[];window.mockWrites=[];window.mockData={draft:new URLSearchParams(location.search).has('registered')?${JSON.stringify(bundle)}:null,progress:null};
 const listeners=new Map(),copy=x=>x==null?null:JSON.parse(JSON.stringify(x));
 const auth={currentUser:null,setPersistence:async()=>{},onAuthStateChanged(fn){cb=fn;fn(null);},getRedirectResult:async()=>null,
 async signInWithPopup(){const email=window.mockNonAdmin?'other@example.com':claims.email;auth.currentUser={uid:'admin-uid',emailVerified:true,email,getIdTokenResult:async()=>({claims:{...claims,email}}),getIdToken:async()=>'mock'};await cb(auth.currentUser);},
 async signOut(){auth.currentUser=null;await cb(null);}};
 const ref=p=>({async get(){window.mockReads.push(p);return {exists:()=>!!window.mockData.draft,val:()=>window.mockData.draft};},
 on(_,fn){listeners.set(p,fn);fn({val:()=>p.endsWith('/destinations')?null:copy(window.mockData.progress)});},off(){listeners.delete(p);},
 async update(patch){window.mockWrites.push(p);window.mockData.progress??={};for(const[k,v]of Object.entries(patch)){const bits=k.split('/'),last=bits.pop();let o=window.mockData.progress;for(const b of bits)o=o[b]??={};o[last]=copy(v);}for(const[p,fn]of listeners)if(!p.endsWith('/destinations'))fn({val:()=>copy(window.mockData.progress)});},
 async transaction(fn){window.mockWrites.push(p);if(p.endsWith('/draft')){const v=fn(window.mockData.draft);if(v!==undefined)window.mockData.draft=v;return {committed:v!==undefined,snapshot:{val:()=>window.mockData.draft}};}
 const id=p.split('/').pop(),o=window.mockData.progress.cards??={};o[id]=fn(o[id]||null);for(const[p,fn]of listeners)if(!p.endsWith('/destinations'))fn({val:()=>copy(window.mockData.progress)});}});
 function Auth(){}Auth.Auth={Persistence:{LOCAL:'local'}};Auth.GoogleAuthProvider=class{setCustomParameters(){}};window.firebase={initializeApp:()=>({auth:()=>auth,database:()=>({ref})}),auth:Auth};})();`;
(async()=>{
 const server=http.createServer((req,res)=>{
  const p=path.resolve(repo,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(repo+path.sep)){res.writeHead(404).end();return;}
  try{const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.enc')?'application/octet-stream':file.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(file));}catch(_){res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 try{for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];let encryptedReads=0;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const u=route.request().url();if(u.startsWith('https://www.gstatic.com/'))return route.fulfill({contentType:'application/javascript',body:u.includes('firebase-app-compat')?sdk:''});
   if(u.includes('firebasedatabase.app'))return route.fulfill({json:await page.evaluate(()=>window.mockData.progress)});
   if(u.endsWith('/review.enc'))encryptedReads++;
   if(u.startsWith(origin))return route.continue();return route.abort();
  });
  await page.addInitScript(()=>{Object.defineProperty(navigator,'serviceWorker',{value:{controller:{scriptURL:location.origin+'/admin-atlas/sw.js'}}});});
  await page.goto(origin+'/admin-atlas/#setup='+key);
  await page.waitForFunction(()=>!document.getElementById('login').disabled);
  assert.equal(new URL(page.url()).hash,'');assert.equal(await page.locator('input[type=file]').count(),0);
  assert.deepEqual(await page.evaluate(()=>mockReads),[]);assert.equal(encryptedReads,0);
  await page.evaluate(()=>window.mockNonAdmin=true);await page.locator('#login').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('관리자 Google 계정만'));
  assert.deepEqual(await page.evaluate(()=>mockReads),[]);assert.equal(encryptedReads,0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sansaAdminAtlasSetup_v1')),null);
  await page.evaluate(()=>{window.mockNonAdmin=false;sessionStorage.setItem('sansaAdminAtlasSetup_v1','A'.repeat(43));});
  await page.locator('#login').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('열지 못했습니다'));
  assert.deepEqual(await page.evaluate(()=>mockWrites),[]);
  await page.evaluate(k=>sessionStorage.setItem('sansaAdminAtlasSetup_v1',k),key);await page.locator('#login').click();
  await page.locator('[data-atlas="resume"]').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>mockData.draft),bundle);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('sansaAdminAtlasSetup_v1')),null);
  await page.locator('[data-atlas="resume"]').click();assert.equal(await page.locator('.atlas-progress b').textContent(),'1/12');
  await page.locator('[data-atlas="sources"]').click();await page.locator('[data-atlas="read"]').click();
  for(let i=0;i<12;i++)await page.locator('[data-atlas="next"]').click();
  assert.equal(await page.locator('#secretAtlasOverlay').getAttribute('data-atlas-page'),'cards');
  await page.locator('[data-atlas="goods"]').click();await page.locator('.atlas-bottom [data-atlas="cards"]').click();
  await page.locator('.atlas-card-button').first().click();await page.locator('.atlas-bottom [data-atlas="map"]').click();
  await page.locator('.atlas-bottom [data-atlas="intro"]').click();await page.locator('[data-atlas="quiz"]').click();
  for(let i=0;i<5;i++)await page.locator('[data-atlas="quiznext"]').click();
  await page.locator('.atlas-bottom [data-atlas="note"]').click();await page.locator('#atlasNote').fill('관리자 격리 테스트');
  await page.evaluate(()=>SansaAtlasStore.flush());await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),3);
  assert.equal(await page.evaluate(()=>SansaAtlasStore.state.note.text),'관리자 격리 테스트');
  assert.equal(await page.evaluate(()=>mockWrites.every(p=>p==='users/admin-uid/adminTests/haeinsa-001/draft'||p.startsWith('users/admin-uid/adminTests/haeinsa-001/progress'))),true);
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).every(k=>k.startsWith('sansaAdminAtlasTest_v1:'))),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/admin-atlas-iphone-'+width+'.png',fullPage:true});
  const fetchedBefore=encryptedReads;
  await page.goto(origin+'/admin-atlas/?registered=1');await page.waitForFunction(()=>!document.getElementById('login').disabled);
  await page.locator('#login').click();await page.locator('[data-atlas="resume"]').waitFor({state:'visible'});
  assert.equal(encryptedReads,fetchedBefore);assert.deepEqual(await page.evaluate(()=>mockWrites),[]);

  console.log(width+'px PASS: fragment removed; anon/nonadmin no draft/ciphertext reads; wrong key no writes; one-click registration; auto-open; 12/6/3; private-path writes only');
  await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
