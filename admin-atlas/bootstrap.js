/* Public shell only. Draft source is fetched from the authenticated admin's private node. */
let currentUid=null,auth=null,db=null,localMode=false;
(async()=>{
 'use strict';
 const ADMIN='song4mi12@gmail.com',PROJECT='travel-diary-c0676',BUNDLE_SHA='b8e5d454e61dd5aee8cff8392f229145d52d226ea580de32a889f0bf213ddd51';
 const $=id=>document.getElementById(id);let raw,epoch=0,loaded=false;
 const status=text=>{$('status').textContent=text;};
 window.showToast=text=>{let node=document.getElementById('toast');if(!node){node=document.createElement('p');node.id='toast';node.setAttribute('role','status');document.body.append(node);}node.textContent=text;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>node.remove(),5000);};
 const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
 function admin(user,claims){return user&&user.emailVerified===true&&user.email===ADMIN&&claims.email===ADMIN&&claims.email_verified===true&&claims.aud===PROJECT&&claims.iss==='https://securetoken.google.com/'+PROJECT&&claims.firebase?.sign_in_provider==='google.com';}
 function base(){if(!currentUid||auth.currentUser?.uid!==currentUid)throw Error('Authentication required');return 'users/'+currentUid+'/adminTests/haeinsa-001';}
 function guard(rawdb){return {ref(original){const uid=currentUid,prefix='users/'+uid,episode=prefix+'/secretAtlas/haeinsa-001';let path,writable;
  if(original===episode||original.startsWith(episode+'/')){path=base()+'/progress'+original.slice(episode.length);writable=true;}
  else if(original===prefix+'/destinations'){path=original;writable=false;}else throw Error('Path not allowed');
  const target=rawdb.ref(path),callbacks=new Map();const check=()=>{if(currentUid!==uid||auth.currentUser?.uid!==uid)throw Error('Account changed');};
  return {on(event,fn,err){check();const cb=s=>{if(currentUid===uid)fn(s);};callbacks.set(fn,cb);return target.on(event,cb,err);},off(event,fn){target.off(event,callbacks.get(fn)||fn);callbacks.delete(fn);},child(key){if(!/^[A-Za-z0-9_/-]+$/.test(key)||key.includes('//'))throw Error('Invalid child');return db.ref(original+'/'+key);},async update(patch){check();if(!writable)throw Error('Read-only reference');for(const k of Object.keys(patch))if(!/^[A-Za-z0-9_/-]+$/.test(k)||k.includes('//'))throw Error('Invalid patch');return target.update(patch);},async transaction(fn){check();if(!writable)throw Error('Read-only reference');return target.transaction(old=>currentUid===uid?fn(old):undefined);}};
 }};}
 async function script(source){const blob=new Blob([source],{type:'application/javascript'}),url=URL.createObjectURL(blob);try{await new Promise((ok,bad)=>{const tag=document.createElement('script');tag.src=url;tag.onload=()=>{tag.remove();ok();};tag.onerror=bad;document.head.append(tag);});}finally{URL.revokeObjectURL(url);}}
 async function activate(text,gen){
  if(await hash(text)!==BUNDLE_SHA)throw Error('검토자료가 일치하지 않습니다');
  const bundle=JSON.parse(text);if(bundle.version!==1||bundle.episode!=='haeinsa-001')throw Error();
  if(gen!==epoch||!currentUid)return;
  if(loaded)return;window.__SANSA_ADMIN_ATLAS_AUTHORIZED__=true;db=guard(raw);
  for(const key of ['content','store','renderer']){if(gen!==epoch||!currentUid)throw Error();await script(bundle[key]);}
  if(gen!==epoch||!currentUid){location.reload();return;}loaded=true;
  let step=0;const capture=()=>({atlas:true,step,route:window.sansaSecretAtlas.capture()});
  window.sansaNavigation={checkpoint(){history.replaceState(capture(),'');step++;history.pushState(null,'');},flush(){history.replaceState(capture(),'');},back(){if(step>0){history.back();return true;}return false;}};
  window.addEventListener('popstate',event=>{if(event.state?.atlas){step=event.state.step;window.sansaSecretAtlas.restore(event.state.route);}else window.sansaSecretAtlas.suspend();});
  $('open').hidden=false;$('verify').hidden=false;$('upload').hidden=true;status('관리자 인증 완료 · 별도 테스트 기록만 저장합니다.');
 }
 async function serverCheck(){
  const uid=currentUid,ref=base()+'/progress';await window.SansaAtlasStore.flush();
  const token=await auth.currentUser.getIdToken();const response=await fetch('https://travel-diary-c0676-default-rtdb.asia-southeast1.firebasedatabase.app/'+ref+'.json?auth='+encodeURIComponent(token),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok||uid!==currentUid)throw Error();const record=await response.json();
  const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((a,k)=>(a[k]=x[k],a),{}):x);
  if(stable(window.SansaAtlasStore.normalize(record))!==stable(window.SansaAtlasStore.state))throw Error();
  $('saved').textContent='서버 기록 일치 확인 · '+new Date().toLocaleString();
 }
 try{
  // The existing root worker caches GET responses. Require the narrower network-only
  // worker before any authentication or private database request is made.
  if(!('serviceWorker' in navigator))throw Error('Service worker isolation required');
  const expected=new URL('sw.js',location.href).href;
  if(navigator.serviceWorker.controller?.scriptURL!==expected){
   const registration=await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
   const worker=registration.installing||registration.waiting||registration.active;if(!worker)throw Error();
   if(worker.state!=='activated')await new Promise((ok,bad)=>{const timer=setTimeout(()=>bad(Error()),15000);worker.addEventListener('statechange',()=>{if(worker.state==='activated'){clearTimeout(timer);ok();}if(worker.state==='redundant'){clearTimeout(timer);bad(Error());}});});
   location.reload();return;
  }
  // Read only the existing public Web config, without executing the production app.
  const response=await fetch('/index.html',{cache:'no-store'});if(!response.ok)throw Error();const html=await response.text(),match=html.match(/const\s+FIREBASE_CONFIG\s*=\s*(\{[\s\S]*?\});/);if(!match)throw Error();
  const config={};for(const key of ['apiKey','authDomain','databaseURL','projectId','messagingSenderId','appId']){const item=match[1].match(new RegExp(key+':\\s*["\u0027]([^"\u0027]+)["\u0027]'));if(!item)throw Error();config[key]=item[1];}
  if(config.projectId!==PROJECT||config.databaseURL!=='https://travel-diary-c0676-default-rtdb.asia-southeast1.firebasedatabase.app')throw Error();
  const app=firebase.initializeApp(config,'sansa-admin-atlas-test');auth=app.auth();raw=app.database();await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  $('login').disabled=false;status('관리자 Google 계정으로 로그인하세요. 원고는 인증 전 내려받지 않습니다.');
  auth.onAuthStateChanged(async user=>{const gen=++epoch;currentUid=null;$('authorized').hidden=true;$('logout').hidden=!user;
   if(loaded){window.__SANSA_ADMIN_ATLAS_AUTHORIZED__=false;window.SansaAtlasStore.connect();location.reload();return;}
   if(!user)return;
   try{const token=await user.getIdTokenResult(true);if(gen!==epoch)return;if(!admin(user,token.claims)){status('관리자 Google 계정만 사용할 수 있습니다. 검토자료에는 접근하지 않았습니다.');return;}
    currentUid=user.uid;$('authorized').hidden=false;status('관리자 인증 완료 · 비공개 검토자료 확인 중…');
    const snap=await raw.ref(base()+'/draft').get();if(gen!==epoch)return;
    if(snap.exists())await activate(snap.val(),gen);else{$('upload').hidden=false;status('최초 검토자료를 선택해 주세요. 기존 사용자 기록에는 쓰지 않습니다.');}
   }catch(_){status('인증 또는 비공개 자료 읽기에 실패했습니다. 로그인 상태·연결·기존 권한을 확인하세요.');}
  });
  $('login').onclick=async()=>{try{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await auth.signInWithPopup(p);}catch(e){if(e.code==='auth/popup-blocked')await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());else status('Google 로그인에 실패했습니다. 다시 시도해 주세요.');}};
  await auth.getRedirectResult();
  $('file').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100000)throw Error();const text=await file.text();if(await hash(text)!==BUNDLE_SHA)throw Error();const gen=epoch;await raw.ref(base()).update({draft:text});await activate(text,gen);}catch(_){status('제공된 검토자료와 일치하지 않거나 저장에 실패했습니다. 기존 기록은 변경하지 않았습니다.');}};
  $('open').onclick=()=>window.openSecretAtlas();
  $('verify').onclick=()=>serverCheck().catch(()=>{$('saved').textContent='서버 기록 일치를 확인하지 못했습니다. 잠시 후 다시 확인하세요.';});
  $('logout').onclick=async()=>{if(loaded){try{await serverCheck();}catch(_){status('서버 확인 실패로 로그아웃을 보류했습니다. 연결을 확인해 주세요.');return;}}await auth.signOut();location.reload();};
 }catch(_){status('인증 환경을 준비하지 못했습니다. 네트워크와 기존 Firebase 설정을 확인하세요.');}
})();
