/* Local, deterministic situation matching. User concerns never leave this browser. */
((root)=>{'use strict';
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/전남친|전여친/g,'전 연인').replace(/남자친구|여자친구|남친|여친/g,'연인').replace(/우리\s*애(?=가|는|를|와|에게|의|\s|$)/g,'우리 아이').replace(/\s+/g,'').trim();
const compile=s=>new RegExp(s,'iu');
const styleNames={comfort:'위로형',practical:'현실정리형',perspective:'관점전환형',action:'행동제안형',reflection:'불교적 성찰형',brief:'아주 짧은 한마디형'};
function enrich(result,input,options={},overrides={}){
 const clean=String(input||'').replace(/\s+/g,' ').trim(),n=normalize(input),topic=result.topic;
 const emotions=[['불안',/불안|걱정|두렵|겁나|긴장/],['분노',/화가|분노|억울|짜증/],['슬픔',/슬프|슬퍼|눈물|서럽/],['지침',/지쳐|지치|힘들|소진|피곤/],['죄책감',/죄책|미안|내탓/],['외로움',/외롭|외로워|혼자인|아무도/],['혼란',/혼란|헷갈|모르겠/],['무기력',/무기력|의욕이없|아무것도하기싫/],['기대',/기대|설레/],['미련',/미련|잊지못|잊을수없/]].filter(([,re])=>re.test(n.replace(/(?:불안|우울|외롭|무기력)(?:하지|하진|지)?않[^,.]*/g,''))).map(([label])=>label);
 const byId={burnout:'감정소진',loneliness:'외로움',anxiety_general:'불안',guilt:'후회',loss_guilt:'후회',confidence:'자기비난',indecision:'선택의 어려움',meaning:'삶의 의미',rest_guilt:'자기비난'};
 const category=byId[topic?.id]||({friend:'인간관계',relationship:'인간관계',family:'가족',work:'일/직장',business:'일/직장',study:'공부/진로',career:'공부/진로',health:'건강',finance:'생활·경제',life:'감정소진',self:'감정소진',safety:'안전'}[topic?.domain])||(result.kind==='safety'?'안전':'상황 확인 필요');
 const short=/한마디|짧게|한줄/.test(n),reflection=/불교적으로|불교적|불교관점|부처님가르침/.test(n);
 let style=styleNames[options.style]?options.style:short?'brief':reflection?'reflection':['refusal','work_mistake','doctor_avoidance'].includes(topic?.id)?'action':['bereavement','pet_loss','loneliness'].includes(topic?.id)?'comfort':['comparison','rest_guilt','body_image'].includes(topic?.id)?'perspective':['meaning','guilt'].includes(topic?.id)?'reflection':'practical';
 let answer=result.baseAnswer||result.answer;if(topic?.id==='burnout'&&!/업무|직장|회사|야근|과로|일(?:이|을|로|때문|에치)/u.test(n))answer=['쉬어도 회복되지 않고 일상 활동이 버겁다면, 지속된 소진과 회복 여건을 함께 살펴볼 필요가 있어요.','오늘 줄일 수 있는 부담 한 가지와 기본적인 식사·수면 시간을 정해보세요. 일상 기능 저하가 이어지면 혼자 버티지 말고 전문적인 상담이나 진료를 고려해 보세요.'];const replacement=topic&&overrides[topic.id];if(result.kind==='matched'&&replacement&&Array.isArray(replacement.answer)&&replacement.answer.length===2){answer=replacement.answer;style=options.style||replacement.style||style;}
 if(result.kind==='matched'&&options.style==='comfort')answer=['그 마음을 혼자 견디지 않아도 괜찮아요. '+answer[0], '조금 여유가 생기면, '+answer[1]];
 if(result.kind==='matched'&&options.style==='perspective')answer=[answer[0]+' 이 상황의 어려움과 나 자신의 가치를 나누어 살펴봐도 좋아요.',answer[1]];
 const summaries={refusal:'싫은 마음이 있어도 표현하기 어려워 계속 참는 일이 힘드시군요.',boss_bullying:'직장에서 모욕적인 말을 겪으며 힘들어하고 계시는군요.',confidence:'자신을 자꾸 탓하게 되어 마음이 무거우시군요.',loneliness:'연결되고 싶은 마음과 외로움을 함께 느끼고 계시는군요.'};
 const summary=result.kind==='safety'?'지금 말씀하신 상황에서는 안전을 먼저 살펴볼게요.':summaries[topic?.id]||('“'+clean.slice(0,70)+(clean.length>70?'…':'')+'”라는 고민을 들려주셨군요.');
 const actors=[['부모',/부모|엄마|아빠|어머니|아버지/],['배우자·연인',/남편|아내|배우자|연인/],['자녀',/자녀|아들|딸(?:이|은|과|을)|아이(?:가|는|와|를)/],['친구',/친구/],['직장 상사',/상사|팀장/]].filter(([,re])=>re.test(n)).map(([label])=>label);const intent=/사과|미안.*전하/.test(n)?'사과 방법':/선택|고를|끊어야|그만둬|해야할지/.test(n)?'선택의 도움':/위로|이해받|들어줬으면/.test(n)?'위로와 경청':/어떻게|방법|해결|감당/.test(n)?'해결 방법':'상황 설명';const recurrence=/반복|자꾸|계속|항상|매일|매번|맨날/u.test(n)?'repeated':'unspecified';const urgency=result.kind==='safety'?'즉각적인 안전 도움':/당장|오늘까지|이번달/.test(n)?'현실의 기한 확인':'일반적인 대화';
 return {...result,baseAnswer:[...(result.baseAnswer||result.answer)],answer:[...answer],summary,category,emotions,actors,events:topic?[topic.label]:[],recurrence,intent,urgency,style,styleLabel:styleNames[style],pipeline:['상황 분류','감정 파악','답변 방식 선택','공감 · 정리 · 제안']};
}
function createMatcher(data,overrides={}){
const topics=data.topics.map(t=>({...t,routes:t.routes.map(r=>({...r,all:r.all.map(compile)}))}));
 topics.find(t=>t.id==='refusal')?.routes.push({all:[/(?:싫은소리|싫다고|불편하다고|내의견|내마음).*(?:못하|못해|못말|참고|참아|말하기어려)/u],rank:55});
 topics.find(t=>t.id==='confidence')?.routes.push({all:[/(?:나만|내자신|스스로|나자신).*(?:탓하|비난하|쓸모없|한심)/u],rank:52});
function classify(input){
 const text=normalize(input).slice(0,4000);if(!text)return{kind:'empty',candidates:[]};
 // A denied topic is not evidence of a wish to do it. Keep the original user text for display.
 const denies=/(?:죽고싶|자살|자해|스스로를?해치)(?:지|진|지는|지는건|은|다는|한|할|하|고싶|고싶은|을)?(?:생각|마음|뜻|충동|건|게|것은)?(?:은|는|이|가|을|를)?(?:없|아니|않)|(?:퇴사|이직|재회|결혼|투자)(?:할|하고|하는|하려는|할생각|하고싶은|하고싶다는)?(?:생각|마음|뜻|고민)?(?:은|는|이|가|을|를|건|것은)?(?:없|아니|않|원치)/gu;
 const evidence=text.replace(denies,'').replace(/(?:불안|우울|무기력)(?:하지|하진|한건)?(?:않|아니)|외롭지않|(?:빚|부채|연체)(?:은|는|이|가)?(?:없|아니)/gu,'');
 const split=evidence.split(/아니라|아니고|아닌데|말고|하지만|그런데|정작|사실은|문제는/u),focus=split.at(-1),negativeFocus=/아니라|아니고|아닌데|말고/u.test(text);
 // Emergencies bypass ordinary keyword ranking; no random wellness advice in a crisis.
 if(/(?:갑자기|지금|심한|극심한).{0,14}(?:가슴통증|흉통|숨을못쉬|호흡곤란)|의식을잃|쓰러졌|의식이없/u.test(evidence))return{kind:'safety',topic:{id:'medical_emergency',label:'지금의 의료 도움'},answer:['지금의 증상은 마음 문제로만 단정하지 말고 즉시 의료 도움을 받아야 해요.','심한 가슴 통증·호흡곤란·의식 저하가 있다면 한국에서는 119에 도움을 요청해요. 혼자 운전하거나 기다리며 넘기기보다 곁에 있는 사람에게도 도움을 알려주세요.'],candidates:[]};
 const protective=/(?:자해하지않|스스로를?해치지않)(?:게|고싶)/u.test(text);
 if(/(?:^|[.!?])(?:어제|오늘|방금)?(?:제가|내가|저는|나는).{0,10}(?:때렸|때려|폭행|폭력을썼|죽인다고협박)/u.test(evidence))return{kind:'safety',topic:{id:'harm_others',label:'추가 피해를 막기'},answer:['누군가에게 폭력을 썼거나 다치게 할 것 같다면, 지금은 더 다치지 않게 행동을 멈추고 거리를 두는 것이 먼저예요.','상대가 다쳤거나 위험하다면 119·112에 도움을 요청해요. 억지로 대화하거나 용서를 요구하지 말고, 신뢰할 사람과 전문기관의 도움을 받아 추가 폭력을 막을 계획을 세워요.'],candidates:[]};
 const reported=/(?:친구|아들|딸|가족|연인|배우자)(?:이|가|는).{0,8}(?:죽고싶(?:대|다고)|죽겠대|자해(?:하겠|하고싶|생각)|자살(?:하겠|생각))/u.test(evidence);
 const crisis=topics.find(t=>t.id==='selfharm');if((protective||(crisis.routes.some(r=>r.all.every(re=>re.test(evidence)))&&(!negativeFocus||crisis.routes.some(r=>r.all.every(re=>re.test(focus))))&&(!/(?:자살|자해).*(?:뜻|정의|의미|단어|기사|뉴스|예방교육|통계|연구)/u.test(evidence)||/죽고싶|죽어버리|스스로.*해(?:치|칠)|(?:자살|자해).*(?:충동|생각|하고싶)/u.test(evidence)))))return{kind:'safety',topic:crisis,answer:reported?['걱정되는 말을 들었다면 혼자 책임지려 하지 말고, 당사자의 안전을 확인할 도움을 함께 연결해요.','지금 다칠 위험이 있거나 이미 다쳤다면 119·112에 도움을 요청해요. 안전하게 곁에 있을 수 있다면 함께 있어주되, 보호자·믿을 사람·전문가에게 바로 알려요. 한국에서는 109로도 상담할 수 있어요.']:crisis.answer,candidates:[]};
 const violence=topics.find(t=>t.id==='partner_abuse');if(violence.routes.some(r=>r.all.every(re=>re.test(evidence)))&&(!negativeFocus||violence.routes.some(r=>r.all.every(re=>re.test(focus)))))return{kind:'safety',topic:violence,answer:violence.answer,candidates:[]};
 const ranked=[];
 for(const topic of topics){if(topic.domain==='safety')continue;let score=-1;for(const route of topic.routes){if(!route.all.every(re=>re.test(evidence)))continue;const anchor=route.all.at(-1);if(negativeFocus&&!anchor.test(focus))continue;const contextBonus=topic.domain==='self'?0:8;const focusBonus=split.length>1&&anchor.test(focus)?6:0;const next=route.rank+(route.all.length-1)*5+contextBonus+focusBonus;score=Math.max(score,next)}if(score>=0)ranked.push({topic,score})}
 ranked.sort((a,b)=>b.score-a.score||a.topic.id.localeCompare(b.topic.id));
 const concrete=ranked.filter(r=>r.topic.domain!=='self'&&!ranked.some(other=>other.topic.parentTopicId===r.topic.id)),byDomain=[...new Map(concrete.map(r=>[r.topic.domain,concrete.find(t=>t.topic.domain===r.topic.domain)])).values()];
 if(!negativeFocus&&/도.+(?:도|고)|그리고|동시에/u.test(text)&&byDomain.length>1)return{kind:'clarify',candidates:byDomain.slice(0,3).map(r=>({id:r.topic.id,label:r.topic.label})),answer:['서로 다른 상황이 함께 보여요. 지금 먼저 다루고 싶은 문제를 골라주세요.','두 문제를 하나의 마음가짐 문제로 묶지 않고, 선택한 상황부터 살펴볼게요.']};
 if(!ranked.length)return{kind:'clarify',candidates:[],answer:['조금 더 맞는 도움을 드리려면, 어떤 상황인지 한 가지만 더 알려주세요.','어떤 일이 있었는지와 지금 가장 도움받고 싶은 부분을 한두 문장으로 적어주세요. 관계·돈·건강 같은 단어만으로 해결책을 정하지 않을게요.']};
 const top=ranked[0],close=ranked.filter(r=>top.score-r.score<6).slice(0,3);
 if(close.length>1)return{kind:'clarify',candidates:close.map(r=>({id:r.topic.id,label:r.topic.label})),answer:['여러 고민이 함께 보여요. 지금 먼저 다루고 싶은 부분은 어느 쪽인가요?','아래에서 가까운 상황을 고르거나, 가장 힘든 부분을 한 문장 더 적어주세요.']};
 return{kind:'matched',topic:top.topic,answer:top.topic.answer,candidates:[]};
}
function analyze(input,options={}){return enrich(classify(input),input,options,overrides)}
function choose(input,id){const result=analyze(input);if(result.kind!=='clarify'||!result.candidates.some(t=>t.id===id))return result;const topic=topics.find(t=>t.id===id);return enrich({kind:'matched',topic,answer:topic.answer,candidates:[]},input,{},overrides)}
return Object.freeze({analyze,choose,topics});
}
let lastResult=null,matcher=null,loading=null,exampleLoading=null,extraExamples=[],legacyExamples=null,samplePool=null,revision=0;
const input=()=>document.getElementById('oracleInput');
function status(message){const p=document.getElementById('oracleStatus');if(p){p.textContent=message||'';p.hidden=!message}}
function reset(){lastResult=null;document.getElementById('oracleReviewPanel')?.setAttribute('hidden','');document.getElementById('oracleFeedback')?.setAttribute('hidden','');revision++;const box=document.getElementById('oracleAnswer');box?.classList.remove('show');box?.removeAttribute('data-topic-id');box?.removeAttribute('data-answer-kind');document.getElementById('oracleChoices')?.replaceChildren();status('')}
async function init(legacy){ensureUI();legacyExamples=legacy;if(!matcher){if(!loading)loading=fetch('/data/oracle-topics.json?v=20261101-completion').then(r=>{if(!r.ok)throw Error('oracle topics '+r.status);return r.json()}).then(createMatcher).catch(e=>{loading=null;throw e});matcher=await loading}buildChoices();return matcher}
function render(result,snapshot){if(input().value.trim()!==snapshot||!document.getElementById('oracleOverlay').classList.contains('show'))return;lastResult={input:snapshot,result:structuredClone(result)};document.getElementById('oracleSummary').textContent=result.summary||'';document.getElementById('oracleAnalysis').textContent=[result.category,...(result.emotions||[]),result.styleLabel].filter(Boolean).join(' · ');document.getElementById('oracleReviewPanel').hidden=false;document.getElementById('oracleReviewConsent').checked=false;document.getElementById('oracleReviewStatus').textContent='';const box=document.getElementById('oracleAnswer');document.getElementById('oracleBig').textContent=result.answer[0];document.getElementById('oracleSmall').textContent=result.kind==='matched'&&result.style==='brief'?result.answer[1].split(/(?<=[.!?。])\s/)[0]:result.style==='reflection'&&result.kind==='matched'?result.answer[1]+' 지금 일어난 마음을 알아차린 뒤, 내가 선택할 수 있는 작은 행동에 머물러 보세요.':result.answer[1];const choices=document.getElementById('oracleChoices');choices.replaceChildren();for(const candidate of result.candidates){const b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.textContent=candidate.label;b.addEventListener('click',()=>{if(input().value.trim()!==snapshot){reset();return}render(enrich(matcher.choose(snapshot,candidate.id),snapshot,{style:document.getElementById('oracleStyle')?.value},root.SansaPracticeConfig?.get()?.replies||{}),snapshot)});choices.append(b)}box.dataset.answerKind=result.kind;if(result.topic)box.dataset.topicId=result.topic.id;else delete box.dataset.topicId;box.classList.add('show');updateFeedback(result);status('')}
function submit(){const snapshot=input().value.trim();if(!snapshot)return;const result=matcher.analyze(snapshot,{style:document.getElementById('oracleStyle')?.value});const release=root.SansaPracticeConfig?.get()?.replies||{};render(enrich(result,snapshot,{style:document.getElementById('oracleStyle')?.value},release),snapshot)}
async function example(){const current=++revision;status('다른 고민 예시를 불러오고 있어요.');if(!exampleLoading)exampleLoading=fetch('/data/oracle-examples-1000.json?v=20261027-oracle2').then(r=>{if(!r.ok)throw Error('oracle examples '+r.status);return r.json()}).then(data=>{extraExamples=data.examples;const known=new Set(legacyExamples);for(const e of extraExamples){if(!known.has(e.text)){legacyExamples.push(e.text);known.add(e.text)}}const restricted=new Set(extraExamples.filter(e=>!e.sampleable).map(e=>e.text));samplePool=legacyExamples.filter(q=>!restricted.has(q)&&matcher.analyze(q).kind!=='safety');return extraExamples}).catch(e=>{exampleLoading=null;throw e});await exampleLoading;if(current!==revision||!document.getElementById('oracleOverlay').classList.contains('show'))return;
 const text=samplePool[Math.floor(Math.random()*samplePool.length)];reset();input().value=text;input().focus();
}
const friendlyTopics={refusal:'거절하기 어려워요',friend_reliability:'친구가 자꾸 약속을 어겨요',friendship_boundaries:'상처 주는 사람이 있어요',apology:'사과하고 싶어요',parent_interference:'부모님 간섭이 힘들어요',caregiving:'부모님을 돌보느라 지쳤어요',family_money:'가족의 금전 부탁이 부담스러워요',family_guilt:'부모님께 미안한 마음이 커요',basic_bills:'생활비가 부족해요',debt:'빚 때문에 불안해요',sales:'매출이 줄었어요',medical_bills:'병원비가 걱정돼요',child_communication:'아이가 말을 하지 않으려고 해요'};
const categoryNames=['인간관계','부부·연인','가족·부모','자녀·양육','직장','사업·경제','건강 걱정','시험·진로','불안·걱정','외로움','후회·죄책감','상실·삶의 의미'];
function categoryIndex(t){
 if(['guilt','past_regret','family_guilt','loss_guilt','rest_guilt'].includes(t.id))return 10;
 if(['loneliness','empty_nest','moving'].includes(t.id))return 9;
 if(t.id==='meaning')return 11;if(t.id==='burnout')return 8;
 if(t.id==='social_anxiety'||t.id==='panic')return 8;
 if(t.domain==='friend')return 0;if(t.domain==='relationship')return 1;
 if(t.domain==='family')return /^(child_|parenting_|fertility)/.test(t.id)?3:2;
 if(t.domain==='work')return 4;if(['business','finance'].includes(t.domain))return 5;
 if(t.domain==='health')return 6;if(['study','career'].includes(t.domain)||t.id==='indecision')return 7;
 return t.domain==='life'?11:8;
}
function setTab(tab){
 const direct=tab==='direct';document.getElementById('oracleDirect').hidden=!direct;document.getElementById('oracleBrowse').hidden=direct;
 document.getElementById('oracleDirectTab').setAttribute('aria-selected',String(direct));document.getElementById('oracleBrowseTab').setAttribute('aria-selected',String(!direct));
 if(direct)input().focus();
}
function buildChoices(){
 const host=document.getElementById('oracleCategories');if(!host||host.children.length)return;
 const topics=matcher.topics.filter(t=>t.domain!=='safety');
 function showCategory(i){const list=document.getElementById('oracleTopics');list.replaceChildren();document.getElementById('oracleCategoryTitle').textContent=categoryNames[i];
  for(const b of host.children)b.setAttribute('aria-pressed',String(+b.dataset.category===i));
  for(const t of topics.filter(t=>categoryIndex(t)===i)){const b=document.createElement('button');b.type='button';const question=friendlyTopics[t.id]||t.label;b.textContent=question;b.dataset.topic=t.id;b.onclick=()=>{reset();input().value=question;const r=enrich({kind:'matched',topic:t,answer:t.answer,candidates:[]},question,{style:document.getElementById('oracleStyle').value},root.SansaPracticeConfig?.get()?.replies||{});r.summary='선택한 고민 · '+question;render(r,question);document.getElementById('oracleAnswer').scrollIntoView({block:'start',behavior:'instant'});};list.append(b);}
 }
 for(const [i,name]of categoryNames.entries()){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.category=i;b.onclick=()=>showCategory(i);host.append(b)}
 showCategory(0);
}
function choiceUI(){
 const overlay=document.getElementById('oracleOverlay'),body=overlay.querySelector('.modal-body');
 overlay.querySelector('.modal-head h2').textContent='무념스님의 마음고민처방';
 overlay.querySelector('.modal-head .sub').textContent='어떤 마음이 가장 힘드신가요? 가까운 고민을 골라도 좋고, 직접 이야기하셔도 좋아요.';
 const note=body.lastElementChild;note.textContent='이 대화는 이 기기에서 처리됩니다. 중요한 결정은 현실의 정보와 필요한 전문 도움도 함께 살펴보세요.';note.style.color='#667a59';note.style.fontSize='12px';
 const tabs=document.createElement('div');tabs.className='oracle-tabs';tabs.setAttribute('role','tablist');tabs.innerHTML='<button type="button" id="oracleBrowseTab" role="tab" aria-selected="true" aria-controls="oracleBrowse">고민 고르기</button><button type="button" id="oracleDirectTab" role="tab" aria-selected="false" aria-controls="oracleDirect">직접 적기</button>';
 const browse=document.createElement('section');browse.id='oracleBrowse';browse.setAttribute('role','tabpanel');browse.setAttribute('aria-labelledby','oracleBrowseTab');browse.innerHTML='<div id="oracleCategories" aria-label="고민 분류"></div><h3 id="oracleCategoryTitle">가까운 고민을 골라보세요</h3><div id="oracleTopics"></div>';
 const direct=document.createElement('section');direct.id='oracleDirect';direct.hidden=true;direct.setAttribute('role','tabpanel');direct.setAttribute('aria-labelledby','oracleDirectTab');
 body.append(direct);direct.append(input(),document.getElementById('oracleSubmit').parentElement);
 input().placeholder='누구와 어떤 일이 있었나요? 지금 가장 도움받고 싶은 부분을 한두 문장으로 적어주세요.';
 document.getElementById('oracleSubmit').textContent='내 상황에 맞는 답변 보기';
 direct.querySelector('[onclick="fillOracleExample()"]').textContent='고민 예시 보기';
 body.prepend(tabs,browse,direct);document.getElementById('oracleStyle').closest('label').after(tabs,browse,direct);
 document.getElementById('oracleBrowseTab').onclick=()=>setTab('browse');document.getElementById('oracleDirectTab').onclick=()=>setTab('direct');
 tabs.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tab=document.getElementById(document.activeElement.id==='oracleBrowseTab'?'oracleDirectTab':'oracleBrowseTab');tab.click();tab.focus();}});
 const result=document.getElementById('oracleAnswer');
 for(const [before,label]of [['oracleSummary','당신의 고민'],['oracleBig','무념스님의 마음 처방'],['oracleSmall','오늘의 한 걸음']]){const h=document.createElement('h3');h.textContent=label;document.getElementById(before).before(h);}
 const feedback=document.createElement('section');feedback.id='oracleFeedback';feedback.hidden=true;feedback.innerHTML='<div class="oracle-feedback-buttons"><button type="button" id="oracleHelpful">이 답변이 도움이 되었어요</button><button type="button" id="oracleMismatch">제 상황과 달라요</button><button type="button" id="oracleOtherStyle">다른 방식으로 듣기</button><button type="button" id="oracleNew">새로운 고민 이야기하기</button></div><p id="oracleFeedbackStatus" role="status"></p><div id="oracleCorrectionPanel" hidden><label>어떤 점이 다른가요?<select id="oracleCorrectionKind"><option>누구의 문제인지 달라요</option><option>실제 사건이 달라요</option><option>원하는 도움이 달라요</option><option>다른 내용을 더 설명할게요</option></select></label><label>추가 설명 (이 기기에서만 처리)<textarea id="oracleCorrection" maxlength="1000"></textarea></label><button type="button" id="oracleCorrect">상황을 보완해 다시 살펴보기</button><p>관리자에게 보내려면 아래 검수 공유에서 별도로 동의하고 보내기를 눌러주세요.</p></div><div id="oracleHallSuggestion" hidden><button type="button" id="oracleSuggestedHall"></button><p>기도는 치료나 현실의 문제 해결을 대신하지 않습니다.</p></div>';
 result.after(feedback);
 document.getElementById('oracleHelpful').onclick=()=>{document.getElementById('oracleFeedbackStatus').textContent='알려주셔서 고마워요. 이 반응은 서버에 보내지 않습니다.';};
 document.getElementById('oracleMismatch').onclick=()=>{document.getElementById('oracleCorrectionPanel').hidden=false;document.getElementById('oracleCorrectionKind').focus();};
 document.getElementById('oracleCorrect').onclick=()=>{const more=document.getElementById('oracleCorrection').value.trim();if(!more){document.getElementById('oracleFeedbackStatus').textContent='무엇이 다른지 한 문장만 더 알려주세요. 같은 답변을 무작위로 바꾸지 않습니다.';document.getElementById('oracleCorrection').focus();return;}const original=input().value;reset();input().value=original+'\n추가 설명: '+more;setTab('direct');submit();};
 document.getElementById('oracleOtherStyle').onclick=()=>{document.getElementById('oracleStyle').focus();document.getElementById('oracleFeedbackStatus').textContent='위에서 원하는 답변 방식을 골라주세요.';};
 document.getElementById('oracleNew').onclick=()=>{reset();input().value='';setTab('browse');document.getElementById('oracleBrowseTab').focus();};
}
function updateFeedback(result){
 const f=document.getElementById('oracleFeedback');if(!f)return;f.hidden=false;document.getElementById('oracleCorrectionPanel').hidden=true;document.getElementById('oracleFeedbackStatus').textContent='';document.getElementById('oracleCorrection').value='';
 const ids={exam_anxiety:'munsu',exam_failure:'munsu',study_focus:'munsu',indecision:'munsu',bereavement:'jijang',pet_loss:'geungnak',loss_guilt:'jijang'};
 const target=ids[result.topic?.id]||(result.topic?.domain==='health'?'yaksa':result.topic?.domain==='family'?'gwanum':'daewung');
 document.getElementById('oracleHallSuggestion').hidden=result.kind!=='matched'||!root.SansaOnlineSansa;
 const b=document.getElementById('oracleSuggestedHall');b.textContent='원하면 관련 법당에 잠시 머물기';b.onclick=()=>{document.getElementById('oracleOverlay').classList.remove('show');root.SansaOnlineSansa.enter(target,{kind:'free',duration:null});};
}

