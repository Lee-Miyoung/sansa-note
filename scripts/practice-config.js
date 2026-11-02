/* Shared schema for public playback and authenticated editorial tools. */
((root)=>{'use strict';
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v),text=(v,n=500)=>typeof v==='string'&&v.length<=n;
function validate(value,tracks){
 if(!plain(value)||value.schemaVersion!==1||!Number.isInteger(value.revision)||value.revision<0||!Array.isArray(value.sequence)||value.sequence.length<1||value.sequence.length>20)throw Error('시퀀스 형식을 확인해 주세요.');
 let end=0;const ids=new Set();
 const sequence=value.sequence.map(s=>{
  if(!plain(s)||!/^[-a-z0-9]+$/.test(s.id)||ids.has(s.id)||!text(s.title,80)||!s.title.trim()||!text(s.guide)||!text(s.action)||!text(s.monk)||!['sit','breathe','bow','listen','vow','bell','quiet'].includes(s.pose)||!Number.isFinite(s.start)||!Number.isFinite(s.end)||Math.abs(s.start-end)>.001||s.end<=s.start||s.end>1800||typeof s.auto!=='boolean')throw Error('단계는 0초부터 빈틈이나 겹침 없이 이어져야 합니다.');
  ids.add(s.id);end=s.end;
  const audioAt=s.audioAt??s.start;if(!Number.isFinite(audioAt)||audioAt<s.start||audioAt>s.end)throw Error('음원 시작 시점은 해당 단계 안에 있어야 합니다.');
  if(!Number.isFinite(s.offset)||s.offset<0||!text(s.track,80))throw Error('음원 오프셋을 확인해 주세요.');
  if(s.track&&tracks){const t=tracks.find(t=>t.id===s.track&&t.verified);if(!t||s.offset>=t.duration)throw Error('확인된 음원과 파일 길이 안의 오프셋을 선택해 주세요.');}
  for(const k of ['subtitle','bubble'])if(!Array.isArray(s[k])||s[k].length!==2||!s[k].every(Number.isFinite)||s[k][0]<s.start||s[k][1]>s.end||s[k][0]>s[k][1])throw Error('자막·말풍선 시각은 해당 단계 안에 있어야 합니다.');
  const volume=s.volume??1;if(!Number.isFinite(volume)||volume<0||volume>1)throw Error('단계 음량은 0부터 1 사이여야 합니다.');
  const audioEnd=s.audioEnd??0,motionAt=s.motionAt??s.start,waitAction=s.waitAction??'none';if(!Number.isFinite(audioEnd)||audioEnd<0||audioEnd&&audioEnd<=s.offset||!Number.isFinite(motionAt)||motionAt<s.start||motionAt>s.end||!['none','seated','gassho','three','vow'].includes(waitAction))throw Error('음원 끝·동작 시점·참여 대기를 확인하세요.');if(s.track&&tracks&&audioEnd>tracks.find(t=>t.id===s.track).duration)throw Error('음원 끝 구간이 파일 길이를 벗어납니다.');
  if(s.repeat!==undefined&&typeof s.repeat!=='boolean')throw Error('음원 반복 설정을 확인하세요.');
  return {...(s.repeat===undefined?{}:{repeat:s.repeat}),...(s.volume===undefined?{}:{volume}),audioEnd,motionAt,waitAction,id:s.id,title:s.title,guide:s.guide,action:s.action,monk:s.monk,pose:s.pose,start:s.start,end:s.end,track:s.track,offset:s.offset,audioAt,auto:s.auto,subtitle:[...s.subtitle],bubble:[...s.bubble]};
 });
 const rawReplies=value.replies??{};if(!plain(rawReplies)||Object.keys(rawReplies).length>200)throw Error('답변 세트를 확인해 주세요.');
 const replies={};for(const [id,r]of Object.entries(rawReplies)){if(['__proto__','constructor','prototype','selfharm','partner_abuse','medical_emergency','harm_others'].includes(id)||!/^[-a-z0-9_]+$/.test(id)||!plain(r)||!Array.isArray(r.answer)||r.answer.length!==2||!r.answer.every(t=>text(t,1200)&&t.trim())||!['comfort','practical','perspective','action','reflection','brief'].includes(r.style))throw Error('답변은 정리와 제안 두 문장으로 작성해 주세요.');replies[id]={answer:[...r.answer],style:r.style};}
 return {schemaVersion:1,revision:value.revision,sequence,replies};
}
const api={validate};if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
let current=null;const listeners=new Set();
function apply(v){current=validate(v);for(const fn of listeners)fn(structuredClone(current));}
api.ready=fetch('/data/practice-experience.json?v=20261101-studio').then(r=>{if(!r.ok)throw Error('체험 설정을 불러오지 못했습니다.');return r.json()}).then(v=>{apply(v);return current});
api.subscribe=fn=>{listeners.add(fn);if(current)fn(structuredClone(current));return()=>listeners.delete(fn)};
api.get=()=>current&&structuredClone(current);
let connected=false;
function connect(){if(connected||!current||typeof firebase==='undefined')return;try{const database=firebase.apps?.length?firebase.apps[0].database():firebase.database();database.ref('shared/practiceExperience/current').on('value',s=>{if(!s.exists())return;try{const v=validate(s.val());if(v.revision>current.revision)apply(v)}catch(_){}},()=>{connected=false});connected=true;}catch(_){}}
api.connect=connect;api.ready.then(()=>Promise.resolve(root.sansaFirebaseReady).then(connect).catch(()=>{})).catch(()=>{});root.addEventListener?.('sansaaccountchange',connect);root.addEventListener?.('sansadataloaded',connect);
root.SansaPracticeConfig=api;
})(typeof window==='undefined'?globalThis:window);
