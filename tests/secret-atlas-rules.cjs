/* Run under a local Realtime Database emulator. No production credentials or writes. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const req=require('node:module').createRequire(path.join(process.env.SANSA_FIREBASE_DEPS||'/tmp/sansa-firebase','package.json'));
const{initializeTestEnvironment,assertSucceeds,assertFails}=req('@firebase/rules-unit-testing');const{ref,set,get,update,remove,runTransaction}=req('firebase/database');
(async()=>{const rules=fs.readFileSync(path.resolve(__dirname,'../firebase/production-with-secret-atlas.rules.json'),'utf8');const env=await initializeTestEnvironment({projectId:'demo-sansa-note',database:{host:'127.0.0.1',port:9900,rules}});try{await env.clearDatabase();const legacy={name:'조계사',stage:1,visits:{visited:{verified:true,ts:123}},photos:{photo:{url:'https://example.invalid/legacy.jpg'}}};await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),'users/alice/destinations/legacy108'),legacy));const alice=env.authenticatedContext('alice').database(),bob=env.authenticatedContext('bob').database(),guest=env.unauthenticatedContext().database(),base='users/alice/secretAtlas/haeinsa-001';await assertSucceeds(set(ref(alice,base+'/position'),{scene:5,at:Date.now()}));await assertSucceeds(get(ref(alice,base)));await assertFails(get(ref(bob,base)));await assertFails(set(ref(bob,base+'/note'),{text:'intrusion',at:Date.now()}));await assertFails(get(ref(guest,base)));await assertFails(set(ref(guest,base+'/note'),{text:'intrusion',at:Date.now()}));await assertFails(set(ref(alice,base+'/position'),{scene:12,at:Date.now()}));await assertFails(set(ref(alice,base+'/unknown'),'no'));await assertFails(set(ref(alice,base+'/completed'),42));await assertFails(set(ref(alice,base+'/cards'),'invalid'));await assertFails(set(ref(alice,base+'/answers'),'invalid'));await assertFails(set(ref(alice,base+'/answers/q1'),{selection:'invalid',correct:true,at:Date.now(),attempts:1}));await assertFails(set(ref(alice,base+'/cards/001'),Date.now()));const stamp=Date.now();await assertSucceeds(update(ref(alice,base),{'completed/1':stamp,'completed/2':stamp,'completed/3':stamp,'completed/4':stamp,'cards/001':stamp}));await assertSucceeds(set(ref(alice,base+'/cards/001'),stamp));await assertFails(set(ref(alice,base+'/cards/001'),stamp+1));await assertFails(set(ref(alice,base+'/cards/002'),stamp));await assertSucceeds(set(ref(alice,base+'/note'),{text:'나만의 기록',at:Date.now()}));await assertFails(set(ref(alice,base+'/note'),{text:'x'.repeat(10001),at:Date.now()}));await assertSucceeds(set(ref(alice,base+'/answers/q1'),{selection:[1,2,0],correct:true,at:Date.now(),attempts:1}));await assertFails(set(ref(alice,base+'/answers/q7'),{selection:[1],correct:true,at:Date.now(),attempts:1}));await assertFails(set(ref(alice,base+'/fieldVerification'),{templeId:'h',visitId:'v',at:123}));await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database(),'users/alice/destinations/h'),{name:'해인사',visits:{v:{verified:true,ts:123}}}));await assertSucceeds(set(ref(alice,base+'/fieldVerification'),{templeId:'h',visitId:'v',at:123}));await assertFails(set(ref(bob,'users/bob/secretAtlas/haeinsa-001/fieldVerification'),{templeId:'h',visitId:'v',at:123}));assert.equal((await get(ref(alice,base+'/note/text'))).val(),'나만의 기록');
const otherBase='users/bob/secretAtlas/haeinsa-001';
await assertSucceeds(update(ref(bob,otherBase),{position:{scene:7,at:Date.now()},note:{text:'B private note',at:Date.now()}}));
assert.equal((await get(ref(bob,otherBase+'/position/scene'))).val(),7);
await assertFails(get(ref(alice,otherBase)));await assertFails(set(ref(alice,otherBase+'/note'),{text:'intrusion',at:Date.now()}));
const aliceReconnect=env.authenticatedContext('alice').database();
assert.equal((await get(ref(aliceReconnect,base+'/note/text'))).val(),'나만의 기록');
assert.equal((await get(ref(aliceReconnect,base+'/position/scene'))).val(),5);
await Promise.all([runTransaction(ref(alice,base+'/cards/001'),old=>old||stamp+1),runTransaction(ref(aliceReconnect,base+'/cards/001'),old=>old||stamp+2)]);
assert.equal((await get(ref(alice,base+'/cards/001'))).val(),stamp);
assert.deepEqual((await get(ref(alice,'users/alice/destinations/legacy108'))).val(),legacy,'old visit/photo/108 source record unchanged');

{
 const admin=env.authenticatedContext('admin',{email:'song4mi12@gmail.com'}).database();
 await assertSucceeds(get(ref(admin,'users')));await assertSucceeds(get(ref(admin,base)));
 await assertFails(set(ref(admin,base+'/note'),{text:'admin cross-write forbidden',at:Date.now()}));
 await assertFails(get(ref(alice,'users')));
 await assertSucceeds(set(ref(alice,'users/alice/profile'),{nickname:'legacy-preserved'}));
 await assertFails(set(ref(bob,'users/alice/profile'),{nickname:'cross-user'}));
 for(const item of ['photoUploadControl','lyricSync','templeVerifyPoints']){
  await assertSucceeds(set(ref(admin,'shared/'+item),{test:true}));
  await assertFails(set(ref(alice,'shared/'+item),{test:false}));
 }
 await assertSucceeds(get(ref(guest,'shared/lyricSync')));await assertSucceeds(get(ref(guest,'shared/templeVerifyPoints')));await assertFails(get(ref(guest,'shared/photoUploadControl')));
 await assertSucceeds(set(ref(alice,'community/posts/test'),{uid:'alice',text:'test'}));
 await assertFails(set(ref(bob,'community/posts/test'),{uid:'bob',text:'other'}));
 await assertSucceeds(get(ref(guest,'community/posts')));
 await assertSucceeds(set(ref(alice,'leaderboards/beatShooter/alice'),{score:42}));
 await assertFails(set(ref(bob,'leaderboards/beatShooter/alice'),{score:99}));
 await assertSucceeds(get(ref(bob,'leaderboards/beatShooter')));await assertFails(get(ref(guest,'leaderboards/beatShooter')));
 await assertFails(remove(ref(alice,base+'/cards/001')));
 await assertFails(remove(ref(alice,base+'/completed/1')));
 await assertSucceeds(remove(ref(alice,base+'/answers/q1')));
 const future='users/alice/secretAtlas/future-test';
 await assertSucceeds(set(ref(alice,future),{schemaNotDefinedYet:true}));
 await assertFails(get(ref(bob,future)));await assertFails(set(ref(bob,future),{intrusion:true}));
 await assertFails(remove(ref(bob,base)));
 await assertSucceeds(remove(ref(alice,base)));
 assert.equal((await get(ref(alice,base))).val(),null,'whole episode deletion is permitted by inherited owner write; validate is skipped');
 console.log('PASS merged rules: legacy access/admin read preserved; known episode validation; future episode inherited access; partial card/dependency delete denied while parent exists; entire episode deletion remains allowed');
}
console.log('PASS full merged Firebase emulator rules: owner access and explicit admin read exception, guest denied, schema/size bounds, card invariants and source-visit verification');}finally{await env.cleanup();}})().catch(e=>{console.error(e);process.exit(1)});
