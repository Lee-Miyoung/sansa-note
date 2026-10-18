// Simulated server/auth sessions. These tests do not exercise real Google Auth.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {guardedDatabase}=require('./safety.js');
test('unchanged store: two devices, re-login, notes, progress and duplicate card restoration',async()=>{
 const server={users:{admin:{destinations:{legacy:{name:'기존 절'}},guardianCards:{legacy:true},secretAtlas:{}}}},listeners=new Map();
 const clone=x=>x===undefined?null:JSON.parse(JSON.stringify(x));
 const get=p=>p.split('/').reduce((x,k)=>x?.[k],server);
 const set=(p,v)=>{const bits=p.split('/'),key=bits.pop();let node=server;for(const bit of bits)node=node[bit]??={};node[key]=clone(v);};
 const notify=()=>{for(const [p,cbs]of listeners)for(const cb of cbs)cb({val:()=>clone(get(p))});};
 const raw={ref:p=>({on(_,cb){if(!listeners.has(p))listeners.set(p,new Set());listeners.get(p).add(cb);cb({val:()=>clone(get(p))});},off(_,cb){listeners.get(p)?.delete(cb);},async update(patch){for(const[k,v]of Object.entries(patch))set(p+'/'+k,v);notify();},async transaction(fn){const v=fn(clone(get(p)));if(v!==undefined)set(p,v);notify();}})};
 const legacy=JSON.stringify({destinations:server.users.admin.destinations,cards:server.users.admin.guardianCards});
 function device(){const cache=new Map();const c={currentUid:'admin',auth:{currentUser:{uid:'admin'}},localMode:false,window:{addEventListener(){}},localStorage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)},setTimeout:()=>0,clearTimeout(){},setInterval(){},console};c.db=guardedDatabase(raw,()=>c.currentUid);vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../../scripts/secret-atlas/store.js'),'utf8'),c);return c;}
 const pc=device(),a=pc.window.SansaAtlasStore;a.touch(3);a.note('PC 복원 테스트');for(let i=0;i<4;i++)a.complete(i);await a.flush();
 const phone=device(),b=phone.window.SansaAtlasStore;assert.equal(b.state.note.text,'PC 복원 테스트');assert.equal(b.state.position.scene,3);assert.equal(Object.keys(b.state.cards).length,1);
 const first=b.state.cards['001'];b.complete(3);await b.flush();assert.equal(b.state.cards['001'],first);
 // Explicit later timestamp avoids same-millisecond last-write ambiguity.
 b.note('휴대폰에서 수정');await b.flush();assert.equal(a.state.note.text,'휴대폰에서 수정');
 pc.currentUid=null;pc.auth.currentUser=null;a.connect();assert.equal(a.uid,'guest');
 pc.currentUid='admin';pc.auth.currentUser={uid:'admin'};a.connect();assert.equal(a.state.note.text,'휴대폰에서 수정');
 assert.equal(JSON.stringify({destinations:server.users.admin.destinations,cards:server.users.admin.guardianCards}),legacy);
});
