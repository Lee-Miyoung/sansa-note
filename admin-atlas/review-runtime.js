/* Compatibility for already registered private drafts. Never rewrites stored content. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SansaAtlasReviewRuntime=api;})(globalThis,()=>{
 function withoutMap(source){
  let value=source;const start=value.indexOf(' function map(){');
  if(start>=0){const end=value.indexOf(' function quiz(){',start);if(end<0)throw Error('Unsupported review renderer');value=value.slice(0,start)+value.slice(end);}
  const goodsStart=value.indexOf(' function goods(){');if(goodsStart>=0){const goodsEnd=value.indexOf(' function sourcesView(){',goodsStart);if(goodsEnd<0)throw Error('Unsupported review renderer');value=value.slice(0,goodsStart)+value.slice(goodsEnd);}
  value=value.replace('<button data-atlas="map">지도·자료</button>','<button data-atlas="sources">역사 자료</button>')
   .replace('intro,reader,map,quiz','intro,reader,quiz').replace('note:notes,goods,sources:','note:notes,sources:')
   .replace("${btn('goods','현장 인증과 굿즈','atlas-btn atlas-light')}",'').replace(",goods:'cards'",'').replace(",goods:'cards-removed'",'').replace("sources:'map'","sources:'sources'")
   .replace("  if(a==='place')return go('map',{place:b.dataset.place});\n",'')
   .replace("['intro','map','cards','note','goods','sources']","['intro','cards','note','sources']")
   .replace('view={...r.view};',"view={...r.view,page:['map','goods'].includes(r.view.page)?'intro':r.view.page};");
  // Close means close the atlas, even on an internal reading screen. Back stays Back.
  value=value.replace("if(a==='close')return back();","if(a==='close')return close();")
   .replace("aria-label=\"직전 화면으로 돌아가기\"","aria-label=\"비밀도감 닫기\"");
  if(/function (?:map|goods)\(|data-atlas="(?:map|goods)"|go\('(?:map|goods)'/.test(value))throw Error('Map removal incomplete');
  return value;
 }
 function friendlyContent(original){
  // Generic dialogue contains no historical manuscript. Facts are selected only
  // after the authenticated private content has been loaded and hash checked.
  const c=JSON.parse(JSON.stringify(original)),old=original.scenes;
  const sentences=text=>(text.match(/[^.!?]+[.!?]*/g)||[]).map(s=>s.trim()).filter(Boolean);
  const spoken=text=>text.replace(/있습니다/g,'있어요').replace(/없습니다/g,'없어요').replace(/필요했습니다/g,'필요했어요').replace(/중요했습니다/g,'중요했어요').replace(/부릅니다/g,'불러요').replace(/옮깁니다/g,'옮겨요').replace(/합니다/g,'해요').replace(/됩니다/g,'돼요').replace(/아닙니다/g,'아니에요').replace(/다릅니다/g,'달라요').replace(/([가-힣])입니다/g,(_,c)=>c+((c.charCodeAt(0)-44032)%28?'이에요':'예요'));
  const facts=[[[7,0,0],[7,1,0]],[[0,0,0],[0,2,0]],[[2,0,0],[2,0,1]],[[2,1,0],[2,1,1]],[[3,0,0],[3,0,1]],[[1,0,1],[1,2,0]],[[4,0,1],[7,0,1]],[[7,1,1],[7,1,2]],[[8,0,0],[8,0,1]],[[9,0,0],[9,0,1]],[[10,0,1],[10,2,0]],[[11,2,1],[11,2,2]]];
  const titles=['나무판이 책이라고?','같은 책을 다시 만든다면','책 한 권인 줄 알았지?','거꾸로 새기는 글자','나무도 성격이 있을까?','이 일을 혼자 했다고?','책에게도 여행이 있어','오래된 책을 만나는 자리','책보다 어린 책장?','창문을 보는 새로운 방법','오래 남는 건 이유가 있어','너라면 무엇을 남길래?'];
  const openers=['무념스님이 발걸음을 멈췄어요. “저 선반을 한번 봐. 우리가 아는 책장과 뭐가 다를까?”','“아까 본 책을 처음부터 다시 만든다면?” 무념스님이 빈 종이를 내밀었어요.','“나는 한 권인 줄 알았는데!” 무념스님이 두 손을 벌려 보였어요.','글자를 쓰려는 무념스님이 고개를 갸웃했어요. “잠깐, 어느 방향으로 새겨야 하지?”','“아무 나무나 고르면 될까?” 무념스님이 나뭇결을 가리켰어요.','글씨를 쓰는 손, 판을 새기는 손, 찍어 보는 손. 서로 다른 손길을 찾아볼까요?','무념스님이 책을 품에 안았어요. “이 책도 여러 사람을 만나 여기까지 왔겠지?”','“책을 보는데 사람들의 손길이 떠오르네.” 무념스님이 조용히 웃었어요.','책과 책장, 어느 쪽이 더 오래되었을까요? 무념스님이 뜻밖의 질문을 던졌어요.','무념스님이 멋진 장식 대신 창문 앞에 섰어요. “이번에는 여기를 보자.”','“오래 남으려면 그냥 가만히 있으면 될까?” 무념스님이 잠시 생각에 잠겼어요.','이제 무념스님이 작은 빈칸을 내밀었어요. “이번에는 네 이야기를 들려줘.”'];
  const questions=['그림 속 나무판을 찾아봐요. 종이책과 닮은 점은 무엇인가요?','오래 남기고 싶은 책이 하나 있다면, 어떤 책인가요?','여러 내용을 한데 모은 책이라면 어떤 이름을 붙이고 싶나요?','종이에 내 이름을 쓰고 뒤에서 비춰 봐요. 어떤 방향으로 보이나요?','나뭇결을 본 적 있나요? 단단함 말고 무엇이 중요할까요?','하루만 공방에서 일한다면 어떤 역할을 맡고 싶나요?','이동 장면은 창작 그림이에요. 정확한 운송 방법을 재현한 그림으로 보지는 말아요.','한 판을 완성하고 지키는 데 몇 종류의 손길이 필요했을까요?','책을 지키기 위해 새 책장을 마련했던 경험이 있나요?','그림의 바람은 창작 표현이에요. 창이 하는 일을 떠올려 봐요.','내가 오래 간직한 물건도 누군가의 돌봄을 받았나요?','멋진 문장이 아니어도 좋아요. 지금 떠오른 한 줄이면 충분해요.'];
  const art=['haeinsa-cover',old[0].art,old[1].art,old[2].art,old[3].art,old[1].art,old[5].art,old[7].art,old[8].art,old[9].art,old[10].art,old[11].art];
  c.scenes=c.scenes.map((scene,i)=>{const refs=facts[i],selected=refs.map(([a,b,d])=>spoken(sentences(old[a].paragraphs[b])[d]||'')).filter(Boolean);if(selected.length!==refs.length)throw Error('Unsupported private story');return {...scene,art:art[i],title:titles[i],paragraphs:[openers[i],selected.join(' '),questions[i]],monk:questions[i],clue:selected[0],sources:[...new Set(refs.flatMap(([a])=>old[a].sources))],interpretation:'대사·질문과 삽화는 창작 연출입니다. 참고할 핵심 사실은 비공개 원고에서 골랐으며 세부 연대·운송 방식·재료 연구의 공식 원문 대조는 검토 중입니다.'};});
  c.quizzes[0].title='사라지고, 다시 만들고, 옮기고! 어떤 순서일까?';
  c.quizzes[0].items=c.quizzes[0].items.map(text=>text.replace(/\d{4}(?:~\d{4})?년\s*/g,''));c.quizzes[0].explanation='먼저 새긴 경판의 소실, 다시 만드는 작업, 이후의 이동 기록 순서로 생각해 봐요. 처음의 경판과 지금 전해지는 경판은 구분해요.';
  c.quizzes[1].title='무념스님의 인쇄 공방, 다음 순서는?';
  c.quizzes[2].title='처음 보는 자료, 어떤 태도가 좋을까?';c.quizzes[2].clue='눈에 보이는 것과 자료로 확인한 것을 나눠 생각해 봐요.';c.quizzes[2].options=['한 장의 사진으로 모든 것을 단정한다','확인한 범위와 아직 모르는 것을 구분한다','출처가 없어도 그럴듯하면 믿는다'];c.quizzes[2].hint='모르는 부분을 남겨 두어도 괜찮아요.';c.quizzes[2].explanation='확인한 범위까지만 이야기하면 새로운 자료를 만났을 때 생각을 더해 갈 수 있어요.';
  c.quizzes[3].title='이 그림, 역사 사진일까 이야기 그림일까?';c.quizzes[3].clue='대사와 삽화는 이야기를 위한 창작이에요.';c.quizzes[3].options=['그림에 나온 장면은 모두 실제 모습을 복원한 것이다','자료에서 확인한 사실과 창작 장면을 구별한다','그림이 예쁘면 출처를 볼 필요가 없다'];c.quizzes[3].hint='그림만으로 당시의 정확한 모습을 알 수 있을까요?';c.quizzes[3].explanation='그림은 상상을 돕는 친구예요. 구체적인 사건과 모습은 자료에서 확인하고, 창작은 창작으로 즐겨요.';
  c.quizzes[2].wrong=['사진 한 장으로 전부 알 수 있을까요? 확인한 범위를 떠올려 봐요.','','출처는 이야기를 확인하는 중요한 단서예요.'];c.quizzes[3].wrong=['삽화는 상상으로 그린 장면이에요. 자료와 구별해 봐요.','','그림의 재미와 역사 자료의 근거는 따로 살펴봐요.'];
  c.quizzes[4].title='나무책과 책장, 짝을 찾아 줘!';c.quizzes[5].title='오래오래 지키려면 무엇이 필요할까?';
  c.published=false;return c;
 }
 function centerControls(document){const path={back:'M12 19l-7-7 7-7 M5 12h14',close:'M6 6l12 12 M18 6L6 18'};for(const [action,d]of Object.entries(path)){const button=document.querySelector('#secretAtlasOverlay [data-atlas="'+action+'"]');if(button)button.innerHTML='<svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24"><path d="'+d+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';}}
 return {withoutMap,friendlyContent,centerControls};
});
