/* Layered shrine presentation and optional participation. The hall engine owns time/audio. */
(()=>{'use strict';const hall=document.getElementById('dharmaHallOverlay');if(!hall||!window.SansaHallUX)return;
const $=id=>document.getElementById(id),api=()=>window.SansaDharmaHall,scene=hall.querySelector('.hall-scene'),art=hall.querySelector('.hall-art'),guide=hall.querySelector('.hall-guidance');
hall.classList.add('hall-25d');
const layers=document.createElement('div');layers.className='shrine-layers';layers.setAttribute('role','img');
function layer(name){const im=document.createElement('img');im.className='shrine-'+name;im.alt='';im.loading='lazy';im.decoding='async';layers.append(im);return im;}
const architecture=layer('architecture'),altar=layer('altar'),foreground=layer('foreground');
architecture.src='/images/online-sansa/layers/architecture.webp';foreground.src='/images/online-sansa/layers/foreground.webp';foreground.srcset='/images/online-sansa/layers/foreground-small.webp 768w, /images/online-sansa/layers/foreground.webp 1536w';
scene.append(layers);const originalImage=scene.querySelector(':scope > img:first-of-type');originalImage.classList.add('shrine-legacy');
const subtitle=document.createElement('p');subtitle.id='hallLiveSubtitle';subtitle.setAttribute('aria-live','off');hall.querySelector('.modal-head>div').append(subtitle);
const progress=document.createElement('progress');progress.id='hallAutoProgress';progress.setAttribute('aria-label','자동 예불 전체 진행');hall.querySelector('.modal-head').after(progress);
const dock=document.createElement('section');dock.className='ritual-transport';dock.setAttribute('aria-label','예불 재생 제어');dock.innerHTML='<div class="ritual-track-line"><p id="ritualSoundName"></p><span id="ritualSoundClock"></span></div><p id="ritualSoundState" role="status"></p><div class="ritual-play-row"><button id="ritualPrevious" aria-label="이전 단계">‹ 이전</button><button id="ritualToggle">일시정지</button><button id="ritualNext" aria-label="다음 단계">다음 ›</button><button id="ritualRestart">다시 시작</button></div><div class="ritual-volume-row"><label for="ritualVolume">음량</label><input id="ritualVolume" type="range" min="0" max="100" value="30"><button id="ritualDetails">설정·출처</button></div>';
hall.querySelector('.modal').append(dock);
$('ritualPrevious').onclick=()=>api().perform('previous');$('ritualNext').onclick=()=>api().perform('next');$('ritualToggle').onclick=()=>{const s=api().state;if(s.completed)api().perform('restart');else api().perform(s.running?'pause':'resume')};$('ritualRestart').onclick=()=>api().perform('restart');
$('ritualVolume').oninput=()=>{$('hallVolume').value=$('ritualVolume').value;$('hallVolume').dispatchEvent(new Event('input',{bubbles:true}))};
$('ritualDetails').onclick=()=>{const options=hall.querySelector('.hall-options');options.open=!options.open;hall.classList.toggle('ritual-settings',options.open);if(options.open)options.scrollIntoView({block:'nearest',behavior:'instant'})};
const auto=document.createElement('button');auto.id='hallAutoStart';auto.type='button';auto.innerHTML='<b>자동 예불 시작</b><small>5분 · 염불과 안내에 따라 조용히 함께하는 시간</small>';
$('hallWelcome').querySelector('h3').textContent='이제, 부처님 앞에 앉습니다';$('hallWelcome').querySelector('.hall-arrival-copy').textContent='처음이라면 5분 자동 예불을 추천해요. 한 번 시작하면 마무리까지 안내합니다.';
$('hallEnterRitual').before(auto);$('hallEnterRitual').innerHTML='<span>자유 기도 시작 · 종소리와 함께</span><small>시간에 얽매이지 않고 내 속도로</small>';
$('hallQuickStart').textContent='자유 기도 시작 · 무음';
function hideWelcome(){ $('hallWelcome').hidden=true; }
auto.onclick=()=>{hideWelcome();api().perform('guided');render()};
const oldQuick=$('hallQuickStart').onclick;$('hallQuickStart').onclick=()=>{const h=api().experience.hall;if(api().state.session?.kind==='guided'&&h)api().openHall(h,{kind:'free',duration:null});oldQuick();render()};
const oldEntry=$('hallEnterRitual').onclick;$('hallEnterRitual').onclick=()=>{const h=api().experience.hall;if(api().state.session?.kind==='guided'&&h)api().openHall(h,{kind:'free',duration:null});oldEntry();render()};
const optional=document.createElement('div');optional.id='ritualOptional';optional.innerHTML='<button id="ritualParticipate"></button><button id="ritualAccessible">앉아서 합장으로 참여</button><button id="ritualEditVow">발원문 적기 · 잠시 멈춤</button><button id="ritualVowResume" hidden>작성 마침 · 예불 계속</button><p id="ritualActualActions"></p>';$('hallCurrent').append(optional);
let optionalAction='';$('ritualParticipate').onclick=()=>api().perform(optionalAction);$('ritualAccessible').onclick=()=>api().perform('accessible');$('ritualEditVow').onclick=()=>{api().perform('edit-vow');$('ritualVowResume').hidden=false;hall.classList.add('ritual-writing');};$('ritualVowResume').onclick=()=>{hall.classList.remove('ritual-writing');$('ritualVowResume').hidden=true;api().perform('resume')};
const fmt=n=>{n=Math.max(0,Math.ceil(n||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
let sceneKey='',poseKey='',previousRunning=false;
function render(){if(!hall.classList.contains('show')){window.SansaHallUX.stopAnimation();return}const s=api().state,e=api().experience,h=e.hall,st=e.sequence[s.stage],guided=s.session?.kind==='guided',timed=guided||s.session?.kind==='scheduled',active=timed&&s.seated&&!s.completed;
 hall.dataset.ritualState=s.completed?'completed':!s.seated?'initial':s.running?'playing':'paused';hall.classList.toggle('ritual-timed',active);hall.classList.toggle('ritual-arrival',!s.seated);hall.classList.toggle('ritual-completed',s.completed);hall.classList.toggle('ritual-free',!timed);hall.classList.toggle('ritual-listening',active&&st?.pose==='listen');
 if(!s.running&&previousRunning)window.SansaHallUX.stopAnimation();previousRunning=s.running;
 const supported=['daewung','geungnak','gwanum','munsu','yaksa','jijang'].includes(h?.id);layers.hidden=!supported;originalImage.hidden=supported;
 if(supported){const key=e.serial+':'+h.id;if(key!==sceneKey){sceneKey=key;const planes=h.sceneLayers;architecture.src=planes?.architecture||'/images/online-sansa/layers/'+(h.id==='daewung'?'architecture':h.id+'-architecture')+'.webp';architecture.srcset=architecture.src.replace('.webp','-small.webp')+' 768w, '+architecture.src+' 1536w';altar.src=planes?.altar||'/images/online-sansa/layers/'+h.id+'-altar.webp';altar.srcset=(planes?.altarSmall||'/images/online-sansa/layers/'+h.id+'-altar-small.webp')+' 640w, '+altar.src+' 1024w';layers.setAttribute('aria-label',h.name+' · '+h.deity+' · 건축·불단·전경을 분리한 창작 수채화');layers.dataset.hall=h.id;}}
 layers.dataset.camera=!s.seated?'entrance':s.completed?'rest':timed?st?.pose||'sit':'sit';
 hall.classList.toggle('ritual-awaiting-schedule',s.session?.kind==='scheduled'&&!s.running);
 if(!s.seated&&!e.isPreview&&guided)$('hallWelcome').hidden=false;
 auto.hidden=!h||s.session?.kind==='scheduled'||e.isPreview;progress.hidden=!timed;progress.max=e.sequence.at(-1)?.end||300;progress.value=s.elapsed;
 $('hallLiveSubtitle').textContent=s.completed?'예불을 마쳤습니다 · 잠시 고요히 머무세요':!s.seated?(guided?'5분 자동 예불 · 시작 전':'자유 기도 · 입장 전'):timed?(s.running?(guided?'자동 예불 진행 중':'정시 예불 진행 중'):'예불 · 일시정지')+' · '+fmt(progress.max-s.elapsed)+' 남음':'내 속도로 머무는 자유 기도';
 dock.hidden=!s.seated||e.isPreview||!timed;$('ritualToggle').disabled=!!s.session?.cancelled||(s.session?.kind==='scheduled'&&(window.SansaClock?.now()??Date.now())<s.session.startAt);$('ritualToggle').textContent=s.completed?'다시 시작':s.running?'일시정지':'계속하기';$('ritualPrevious').disabled=!timed||s.stage===0||s.session?.kind==='scheduled';$('ritualNext').disabled=!timed||s.completed||s.session?.kind==='scheduled';$('ritualRestart').disabled=s.session?.kind==='scheduled';$('ritualVolume').value=$('hallVolume').value;
 const track=e.activeTrack,ai=track?.id.startsWith('recitation-');$('ritualSoundName').textContent=track?track.title+(ai&&!track.title.includes('AI')?' · AI 합성 음성':track.kind==='chant'?' · 실제 현장 녹음':''):'현재 음원: 무음';
 $('ritualSoundClock').textContent=track?fmt(api().media.currentTime)+' / '+fmt(Number.isFinite(api().media.duration)?api().media.duration:track.duration):'';
 $('ritualSoundState').textContent=$('hallAudioStatus').textContent+(track&&st?.pose==='listen'&&!st.repeat?' · 한 번 듣고 남은 시간은 고요히 머뭅니다.':track&&st?.repeat?' · 관리자 설정에 따라 반복합니다.':'');
 optional.hidden=!active||!guided;
 if(active&&guided){$('hallWelcome').hidden=true;$('hallCurrent').hidden=false;$('hallNowAction').textContent=st.pose==='bow'?'무념스님의 동작을 따라 하거나, 앉아서 합장해도 괜찮습니다.':'버튼을 누르지 않아도 다음 단계로 이어집니다.';$('hallGuide').textContent=st.pose==='vow'?h.vow:st.guide;$('hallGuide').hidden=false;
  const m={sit:['합장으로 함께했어요','gassho'],breathe:['숨을 고르고 있어요','breath'],bow:[s.three>=3?'직접 삼배 3회 확인':`절을 마쳤어요 · ${s.three}/3`,'bow'],listen:['명호를 함께 읊었어요','recite-auto'],vow:['마음속으로 발원했어요','vow']};const choice=m[st.pose];$('ritualParticipate').hidden=!choice;$('ritualParticipate').textContent=choice?.[0]||'';optionalAction=choice?.[1]||'';$('ritualParticipate').disabled=st.pose==='bow'&&s.three>=3;$('ritualAccessible').hidden=st.pose!=='bow';$('ritualAccessible').disabled=s.three>=3;$('ritualEditVow').hidden=st.pose!=='vow';$('ritualActualActions').textContent=`직접 참여 · 합장 ${s.gassho}회 · 삼배 ${s.three}/3 · 명호 ${e.recitationCount}회`;
 }
 // Three demonstrations use separate upright/kneeling/prostrate frames, never rotation or counting.
 if(active&&s.running&&st?.pose==='bow'){const duration=st.end-st.start,part=Math.min(2,Math.floor((s.elapsed-(st.motionAt??st.start))/Math.max(1,duration/3))),key=e.serial+':'+s.stage+':'+part;if(part>=0&&poseKey!==key){poseKey=key;window.SansaHallUX.animateBow();}}
 if(s.completed)hall.classList.remove('ritual-writing');
}
const previous=window.SansaHallUX.render;window.SansaHallUX.render=()=>{previous();render()};
new MutationObserver(()=>{if(!hall.classList.contains('show')){poseKey='';sceneKey='';hall.dataset.ritualState='stopped';if(hall.classList.contains('ritual-writing')||hall.classList.contains('ritual-settings'))hall.classList.remove('ritual-writing','ritual-settings');}}).observe(hall,{attributes:true,attributeFilter:['class']});
render();})();
