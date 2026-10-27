/* Local, deterministic situation matching. User concerns never leave this browser. */
((root)=>{'use strict';
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/전남친|전여친/g,'전 연인').replace(/남자친구|여자친구|남친|여친/g,'연인').replace(/우리\s*애(?=가|는|를|와|에게|의|\s|$)/g,'우리 아이').replace(/\s+/g,'').trim();
const compile=s=>new RegExp(s,'iu');
function createMatcher(data){
const topics=data.topics.map(t=>({...t,routes:t.routes.map(r=>({...r,all:r.all.map(compile)}))}));
function analyze(input){
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
 if(!ranked.length)return{kind:'clarify',candidates:[],answer:['조금 더 맞는 도움을 드리려면, 어떤 상황인지 한 가지만 더 알려주세요.','어떤 일이 있었는지와 지금 가장 도움받고 싶은 부분을 한두 문장으로 적어주세요. 관계·돈·건강 같은 단어만으로 해결책을 정하지 않을게요.']};
 const top=ranked[0],close=ranked.filter(r=>top.score-r.score<6).slice(0,3);
 if(close.length>1)return{kind:'clarify',candidates:close.map(r=>({id:r.topic.id,label:r.topic.label})),answer:['여러 고민이 함께 보여요. 지금 먼저 다루고 싶은 부분은 어느 쪽인가요?','아래에서 가까운 상황을 고르거나, 가장 힘든 부분을 한 문장 더 적어주세요.']};
 return{kind:'matched',topic:top.topic,answer:top.topic.answer,candidates:[]};
}
function choose(input,id){const result=analyze(input);if(result.kind!=='clarify'||!result.candidates.some(t=>t.id===id))return result;const topic=topics.find(t=>t.id===id);return{kind:'matched',topic,answer:topic.answer,candidates:[]}}
return Object.freeze({analyze,choose,topics});
}
let matcher=null,loading=null,exampleLoading=null,extraExamples=[],legacyExamples=null,samplePool=null,revision=0;
const input=()=>document.getElementById('oracleInput');
function status(message){const p=document.getElementById('oracleStatus');if(p){p.textContent=message||'';p.hidden=!message}}
function reset(){revision++;const box=document.getElementById('oracleAnswer');box?.classList.remove('show');box?.removeAttribute('data-topic-id');box?.removeAttribute('data-answer-kind');document.getElementById('oracleChoices')?.replaceChildren();status('')}
async function init(legacy){legacyExamples=legacy;if(!matcher){if(!loading)loading=fetch('/data/oracle-topics.json?v=20261027-oracle').then(r=>{if(!r.ok)throw Error('oracle topics '+r.status);return r.json()}).then(createMatcher).catch(e=>{loading=null;throw e});matcher=await loading}return matcher}
function render(result,snapshot){if(input().value.trim()!==snapshot||!document.getElementById('oracleOverlay').classList.contains('show'))return;const box=document.getElementById('oracleAnswer');document.getElementById('oracleBig').textContent=result.answer[0];document.getElementById('oracleSmall').textContent=result.answer[1];const choices=document.getElementById('oracleChoices');choices.replaceChildren();for(const candidate of result.candidates){const b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.textContent=candidate.label;b.addEventListener('click',()=>{if(input().value.trim()!==snapshot){reset();return}render(matcher.choose(snapshot,candidate.id),snapshot)});choices.append(b)}box.dataset.answerKind=result.kind;if(result.topic)box.dataset.topicId=result.topic.id;else delete box.dataset.topicId;box.classList.add('show');status('')}
function submit(){const snapshot=input().value.trim();if(!snapshot)return;render(matcher.analyze(snapshot),snapshot)}
async function example(){const current=++revision;status('다른 고민 예시를 불러오고 있어요.');if(!exampleLoading)exampleLoading=fetch('/data/oracle-examples-1000.json?v=20261027-oracle').then(r=>{if(!r.ok)throw Error('oracle examples '+r.status);return r.json()}).then(data=>{extraExamples=data.examples;const known=new Set(legacyExamples);for(const e of extraExamples){if(!known.has(e.text)){legacyExamples.push(e.text);known.add(e.text)}}const restricted=new Set(extraExamples.filter(e=>!e.sampleable).map(e=>e.text));samplePool=legacyExamples.filter(q=>!restricted.has(q)&&matcher.analyze(q).kind!=='safety');return extraExamples}).catch(e=>{exampleLoading=null;throw e});await exampleLoading;if(current!==revision||!document.getElementById('oracleOverlay').classList.contains('show'))return;
 const text=samplePool[Math.floor(Math.random()*samplePool.length)];reset();input().value=text;input().focus();
}
const api=Object.freeze({init,submit,example,reset,match(text){return matcher?.analyze(text)||null},get ready(){return !!matcher},get extraExamples(){return extraExamples},createMatcher});
if(typeof module!=='undefined'&&module.exports)module.exports={createMatcher,normalize};else root.SansaOracle=api;
})(typeof window==='undefined'?globalThis:window);
