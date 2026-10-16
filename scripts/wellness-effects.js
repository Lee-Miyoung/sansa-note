/* Visual feedback only. Never reads or writes user storage. */
(()=>{
  const feedbackTimers=new WeakMap();
  let breathVisualTimer;
  window.sansaWellnessBreathing=remainingMs=>{
    clearInterval(breathVisualTimer);
    const label=document.getElementById('breathRemaining');
    if(!label)return;
    label.style.display=remainingMs>0?'block':'none';
    if(remainingMs<=0)return;
    const until=Date.now()+remainingMs;
    const tick=()=>{
      if(!document.getElementById('breathOverlay')?.classList.contains('show')){clearInterval(breathVisualTimer);return;}
      if(!document.hidden)label.textContent=`남은 시간 ${Math.max(0,Math.ceil((until-Date.now())/1000))}초`;
    };
    tick();breathVisualTimer=setInterval(tick,1000);
  };
  window.sansaWellnessFeedback=kind=>{
    const el=document.querySelector({moktak:'#moktakWrap',mantra:'#mantraBeadCircle',vow:'#vowBody'}[kind]);
    if(!el)return;
    clearTimeout(feedbackTimers.get(el));
    el.classList.remove('wellness-feedback');
    void el.offsetWidth;
    el.classList.add('wellness-feedback');
    const counter=document.querySelector(kind==='moktak'?'#moktakCount':'#mantraCount');
    const value=Number(counter?.textContent)||0;
    el.classList.toggle('wellness-milestone',value>0&&value%(kind==='mantra'?108:10)===0);
    feedbackTimers.set(el,setTimeout(()=>el.classList.remove('wellness-feedback'),600));
  };
  const audio=document.getElementById('playlistAudio'),room=document.getElementById('playlistOverlay');
  if(audio&&room){const sync=()=>room.classList.toggle('is-playing',!audio.paused&&!audio.ended);['play','pause','ended'].forEach(event=>audio.addEventListener(event,sync));sync();}
})();
