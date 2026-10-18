/* Licensed local recordings. One media element; never autoplay or synthesize tones. */
(()=>{
 const room=document.querySelector('#breathOverlay .modal-body');if(!room)return;
 const audio=new Audio();audio.preload='none';audio.loop=true;
 let tracks=[],selected=null,playing=false,serial=0,previewTimer=0,deadlineTimer=0,deadline=0;
 let volume=.25;try{const value=JSON.parse(localStorage.getItem('sansaMeditationVolume_v2'));if(typeof value==='number')volume=Math.max(0,Math.min(1,value));}catch(_){}
 const panel=document.createElement('section');panel.className='meditation-sound-panel';panel.setAttribute('aria-label','명상 음원 선택');
 panel.innerHTML='<label for="meditationSound">나의 명상 소리</label><select id="meditationSound"><option value="">무음 · 소리 선택 안함</option></select><p id="meditationDescription">소리를 선택하지 않으면 무음으로 시작해요.</p><div class="meditation-controls"><button type="button" id="meditationSoundPreview" class="btn btn-ghost" disabled>12초 미리 듣기</button><button type="button" id="meditationPlay" class="btn btn-primary" disabled>재생</button><button type="button" id="meditationPause" class="btn btn-ghost" disabled>일시정지</button><button type="button" id="meditationStop" class="btn btn-ghost" disabled>정지</button></div><label class="meditation-volume">음량 <input id="meditationVolume" type="range" min="0" max="100" step="1" aria-label="명상 음원 음량"><output id="meditationVolumeLabel"></output></label><p class="meditation-device-note">아이폰에서는 측면 볼륨 버튼으로도 음량을 조절해 주세요.</p><div id="meditationSoundStatus" role="status">무음 · 음원은 직접 재생할 때만 불러옵니다.</div><details><summary>음원 출처와 라이선스</summary><div id="meditationAttribution"></div><a href="./audio/meditation/LICENSES.txt" target="_blank" rel="noopener noreferrer">전체 출처·변경 내역 보기</a></details>';
 room.appendChild(panel);
 const $=id=>panel.querySelector('#'+id),select=$('meditationSound'),status=$('meditationSoundStatus');
 function setVolume(){const value=Number($('meditationVolume').value)/100;volume=value;audio.volume=value; // iOS may use the hardware volume instead.
  $('meditationVolumeLabel').value=Math.round(value*100)+'%';try{localStorage.setItem('sansaMeditationVolume_v2',JSON.stringify(value));}catch(_){}
 }
 $('meditationVolume').value=Math.round(volume*100);setVolume();$('meditationVolume').addEventListener('input',setVolume);
 function stop(unload=false){serial++;clearTimeout(previewTimer);audio.pause();try{audio.currentTime=0;}catch(_){}playing=false;if(unload){audio.removeAttribute('src');audio.load();}status.textContent=selected?'정지 · '+selected.title:'무음 · 소리를 선택해 주세요.';}
 function pause(){serial++;clearTimeout(previewTimer);audio.pause();playing=false;status.textContent='일시정지 · '+(selected?.title||'');}
 function setDeadline(ms){clearTimeout(deadlineTimer);deadline=ms>0?Date.now()+ms:0;if(ms>0)deadlineTimer=setTimeout(()=>{deadline=0;stop();},ms);}
 function hushOtherAudio(){for(const node of document.querySelectorAll('audio'))if(node!==audio&&!node.paused)node.pause();window.updatePlaylistPlayButtons?.();}
 function enter(){hushOtherAudio();stop(true);setDeadline(0);selected=null;select.value='';renderChoice();}
 function renderChoice(){
  for(const id of ['meditationSoundPreview','meditationPlay','meditationPause','meditationStop'])$(id).disabled=!selected;
  $('meditationDescription').textContent=selected?selected.description:'소리를 선택하지 않으면 무음으로 시작해요.';
  const attribution=$('meditationAttribution');attribution.replaceChildren();
  if(selected){const p=document.createElement('p');p.textContent=selected.creator+' · '+selected.originalTitle;attribution.append(p);
   for(const [label,href]of [['원본',selected.source],[selected.license,selected.licenseURL]]){const a=document.createElement('a');a.textContent=label+' ';a.href=href;a.target='_blank';a.rel='noopener noreferrer';attribution.append(a);}
   const changes=document.createElement('p');changes.textContent=selected.changes;attribution.append(changes);
  }
  status.textContent=selected?'선택됨 · 재생 버튼을 눌러 주세요.':'무음 · 음원은 직접 재생할 때만 불러옵니다.';
 }
 async function play(preview=false){
  if(!selected)return false;hushOtherAudio();clearTimeout(previewTimer);const token=++serial,track=selected;
  if(audio.getAttribute('src')!==track.src){audio.pause();audio.src=track.src;}if(preview)audio.currentTime=0;
  audio.volume=volume;status.textContent='불러오는 중 · '+track.title;
  try{
   // Called directly from a click; no network await before play (Safari gesture requirement).
   await audio.play();if(token!==serial)return false;playing=true;status.textContent=(preview?'12초 미리 듣기 · ':'재생 중 · ')+track.title;
   if(preview)previewTimer=setTimeout(()=>{if(token===serial)stop();},12000);
   if(deadline&&deadline<=Date.now())stop();return true;
  }catch(_){if(token===serial){playing=false;status.textContent='재생하지 못했습니다. 네트워크를 확인하고 재생을 다시 눌러 주세요.';}return false;}
 }
 select.addEventListener('change',()=>{stop(true);selected=tracks.find(t=>t.id===select.value)||null;renderChoice();});
 $('meditationSoundPreview').onclick=()=>play(true);$('meditationPlay').onclick=()=>play(false);$('meditationPause').onclick=pause;$('meditationStop').onclick=()=>stop();
 audio.addEventListener('error',()=>{playing=false;if(selected)status.textContent='음원을 불러오지 못했습니다. 다시 재생해 주세요.';});
 const overlay=document.getElementById('breathOverlay');
 new MutationObserver(changes=>{if(!overlay.classList.contains('show')||changes.some(c=>c.target!==overlay&&c.target.matches?.('.overlay.show')&&!String(c.oldValue).split(/\s+/).includes('show'))){stop(true);setDeadline(0);}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
 document.addEventListener('play',event=>{if(event.target!==audio&&event.target instanceof HTMLMediaElement&&!event.target.muted)stop(true);},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(true);});window.addEventListener('pagehide',()=>stop(true));
 fetch('./audio/meditation/catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(list=>{tracks=list.filter(t=>/^[a-z]+$/.test(t.id)&&/^\.\/audio\/meditation\/[a-z]+\.mp3$/.test(t.src));for(const t of tracks)select.add(new Option(t.title,t.id));}).catch(()=>{status.textContent='음원 목록을 불러오지 못했습니다. 호흡은 무음으로 이용할 수 있어요.';});
 window.sansaMeditationSound={play,stop:()=>stop(true),enter,setDeadline,get state(){return playing?'playing':'silent';},get activeCount(){return audio.paused?0:1;},get current(){return selected?.id||null;},get media(){return audio;}};
})();
