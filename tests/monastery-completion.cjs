const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{chromium,webkit}=require('playwright');const{fullRoute}=require('./unified-fixtures.cjs');
const dir=path.resolve('docs/online-sansa/completion/screenshots');fs.mkdirSync(dir,{recursive:true});
const wk=process.env.SANSA_BROWSER==='webkit',width=+(process.env.SANSA_WIDTH||390),height=width===820?1180:width===412?915:width>700?1000:844;
async function shot(p,name){await p.waitForTimeout(300);await p.screenshot({path:path.join(dir,`${name}-${wk?'webkit':'chromium'}-${width}.jpg`),type:'jpeg',quality:76});}
(async()=>{
 const browser=await(wk?webkit:chromium).launch(wk?{}:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});await fullRoute(p);
  const errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()+(r.postData()||'')));
  await p.goto('https://sansanote.com/');await p.evaluate(()=>startLocalMode());await p.evaluate(()=>SansaOnlineSansa.ready);
  const snapshot=await p.evaluate(()=>{mockRecords['users/A/photos']={original:'photo'};mockRecords['users/A/destinations']={original:'visit'};localStorage.setItem('completion-preserve','keep');return JSON.stringify(mockRecords)});
  await p.locator('.sansa-home-rest').click();assert(await p.locator('#mindRestOverlay').isVisible());assert.equal(await p.locator('#mindRestChoices>button,#mindRestChoices>a').count(),8);await shot(p,'mind-rest');
  for(const[name,target]of[['호흡 명상','breathOverlay'],['목탁','moktakOverlay'],['염주','mantraOverlay'],['마음 기록','vowOverlay'],['명상 소리','breathOverlay'],['음악방','playlistOverlay']]){
   await p.locator('#mindRestChoices').getByRole('button',{name,exact:false}).click();assert(await p.locator('#'+target).isVisible(),name+' opens the actual existing function');await p.evaluate(target=>{const closers={breathOverlay:closeBreathOverlay,moktakOverlay:closeMoktakOverlay,mantraOverlay:closeMantraOverlay,vowOverlay:closeVowOverlay,playlistOverlay:closePlaylistOverlay};closers[target]();},target);await p.waitForTimeout(350);await p.evaluate(()=>openMindRest());
  }
  assert.equal(await p.locator('#mindRestChoices a').getAttribute('href'),'/copy/index.html');
  await p.locator('#mindRestClose').click();await p.locator('.sansa-home-temple').click();assert(await p.locator('#sansaFirstVisit').isVisible());await p.locator('#sansaFirstPractice').click();
  for(const[id,i]of['daewung','geungnak','gwanum','munsu','yaksa','jijang'].map((v,i)=>[v,i])){
   if(i)await p.evaluate(id=>SansaOnlineSansa.enter(id,{kind:'free',duration:null}),id);
   await shot(p,id+'-entrance');const before=await p.locator('.hall-scene>img').first().getAttribute('src');assert(!before.includes('-seated'));
   if(await p.locator('#hallQuickStart').isVisible())await p.locator('#hallQuickStart').click();else await p.locator('#hallPrimaryAction').click();
   await p.waitForFunction(()=>document.querySelector('.hall-scene>img').complete);
   const after=await p.locator('.hall-scene>img').first().getAttribute('src');assert(after.includes(id+'-seated.webp'));assert.notEqual(after,before);
   assert((await p.locator('#hallSeatStatus').innerText()).includes('자리에 앉았습니다'));assert(!await p.locator('#hallSeat').isVisible());
   assert((await p.locator('#hallMonk').getAttribute('src')).includes('monk-meditation'));
   await shot(p,id+'-seated');await p.locator('#hallPrimaryAction').click();assert.equal(await p.evaluate(()=>SansaDharmaHall.state.gassho),1);
   await p.waitForFunction(()=>document.getElementById('hallMonk').getAttribute('src').includes('monk-prayer'));await shot(p,id+'-gassho');
   assert.equal(await p.locator('.hall-scene').innerText(),'');assert.equal(await p.evaluate(()=>SansaDharmaHall.media.paused),true);assert.equal(await p.locator('#hallPresence').innerText(),'참여 인원 확인 중');
   await p.locator('#hallClose').click();
  }
  if(await p.locator('#onlineSansaOverlay').isVisible())await p.locator('#sansaClose').click();await p.waitForTimeout(250);await p.evaluate(()=>openOracleOverlay());await p.waitForFunction(()=>window.SansaOracle?.ready);assert.equal(await p.locator('#oracleCategories button').count(),12);await shot(p,'oracle-choice');
  await p.locator('#oracleTopics [data-topic=refusal]').click();assert.equal(await p.locator('#oracleAnswer').getAttribute('data-topic-id'),'refusal');await shot(p,'oracle-selected-answer');
  await p.locator('#oracleDirectTab').click();
  for(const c of require('../data/oracle-quality-20.json').cases){await p.locator('#oracleInput').fill(c.input);await p.locator('#oracleSubmit').click();await p.waitForFunction(id=>document.getElementById('oracleAnswer').dataset.topicId===id,c.expectedTopicId);}
  await p.locator('#oracleInput').fill('어머니가 아프신데 병원비가 많이 나와요.');await p.locator('#oracleSubmit').click();await p.waitForFunction(()=>document.getElementById('oracleAnswer').dataset.topicId==='medical_bills');
  const original=await p.locator('#oracleBig').textContent();await p.locator('#oracleStyle').selectOption('comfort');assert.notEqual(await p.locator('#oracleBig').textContent(),original);assert.equal(await p.locator('#oracleAnswer').getAttribute('data-topic-id'),'medical_bills');await p.locator('#oracleStyle').selectOption('practical');assert.equal(await p.locator('#oracleBig').textContent(),original,'changing style does not accumulate old prefixes');
  await p.locator('#oracleMismatch').click();await p.locator('#oracleCorrect').click();assert((await p.locator('#oracleFeedbackStatus').innerText()).includes('무작위'));
  await p.locator('#oracleCorrection').fill('개인고민확인표식 · 부모 간섭이 아니라 제 수술비가 너무 비싸요.');await p.locator('#oracleCorrect').click();assert.equal(await p.locator('#oracleAnswer').getAttribute('data-topic-id'),'medical_bills');
  assert(!requests.some(r=>r.includes('개인고민확인표식')),'concern and correction never sent by default');await shot(p,'oracle-direct-answer');
  await p.locator('#oracleHelpful').click();assert((await p.locator('#oracleFeedbackStatus').innerText()).includes('서버에 보내지'));
  await p.locator('#oracleNew').click();assert.equal(await p.locator('#oracleInput').inputValue(),'');assert(!await p.locator('#oracleDirect').isVisible());
  assert.deepEqual(await p.evaluate(()=>mockWrites),[]);assert.equal(await p.evaluate(()=>JSON.stringify(mockRecords)),snapshot);assert.equal(await p.evaluate(()=>localStorage.getItem('completion-preserve')),'keep');assert.deepEqual(errors,[]);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS',wk?'WebKit':'Chromium',width,'8 existing rooms, courtyard onboarding, 6 distinct entrance/seated/gassho views, honest presence fallback, 12 categories and selected answer, 20 direct cases, style/correction/privacy, existing data preserved; screenshots captured');
  await p.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
