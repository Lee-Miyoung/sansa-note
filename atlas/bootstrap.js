/* Public, independent episode. Existing pilgrimage/card/diary paths are read-only here. */
let currentUid=null,auth=null,db=null,localMode=true;
(async()=>{
 const content=window.SansaAtlasContent,episodeId=content?.id||'haeinsa-001';
 const expectedId=location.pathname.startsWith('/atlas/bulguksa/')?'bulguksa-002':'haeinsa-001';
 if(!content||content.scenes?.length!==12||content.cards?.length!==3||episodeId!==expectedId){
  document.getElementById('publicAtlasStatus').textContent='이야기 자료를 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요. 기록은 변경하지 않았습니다.';return;
 }
 window.SansaAtlasEpisode=Object.freeze({id:episodeId});
 const $=id=>document.getElementById(id),project='travel-diary-c0676';let started=false,starting=null,step=0;
 window.showToast=text=>{let n=$('toast');if(!n){n=document.createElement('p');n.id='toast';n.setAttribute('role','status');document.body.append(n);}n.textContent=text;clearTimeout(window.atlasToastTimer);window.atlasToastTimer=setTimeout(()=>n.remove(),5000);};
 const capture=()=>({publicAtlas:true,episode:episodeId,step,route:window.sansaSecretAtlas?.capture()});
 window.sansaNavigation={checkpoint(){history.replaceState(capture(),'');step++;history.pushState(null,'');},flush(){history.replaceState(capture(),'');},back(){if(step>0){history.back();return true;}return false;}};
 window.addEventListener('popstate',event=>{if(event.state?.publicAtlas&&(event.state.episode===episodeId||(!event.state.episode&&episodeId==='haeinsa-001'))){step=event.state.step;window.sansaSecretAtlas?.restore(event.state.route);}else window.sansaSecretAtlas?.suspend();});
 function script(src){return new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=src;tag.onload=resolve;tag.onerror=reject;document.head.append(tag);});}
 function guard(raw){return{ref(path){const own='users/'+currentUid,episode=own+'/secretAtlas/'+episodeId,writable=path===episode||path.startsWith(episode+'/');if(!currentUid||(!writable&&path!==own+'/destinations'))throw Error('Disallowed path');const uid=currentUid,target=raw.ref(path);const check=()=>{if(auth.currentUser?.uid!==uid||currentUid!==uid)throw Error('Account changed');};return{on(...args){check();return target.on(...args);},off(...args){return target.off(...args);},child(key){if(!/^[A-Za-z0-9_/-]+$/.test(key)||key.includes('//'))throw Error('Invalid child');return db.ref(path+'/'+key);},update(patch){check();if(!writable)throw Error('Read-only');return target.update(patch);},transaction(fn){check();if(!writable)throw Error('Read-only');return target.transaction(old=>{check();return fn(old);});}};}};}
 function label(user){$('atlasAccountLabel').textContent=user?'로그인 계정에 비밀도감 기록만 저장합니다.':'게스트 · 기록은 이 브라우저에만 저장합니다.';$('atlasLogin').hidden=!auth||!!user;$('atlasLogout').hidden=!user;}
 async function start(){if(started)return;if(starting)return starting;starting=(async()=>{await script('/atlas/store.js?v=20261019-episodes');await script('/atlas/renderer.js?v=20261019-episodes');started=true;const paths={back:'M12 19l-7-7 7-7 M5 12h14',close:'M6 6l12 12 M18 6L6 18'};for(const[a,d]of Object.entries(paths)){const button=document.querySelector('[data-atlas="'+a+'"]');if(button)button.innerHTML='<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';}$('startAtlas').disabled=false;$('startAtlas').textContent=(window.SansaAtlasContent.templeName||'해인사')+' 이야기 열기 →';$('publicAtlasStatus').textContent='이야기를 열어 무념스님과 함께 걸어 보세요.';$('startAtlas').onclick=()=>window.openSecretAtlas();})();try{await starting;}catch(_){$('publicAtlasStatus').textContent='이야기를 불러오지 못했습니다. 새로고침해 주세요.';}}
 async function isolatedTransport(){
  if(!('serviceWorker' in navigator))throw Error('No isolated transport');
  const expected=new URL('/atlas/sw.js',location.origin).href;
  if(navigator.serviceWorker.controller?.scriptURL===expected)return;
  let registrationTimer;try{await Promise.race([navigator.serviceWorker.register('/atlas/sw.js',{scope:'/atlas/',updateViaCache:'none'}),new Promise((_,reject)=>{registrationTimer=setTimeout(()=>reject(Error('Isolation timeout')),8000);})]);}finally{clearTimeout(registrationTimer);}
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',check);reject(Error('Isolation unavailable'));},12000);function check(){if(navigator.serviceWorker.controller?.scriptURL===expected){clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);resolve();}}navigator.serviceWorker.addEventListener('controllerchange',check);check();});
 }
 await start();label(null);
 try{await isolatedTransport();const response=await fetch('/index.html',{cache:'no-store'});if(!response.ok)throw Error();const html=await response.text(),match=html.match(/const\s+FIREBASE_CONFIG\s*=\s*(\{[\s\S]*?\});/);if(!match)throw Error();const config={};for(const key of['apiKey','authDomain','databaseURL','projectId','messagingSenderId','appId']){const value=match[1].match(new RegExp(key+':\\s*["\u0027]([^"\u0027]+)["\u0027]'));if(!value)throw Error();config[key]=value[1];}if(config.projectId!==project||!window.firebase)throw Error();const app=firebase.initializeApp(config);auth=app.auth();const raw=app.database();db=guard(raw);let first=true;
  auth.onAuthStateChanged(async user=>{const initial=first;first=false;if(!initial&&started){try{await window.SansaAtlasStore.flush();}catch(_){}window.sansaSecretAtlas?.suspend();}currentUid=user?.uid||null;localMode=!user;label(user);await start();window.SansaAtlasStore.connect();});
  $('atlasLogin').onclick=async()=>{try{const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await auth.signInWithPopup(provider);}catch(e){if(e.code==='auth/popup-blocked')await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());else window.showToast('Google 로그인에 실패했습니다. 다시 시도해 주세요.');}};
  $('atlasLogout').onclick=async()=>{await window.SansaAtlasStore.flush();if(['saving','offline','permission-denied','local-error'].includes(window.SansaAtlasStore.status)){window.showToast('기록 저장을 확인한 뒤 로그아웃해 주세요.');return;}await auth.signOut();};
  auth.getRedirectResult().catch(()=>window.showToast('로그인 연결을 다시 시도해 주세요.'));
 }catch(_){label(null);await start();$('publicAtlasStatus').textContent='계정 연결을 준비하지 못해 이 브라우저에만 기록합니다. 계정 저장은 Safari·Chrome 일반 탭에서 다시 열어 주세요.';}
})();
