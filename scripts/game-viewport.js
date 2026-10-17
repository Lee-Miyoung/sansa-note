/* Game-only viewport fitting; restore the original meta and normal page gestures on exit. */
(()=>{
  const overlay=document.getElementById('beatLabOverlay');if(!overlay)return;
  const rank=document.createElement('button');rank.type='button';rank.className='game-rank-access';rank.textContent='🏆';rank.setAttribute('aria-label','게임 순위 보기');rank.addEventListener('click',()=>window.openBeatLeaderboard?.());overlay.querySelector('.modal-head')?.appendChild(rank);
  const meta=document.querySelector('meta[name=viewport]');let originalMeta=null,frame=0;
  function fit(){
    if(!overlay.classList.contains('show'))return;
    const vv=window.visualViewport,h=Math.floor(vv?.height||innerHeight),w=Math.floor(vv?.width||innerWidth);
    overlay.style.setProperty('--beat-fixed-vh',h+'px');overlay.style.setProperty('--beat-visible-width',w+'px');
    overlay.style.setProperty('--beat-visible-top',(vv?.offsetTop||0)+'px');overlay.style.setProperty('--beat-visible-left',(vv?.offsetLeft||0)+'px');
    overlay.dataset.gameSize=h<440?'tiny':h<620?'short':'regular';
    requestAnimationFrame(()=>{if(overlay.classList.contains('show')){window.lockBeatDefenseLine?.();window.ensureBeatFxCanvas?.();}});
  }
  function requestFit(){cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);}
  function sync(){
    if(overlay.classList.contains('show')){
      if(originalMeta===null&&meta){originalMeta=meta.getAttribute('content')||'';meta.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');}
      requestFit();
    }else if(originalMeta!==null){if(meta)meta.setAttribute('content',originalMeta);originalMeta=null;}
  }
  new MutationObserver(sync).observe(overlay,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',requestFit,{passive:true});window.addEventListener('orientationchange',requestFit,{passive:true});
  window.visualViewport?.addEventListener('resize',requestFit,{passive:true});window.visualViewport?.addEventListener('scroll',requestFit,{passive:true});
  window.sansaFitGame=fit;sync();
})();
