const assert=require('node:assert/strict');
const {createPresence,validCounts}=require('../../scripts/hall-presence.js');
const {countSessions,shouldAggregate}=require('../../functions/presence/count.cjs');
let time=1000000;
const records=new Map(),watchers=new Map(),log=[],timers=new Map();let nextTimer=0,holdRemoval=false,releaseRemoval;
const stamp={'.sv':'timestamp'},clone=v=>v==null?null:JSON.parse(JSON.stringify(v)),resolve=v=>v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,x?.['.sv']==='timestamp'?time:x])):v;
function notify(path){for(const fn of watchers.get(path)||[])fn({val:()=>clone(records.get(path))});}
const database={
 ref(path){
  return {
   path,
   on(_,fn){log.push(['read',path]);if(!watchers.has(path))watchers.set(path,new Set());watchers.get(path).add(fn);fn({val:()=>clone(records.get(path))});},
   off(_,fn){watchers.get(path)?.delete(fn);},
   async set(value){log.push(['set',path,clone(value)]);records.set(path,resolve(value));notify(path);},
   async transaction(fn){const value=fn(clone(records.get(path)));if(value===undefined)return {committed:false};if(value===null&&holdRemoval&&path.includes('/daewung/A/'))await new Promise(r=>releaseRemoval=r);log.push(['transaction',path,clone(value)]);if(value===null)records.delete(path);else records.set(path,resolve(value));notify(path);return{committed:true};},
   onDisconnect(){return {async set(value){log.push(['armed',path,clone(value)]);},async cancel(){log.push(['cancelled',path]);}};}
  };
 }
};

const flush=()=>new Promise(r=>setImmediate(r));
async function settle(){for(let i=0;i<6;i++)await flush();}
(async()=>{
 const values=[],client=createPresence({database,timestamp:stamp,now:()=>time,onChange:v=>values.push(v),schedule(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id;},unschedule(id){timers.delete(id);}});
 records.set('.info/connected',true);records.set('onlineSansaPresence/config',{enabled:false,metric:'users'});
 await client.enter('daewung',{uid:'A',google:true});await settle();assert.equal(log.filter(x=>x[0]==='set'||x[0]==='transaction').length,0,'disabled deployment performs no writes');
 records.set('onlineSansaPresence/config',{enabled:true,metric:'users'});notify('onlineSansaPresence/config');await settle();assert(!client.state.registered,'missing server aggregate never becomes a fabricated zero');
 records.set('onlineSansaPresence/aggregates/daewung/public',{schemaVersion:1,scope:'google-unique',count:2,sessions:3,asOf:time});notify('onlineSansaPresence/aggregates/daewung/public');await settle();assert(client.state.registered);
 const announced=log.findIndex(x=>x[0]==='set'&&x[2].phase==='online'),armed=log.findIndex(x=>x[0]==='armed');assert(armed>=0&&armed<announced,'disconnect cleanup is armed before online announcement');
 const sessionPath=log[announced][1];assert(sessionPath.startsWith('onlineSansaPresence/sessions/daewung/A/'));
 assert(log.filter(x=>x[0]==='read').every(x=>!x[1].includes('/sessions/')),'other session lists and UIDs are never read');
 time+=45000;for(const t of [...timers.values()].filter(t=>t.ms===45000))await t.fn();await settle();assert.equal(records.get(sessionPath).updatedAt,time);
 client.setActive(false);await settle();assert(!records.has(sessionPath));assert(!client.state.registered);
 client.setActive(true);await settle();assert(client.state.registered);
 records.set('.info/connected',false);notify('.info/connected');await settle();assert(!client.state.registered);assert.equal(values.at(-1).state,'unavailable');
 records.set('.info/connected',true);notify('.info/connected');await settle();assert(client.state.registered,'reconnect creates one private session');
 time+=100000;notify('onlineSansaPresence/aggregates/daewung/public');await settle();assert.equal(values.at(-1).state,'unavailable','stale public values are not displayed');
 await Promise.all([client.enter('yaksa',{uid:'A',google:true}),client.enter('jijang',{uid:'B',google:true})]);await settle();assert.equal(client.state.hall,'jijang','rapid hall/account changes cannot revive old watches');
 await client.leave();assert.equal(timers.size,0);assert([...watchers.values()].every(s=>s.size===0));
 const before=log.filter(x=>x[0]==='transaction').length;
 records.set('onlineSansaPresence/aggregates/daewung/public',{schemaVersion:1,scope:'google-unique',count:0,sessions:0,asOf:time});
 await client.enter('daewung',null);await settle();assert.equal(values.at(-1).count,0,'a real server zero is allowed');assert.equal(log.filter(x=>x[0]==='transaction').length,before,'guests are not silently registered');await client.leave();

 records.set('onlineSansaPresence/aggregates/daewung/public',{schemaVersion:1,scope:'google-unique',count:1,sessions:1,asOf:time});
 records.set('onlineSansaPresence/aggregates/jijang/public',{schemaVersion:1,scope:'google-unique',count:1,sessions:1,asOf:time});
 await client.enter('daewung',{uid:'A',google:true});await settle();assert(client.state.registered);
 holdRemoval=true;const old=client.enter('yaksa',{uid:'A',google:true});await settle();const newer=client.enter('jijang',{uid:'B',google:true});await settle();assert.equal(client.state.hall,'jijang');
 holdRemoval=false;releaseRemoval();await Promise.all([old,newer]);await settle();assert.equal(client.state.hall,'jijang','delayed old removal must not wipe the newer hall state');assert(client.state.registered);await client.leave();assert.equal(timers.size,0);
 assert(!validCounts({schemaVersion:1,scope:'google-unique',count:-1,sessions:0,asOf:time},time));
 const publicValue=countSessions({A:{a:{phase:'online',updatedAt:time},b:{phase:'online',updatedAt:time}},B:{a:{phase:'online',updatedAt:time}},C:{a:{phase:'online',updatedAt:time-120001}},D:{a:{phase:'offline',updatedAt:time}},E:{a:{phase:'reserved',updatedAt:time}}},time);
 assert.equal(publicValue.count,2);assert.equal(publicValue.sessions,3);assert.deepEqual(Object.keys(publicValue).sort(),['asOf','count','schemaVersion','scope','sessions']);
 assert.equal(shouldAggregate('online','online'),false);assert.equal(shouldAggregate('reserved','online'),true);assert.equal(shouldAggregate('online','offline'),true);assert.equal(shouldAggregate('reserved',null),false);
 console.log('PASS private presence reservations/cleanup ordering, reconnect, inactivity, rapid hall/account change, guest read-only, stale/invalid fallback, real zero; unique Google users vs sessions, TTL, no UID leaks');
})().catch(e=>{console.error(e);process.exitCode=1});
