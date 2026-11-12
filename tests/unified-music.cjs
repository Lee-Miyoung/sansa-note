const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{fullRoute}=require('./unified-fixtures.cjs');
(async()=>{
 const wk=process.env.SANSA_BROWSER==='webkit',b=await(wk?webkit:chromium).launch(wk?{executablePath:'/workspace/.sansa-webkit-run'}:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await fullRoute(p);const requests=[];p.on('request',r=>{if(/\.(mp3|wav)/.test(r.url()))requests.push(r.url());});
  await p.goto('https://sansanote.com/');await p.waitForFunction(()=>window.SansaTempleMusic);await p.evaluate(()=>SansaTempleMusic.ready);
  assert.equal(requests.length,0,'home does not preload music');assert.equal(await p.evaluate(()=>SansaSession.member()),false);
  await p.evaluate(()=>openSansaMusicRoom('haeinsa-palman'));
  assert.equal(await p.locator('#playlistSongTitle').innerText(),'팔만의 바람');assert.equal(await p.locator('#songOrderList .song-pick').count(),6);assert.equal(await p.locator('#playlistOverlay [role=tablist],#playlistOverlay [role=tab],#musicRoomOverlay').count(),0,'no tabs or duplicate room');
  assert((await p.locator('#lyricsInner').innerText()).includes('가야산에 바람이 분다'));assert(!await p.locator('#lyricSyncPanel').isVisible());assert.equal(await p.locator('#lyricsInner .lyric-sync-pick').count(),0);
  await p.locator('#playlistPlayBtn').click();
  if(!wk){await p.waitForFunction(()=>!SansaTempleMusic.media.paused&&SansaTempleMusic.media.currentTime>.1);assert(Math.abs(await p.evaluate(()=>SansaTempleMusic.media.duration)-269.4)<.1);}
  assert.equal(await p.locator('audio#playlistAudio').count(),1);
  const source=await p.evaluate(()=>SansaTempleMusic.media.src);await p.evaluate(()=>{closePlaylistOverlay();openSansaMusicRoom('haeinsa-palman');});assert.equal(await p.evaluate(()=>SansaTempleMusic.media.src),source);
  if(!wk)assert.equal(await p.evaluate(()=>SansaTempleMusic.media.paused),false,'reopen preserves playing track');
  await p.evaluate(()=>{SansaTempleMusic.media.pause();Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copiedMusic=text}});Object.defineProperty(navigator,'share',{configurable:true,value:undefined});});
  await p.locator('#playlistMusicShare').click();assert((await p.evaluate(()=>copiedMusic)).endsWith('?music=haeinsa-palman'));
  await p.evaluate(()=>{SansaTempleMusic.selectInfo('legacy-song1');SansaTempleMusic.play();});if(!wk)await p.waitForFunction(()=>!SansaTempleMusic.media.paused&&SansaTempleMusic.media.currentTime>.1);assert.equal(await p.locator('#playlistSongTitle').innerText(),'비워내 비워내');assert((await p.locator('#lyricsInner .lyric-line').count())>5);
  await p.goto('https://sansanote.com/?music=haeinsa-palman');await p.waitForFunction(()=>document.querySelector('#playlistSongTitle')?.textContent==='팔만의 바람');assert(await p.locator('#playlistOverlay').isVisible());assert.equal(await p.evaluate(()=>SansaTempleMusic.media.paused),true,'deep links do not autoplay');
  await p.evaluate(()=>{closePlaylistOverlay();openDetail(Object.keys(destinations).find(id=>destinations[id].name==='해인사'));});await p.waitForSelector('#templeSongButton');await p.locator('#templeSongButton').click();assert.equal(await p.locator('#playlistSongTitle').innerText(),'팔만의 바람');assert((await p.locator('#lyricsInner').innerText()).includes('우리가 듣는다'));assert.equal(await p.locator('#memberActionDialog').count(),0);
  console.log('PASS',wk?'webkit controls only':'Chromium real 269.4s Palman and legacy playback','one player/list/lyrics; zero tabs; no public timing tools; share/deep link/detail; reopen without reset; zero home audio requests');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
