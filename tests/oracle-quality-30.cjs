const assert=require('node:assert/strict'),fs=require('node:fs');const data=require('../data/oracle-topics.json'),suite=require('../data/oracle-quality-30.json'),{createMatcher}=require('../scripts/oracle-counsel.js'),m=createMatcher(data);assert.equal(suite.cases.length,30);assert.equal(new Set(suite.cases.map(c=>c.id)).size,30);for(const c of suite.cases){const r=m.analyze(c.input);assert.equal(r.kind,'matched',c.id);assert.equal(r.topic.id,c.expectedTopicId,c.id);assert(r.summary&&r.answer.length===2&&r.answer.every(x=>x.trim()));assert(r.actors&&r.intent&&r.urgency);assert.equal(m.analyze(c.input).answer.join(''),r.answer.join(''),'deterministic')}
const variants=[
['제 수술비를 감당하기 어려워요.','medical_bills'],
['돌아가신 아버지께 잘해드리지 못해서 죄책감이 들어요.','loss_guilt'],
['아픈 엄마의 병원비 때문에 돈 걱정이 됩니다.','medical_bills'],
['엄마 병원비 감당이 안대요','medical_bills'],
['아빠 치료비 300만원을 이번 주까지 내야 합니다.','medical_bills'],
['부모 갈등이 아니라 어머니 치료비를 감당하기 어려워요.','medical_bills'],
['병원비가 아니라 부모님이 제 진로에 간섭해서 힘들어요.','parent_interference'],
['엄마를 돌보느라 지쳐서 잠시 쉬고 싶은데 죄책감이 듭니다.','caregiving'],
['사람들 부탁을 다 받다 보니 제 시간이 없어서 힘들어요.','refusal'],
['시험이 코앞인데 공부한 게 안 떠올라요.','exam_anxiety'],
['친구가 약속을 매번 취소하지만 싫지는 않아요. 다만 서운한 마음을 전하고 싶어요.','friend_reliability'],
['상사 문제는 아니고 제가 친구에게 심한 말을 해서 사과하고 싶어요.','apology'],
['남편은 해결책만 말하고 제 얘기를 듣지 않아요.','partner_listening'],
['상사가 매일 사람들 앞에서 모욕합니다.','boss_bullying'],
['남편이 해결책만 말하고 제 이야기를 듣지 않습니다.','partner_listening'],
['죽고 싶은 건 아니고 엄마 병원비를 감당하기 어려워요.','medical_bills'],
];for(const[q,id]of variants){const r=m.analyze(q);assert.equal(r.topic?.id,id,JSON.stringify({q,id,result:r}))}
for(const q of ['힘들어요','어떡하죠','엄마 병원비','괜찮은 것 같기도 해요']){const r=m.analyze(q);assert.equal(r.kind,'clarify',q)}
const mixed=m.analyze('엄마 병원비도 막막하고 상사의 모욕도 힘들어요.');assert.equal(mixed.kind,'clarify');assert(mixed.candidates.some(c=>c.id==='medical_bills'));assert(mixed.candidates.some(c=>c.id==='boss_bullying'));
for(const[q,id]of [['병원비가 막막해서 지금 죽고 싶어요','selfharm'],['남편이 저를 때려서 다쳤고 병원비도 막막해요','partner_abuse'],['갑자기 심한 가슴 통증과 호흡곤란이 있는데 병원비도 걱정돼요','medical_emergency']]){const r=m.analyze(q);assert.equal(r.kind,'safety');assert.equal(r.topic.id,id);assert(/119|112|109/.test(r.answer.join(' ')))}
const medical=m.analyze('아픈 엄마의 병원비 때문에 돈 걱정이 됩니다.');assert(medical.actors.includes('부모'));assert(/의료비|병원비|지원/.test(medical.answer.join(' ')));assert(/사회사업팀|지원창구|지원 창구/.test(medical.answer.join(' ')));const listening=m.analyze('남편은 해결책만 말하고 제 얘기를 듣지 않아요.');assert(/경청|이야기|들어/.test(listening.answer.join(' ')));assert(!/이혼|헤어지|결혼생활을포기/.test(listening.answer.join(' ')));const bullying=m.analyze('상사가 매일 사람들 앞에서 모욕합니다.');assert(/기록|상담/.test(bullying.answer.join(' ')));assert(!/참으세요|긍정적으로/.test(bullying.answer.join(' ')));
const report={representativeCases:30,matched:30,paraphraseAndNegation:variants.length,ambiguous:4,mixed:1,urgent:3,topics:data.topics.length,note:'Automatic topic/structure/selected semantic assertions; not a claim of universal answer quality or human review.'};fs.mkdirSync('/workspace/scratch/oracle',{recursive:true});fs.writeFileSync('/workspace/scratch/oracle/quality-30-result.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report));

assert(!/어머니|엄마|아버지/.test(m.analyze('제 수술비를 감당하기 어려워요.').answer.join(' ')),'do not invent a different patient');
