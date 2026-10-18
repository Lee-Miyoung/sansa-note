/* Public shell only. Draft source is fetched from the authenticated admin's private node. */
let currentUid=null,auth=null,db=null,localMode=false;
(async()=>{
 'use strict';
 const ADMIN='song4mi12@gmail.com',PROJECT='travel-diary-c0676',BUNDLE_SHA='1fcc6cc2f77fa5c3de6e57d6af1ab431a6b728bd0d5798a72c85353195f36d75',LEGACY_SHA='b8e5d454e61dd5aee8cff8392f229145d52d226ea580de32a889f0bf213ddd51';
 const $=id=>document.getElementById(id);let raw,epoch=0,loaded=false;
 const status=text=>{$('status').textContent=text;};
 const SETUP_SESSION='sansaAdminAtlasSetup_v1';
 // URL fragments are not sent to the web server. Remove the one-time key from
 // history immediately, retaining it only for this tab's auth/worker reload.
 try{const fragment=new URLSearchParams(location.hash.slice(1)),key=fragment.get('setup');
  if(key){history.replaceState(null,'',location.pathname+location.search);if(/^[A-Za-z0-9_-]{43}$/.test(key))sessionStorage.setItem(SETUP_SESSION,key);}
 }catch(_){status('Safari의 일반 탭에서 최초 등록 링크를 다시 열어 주세요.');return;}
 async function registerReview(gen){
  const encoded=sessionStorage.getItem(SETUP_SESSION);
  if(!encoded){$('setupHelp').hidden=false;status('이 계정에 등록된 검토자료가 없습니다. 기존 관리자 계정인지 확인해 주세요. 파일 선택은 필요 없습니다.');return null;}
  if(!/^[A-Za-z0-9_-]{43}$/.test(encoded))throw Error();
  const response=await fetch('review.enc',{cache:'no-store'});if(!response.ok)throw Error();
  const envelope=new Uint8Array(await response.arrayBuffer());if(envelope.length<29||envelope.length>100000)throw Error();
  const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')+'='),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['decrypt']);
  const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:envelope.slice(0,12),additionalData:new TextEncoder().encode('sansa-admin-atlas:haeinsa-001:v1')},key,envelope.slice(12));
  const text=new TextDecoder('utf-8',{fatal:true}).decode(decrypted);
  if(await hash(text)!==BUNDLE_SHA||gen!==epoch||!currentUid)throw Error();
  // Initialize only this test draft. Never replace a previously registered draft.
  const result=await raw.ref(base()+'/draft').transaction(old=>gen===epoch&&currentUid?(old===null?text:old):undefined);
  if(!result.committed||gen!==epoch)throw Error();sessionStorage.removeItem(SETUP_SESSION);
  return result.snapshot.val();
 }

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
 let transportPromise=null;
 function privateTransport(){
  if(transportPromise)return transportPromise;
  transportPromise=(async()=>{
   if(!('serviceWorker' in navigator))throw Error('private-transport');
   const expected=new URL('sw.js',location.href).href;
   if(navigator.serviceWorker.controller?.scriptURL===expected)return;
   await navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'});
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',check);reject(Error('private-transport'));},15000);
    function check(){if(navigator.serviceWorker.controller?.scriptURL===expected){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);resolve();}}
    navigator.serviceWorker.addEventListener('controllerchange',check);check();
   });
  })().catch(error=>{transportPromise=null;throw error;});return transportPromise;
 }
 async function persistence(){
  for(const mode of ['LOCAL','SESSION','NONE'])try{await auth.setPersistence(firebase.auth.Auth.Persistence[mode]);return;}catch(_){}
  throw Error('persistence');
 }
 async function script(source){const blob=new Blob([source],{type:'application/javascript'}),url=URL.createObjectURL(blob);try{await new Promise((ok,bad)=>{const tag=document.createElement('script');tag.src=url;tag.onload=()=>{tag.remove();ok();};tag.onerror=bad;document.head.append(tag);});}finally{URL.revokeObjectURL(url);}}
 async function activate(text,gen){
  if(![BUNDLE_SHA,LEGACY_SHA].includes(await hash(text)))throw Error('검토자료가 일치하지 않습니다');
  const bundle=JSON.parse(text);bundle.renderer=SansaAtlasReviewRuntime.withoutMap(bundle.renderer);if(bundle.version!==1||bundle.episode!=='haeinsa-001')throw Error();
  if(gen!==epoch||!currentUid)return;
  if(loaded)return;window.__SANSA_ADMIN_ATLAS_AUTHORIZED__=true;db=guard(raw);
  for(const key of ['content','store','renderer']){if(gen!==epoch||!currentUid)throw Error();await script(bundle[key]);if(key==='content')window.SansaAtlasContent=SansaAtlasReviewRuntime.friendlyContent(window.SansaAtlasContent);}
  SansaAtlasReviewRuntime.centerControls(document);
  if(gen!==epoch||!currentUid){location.reload();return;}loaded=true;
  let step=0;const capture=()=>({atlas:true,step,route:window.sansaSecretAtlas.capture()});
  window.sansaNavigation={checkpoint(){history.replaceState(capture(),'');step++;history.pushState(null,'');},flush(){history.replaceState(capture(),'');},back(){if(step>0){history.back();return true;}return false;}};
  window.addEventListener('popstate',event=>{if(event.state?.atlas){step=event.state.step;window.sansaSecretAtlas.restore(event.state.route);}else window.sansaSecretAtlas.suspend();});
  $('open').hidden=false;$('verify').hidden=false;$('setupHelp').hidden=true;sessionStorage.removeItem(SETUP_SESSION);status('관리자 인증 완료 · 별도 테스트 기록만 저장합니다.');window.openSecretAtlas();
 }
 async function serverCheck(){
  const uid=currentUid,ref=base()+'/progress';await window.SansaAtlasStore.flush();
  const token=await auth.currentUser.getIdToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let record;try{const response=await fetch('https://travel-diary-c0676-default-rtdb.asia-southeast1.firebasedatabase.app/'+ref+'.json?auth='+encodeURIComponent(token),{cache:'no-store',redirect:'error',signal:controller.signal});if(!response.ok||uid!==currentUid)throw Error();record=await response.json();}finally{clearTimeout(timer);}
  const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((a,k)=>(a[k]=x[k],a),{}):x);
  if(stable(window.SansaAtlasStore.normalize(record))!==stable(window.SansaAtlasStore.state))throw Error();
  $('saved').textContent='서버 기록 일치 확인 · '+new Date().toLocaleString();
 }
 try{
  // Read only the existing public Web config, without executing the production app.
  const response=await fetch('/index.html',{cache:'no-store'});if(!response.ok)throw Error();const html=await response.text(),match=html.match(/const\s+FIREBASE_CONFIG\s*=\s*(\{[\s\S]*?\});/);if(!match)throw Error();
  const config={};for(const key of ['apiKey','authDomain','databaseURL','projectId','messagingSenderId','appId']){const item=match[1].match(new RegExp(key+':\\s*["\u0027]([^"\u0027]+)["\u0027]'));if(!item)throw Error();config[key]=item[1];}
  if(config.projectId!==PROJECT||config.databaseURL!=='https://travel-diary-c0676-default-rtdb.asia-southeast1.firebasedatabase.app')throw Error();
  const app=firebase.initializeApp(config,'sansa-admin-atlas-test');auth=app.auth();raw=app.database();
  // Privacy isolation gates private data, not the Google login button.
  privateTransport().catch(()=>{});await persistence();
  $('login').disabled=false;status('관리자 Google 계정으로 로그인하세요. 원고는 인증 전 내려받지 않습니다.');
  async function onUser(user){const gen=++epoch;currentUid=null;$('authorized').hidden=true;$('logout').hidden=!user;
   if(loaded){window.__SANSA_ADMIN_ATLAS_AUTHORIZED__=false;window.SansaAtlasStore.connect();location.reload();return;}
   if(!user)return;
   try{const token=await user.getIdTokenResult(true);if(gen!==epoch)return;if(!admin(user,token.claims)){sessionStorage.removeItem(SETUP_SESSION);status('관리자 Google 계정만 사용할 수 있습니다. 검토자료에는 접근하지 않았습니다.');return;}
    currentUid=user.uid;status('관리자 인증 완료 · 비공개 연결 확인 중…');await privateTransport();if(gen!==epoch)return;$('authorized').hidden=false;$('retry').hidden=true;
    const snap=await raw.ref(base()+'/draft').get();if(gen!==epoch)return;
    const text=snap.exists()?snap.val():await registerReview(gen);if(text)await activate(text,gen);
   }catch(_){$('retry').hidden=false;status('로그인은 유지됩니다. 비공개 자료 연결을 확인하지 못했습니다. Safari 일반 탭에서 다시 확인을 눌러 주세요. 기존 기록은 변경하지 않았습니다.');}
  }
  auth.onAuthStateChanged(onUser);
  $('retry').onclick=()=>auth.currentUser?onUser(auth.currentUser):location.reload();
  $('login').onclick=async()=>{try{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await auth.signInWithPopup(p);}catch(e){if(e.code==='auth/popup-blocked')await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());else status('Google 로그인에 실패했습니다. 다시 시도해 주세요.');}};
  try{await auth.getRedirectResult();}catch(_){status('이전 로그인 연결을 완료하지 못했습니다. 관리자 Google 로그인을 다시 눌러 주세요.');}
  $('open').onclick=()=>window.openSecretAtlas();
  $('verify').onclick=()=>serverCheck().catch(()=>{$('saved').textContent='서버 기록 일치를 확인하지 못했습니다. 잠시 후 다시 확인하세요.';});
  $('logout').onclick=async()=>{if(loaded){try{await serverCheck();}catch(_){status('서버 확인 실패로 로그아웃을 보류했습니다. 연결을 확인해 주세요.');return;}}await auth.signOut();location.reload();};
 }catch(_){$('retry').hidden=false;$('retry').onclick=()=>location.reload();status('Google 인증 환경을 준비하지 못했습니다. Safari 일반 탭에서 다시 확인을 눌러 주세요.');}
})();
