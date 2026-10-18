/* Standalone test harness: never loads the production application. */
let currentUid=null,auth=null,db=null,localMode=false;
(async()=>{
 const $=id=>document.getElementById(id),safe=AtlasStageSafety;
 let config,app,store,unsubscribe;
 const status=text=>{$('authStatus').textContent=text;};
 const error=()=>status('연결 또는 인증 검사가 실패했습니다. 테스트 프로젝트 설정·Google 로그인·규칙을 확인하세요.');
 try{
  const setup=await fetch('stage-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
  config=safe.validateConfig(setup.config,setup.blocked);
  $('project').textContent=config.projectId;$('database').textContent=config.databaseURL;
  const response=await fetch('https://identitytoolkit.googleapis.com/v1/projects?key='+encodeURIComponent(config.apiKey),{cache:'no-store',redirect:'error'});
  const info=await response.json();if(!response.ok||info.projectId!==config.projectId)throw Error('API key project mismatch');
  app=firebase.initializeApp(config,'sansa-admin-isolated-test');auth=app.auth();
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  db=safe.guardedDatabase(app.database(),()=>currentUid);
  for(let i=0;i<12;i++)$('scene').add(new Option('장면 '+(i+1),String(i)));
  $('login').disabled=false;status('테스트 프로젝트 확인 완료. 관리자 Google 로그인을 진행하세요.');
  const loadStore=()=>new Promise((resolve,reject)=>{if(window.SansaAtlasStore)return resolve(window.SansaAtlasStore);const script=document.createElement('script');script.src='store.js';script.onload=()=>resolve(window.SansaAtlasStore);script.onerror=reject;document.head.append(script);});
  auth.onAuthStateChanged(async user=>{
   $('workspace').disabled=true;currentUid=null;unsubscribe?.();store?.connect();
   $('logout').disabled=!user;$('identity').textContent='로그인 전';
   if(!user)return;
   try{
    const token=await user.getIdTokenResult();safe.validateIdentity(user,token.claims,config,setup.adminEmail);
    if(auth.currentUser!==user)return;
    currentUid=user.uid;store=await loadStore();store.connect();
    unsubscribe=store.subscribe(render);render();$('workspace').disabled=false;$('identity').textContent=user.email;
    $('verifyStatus').textContent='다시 로그인했습니다. 서버 확인 버튼으로 복원된 기록을 확인하세요.';status('테스트 프로젝트의 관리자 Google 로그인 확인 완료.');
   }catch(_){currentUid=null;error();await auth.signOut();}
  });
  $('login').onclick=async()=>{const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});try{await auth.signInWithPopup(provider);}catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')await auth.signInWithRedirect(provider);else error();}};
  await auth.getRedirectResult();
  function render(){const s=store.state;$('scene').value=String(s.position.scene);if(document.activeElement!==$('note'))$('note').value=s.note.text;$('progress').textContent='완료 '+Object.keys(s.completed).length+'/12 · 카드 '+Object.keys(s.cards).length+'/3';$('cards').textContent=['001','002','003'].map(id=>id+(s.cards[id]?' 획득':' 미획득')).join(' · ');$('saveStatus').textContent='동기화 상태: '+store.status+' (서버 확인 버튼으로 확정하세요)';}
  $('scene').onchange=()=>store.touch(Number($('scene').value));
  $('complete').onclick=()=>store.complete(Number($('scene').value));
  $('note').oninput=()=>store.note($('note').value);
  async function verify(){
   const uid=currentUid,user=auth.currentUser;if(!uid||!user)throw Error();
   await store.flush();const token=await user.getIdToken();
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const path=safe.checkPath('users/'+uid+'/secretAtlas/haeinsa-001',uid,false);
    const response=await fetch(config.databaseURL+'/'+path+'.json?auth='+encodeURIComponent(token),{cache:'no-store',redirect:'error',signal:controller.signal});
    if(!response.ok||currentUid!==uid)throw Error();const record=await response.json();
    const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,k)=>(a[k]=v[k],a),{}):v);
    if(stable(store.normalize(record))!==stable(store.state))throw Error();
    $('serverRecord').textContent=JSON.stringify({position:record?.position,completed:record?.completed,cards:record?.cards,note:record?.note},null,2);
    $('verifyStatus').textContent='서버 기록 일치 확인: '+new Date().toLocaleString();return true;
   }finally{clearTimeout(timer);}
  }
  $('verify').onclick=async()=>{try{await verify();}catch(_){$('verifyStatus').textContent='서버 기록 일치를 확인하지 못했습니다. 연결 상태를 확인하고 다시 눌러 주세요.';}};
  $('logout').onclick=async()=>{try{await verify();await auth.signOut();$('serverRecord').textContent='';$('verifyStatus').textContent='로그아웃 완료. 같은 계정으로 다시 로그인해 복원을 확인하세요.';}catch(_){$('verifyStatus').textContent='서버 저장 확인 실패로 로그아웃을 보류했습니다. 다시 확인해 주세요.';}};
 }catch(_){error();}
})();