function ensureUI(){
 if(document.getElementById('oracleSummary'))return;
 const answer=document.getElementById('oracleAnswer'),summary=document.createElement('p'),analysis=document.createElement('p');summary.id='oracleSummary';analysis.id='oracleAnalysis';analysis.className='oracle-analysis';answer.prepend(summary,analysis);
 const label=document.createElement('label');label.className='oracle-style-label';label.textContent='답변 방식 ';const select=document.createElement('select');select.id='oracleStyle';select.add(new Option('상황에 맞게',''));for(const [key,value]of Object.entries(styleNames))select.add(new Option(({comfort:'위로가 필요해요',practical:'현실적인 해결 방법이 필요해요',perspective:'관점을 바꿔보고 싶어요',brief:'짧은 한마디가 좋아요',action:'작은 행동부터 정하고 싶어요',reflection:'불교적인 성찰을 듣고 싶어요'})[key]||value,key));select.onchange=()=>{const previous=lastResult&&structuredClone(lastResult);reset();if(previous){const r=enrich(previous.result,previous.input,{style:select.value},root.SansaPracticeConfig?.get()?.replies||{});render(r,previous.input);}};label.append(select);document.getElementById('oracleInput').before(label);choiceUI();
 const review=document.createElement('section');review.id='oracleReviewPanel';review.hidden=true;review.innerHTML='<details><summary>답변이 상황에 맞았나요? · 선택적 검수 공유</summary><p>동의한 경우에만 고민 원문·분류·표시된 답변을 관리자에게 보냅니다. 이름·연락처 등 개인정보는 지우고 제출해 주세요. 공유에는 Google 로그인이 필요합니다.</p><label><input type="checkbox" id="oracleReviewConsent">이 고민과 답변을 관리자 검수용으로 공유하는 데 동의합니다.</label><button type="button" class="btn btn-ghost" id="oracleReviewSend">검수 요청 보내기</button><p id="oracleReviewStatus" role="status"></p></details>';answer.after(review);
 document.getElementById('oracleReviewSend').onclick=async()=>{
  const status=document.getElementById('oracleReviewStatus');if(!lastResult||input().value.trim()!==lastResult.input)return;
  if(!document.getElementById('oracleReviewConsent').checked){status.textContent='공유 동의를 선택한 경우에만 전송합니다.';return;}
  if(!root.SansaSession?.require('답변 검수 공유'))return;
  const snapshot=structuredClone(lastResult),uid=auth.currentUser?.uid;if(!uid)return;
  const button=document.getElementById('oracleReviewSend');button.disabled=true;
  try{const displayed=[document.getElementById('oracleBig').textContent,document.getElementById('oracleSmall').textContent];await db.ref('shared/oracleReviewInbox/'+uid).push().set({schemaVersion:1,uid,consent:true,input:snapshot.input,topicId:snapshot.result.topic?.id||'',category:snapshot.result.category,emotions:snapshot.result.emotions,style:snapshot.result.style,summary:snapshot.result.summary,answer:displayed,createdAt:Date.now()});if(auth.currentUser?.uid===uid&&lastResult?.input===snapshot.input)status.textContent='검수 요청을 보냈습니다.';}catch(_){status.textContent='전송하지 못했습니다. 검수 저장 권한과 연결을 확인해 주세요.';}finally{button.disabled=false;}
 };
}
const api=Object.freeze({init,submit,example,reset,match(text){return matcher?.analyze(text)||null},get ready(){return !!matcher},get extraExamples(){return extraExamples},createMatcher});
if(typeof module!=='undefined'&&module.exports)module.exports={createMatcher,normalize};else root.SansaOracle=api;
})(typeof window==='undefined'?globalThis:window);
