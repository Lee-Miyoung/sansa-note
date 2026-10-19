/* Independent, per-user progress. Never writes to existing pilgrimage/card/diary paths. */
(()=>{
 const ID=window.SansaAtlasEpisode?.id||'haeinsa-001',VERSION=1;
 if(!['haeinsa-001','bulguksa-002'].includes(ID))throw Error('Unknown episode');
 const TEMPLE=ID==='bulguksa-002'?'불국사':'해인사';
 const blank=()=>({version:VERSION,position:{scene:0,at:0},completed:{},answers:{},cards:{},note:{text:'',at:0},lastReadAt:0,fieldVerification:null});
 const safeNum=(v,max=Date.now()+86400000)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Number(v))):0;
 function normalize(raw){const s=blank(),r=raw&&typeof raw==='object'?raw:{};
  s.position={scene:Math.floor(safeNum(r.position?.scene,11)),at:safeNum(r.position?.at)};
  for(let i=1;i<=12;i++)if(safeNum(r.completed?.[i]))s.completed[i]=safeNum(r.completed[i]);
  for(let i=1;i<=3;i++){const id=String(i).padStart(3,'0');if(safeNum(r.cards?.[id])&&[0,1,2,3].every(n=>s.completed[(i-1)*4+n+1]))s.cards[id]=safeNum(r.cards[id]);}
  for(let i=1;i<=6;i++){const a=r.answers?.['q'+i];if(a&&Array.isArray(a.selection))s.answers['q'+i]={selection:a.selection.slice(0,6).map(v=>Math.floor(safeNum(v,5))),correct:a.correct===true,at:safeNum(a.at),attempts:Math.floor(safeNum(a.attempts,10000))};}
  s.note={text:typeof r.note?.text==='string'?r.note.text.slice(0,10000):'',at:safeNum(r.note?.at)};s.lastReadAt=safeNum(r.lastReadAt);
  if(r.fieldVerification&&typeof r.fieldVerification.visitId==='string')s.fieldVerification={templeId:String(r.fieldVerification.templeId||'').slice(0,120),visitId:r.fieldVerification.visitId.slice(0,120),at:safeNum(r.fieldVerification.at)};
  return s;
 }
 function merge(a,b){a=normalize(a);b=normalize(b);const r=blank();r.completed={...a.completed,...b.completed};
  for(const k of Object.keys(a.completed))if(b.completed[k])r.completed[k]=Math.min(a.completed[k],b.completed[k]);
  r.cards={...a.cards,...b.cards};for(const k of Object.keys(a.cards))if(b.cards[k])r.cards[k]=Math.min(a.cards[k],b.cards[k]);
  r.position=a.position.at>b.position.at?a.position:b.position;r.note=a.note.at>b.note.at?a.note:b.note;r.lastReadAt=Math.max(a.lastReadAt,b.lastReadAt);r.fieldVerification=a.fieldVerification||b.fieldVerification;
  for(let i=1;i<=6;i++){const k='q'+i,x=a.answers[k],y=b.answers[k];r.answers[k]=!x?y:!y?x:x.at>y.at?x:y;if(!r.answers[k])delete r.answers[k];}
  return normalize(r);
 }
 function owner(){return typeof currentUid!=='undefined'&&currentUid&&typeof auth!=='undefined'&&auth?.currentUser?.uid===currentUid&&!localMode?currentUid:'guest';}
 let visitRef=null,visitHandler=null,confirmedVisit=null;
 let uid=null,state=blank(),ref=null,handler=null,status='local',pending={},timer=0,generation=0;
 const listeners=new Set();function emit(){listeners.forEach(fn=>fn(state,status));}
 function key(){return 'sansaSecretAtlas_v1:'+uid+':'+ID;}
 function persist(){try{localStorage.setItem(key(),JSON.stringify(state));}catch(_){status='local-error';}}
 function getPending(){try{return JSON.parse(localStorage.getItem(key()+':pending')||'{}')}catch(_){return {};}}
 function persistPending(){try{localStorage.setItem(key()+':pending',JSON.stringify(pending));}catch(_){}}
 async function flush(){clearTimeout(timer);const currentRef=ref,gen=generation;if(!currentRef||!Object.keys(pending).length)return;
  if(flush.busy===gen)return;flush.busy=gen;const batch={...pending};status='saving';emit();try{const regular=Object.fromEntries(Object.entries(batch).filter(([k])=>!k.startsWith('cards/')));
   if(Object.keys(regular).length)await currentRef.update(regular);
   for(const [path,value]of Object.entries(batch).filter(([k])=>k.startsWith('cards/')))await currentRef.child(path).transaction(old=>old||value);
   if(gen!==generation)return;for(const k of Object.keys(batch))if(JSON.stringify(pending[k])===JSON.stringify(batch[k]))delete pending[k];persistPending();status=Object.keys(pending).length?'saving':'cloud';}
  catch(e){if(gen!==generation)return;status=e?.code==='PERMISSION_DENIED'?'permission-denied':'offline';}finally{if(flush.busy===gen)flush.busy=null;}emit();if(gen===generation&&status==='saving'&&Object.keys(pending).length){clearTimeout(timer);timer=setTimeout(flush,400);}
 }
 function write(patch){Object.assign(pending,patch);persist();persistPending();emit();if(ref){clearTimeout(timer);timer=setTimeout(flush,400);}}
 function connect(){const next=owner();if(next===uid)return;generation++;clearTimeout(timer);if(ref&&handler)ref.off('value',handler);if(visitRef&&visitHandler)visitRef.off('value',visitHandler);visitRef=null;visitHandler=null;confirmedVisit=null;uid=next;ref=null;handler=null;
  try{state=normalize(JSON.parse(localStorage.getItem(key())||'null'));}catch(_){state=blank();}pending=getPending();status=uid==='guest'?'guest':'loading';emit();
  if(uid==='guest'||typeof db==='undefined'||!db)return;
  ref=db.ref('users/'+uid+'/secretAtlas/'+ID);const gen=generation;
  handler=snap=>{if(gen!==generation)return;const remote=normalize(snap.val());
   if(pending.note&&remote.note.at>pending.note.at)delete pending.note;
   if(pending.position&&remote.position.at>pending.position.at)delete pending.position;
   if(pending.lastReadAt&&remote.lastReadAt>pending.lastReadAt)delete pending.lastReadAt;
   for(const k of Object.keys(pending))if(k.startsWith('answers/')&&remote.answers[k.slice(8)]?.at>pending[k].at)delete pending[k];
   persistPending();state=merge(state,remote);persist();status='cloud';emit();if(Object.keys(pending).length)flush();};
  ref.on('value',handler,e=>{if(gen!==generation)return;status=e?.code==='PERMISSION_DENIED'?'permission-denied':'offline';emit();});
  visitRef=db.ref('users/'+uid+'/destinations');visitHandler=snap=>{if(gen!==generation)return;confirmedVisit=null;for(const [templeId,d]of Object.entries(snap.val()||{})){if(d?.name!==TEMPLE)continue;for(const [visitId,v]of Object.entries(d.visits||{}))if(v?.verified===true){confirmedVisit={templeId,visitId,at:safeNum(v.ts||v.createdAt)};break;}if(confirmedVisit)break;}syncVisit();emit();};
  visitRef.on('value',visitHandler,()=>{if(gen===generation){confirmedVisit=null;emit();}});
 }
 function touch(scene){connect();const now=Date.now();state.position={scene:Math.max(0,Math.min(11,scene)),at:now};state.lastReadAt=now;write({version:VERSION,position:state.position,lastReadAt:now});}
 function complete(scene){connect();const n=scene+1;if(n<1||n>12)return[];const now=Date.now(),patch={},earned=[];
  if(!state.completed[n]){state.completed[n]=now;patch['completed/'+n]=now;}
  for(let p=1;p<=3;p++){const id=String(p).padStart(3,'0');if([0,1,2,3].every(n=>state.completed[(p-1)*4+n+1])&&!state.cards[id]){state.cards[id]=now;patch['cards/'+id]=now;earned.push(id);}}
  if(Object.keys(patch).length)write(patch);return earned;
 }
 function answer(id,selection,correct){connect();const a={selection:[...selection],correct:!!correct,at:Date.now(),attempts:(state.answers[id]?.attempts||0)+1};state.answers[id]=a;write({['answers/'+id]:a});}
 function note(text){connect();state.note={text:String(text).slice(0,10000),at:Date.now()};write({note:state.note});}
 function verifiedVisit(){connect();return confirmedVisit;}
 function syncVisit(){connect();const v=verifiedVisit();if(v&&JSON.stringify(v)!==JSON.stringify(state.fieldVerification)){state.fieldVerification=v;write({fieldVerification:v});}return v;}
 window.SansaAtlasStore={connect,flush,touch,complete,answer,note,syncVisit,verifiedVisit,normalize,merge,get state(){connect();return state;},get uid(){connect();return uid;},get status(){return status;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
 window.addEventListener('online',()=>{connect();flush();});window.addEventListener('pagehide',()=>{persist();persistPending();flush();});
 // Auth changes are checked even while the panel is closed; never reuse another user's state.
 setInterval(connect,1000);connect();
})();
