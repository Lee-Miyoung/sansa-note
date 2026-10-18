/* Shared pure safety checks for the standalone staging page and its build tools. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasStageSafety=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function check(ok,message){if(!ok)throw new Error(message);}
 function validateConfig(input,blocked){
  check(input&&typeof input==='object'&&!Array.isArray(input),'Web 앱 설정 JSON이 필요합니다.');
  check(!('private_key'in input)&&!('client_secret'in input)&&!('refresh_token'in input)&&input.type!=='service_account','관리자 키나 인증정보를 넣지 마세요. Web 앱 공개 설정만 사용합니다.');
  const {projectId,apiKey,authDomain,databaseURL,appId,messagingSenderId}=input;
  check(typeof projectId==='string'&&/^sansa-atlas-test-[a-z0-9-]{1,13}$/.test(projectId)&&projectId.length<=30,'프로젝트 ID는 sansa-atlas-test-로 시작하는 별도 테스트 프로젝트여야 합니다.');
  check(projectId!==blocked.projectId,'운영 프로젝트는 사용할 수 없습니다.');
  check(typeof apiKey==='string'&&/^AIza[A-Za-z0-9_-]{35}$/.test(apiKey)&&apiKey!==blocked.apiKey,'새 테스트 프로젝트의 Web API 키가 필요합니다.');
  check(authDomain===projectId+'.firebaseapp.com'&&authDomain!==blocked.authDomain,'테스트 프로젝트 기본 인증 도메인을 사용해야 합니다.');
  check(typeof databaseURL==='string','테스트 Database URL이 필요합니다.');
  let url;try{url=new URL(databaseURL);}catch(_){throw new Error('Database URL 형식을 확인하세요.');}
  const host=projectId+'-default-rtdb';
  const validHost=url.hostname===host+'.firebaseio.com'||(url.hostname.startsWith(host+'.')&&/^[a-z0-9-]+\.firebasedatabase\.app$/.test(url.hostname.slice(host.length+1)));
  check(url.protocol==='https:'&&validHost&&!url.port&&!url.username&&!url.password&&!url.search&&!url.hash&&(url.pathname==='/'||url.pathname===''),'테스트 프로젝트의 기본 HTTPS Database URL만 허용합니다.');
  check(url.origin!==new URL(blocked.databaseURL).origin,'운영 Database 연결은 금지됩니다.');
  check(typeof messagingSenderId==='string'&&/^\d+$/.test(messagingSenderId)&&messagingSenderId!==blocked.messagingSenderId,'새 프로젝트의 messagingSenderId를 확인하세요.');
  check(typeof appId==='string'&&new RegExp('^1:'+messagingSenderId+':web:[a-zA-Z0-9]+$').test(appId)&&appId!==blocked.appId,'새 테스트 Web 앱 ID가 필요합니다.');
  return {apiKey,authDomain,databaseURL:url.origin,projectId,appId,messagingSenderId};
 }
 function validateIdentity(user,claims,config,adminEmail){
  check(user&&user.emailVerified===true&&String(user.email).toLowerCase()===adminEmail.toLowerCase(),'지정된 기존 관리자 Google 계정으로 로그인해 주세요.');
  check(claims.aud===config.projectId&&claims.iss==='https://securetoken.google.com/'+config.projectId,'테스트 프로젝트가 발급한 로그인만 허용합니다.');
  check(claims.email_verified===true&&String(claims.email).toLowerCase()===adminEmail.toLowerCase()&&claims.firebase?.sign_in_provider==='google.com','Google 로그인 및 이메일 인증을 확인하지 못했습니다.');
 }
 function checkPath(path,uid,write){
  check(typeof uid==='string'&&uid.length>0&&!/[.#$\[\]\/]/.test(uid),'테스트 계정 로그인이 필요합니다.');
  check(typeof path==='string'&&!/[.#$\[\]]/.test(path)&&!path.includes('//')&&!path.endsWith('/'),'데이터 경로 형식을 확인하세요.');
  const own='users/'+uid,episode=own+'/secretAtlas/haeinsa-001';
  check(path===episode||path.startsWith(episode+'/')||(!write&&path===own+'/destinations'),'테스트 비밀도감 외의 쓰기·조회는 허용하지 않습니다.');
  return path;
 }
 function guardedDatabase(raw,owner){
  function wrap(path){
   const uid=owner();checkPath(path,uid,false);const target=raw.ref(path),handlers=new Map();
   function allowed(write){check(owner()===uid,'로그인 계정이 변경되어 이전 요청을 중단합니다.');checkPath(path,uid,write);}
   return {
    on(event,fn,onError){allowed(false);const guarded=snap=>{if(owner()===uid)fn(snap);};handlers.set(fn,guarded);return target.on(event,guarded,onError);},
    off(event,fn){target.off(event,handlers.get(fn)||fn);handlers.delete(fn);},
    child(child){allowed(false);return wrap(path+'/'+child);},
    async update(patch){allowed(true);check(patch&&typeof patch==='object'&&!Array.isArray(patch),'저장 패치 형식을 확인하세요.');for(const key of Object.keys(patch))checkPath(path+'/'+key,uid,true);return target.update(patch);},
    async transaction(fn){allowed(true);return target.transaction(old=>owner()===uid?fn(old):undefined);}
   };
  }
  return {ref:wrap};
 }
 return {validateConfig,validateIdentity,checkPath,guardedDatabase};
});
