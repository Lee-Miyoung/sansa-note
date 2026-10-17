/* One history owner. UI snapshots contain drafts and view state, never database writes. */
(()=>{
  if(window.sansaNavigation)return;
  const native={push:history.pushState.bind(history),replace:history.replaceState.bind(history)};
  const KEY='sansaNavigation_v1',records=new Map();
  let current=null,restoring=false,timer=0,batchUntil=0,depth=0,serial=0,restoreVersion=0;
  const liveNodes=new Map();
  let editorKey=null;const drafts={};try{Object.assign(drafts,JSON.parse(sessionStorage.getItem('sansaVowDrafts_v1')||'{}'));}catch(_){}
  function persistDrafts(){try{sessionStorage.setItem('sansaVowDrafts_v1',JSON.stringify(drafts));}catch(_){}}
  function rememberDraft(){const field=document.querySelector('#vowBody textarea');if(field&&editorKey){drafts[editorKey]=field.value;persistDrafts();}}
  let appReady=!!document.getElementById('app')&&getComputedStyle(document.getElementById('app')).display!=='none',pendingRestore=null;
  function readSaved(){try{for(const r of JSON.parse(sessionStorage.getItem(KEY)||'[]'))records.set(r.id,r);}catch(_){}}
  function persist(){try{sessionStorage.setItem(KEY,JSON.stringify([...records.values()].slice(-30)));}catch(_){}}
  function shown(){return [...document.querySelectorAll('.overlay.show')].map(e=>e.id);}
  function stateBits(){return {
    type:typeof contentType==='undefined'?'temple':contentType,
    catalog:typeof catalogMode==='undefined'?'temple':catalogMode,
    temple:typeof currentDetailId==='undefined'?null:currentDetailId,
    mountain:typeof currentMountainDetailId==='undefined'?null:currentMountainDetailId,
    region:typeof filterRegion==='undefined'?'전체':filterRegion,
    tag:typeof filterTag==='undefined'?'all':filterTag,
    quick:typeof heroQuickFilter==='undefined'?'all':heroQuickFilter,
    pg:typeof pilgrimGameTab==='undefined'?'map':pilgrimGameTab,
    pinned:window.sansaPinnedView?.get()||'temple',
    meditation:typeof MEDITATION_TYPES==='undefined'?null:Object.keys(MEDITATION_TYPES).find(k=>MEDITATION_TYPES[k]===currentMeditation),
    amulet:typeof amuletSelected==='undefined'?null:amuletSelected?.key,
    paper:typeof amuletPaperTone==='undefined'?'warm':amuletPaperTone,
    pattern:typeof amuletPattern==='undefined'?'lattice':amuletPattern
  };}
  function route(){
    const ids=shown(),s=stateBits(),parts=[ids.join(',')||'main'];
    if(ids.includes('catalogOverlay'))parts.push('catalog:'+s.catalog);
    if(ids.includes('beatLabOverlay')&&document.getElementById('beatLeaderboard')?.classList.contains('show'))parts.push('beat-rank');
    if(ids.includes('detailOverlay'))parts.push('temple:'+s.temple);
    if(ids.includes('mDetailOverlay'))parts.push('mountain:'+s.mountain);
    if(ids.includes('worryOverlay')){const b=document.getElementById('worryBody');parts.push(b?.classList.contains('emotion-grid')?'emotions':'emotion-result:'+b?.dataset.emotionKey);}
    if(ids.includes('vowOverlay'))parts.push(document.querySelector('#vowBody textarea')?'vow-editor':'vow-list');
    if(ids.includes('amuletOverlay'))parts.push(document.getElementById('amuletCanvas')?'amulet-preview':'amulet-picker');
    if(ids.includes('pilgrimCollectionOverlay'))parts.push('pg:'+s.pg);
    const guardian=document.getElementById('guardianCardDetail');
    if(guardian)parts.push('guardian:'+(guardian.querySelector('h3')?.textContent||''));
    return parts.join('|');
  }
  function pageY(){const top=parseFloat(document.body.style.top);return document.body.classList.contains('sansa-overlay-locked')&&Number.isFinite(top)?-top:scrollY;}
  function snapshot(id,index){
    const ids=shown(),fields={},scrolls={},panels={};rememberDraft();
    document.querySelectorAll('input[id]:not([type=file]):not([type=password]),textarea[id],select[id]').forEach(e=>{if(e.matches('[type=range],#meditationSound,#meditationBellEnabled'))return;fields[e.id]={value:e.value,checked:e.checked};});
    document.querySelectorAll('.overlay.show .modal,.overlay.show .modal-body,.overlay.show [id]').forEach(e=>{
      if(e.id||e.matches('.modal,.modal-body')){const selector=e.id?'#'+e.id:'#'+e.closest('.overlay').id+(e.matches('.modal')?' .modal':' .modal-body');if(e.scrollHeight>e.clientHeight+1)scrolls[selector]=[e.scrollTop,e.scrollLeft];}
    });
    for(const name of ['worryBody','vowBody']){const e=document.getElementById(name);if(e&&ids.includes(e.closest('.overlay')?.id))panels[name]={html:e.innerHTML,className:e.className,emotion:e.dataset.emotionKey||''};}
    const guardian=document.getElementById('guardianCardDetail');if(guardian)liveNodes.set(id,guardian);
    return {id,index,key:route(),ids,fields,scrolls,panels,bits:stateBits(),y:pageY(),gameRank:!!document.getElementById('beatLeaderboard')?.classList.contains('show'),guardian:!!guardian,guardianIndex:guardian?Number((guardian.querySelector('.guardian-detail-kicker,small')?.textContent||'').match(/\d{3}/)?.[0]||'1')-1:null,bodyClasses:[...document.body.classList].filter(c=>/catalog|community/.test(c)),editorKey,at:Date.now()};
  }
  function attach(r,push){records.set(r.id,r);current=r;const st={...(history.state||{}),sansaNavigation:{v:1,id:r.id,index:r.index}};try{(push?native.push:native.replace)(st,'',location.href);}catch(_){}persist();}
  function checkpoint(){if(restoring||!current)return;if(route()!==current.key){if(performance.now()<batchUntil){schedule();return;}flush();}attach(snapshot(current.id,current.index),false);}
  function flush(){
    clearTimeout(timer);timer=0;if(restoring||depth)return;
    if(!current)return;
    const key=route();
    if(key!==current.key){const r=snapshot(Date.now().toString(36)+'-'+(++serial),current.index+1);attach(r,true);}
  }
  function schedule(){if(timer)return;timer=setTimeout(()=>{timer=0;flush();},Math.max(35,batchUntil-performance.now()+15));}
  function beforeAction(){if(restoring||depth||performance.now()<batchUntil)return;flush();checkpoint();}
  function wrapActions(){
    const extra=['pickWorryTemple','renderVowList','renderVowWrite','renderVowEdit','pickAmuletCategory','setPilgrimGameTab','setCatalogMode','goSiteNav','saveVow','updateVow','renderAmuletCategoryPicker'];
    for(const name of Object.keys(window).filter(n=>/^open[A-Z]/.test(n)).concat(extra)){
      const fn=window[name];if(typeof fn!=='function'||fn.__sansaNavigationWrapped||String(fn).includes('[native code]'))continue;
      const wrapped=function(...args){beforeAction();depth++;try{
        const result=fn.apply(this,args);
        if(name==='renderVowWrite'||name==='renderVowEdit'){
          editorKey=(typeof currentUid==='undefined'||!currentUid?'guest':currentUid)+':'+(name==='renderVowWrite'?'new':'edit:'+args[0]);
          const field=document.querySelector('#vowBody textarea');if(field&&typeof drafts[editorKey]==='string')field.value=drafts[editorKey];
        }
        if((name==='saveVow'||name==='updateVow')&&!document.querySelector('#vowBody textarea')&&editorKey){delete drafts[editorKey];persistDrafts();}
        return result;
      }finally{depth--;if(!depth&&(name!=='goSiteNav'||args[0]==='home'||shown().length))flush();schedule();}};
      wrapped.__sansaNavigationWrapped=true;window[name]=wrapped;
    }
  }
  function restoreBits(s){
    if(typeof contentType!=='undefined')contentType=s.type;
    if(typeof catalogMode!=='undefined')catalogMode=s.catalog;
    if(typeof currentDetailId!=='undefined')currentDetailId=s.temple;
    if(typeof currentMountainDetailId!=='undefined')currentMountainDetailId=s.mountain;
    if(typeof filterRegion!=='undefined')filterRegion=s.region;
    if(typeof filterTag!=='undefined')filterTag=s.tag;
    if(typeof heroQuickFilter!=='undefined')heroQuickFilter=s.quick;
    if(typeof amuletPaperTone!=='undefined')amuletPaperTone=s.paper||'warm';
    if(typeof amuletPattern!=='undefined')amuletPattern=s.pattern||'lattice';
  }
  function cleanupLeaving(target){
    const closers={beatLabOverlay:'closeBeatLab',breathOverlay:'closeBreathOverlay',mantraOverlay:'closeMantraOverlay',rouletteOverlay:'closeRouletteOverlay'};
    for(const [id,fn]of Object.entries(closers))if(!target.ids.includes(id)&&document.getElementById(id)?.classList.contains('show'))window[fn]?.();
    if(!target.guardian)document.getElementById('guardianCardDetail')?.remove();
  }
  function applyFields(r){for(const [id,f]of Object.entries(r.fields)){const e=document.getElementById(id);if(e&&e.type!=='file'){e.value=f.value;if(typeof f.checked==='boolean')e.checked=f.checked;}}}
  function applyScroll(r){
    for(const [sel,[y,x]]of Object.entries(r.scrolls)){const e=document.querySelector(sel);if(e){e.scrollTop=y;e.scrollLeft=x;}}
    if(!r.ids.length){document.body.style.position='';document.body.style.top='';document.body.style.overflow='';document.documentElement.style.overflow='';document.body.classList.remove('sansa-overlay-locked','pack-modal-open','sansa-modal-open');window.scrollTo({top:r.y,left:0,behavior:'instant'});}
  }
  async function restore(r){
    if(!r)return;const version=++restoreVersion;restoring=true;clearTimeout(timer);
    try{
      const previousBits=stateBits();cleanupLeaving(r);restoreBits(r.bits);
      if(!r.ids.length&&['type','region','tag','quick'].some(k=>previousBits[k]!==r.bits[k]))window.render?.();
      if(!r.ids.length&&r.bits.pinned)window.sansaPinnedView?.set(r.bits.pinned);
      for(const id of shown())if(!r.ids.includes(id)){const e=document.getElementById(id);e.classList.remove('show');e.setAttribute('aria-hidden','true');e.style.removeProperty('display');}
      const catalog=document.getElementById('catalogOverlay'),app=document.getElementById('app');
      const hasCatalog=r.ids.includes('catalogOverlay');
      document.body.classList.toggle('catalog-screen-open',hasCatalog);
      document.body.classList.toggle('sansa-catalog-active',hasCatalog);
      if(app)hasCatalog?app.style.setProperty('display','none','important'):app.style.setProperty('display','block');
      if(catalog){catalog.style.removeProperty('display');if(hasCatalog)catalog.style.setProperty('display','flex','important');}
      applyFields(r);
      if(hasCatalog){window.syncCatalogModeTabs?.();window.renderCatalogOverlay?.();}
      if(r.ids.includes('breathOverlay')&&r.bits.meditation)window.openBreathOverlay?.(r.bits.meditation);
      if(r.ids.includes('amuletOverlay')){if(r.key.includes('amulet-preview')&&r.bits.amulet)window.pickAmuletCategory?.(r.bits.amulet);else window.renderAmuletCategoryPicker?.();}
      if(r.ids.includes('detailOverlay')&&r.bits.temple)window.openDetail?.(r.bits.temple,{skipHistory:true});
      if(r.ids.includes('mDetailOverlay')&&r.bits.mountain)window.openMountainDetail?.(r.bits.mountain,{skipHistory:true});
      if(r.ids.includes('pilgrimCollectionOverlay')&&typeof pilgrimGameTab!=='undefined'){
        pilgrimGameTab=r.bits.pg;window.setPilgrimGameTab?.(r.bits.pg,document.querySelector('[data-pg-tab="'+r.bits.pg+'"]'));
      }
      for(const [id,p]of Object.entries(r.panels)){const e=document.getElementById(id);if(e){if(id==='vowBody'&&!p.html.includes('<textarea'))window.renderVowList?.();else if(e.innerHTML!==p.html)e.innerHTML=p.html;e.className=p.className;e.dataset.emotionKey=p.emotion;}}
      for(const id of r.ids){const e=document.getElementById(id);if(e){e.classList.add('show');e.setAttribute('aria-hidden','false');}}
      if(r.guardian){const node=liveNodes.get(r.id);if(node&&!node.isConnected)document.body.appendChild(node);else if(!node)window.openLotusGuardianCard?.(r.guardianIndex);}
      if(r.ids.includes('beatLabOverlay')){window.openBeatLab?.();window.sansaFitGame?.();if(r.gameRank)document.getElementById('beatLeaderboard')?.classList.add('show');else window.closeBeatLeaderboard?.();}
      applyFields(r);if(r.ids.includes('amuletOverlay')&&document.getElementById('amuletCanvas'))window.renderAmuletPreview?.();editorKey=r.editorKey||null;current=r;
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(version!==restoreVersion)return;
      applyScroll(r);setTimeout(()=>{if(current?.id===r.id)applyScroll(r);},100);
    }finally{setTimeout(()=>{if(version===restoreVersion){restoring=false;schedule();}},150);}
  }
  function canBack(){return !!current&&current.index>0;}
  function back(){flush();checkpoint();if(canBack()){history.back();return true;}return false;}
  document.addEventListener('click',event=>{
    if(restoring)return;
    batchUntil=0;beforeAction();batchUntil=performance.now()+110;
    const close=event.target.closest('.close-x,.guardian-detail-close,.guardian-detail-ok,#guardianCardDetail .close-detail,[data-sansa-back]')||(event.target.id==='guardianCardDetail')||(event.target.matches('.overlay.show[onclick]'));
    const inlineBack=event.target.closest('a[onclick],button[onclick]');
    if((close||(inlineBack&&(/^\s*[←‹]/.test(inlineBack.textContent)||/^\s*close[A-Za-z]+\(\);?\s*$/.test(inlineBack.getAttribute('onclick')||''))))&&canBack()){
      event.preventDefault();event.stopImmediatePropagation();back();return;
    }
    const link=event.target.closest('a[href]');
    if(link&&new URL(link.href,location.href).origin===location.origin){checkpoint();persist();}
    schedule();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&shown().length&&canBack()){e.preventDefault();e.stopImmediatePropagation();back();}},true);
  let draftTimer;
  document.addEventListener('input',()=>{clearTimeout(draftTimer);draftTimer=setTimeout(checkpoint,120);},true);
  document.addEventListener('change',()=>{clearTimeout(draftTimer);draftTimer=setTimeout(checkpoint,30);},true);
  let scrollTimer;
  document.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(!restoring&&current&&route()===current.key){current.y=pageY();const fresh=snapshot(current.id,current.index);current.scrolls=fresh.scrolls;current.fields=fresh.fields;records.set(current.id,current);persist();}},100);},true);
  window.addEventListener('pagehide',()=>{flush();checkpoint();});
  window.addEventListener('popstate',event=>{
    clearTimeout(timer);const mark=event.state?.sansaNavigation;if(!mark)return;
    const r=records.get(mark.id);if(r)restore(r);
  });
  readSaved();const existing=history.state?.sansaNavigation,saved=existing&&records.get(existing.id);
  if(saved){current=saved;pendingRestore=saved;restoring=true;if(appReady){pendingRestore=null;setTimeout(()=>restore(saved),0);}}
  else attach(snapshot(Date.now().toString(36)+'-initial',0),false);
  new MutationObserver(changes=>{if(restoring)return;const relevant=changes.some(change=>{const e=change.target.nodeType===1?change.target:change.target.parentElement;return !e?.closest('#beatLabOverlay')||e.id==='beatLabOverlay'||e.id==='beatLeaderboard';});if(relevant)schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  const launch=window.launchApp;if(typeof launch==='function'){window.launchApp=function(...args){const result=launch.apply(this,args);appReady=true;if(pendingRestore){const r=pendingRestore;pendingRestore=null;restore(r);}else checkpoint();return result;};}
  wrapActions();window.addEventListener('DOMContentLoaded',wrapActions,{once:true});
  window.addEventListener('pageshow',event=>{const r=records.get(history.state?.sansaNavigation?.id);if(r&&event.persisted){if(appReady)restore(r);else pendingRestore=r;}});
  window.sansaNavigation={back,checkpoint,flush,get current(){return current;},get size(){return records.size;}};
})();
