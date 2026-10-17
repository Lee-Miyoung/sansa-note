/* Original synthesized audio: no third-party recordings or external requests. */
(()=>{
  const KEY='sansaMeditationSound_v1',types={small:{label:'맑은 작은 종',freqs:[880,1763,2450],duration:1.8},chime:{label:'은은한 풍경',freqs:[1174,1568,1760],duration:2.2},deep:{label:'깊은 명상 종',freqs:[196,392,550],duration:3.5},bowl:{label:'부드러운 싱잉볼',freqs:[220,440,644,873],duration:4}};
  let saved={type:'small',volume:.22,enabled:true};try{saved={...saved,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
  if(!types[saved.type])saved.type='small';saved.volume=Math.min(.5,Math.max(0,Number(saved.volume)||0));
  let context=null,lastPlayed=null;const active=new Set();
  const room=document.querySelector('#breathOverlay .modal-body');if(!room)return;
  const panel=document.createElement('section');panel.className='meditation-sound-panel';panel.setAttribute('aria-label','명상 종소리 선택');
  panel.innerHTML=`<label for="meditationSound">나의 명상 소리</label><div class="meditation-sound-row"><select id="meditationSound">${Object.entries(types).map(([key,value])=>`<option value="${key}">${value.label}</option>`).join('')}</select><button type="button" id="meditationSoundPreview" class="btn btn-ghost">미리 듣기</button></div><label class="meditation-volume">음량 <input id="meditationVolume" type="range" min="0" max="50" step="1" aria-label="명상 종소리 음량"><output id="meditationVolumeLabel"></output></label><label class="meditation-bell-choice"><input type="checkbox" id="meditationBellEnabled"> 호흡에 맞춰 종소리 듣기</label><div id="meditationSoundStatus" role="status">미리 듣기를 누르면 선택한 소리를 들을 수 있어요.</div>`;
  room.appendChild(panel);
  const select=panel.querySelector('#meditationSound'),volume=panel.querySelector('#meditationVolume'),enabled=panel.querySelector('#meditationBellEnabled'),status=panel.querySelector('#meditationSoundStatus');
  select.value=saved.type;volume.value=Math.round(saved.volume*100);enabled.checked=saved.enabled;
  const update=()=>{saved={type:select.value,volume:Number(volume.value)/100,enabled:enabled.checked};panel.querySelector('output').value=Math.round(saved.volume*100)+'%';try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(_){}};update();
  select.addEventListener('change',update);volume.addEventListener('input',update);enabled.addEventListener('change',update);
  async function play(preview=false){
    if(!preview&&!saved.enabled)return false;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){status.textContent='이 브라우저는 종소리 합성을 지원하지 않아요.';return false;}
    try{
      context ||= new Audio();if(context.state==='suspended')await context.resume();
      if(active.size)stop();
      const tone=types[saved.type],now=context.currentTime,mix=context.createGain(),compressor=context.createDynamicsCompressor();
      compressor.threshold.value=-16;compressor.knee.value=18;compressor.ratio.value=4;
      mix.gain.setValueAtTime(saved.volume*.32,now);mix.connect(compressor);compressor.connect(context.destination);
      tone.freqs.forEach((frequency,i)=>{
        const oscillator=context.createOscillator(),envelope=context.createGain(),offset=saved.type==='chime'?i*.23:0,start=now+offset;
        oscillator.type='sine';oscillator.frequency.value=frequency;
        envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(1/(1+i*.9),start+.025);envelope.gain.exponentialRampToValueAtTime(.0001,start+tone.duration);
        oscillator.connect(envelope);envelope.connect(mix);oscillator.__envelope=envelope;active.add(oscillator);
        oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();envelope.disconnect();};oscillator.start(start);oscillator.stop(start+tone.duration+.05);
      });
      setTimeout(()=>{mix.disconnect();compressor.disconnect();},(tone.duration+1)*1000);
      lastPlayed={type:saved.type,voices:tone.freqs.length,volume:saved.volume};status.textContent=types[saved.type].label+' · '+Math.round(saved.volume*100)+'%';return true;
    }catch(_){status.textContent='소리를 켜려면 미리 듣기를 다시 눌러 주세요.';return false;}
  }
  panel.querySelector('#meditationSoundPreview').addEventListener('click',()=>play(true));
  function stop(){for(const node of active){try{const now=context.currentTime,g=node.__envelope.gain;if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(now);else g.cancelScheduledValues(now);g.linearRampToValueAtTime(.0001,now+.035);node.stop(now+.04);}catch(_){}}active.clear();}
  window.sansaMeditationSound={play,stop,get state(){return context?.state||'not-started';},get lastPlayed(){return lastPlayed;},get activeCount(){return active.size;}};
})();
