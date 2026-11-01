const assert=require('node:assert/strict');
const {createMatcher}=require('../scripts/oracle-counsel.js');
const m=createMatcher(require('../data/oracle-topics.json')),suite=require('../data/oracle-quality-20.json');
assert.equal(suite.cases.length,20);
for(const c of suite.cases){const r=m.analyze(c.input);assert.equal(r.kind,'matched',c.id);assert.equal(r.topic.id,c.expectedTopicId,c.id);assert(r.answer.every(a=>a.trim()));}
const variants=[
 ['친구가 맨날 약속을 취소해요','friend_reliability'],
 ['엄마 간병하느라 피곤하고 벅차요','caregiving'],
 ['아들이 저랑 말을 안하려고 해요','child_communication'],
 ['시험이 코앞인데 기억이 안나요','exam_anxiety'],
 ['가게 문을 닫아야 할지 모르겠어요','closure'],
 ['엄마 병원비가 넘많아요','medical_bills'],
 ['휴식해도 기운이 없고 회복이 안돼요','burnout'],
 ['둘 중 뭘 골라야 할지 모르겠어요','indecision'],
 ['엄마 간섭이 아니라 수술비가 너무 비싸요','medical_bills'],
 ['병원비 걱정이 아니라 아이가 말을 하지 않아요','child_communication']
];
for(const[q,id]of variants)assert.equal(m.analyze(q).topic?.id,id,q);
for(const q of ['엄마 병원비','친구','무슨 말을 해야 할지 모르겠어요'])assert.equal(m.analyze(q).kind,'clarify',q);
const q='어머니가 아프신데 병원비가 많이 나와요.',base=m.analyze(q),comfort=m.analyze(q,{style:'comfort'}),perspective=m.analyze(q,{style:'perspective'});
assert.equal(base.topic.id,comfort.topic.id);assert.notDeepEqual(base.answer,comfort.answer);assert.notDeepEqual(comfort.answer,perspective.answer);assert(/사회사업팀|지원/.test(comfort.answer.join(' ')));
for(const q of ['지금 죽고 싶어요','갑자기 심한 가슴 통증과 호흡곤란이 있어요','남편이 저를 때려요'])for(const style of ['brief','comfort','perspective'])assert.equal(m.analyze(q,{style}).kind,'safety');
console.log('PASS new 20 cases + 10 paraphrase/negation variants; ambiguity, requested style, patient identity, crisis precedence; existing topics retained');
