const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {fullRoute,login}=require('./unified-fixtures.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await fullRoute(p);await p.goto('https://sansanote.com/');await p.waitForFunction(()=>window.SansaSession);
  const welcome=p.locator('.sansa-privacy-welcome');assert(await welcome.isVisible());assert((await welcome.innerText()).includes('개인정보 보호를 위해'));
  assert.equal(await p.evaluate(()=>SansaSession.member()),false);
  await p.locator('.fun-banner-btn.playlist').screenshot({path:'scratch/privacy-game/playlist-mobile.png'});
  for(const width of [390,1440]){await p.setViewportSize({width,height:844});assert(await p.locator('.sansa-mascot[data-pose=music]').first().evaluate(e=>{const c=getComputedStyle(e);return c.backgroundSize==='300% 400%'&&c.borderRadius==='50%'&&c.clipPath.startsWith('circle(')}));}
  await p.setViewportSize({width:390,height:844});await welcome.screenshot({path:'scratch/privacy-game/welcome-mobile.png'});
  await p.evaluate(()=>openBeatLab(true));await p.waitForTimeout(600);
  // A closed meditation player must not reload for every shot, combo or explosion.
  await p.evaluate(()=>{window.gameAudioLoads=0;const original=HTMLMediaElement.prototype.load;HTMLMediaElement.prototype.load=function(){window.gameAudioLoads++;return original.call(this)};beatSoundOn=false;});
  const result=await p.evaluate(async()=>{
   let samples=0;for(let i=0;i<100;i++){
    for(const enemy of document.querySelectorAll('#worrySmashZone .worry-enemy:not(.smash)'))if(enemy.dataset.locked!=='1')playBeat(enemy.dataset.weapon,document.querySelector('.beat-pad[data-weapon="'+enemy.dataset.weapon+'"]'));
    await new Promise(r=>setTimeout(r,50));if(i%10===0){if(!worryGameRunning||beatLives<=0)throw Error('game stopped during sustained matching shots');samples++;}
   }
   return {samples,hits:beatHits,level:beatLevel,loads:gameAudioLoads,locked:[...document.querySelectorAll('.worry-enemy:not(.smash)')].filter(e=>e.dataset.locked==='1').length};
  });
  assert(result.hits>40);assert(result.level>1);assert.equal(result.loads,0,'shot effects never reload the closed meditation player');
  await p.waitForTimeout(250);assert.equal(await p.locator('.worry-enemy:not(.smash)[data-locked="1"]').count(),0,'hit targets unlock or disappear');
  // A failed AudioContext must not abort the simulation at the defense line.
  await p.evaluate(()=>{beatSoundOn=true;hipAudioCtx=null;window.AudioContext=window.webkitAudioContext=class{constructor(){throw Error('audio unavailable')}};beatLifeGraceUntil=0;const e=document.querySelector('.worry-enemy:not(.smash)');e.dataset.y=String(beatDefenseY);});
  await p.waitForTimeout(180);assert(await p.evaluate(()=>worryGameRunning&&beatLives===2));
  await p.evaluate(()=>restartWorryGame());await p.waitForTimeout(350);assert(await p.evaluate(()=>worryGameRunning&&beatLives===3));
  await p.evaluate(()=>closeBeatLab());await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>worryGameRunning),false);
  await p.evaluate(()=>openPilgrimGuardianCollection());assert(await p.locator('#memberActionDialog').isVisible());assert((await p.locator('#memberActionDialog').innerText()).includes('개인정보 보호를 위해'));await p.getByRole('button',{name:'나중에 하기',exact:true}).click();await login(p);assert.equal(await p.evaluate(()=>SansaSession.member()),true);
  assert.deepEqual(errors,[]);console.log('PASS',result,'circular playlist; public privacy notice; sustained shots; audio failure; restart; close; member gate');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
