/* Public, silent-first practice. Only verified local recordings may enter the catalog. */
(()=>{'use strict';
const hall=document.createElement('section');hall.id='dharmaHallOverlay';hall.className='overlay';hall.setAttribute('aria-hidden','true');
hall.innerHTML=`<div class="modal hall-modal" role="dialog" aria-modal="true" aria-labelledby="hallTitle" tabindex="-1">
 <header class="modal-head"><div><span class="hall-eyebrow">잠시, 불단 앞에 앉아</span><h2 id="hallTitle">무념스님의 온라인 법당</h2></div><button type="button" class="close-x" id="hallClose" aria-label="법당 나가기">×</button></header>
 <div class="modal-body"><figure class="hall-scene"><img src="./images/dharma-hall.svg" alt="나무 기둥과 단청, 연등 사이로 연꽃 대좌의 불상을 마주한 법당. 앞에는 마루와 방석이 놓여 있습니다."><img id="hallMonk" class="hall-monk" src="./images/brand/monks/monk-prayer.png" alt="곁에서 합장하는 무념스님"><figcaption>상상으로 그린 산사노트의 법당</figcaption></figure>
 <nav class="hall-modes" aria-label="법당 체험 선택"><button type="button" data-mode="quiet" aria-pressed="true">고요히 머물기<small>시간 제한 없이</small></button><button type="button" data-mode="ceremony" aria-pressed="false">작은 예불<small>5분 · 무념스님과 함께</small></button><button type="button" data-mode="bows" aria-pressed="false">108배 마음 수행<small>나의 속도로</small></button></nav>
 <section class="hall-practice" aria-labelledby="hallStep"><h3 id="hallStep" tabindex="-1">고요히 머물기</h3><p id="hallGuide">편안히 앉아 마음을 쉬어 보세요. 법당은 무음으로 시작합니다.</p><p class="hall-progress" id="hallProgress"></p><progress id="hallBar" max="300" value="0" aria-label="작은 예불 진행" hidden></progress>
 <ol id="hallOrder" hidden><li>입장과 합장 · 30초</li><li>천천히 3배 · 1분</li><li>염불에 귀 기울이기 · 2분 30초</li><li>마음속 발원과 마무리 · 1분</li></ol>
 <div id="hallBowControls" hidden><label>안내 간격 <select id="hallPace"><option value="0">직접 세기</option><option value="8">8초</option><option value="12" selected>12초</option><option value="20">20초</option></select></label><p>무리하지 말고 자신의 속도에 맞추세요. 앉아서 합장으로 함께해도 괜찮습니다.</p><button type="button" class="btn btn-ghost" id="hallCount">한 배 올렸어요</button><button type="button" class="btn btn-ghost" id="hallUndo">한 배 되돌리기</button></div>
 <div class="hall-controls"><button type="button" class="btn btn-primary" id="hallPlay">시작</button><button type="button" class="btn btn-ghost" id="hallPause" disabled>일시정지</button><button type="button" class="btn btn-ghost" id="hallStop">정지 · 처음으로</button></div><p id="hallStatus" role="status">무음 · 소리는 직접 선택할 때만 시작해요.</p></section>
 <section class="hall-sound" aria-label="법당 소리"><label for="hallSound">함께 들을 소리</label><select id="hallSound"><option value="">무음</option></select><p id="hallAudioDescription">검증된 실제 염불·종·목탁 음원을 준비하고 있어요. 현재는 무음으로 체험할 수 있습니다.</p><label>음량 <input id="hallVolume" type="range" min="0" max="100" value="30" aria-label="법당 음량"><output id="hallVolumeValue">30%</output></label><p class="hall-note">아이폰에서는 기기의 볼륨 버튼으로도 조절해 주세요.</p><div id="hallAttribution"></div></section>
 <p class="hall-note">작은 예불은 산사노트의 짧은 체험 프로그램입니다. 사찰의 전통 예불 전체를 재현하거나 대체하지 않습니다. 수행 횟수는 이번 방문 동안만 유지됩니다.</p>
 <details class="hall-credits"><summary>공간과 소리의 출처</summary><p>법당 그림: 산사노트 전용 SVG 일러스트. 한국 사찰의 목조 법당 구성에서 착안한 가상 공간이며 특정 사찰을 재현한 그림이 아닙니다.</p><p>실제 녹음과 전통 악기 연주곡은 파일·저작자·이용조건·재생 검증을 마친 뒤에만 제공합니다. 현재 등록된 법당 음원은 없습니다.</p><a href="./audio/dharma-hall/SOURCES.md" target="_blank" rel="noopener">음원 후보 및 확인 상태</a></details>
 </div></div>`;document.body.append(hall);
const $=id=>hall.querySelector('#'+id),media=document.createElement('audio');media.preload='none';media.hidden=true;hall.append(media);
let mode='quiet',running=false,elapsed=0,last=0,timer=0,count=0,paceElapsed=0,stage=-1,tracks=[],choice=null,epoch=0,opener=null;
const stages=[{end:30,title:'입장과 합장',guide:'두 손을 모으고 천천히 숨을 고릅니다.',kind:'bell'},{end:90,title:'천천히 3배',guide:'몸을 천천히 낮추고 일어나세요. 앉아서 합장해도 괜찮습니다.',kind:'moktak'},{end:240,title:'염불에 귀 기울이기',guide:'마음이 향하는 곳을 조용히 바라봅니다.',kind:'chant'},{end:300,title:'마음속 발원과 마무리',guide:'나와 이웃의 평안을 마음속으로 발원하고 잠시 고요히 머뭅니다.',kind:'bell'}];
function stopMedia(reset=true){epoch++;media.pause();if(reset){try{media.currentTime=0}catch(_){}}}
function hush(){window.sansaMeditationSound?.stop();for(const a of document.querySelectorAll('audio,video'))if(a!==media&&!a.muted)a.pause();window.updatePlaylistPlayButtons?.();}
function render(){
 for(const b of hall.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
 $('hallBowControls').hidden=mode!=='bows';$('hallOrder').hidden=mode!=='ceremony';$('hallBar').hidden=mode!=='ceremony';$('hallBar').value=elapsed;
 $('hallPause').disabled=!running;$('hallPlay').disabled=running;
 $('hallCount').disabled=count>=108;$('hallUndo').disabled=count===0;
 if(mode==='quiet'){$('hallStep').textContent='고요히 머물기';$('hallGuide').textContent='편안히 앉아 마음을 쉬어 보세요. 시간에 쫓기지 않아도 괜찮습니다.';$('hallProgress').textContent='시간 제한 없음';}
 if(mode==='bows'){$('hallStep').textContent=count===108?'오늘의 수행을 마쳤습니다':'108배 마음 수행';$('hallGuide').textContent=count===108?'애쓰셨습니다. 잠시 편안히 쉬어 주세요.':'무념스님의 안내를 보며 자신의 속도로 절하거나, 직접 한 배씩 세어 보세요.';$('hallProgress').textContent=count+' / 108배';}
 if(mode==='ceremony'){
  const s=stages[Math.max(stage,0)];$('hallStep').textContent=elapsed>=300?'작은 예불을 마쳤습니다':s.title;
  $('hallGuide').textContent=elapsed>=300?'잠시 고요히 머물러 주세요.':s.guide+(stage===2&&!tracks.some(t=>t.kind==='chant')?' · 실제 염불 음원은 준비 중이므로 지금은 무음으로 이어갑니다.':'');
  const seconds=Math.max(0,Math.ceil(300-elapsed));$('hallProgress').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' 남음';
  [...$('hallOrder').children].forEach((li,i)=>{if(i===stage)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
 }
 const bowing=running&&(mode==='bows'||mode==='ceremony'&&stage===1);
 $('hallMonk').classList.toggle('is-bowing',bowing);$('hallMonk').style.setProperty('--bow-pace',(mode==='bows'?Number($('hallPace').value)||12:20)+'s');
}
async function playTrack(track,resume=false){
 stopMedia(!resume);if(!track)return;hush();const token=++epoch;
 if(media.getAttribute('src')!==track.src)media.src=track.src;
 media.loop=track.loop===true&&track.kind==='instrumental';media.volume=Number($('hallVolume').value)/100;
 $('hallAttribution').replaceChildren();const text=document.createElement('p');text.textContent=track.title+' · '+track.creator+' · '+track.license+' · '+track.changes;
 const link=document.createElement('a');link.href=track.source;link.textContent='원본과 이용조건';link.target='_blank';link.rel='noopener noreferrer';$('hallAttribution').append(text,link);
 try{await media.play();if(token!==epoch||!running)return;$('hallStatus').textContent='재생 중 · '+track.title;}catch(_){if(token===epoch){pause();$('hallStatus').textContent='소리를 재생하지 못했어요. 재생을 다시 눌러 주세요. 무음으로도 체험할 수 있습니다.';}}
}
function selected(){return tracks.find(t=>t.id===$('hallSound').value)||null;}
function stageAudio(resume=false){
 const track=selected();choice=track;
 // Chant and effects never overlap with background music or one another.
 const active=mode==='ceremony'?(track?.kind==='instrumental'?null:tracks.find(t=>t.kind===stages[Math.max(stage,0)]?.kind&&(track?.kind==='ritual'||t.id===track?.id))):track;
 if(active)playTrack(active,resume);else stopMedia();
}
function begin(){if(running)return;if(mode==='ceremony'&&elapsed>=300||mode==='bows'&&count>=108)return;hush();running=true;last=performance.now();if(mode==='ceremony'&&stage<0)stage=0;stageAudio(true);$('hallStatus').textContent=selected()?'소리를 준비하고 있어요.':'무음으로 함께합니다.';timer=setInterval(tick,200);render();}
function pause(){running=false;clearInterval(timer);timer=0;stopMedia(false);$('hallStatus').textContent='일시정지 · 준비되면 다시 시작해 주세요.';render();}
function reset(){pause();elapsed=0;count=0;paceElapsed=0;stage=-1;stopMedia();$('hallAttribution').replaceChildren();$('hallStatus').textContent='정지 · 처음부터 다시 시작할 수 있어요.';render();}
function bump(){if(count>=108)return;count++;if(count===108){pause();$('hallStatus').textContent='108배를 마쳤습니다. 잠시 고요히 쉬어 주세요.';}render();}
function tick(){const now=performance.now(),delta=(now-last)/1000;last=now;if(!running)return;
 if(mode==='ceremony'){elapsed=Math.min(300,elapsed+delta);const next=stages.findIndex(s=>elapsed<s.end);if(next<0){pause();stage=3;$('hallStatus').textContent='예불 체험을 마쳤습니다. 고요히 머물러도 좋습니다.';}else if(next!==stage){stage=next;stageAudio();}}
 if(mode==='bows'){const pace=Number($('hallPace').value);if(pace){paceElapsed+=delta;if(paceElapsed>=pace){paceElapsed%=pace;bump();}}}render();}
function setMode(value){reset();mode=value;render();$('hallStatus').textContent='무음 · 소리를 선택하고 시작할 수 있어요.';}
function close(){reset();hall.classList.remove('show');hall.setAttribute('aria-hidden','true');if(opener?.isConnected)opener.focus();}
window.openDharmaHall=function(){opener=document.activeElement;if(document.getElementById('playlistOverlay')?.classList.contains('show'))window.closePlaylistOverlay?.();if(document.getElementById('breathOverlay')?.classList.contains('show'))window.closeBreathOverlay?.();hush();setMode('quiet');$('hallSound').value='';choice=null;hall.classList.add('show');hall.setAttribute('aria-hidden','false');hall.querySelector('.modal-body').scrollTop=0;$('hallClose').focus();};window.closeDharmaHall=close;
for(const b of hall.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
$('hallPlay').onclick=begin;$('hallPause').onclick=pause;$('hallStop').onclick=reset;$('hallCount').onclick=bump;$('hallUndo').onclick=()=>{count=Math.max(0,count-1);render()};$('hallPace').onchange=()=>{paceElapsed=0;render()};$('hallClose').onclick=close;
$('hallVolume').oninput=()=>{media.volume=Number($('hallVolume').value)/100;$('hallVolumeValue').value=$('hallVolume').value+'%';};
$('hallSound').onchange=()=>{stopMedia();$('hallAttribution').replaceChildren();choice=selected();$('hallAudioDescription').textContent=choice?choice.description:'무음으로 함께합니다. 실제 법당 녹음은 확인을 마친 뒤 제공합니다.';if(running)stageAudio();};
media.addEventListener('error',()=>{if(running){pause();$('hallStatus').textContent='음원을 불러오지 못했습니다. 무음을 선택하거나 재생을 다시 눌러 주세요.';}});
document.addEventListener('play',e=>{if(e.target!==media&&e.target instanceof HTMLMediaElement&&!e.target.muted&&hall.classList.contains('show'))pause();},true);
new MutationObserver(changes=>{if(!hall.classList.contains('show')){if(running||!media.paused)reset();hall.setAttribute('aria-hidden','true');}else if(changes.some(c=>c.target!==hall&&c.target.matches?.('.overlay.show')&&!String(c.oldValue).split(/\s+/).includes('show')))close();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause()});window.addEventListener('pagehide',pause);
hall.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...hall.querySelectorAll('button:not(:disabled),select,input,a,summary')].filter(n=>n.getClientRects().length),first=nodes[0],lastNode=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastNode.focus()}else if(!e.shiftKey&&document.activeElement===lastNode){e.preventDefault();first.focus()}}});
const ready=fetch('./audio/dharma-hall/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(rows=>{tracks=rows.filter(t=>t.verified===true&&/^[-a-z0-9]+$/.test(t.id)&&/^\.\/audio\/dharma-hall\/[-a-z0-9]+\.mp3$/.test(t.src)&&['chant','bell','moktak','instrumental'].includes(t.kind)&&t.creator&&t.license&&t.changes&&/^https:\/\//.test(t.source));for(const t of tracks)$('hallSound').add(new Option(t.title,t.id));return tracks;}).catch(()=>{$('hallAudioDescription').textContent='소리 목록을 불러오지 못했습니다. 무음 체험은 이용할 수 있어요.';return[]});
const entry=document.createElement('button');entry.type='button';entry.id='dharmaHallEntry';entry.className='hall-entry';entry.innerHTML='<img src="./images/brand/monks/monk-prayer.png" alt="" loading="lazy"><span><b>무념스님의 온라인 법당</b><small>불단 앞에 앉아 · 고요히 머물기, 작은 예불, 108배</small></span><span aria-hidden="true">↗</span>';entry.onclick=()=>window.openDharmaHall();document.querySelector('.home-tools-section')?.append(entry);
window.SansaDharmaHall={ready,open:()=>window.openDharmaHall(),close,get media(){return media},get state(){return {mode,running,elapsed,count,stage}}};render();
})();
