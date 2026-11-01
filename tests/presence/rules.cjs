// DEMO project only. This fixture is not a replacement for production rules.
const assert=require('node:assert/strict'),fs=require('node:fs');
const{initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const{ref,set,get,serverTimestamp}=require('firebase/database');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-sansa-presence',database:{host:'127.0.0.1',port:9014,rules:fs.readFileSync(__dirname+'/database.rules.json','utf8')}});
 try{
  await env.clearDatabase();
  const claims={email_verified:true,firebase:{sign_in_provider:'google.com'}},a=env.authenticatedContext('A',claims).database(),b=env.authenticatedContext('B',claims).database(),guest=env.unauthenticatedContext().database(),anon=env.authenticatedContext('anonymous',{firebase:{sign_in_provider:'anonymous'}}).database();
  const row=(id,phase='reserved')=>({id,phase,updatedAt:serverTimestamp()}),p='onlineSansaPresence/sessions/daewung/A/a',id='session-aaaaaaaaaa';
  await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'users/A'),{photos:{original:true},destinations:{keep:1},guardianCards:{MY001:true}});await set(ref(c.database(),'onlineSansaPresence/config'),{enabled:true,metric:'users'});await set(ref(c.database(),'onlineSansaPresence/aggregates/daewung/public'),{schemaVersion:1,scope:'google-unique',count:0,devices:0,asOf:Date.now()});});
  await assertSucceeds(get(ref(guest,'onlineSansaPresence/aggregates/daewung/public')));
  for(const db of[a,b,guest,anon]){await assertFails(set(ref(db,'onlineSansaPresence/config'),{enabled:true}));await assertFails(set(ref(db,'onlineSansaPresence/aggregates/daewung/public'),{count:999}));}
  await assertFails(set(ref(guest,p),row(id)));await assertFails(set(ref(anon,p),row(id)));await assertFails(set(ref(b,p),row(id)));
  await assertSucceeds(set(ref(a,p),row(id)));await assertSucceeds(set(ref(a,p),row(id,'online')));
  await assertFails(set(ref(a,p),row(id,'online'))); // Heartbeat rate bound.
  await assertFails(get(ref(b,'onlineSansaPresence/sessions/daewung/A')));await assertFails(get(ref(guest,'onlineSansaPresence/sessions')));await assertFails(get(ref(a,'onlineSansaPresence/aggregates/daewung')));
  await assertFails(set(ref(a,p),{...row(id),email:'private@example.com'}));await assertFails(set(ref(a,p),{...row(id),gps:{lat:1}}));
  await assertFails(set(ref(a,'onlineSansaPresence/sessions/daewung/A/d'),row('session-dddddddddd')));
  await assertFails(set(ref(a,'onlineSansaPresence/sessions/fake/A/a'),row('session-fffffffffff')));
  await assertSucceeds(set(ref(a,'onlineSansaPresence/sessions/daewung/A/b'),row('session-bbbbbbbbbb')));await assertSucceeds(set(ref(a,'onlineSansaPresence/sessions/daewung/A/c'),row('session-cccccccccc')));
  await assertFails(set(ref(a,p),row('different-session','offline')));
  await env.withSecurityRulesDisabled(async c=>{await set(ref(c.database(),'onlineSansaPresence/config/enabled'),false);});
  await assertSucceeds(set(ref(a,p),row(id,'offline'))); // Disconnect stays valid after kill switch.
  await assertSucceeds(set(ref(a,p),null));
  assert.deepEqual((await get(ref(a,'users/A'))).val(),{photos:{original:true},destinations:{keep:1},guardianCards:{MY001:true}});
  console.log('PASS demo presence rules: public aggregate only; Google owner private slots; 3-slot bound; rate bound; no forged count/UID/email/GPS; ID-safe disconnect; disabled cleanup; original user data unchanged');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
