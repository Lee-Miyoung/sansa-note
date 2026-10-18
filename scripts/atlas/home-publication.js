/* Changes only home visibility. Direct /atlas/ access remains public. */
(()=>{
  const PATH='shared/secretAtlasPublication/haeinsa-001';
  const card=document.getElementById('homeAtlasEntry');
  if(!card)return;
  const panel=document.createElement('section');
  panel.id='atlasPublicationAdmin';panel.hidden=true;panel.className='atlas-publication-admin';
  panel.innerHTML=`<h3>산사 비밀도감 · 해인사</h3>
    <p>공개하면 홈 메뉴가 나타나고, 비공개로 바꾸면 홈에서만 숨깁니다. <b>직접 주소는 계속 열립니다.</b> 본문 접근을 제한하는 보안 기능은 아닙니다.</p>
    <div class="atlas-publication-actions"><button type="button" id="atlasPublish" class="btn btn-primary" disabled>홈에 공개</button><button type="button" id="atlasUnpublish" class="btn btn-ghost" disabled>홈에서 비공개</button><a href="/atlas/">비밀도감 열기 ↗</a></div>
    <p id="atlasPublicationStatus" role="status">설정 연결 중…</p>
    <button type="button" id="atlasPublicationRetry" class="btn btn-ghost">설정 다시 확인</button>
    <a id="atlasPublicationRules" href="/docs/atlas-publication/rules.fragment.json" target="_blank" rel="noopener" hidden>추가할 전용 규칙 보기</a>
    <details id="atlasPublicationSetup"><summary>버튼이 비활성일 때 · 최초 1회 설정</summary>
      <p>운영 Firebase의 새 설정 경로 권한이 필요합니다. 앱에서는 규칙을 자동 변경하지 않습니다.</p>
      <ol><li>Firebase 콘솔 → 기존 운영 프로젝트 → Realtime Database → <b>규칙</b>을 엽니다. 현재 규칙을 먼저 복사해 보관하세요.</li>
      <li><code>rules → shared</code> 안의 마지막 항목 뒤에 쉼표를 넣고, 아래 <code>secretAtlasPublication</code> 항목만 추가합니다. <b>기존 users·shared·community·leaderboards 규칙은 지우거나 바꾸지 마세요.</b></li>
      <li>규칙을 게시한 뒤 여기서 <b>설정 다시 확인</b>을 누릅니다. 읽기가 허용되면 두 버튼 중 선택할 수 있는 버튼이 활성화됩니다.</li></ol>
      <button id="atlasCopyPublicationRule" class="btn btn-ghost" type="button" disabled>추가 항목 복사</button>
      <pre id="atlasPublicationRuleCode" tabindex="0">추가할 항목을 준비하고 있습니다.</pre><p id="atlasPublicationCopyStatus" role="status"></p>
    </details>`;
  document.querySelector('#adminOverlay .modal-body')?.prepend(panel);
  const $=id=>panel.querySelector('#'+id);
  let ref=null,ready=false,busy=false,value=true,lastServerValue=null,authGeneration=0,ruleText='',rulePromise=null;
  // The existing main-app administrator identity remains the single source of truth.
  const admin=()=>typeof isAdminUser==='function'&&isAdminUser()&&typeof auth!=='undefined'&&auth?.currentUser?.emailVerified===true;
  function render(){
    card.hidden=!value;panel.hidden=!admin();
    $('atlasPublish').disabled=!admin()||!ready||busy||value;
    $('atlasUnpublish').disabled=!admin()||!ready||busy||!value;
    $('atlasPublish').setAttribute('aria-pressed',String(value));$('atlasUnpublish').setAttribute('aria-pressed',String(!value));
  }
  function explain(error){
    const denied=String(error?.code||'').toLowerCase().includes('permission');
    $('atlasPublicationStatus').textContent=denied
      ?'공개 설정 전용 경로의 권한이 없습니다. 아래 최초 1회 설정을 적용한 뒤 다시 확인하세요. 표시 상태를 바꾸거나 저장하지 않았습니다.'
      :'공개 설정에 연결하지 못했습니다. 인터넷 연결 후 다시 확인하세요. 확인된 표시 상태는 유지합니다.';
    $('atlasPublicationRules').hidden=!denied;
    if(denied){$('atlasPublicationSetup').open=true;prepareRule();}
  }
  function received(snap,confirmed=false){
    if(busy&&!confirmed)return;
    const setting=snap.val();
    if(setting!==null&&(typeof setting?.public!=='boolean'||!Number.isFinite(setting?.updatedAt))){
      ready=false;$('atlasPublicationStatus').textContent='공개 설정 형식이 올바르지 않습니다. 새 경로의 public(참/거짓)과 updatedAt(시간)을 확인해 주세요. 기존 값은 수정하지 않았습니다.';render();return;
    }
    ready=true;lastServerValue=setting;value=setting===null?true:setting.public;
    $('atlasPublicationRules').hidden=true;
    $('atlasPublicationStatus').textContent=value?'현재: 홈에 공개 중':'현재: 홈에서 비공개 · 직접 주소는 공개';render();
  }
  function listen(){
    if(!ref)return;
    ref.off('value',received);ready=false;render();
    ref.on('value',received,error=>{ready=false;explain(error);render();});
  }
  async function save(next){
    if(busy||!ready||!admin())return;
    if(!navigator.onLine){$('atlasPublicationStatus').textContent='오프라인이라 저장하지 않았습니다. 연결 후 다시 선택해 주세요.';return;}
    busy=true;render();
    const before=value,uid=auth.currentUser.uid,generation=authGeneration;
    $('atlasPublicationStatus').textContent='공개 설정 저장 중…';
    const timer=setTimeout(()=>{if(generation===authGeneration&&busy)$('atlasPublicationStatus').textContent='서버 응답을 기다리고 있습니다. 아직 저장 완료가 아닙니다. 연결이 돌아오면 반영될 수 있으므로 다시 누르지 말아 주세요.';},12000);
    try{
      const {claims}=await auth.currentUser.getIdTokenResult(true);
      if(generation!==authGeneration||auth.currentUser?.uid!==uid||!admin()||claims.email!==ADMIN_EMAIL||claims.email_verified!==true||claims.firebase?.sign_in_provider!=='google.com'||claims.aud!==FIREBASE_CONFIG.projectId)throw Error('Authentication changed');
      await ref.update({public:next,updatedAt:firebase.database.ServerValue.TIMESTAMP});
      const confirmed=await ref.get();
      if(generation!==authGeneration||auth.currentUser?.uid!==uid)return;
      if(confirmed.val()?.public!==next)throw Error('Not confirmed');
      received(confirmed,true);
      $('atlasPublicationStatus').textContent=next?'저장 완료 · 모든 사용자 홈에 공개':'저장 완료 · 모든 사용자 홈에서 숨김 · 직접 주소는 공개';
    }catch(error){
      if(generation!==authGeneration)return;
      value=typeof lastServerValue?.public==='boolean'?lastServerValue.public:before;
      if(String(error?.code||'').toLowerCase().includes('permission')){ready=false;explain(error);}
      else $('atlasPublicationStatus').textContent='저장 완료를 확인하지 못했습니다. 현재 표시 상태는 유지합니다. 연결 후 설정 다시 확인을 눌러 주세요.';
    }finally{clearTimeout(timer);if(generation===authGeneration){busy=false;render();}}
  }
  function prepareRule(){
    if(rulePromise)return rulePromise;
    rulePromise=fetch('/docs/atlas-publication/rules.fragment.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
      const node=data.rules?.shared?.secretAtlasPublication;if(!node)throw Error();
      // Copy only the new member inside rules.shared, never an entire rules replacement.
      ruleText=JSON.stringify({secretAtlasPublication:node},null,2).slice(2,-2);
      $('atlasPublicationRuleCode').textContent=ruleText;$('atlasCopyPublicationRule').disabled=false;
    }).catch(()=>{$('atlasPublicationRuleCode').textContent='추가 항목을 불러오지 못했습니다. 위 전용 규칙 링크를 열어 확인해 주세요.';rulePromise=null;});
    return rulePromise;
  }
  $('atlasCopyPublicationRule').onclick=async()=>{try{await navigator.clipboard.writeText(ruleText);$('atlasPublicationCopyStatus').textContent='shared 안에 추가할 항목만 복사했습니다. 기존 규칙은 그대로 두세요.';}catch(_){const selection=getSelection(),range=document.createRange();range.selectNodeContents($('atlasPublicationRuleCode'));selection.removeAllRanges();selection.addRange(range);$('atlasPublicationCopyStatus').textContent='자동 복사가 허용되지 않아 항목을 선택했습니다. 선택한 글을 길게 눌러 복사해 주세요.';}};
  $('atlasPublish').onclick=()=>save(true);$('atlasUnpublish').onclick=()=>save(false);
  $('atlasPublicationRetry').onclick=()=>{if(!busy){listen();prepareRule();}};
  let connected=false;
  function connect(){
    render();if(connected||typeof db==='undefined'||!db||typeof auth==='undefined'||!auth)return;
    connected=true;ref=db.ref(PATH);listen();
    auth.onAuthStateChanged(()=>{authGeneration++;busy=false;render();listen();if(admin())prepareRule();});
  }
  connect();const timer=setInterval(()=>{connect();if(connected)clearInterval(timer);},500);
  window.sansaAtlasPublication={get public(){return value;},get ready(){return ready;},refresh:listen};
})();
