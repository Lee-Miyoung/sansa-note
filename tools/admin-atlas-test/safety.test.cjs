const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const safety=require('./safety.js'),{build}=require('./prepare.cjs');
const blocked={projectId:'production',apiKey:'AIza'+'P'.repeat(35),authDomain:'production.firebaseapp.com',databaseURL:'https://production-default-rtdb.firebaseio.com',appId:'1:999:web:abc',messagingSenderId:'999'};
const config={projectId:'sansa-atlas-test-safe',apiKey:'AIza'+'T'.repeat(35),authDomain:'sansa-atlas-test-safe.firebaseapp.com',databaseURL:'https://sansa-atlas-test-safe-default-rtdb.asia-southeast1.firebasedatabase.app',appId:'1:123:web:abc',messagingSenderId:'123'};
test('separate project config accepted, production and mixed credentials rejected',()=>{
 assert.equal(safety.validateConfig(config,blocked).projectId,config.projectId);
 for(const patch of [{projectId:'production'},{apiKey:blocked.apiKey},{authDomain:blocked.authDomain},{databaseURL:blocked.databaseURL},{messagingSenderId:'999'},{private_key:'never'},{databaseURL:config.databaseURL+'/?x=1'}])assert.throws(()=>safety.validateConfig({...config,...patch},blocked));
});
test('Google identity requires matching staging token and verified admin',()=>{
 const user={email:'song4mi12@gmail.com',emailVerified:true},claims={aud:config.projectId,iss:'https://securetoken.google.com/'+config.projectId,email:user.email,email_verified:true,firebase:{sign_in_provider:'google.com'}};
 safety.validateIdentity(user,claims,config,user.email);
 for(const patch of [{aud:'production'},{email:'other@example.com'},{email_verified:false},{firebase:{sign_in_provider:'anonymous'}}])assert.throws(()=>safety.validateIdentity(user,{...claims,...patch},config,user.email));
});
test('write wrapper blocks other users, destinations writes and stale account handles',async()=>{
 let owner='A',writes=0;const ref={on(){},off(){},update:async()=>{writes++;},transaction:async fn=>fn(null)};
 const db=safety.guardedDatabase({ref:()=>ref},()=>owner),own=db.ref('users/A/secretAtlas/haeinsa-001');
 await own.update({note:{text:'test',at:1}});assert.equal(writes,1);
 assert.throws(()=>db.ref('users/B/secretAtlas/haeinsa-001'));
 await assert.rejects(db.ref('users/A/destinations').update({anything:1}));
 await assert.rejects(own.update({'../../destinations':null}));
 owner='B';await assert.rejects(own.update({note:{text:'stale'}}));assert.equal(writes,1);
});
test('standalone build copies exact rules and store and refuses existing output',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-stage-test-')),file=path.join(root,'config.json'),dest=path.join(root,'site');fs.writeFileSync(file,JSON.stringify(config));
 build(file,dest);const repo=path.resolve(__dirname,'../..');
 assert.deepEqual(fs.readFileSync(path.join(dest,'database.rules.json')),fs.readFileSync(path.join(repo,'firebase/production-with-secret-atlas.rules.json')));
 assert.deepEqual(fs.readFileSync(path.join(dest,'public/store.js')),fs.readFileSync(path.join(repo,'scripts/secret-atlas/store.js')));
 assert.equal(JSON.parse(fs.readFileSync(path.join(dest,'.firebaserc'))).projects.default,config.projectId);
 assert.throws(()=>build(file,dest));assert.throws(()=>build(file,path.join(repo,'unsafe-output')));
 assert.equal(fs.existsSync(path.join(dest,'public/sw.js')),false);
 assert.equal(fs.readFileSync(path.join(dest,'public/index.html'),'utf8').includes('launchApp'),false);
});
