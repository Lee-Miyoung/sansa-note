/* New device-only photos. Legacy cloud objects and unrelated databases are untouched. */
(()=>{
'use strict';
const NAME='sansaDevicePhotos_v1',VERSION=1,active=new Set();let connection,generation=0,locked=false,boundOwner=null;
let guest;
try{guest=localStorage.getItem('sansaDevicePhotoGuest_v1');if(!guest){guest=crypto.randomUUID();localStorage.setItem('sansaDevicePhotoGuest_v1',guest);}}catch(_){guest='this-browser';}
function owner(){
 if(locked)return null;
 if(typeof localMode!=='undefined'&&localMode)return 'guest:'+guest;
 if(typeof currentUid!=='undefined'&&currentUid&&typeof auth!=='undefined'&&auth?.currentUser?.uid===currentUid)return 'user:'+currentUid;
 return null;
}
function scope(){const value=owner();if(!value)throw Error('계정 연결을 확인한 뒤 다시 시도해 주세요.');boundOwner??=value;return {owner:value,generation};}
function assert(s){if(!s||s.owner!==owner()||s.generation!==generation)throw Error('계정이 바뀌어 사진 작업을 중단했어요.');}
function changed(){const next=owner();if(!locked&&next===boundOwner)return;boundOwner=next;generation++;locked=false;for(const tx of active)try{tx.abort()}catch(_){};window.dispatchEvent(new Event('devicephotosreset'));}
function member(s){assert(s);if(!s.owner.startsWith('user:'))throw Error('사진과 개인 기록은 Google 로그인 후 저장할 수 있어요.');}
function lock(){generation++;locked=true;boundOwner=null;for(const tx of active)try{tx.abort()}catch(_){}window.dispatchEvent(new Event('devicephotosreset'));}
function open(){
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(Error('이 브라우저에서 사진 저장소를 사용할 수 없어요.'));
  let failed=false;const req=indexedDB.open(NAME,VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result,photos=db.createObjectStore('photos',{keyPath:'key'});photos.createIndex('owner','owner');photos.createIndex('place',['owner','kind','placeId']);
   db.createObjectStore('blobs',{keyPath:'key'});db.createObjectStore('cards',{keyPath:'key'});
  };
  req.onerror=()=>{connection=null;reject(req.error)};
  req.onblocked=()=>{failed=true;connection=null;reject(Error('다른 탭의 사진 작업을 마친 뒤 다시 시도해 주세요.'))};
  req.onsuccess=()=>{const db=req.result;if(failed){db.close();return}db.onversionchange=()=>{db.close();connection=null};resolve(db)};
 });return connection;
}
async function transaction(stores,mode,s,run){
 assert(s);const db=await open();assert(s);
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(stores,mode);active.add(tx);let result;
  tx.oncomplete=()=>{active.delete(tx);try{assert(s);resolve(result)}catch(e){reject(e)}};
  tx.onerror=tx.onabort=()=>{active.delete(tx);reject(tx.error||Error('사진 저장을 완료하지 못했어요.'))};
  try{run(tx,value=>result=value)}catch(e){try{tx.abort()}catch(_){}reject(e)}
 });
}
const key=(s,kind,placeId,id)=>[s.owner,kind,String(placeId),id];
async function hash(blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function thumbnail(blob){
 const url=URL.createObjectURL(blob),im=new Image();
 try{im.src=url;await im.decode();const scale=Math.min(1,320/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*scale));c.height=Math.max(1,Math.round(im.naturalHeight*scale));const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);const small=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.8));if(!small)throw Error('미리보기를 만들지 못했어요.');return {blob:small,width:im.naturalWidth,height:im.naturalHeight};}finally{URL.revokeObjectURL(url)}
}
async function list(kind,placeId,s=scope()){
 return transaction(['photos'],'readonly',s,(tx,set)=>{
 const index=tx.objectStore('photos').index(kind&&placeId!=null?'place':'owner'),req=index.getAll(kind&&placeId!=null?[s.owner,kind,String(placeId)]:s.owner);req.onsuccess=()=>set(req.result.sort((a,b)=>b.createdAt-a.createdAt));});
}
async function get(kind,placeId,id,s=scope()){
 return transaction(['blobs'],'readonly',s,(tx,set)=>{const req=tx.objectStore('blobs').get(key(s,kind,placeId,id));req.onsuccess=()=>set(req.result?.blob||null)});
}
async function save(kind,placeId,file,s=scope(),place={}){
 member(s);
 assert(s);if(!['temple','mountain'].includes(kind)||!placeId)throw Error('사진을 연결할 장소를 확인해 주세요.');
 const optimized=await compressUserPhoto(file);assert(s);const small=await thumbnail(optimized.file),sha256=await hash(optimized.file);assert(s);
 const id='device-'+crypto.randomUUID(),createdAt=Date.now(),k=key(s,kind,placeId,id);
 const record={key:k,owner:s.owner,kind,placeId:String(placeId),id,createdAt,registeredAt:createdAt,placeName:String(place.name||'').slice(0,160),region:String(place.region||'').slice(0,80),mime:'image/jpeg',bytes:optimized.file.size,width:small.width,height:small.height,sha256,thumbnail:small.blob};
 await transaction(['photos','blobs'],'readwrite',s,tx=>{tx.objectStore('photos').put(record);tx.objectStore('blobs').put({key:k,blob:optimized.file});});
 window.dispatchEvent(new Event('devicephotoschange'));return record;
}
async function remove(kind,placeId,id,s=scope()){
 member(s);
 await transaction(['photos','blobs'],'readwrite',s,tx=>{const k=key(s,kind,placeId,id);tx.objectStore('photos').delete(k);tx.objectStore('blobs').delete(k)});window.dispatchEvent(new Event('devicephotoschange'));
}
async function preference(placeId,value,s=scope()){
 if(value!==undefined)member(s);
 const k=[s.owner,String(placeId)];return transaction(['cards'],value===undefined?'readonly':'readwrite',s,(tx,set)=>{
 const store=tx.objectStore('cards');if(value!==undefined){store.put({key:k,...value});set(value)}else{const req=store.get(k);req.onsuccess=()=>set(req.result||null)}});
}
async function restore(records,s=scope()){
 member(s);
 assert(s);const existing=await list(null,null,s),seen=new Set(existing.map(p=>[p.kind,p.placeId,p.sha256].join(':'))),prepared=[];let skipped=0;
 for(const r of records){assert(s);if(!['temple','mountain'].includes(r.kind)||typeof r.placeId!=='string'||!r.placeId||r.placeId.length>200||!(r.blob instanceof Blob)||r.blob.size>2*1024*1024)throw Error('백업 사진 정보가 올바르지 않아요.');const sha256=await hash(r.blob);if(sha256!==r.sha256)throw Error('백업 사진이 손상되었어요.');const sig=[r.kind,r.placeId,sha256].join(':');if(seen.has(sig)){skipped++;continue;}seen.add(sig);const small=await thumbnail(r.blob);if(Math.max(small.width,small.height)>1600)throw Error('지원하는 백업 이미지 크기를 초과했어요.');const id='device-'+crypto.randomUUID(),k=key(s,r.kind,r.placeId,id);prepared.push({record:{key:k,owner:s.owner,kind:r.kind,placeId:r.placeId,id,createdAt:Number.isFinite(r.createdAt)&&r.createdAt>0?r.createdAt:Date.now(),registeredAt:Date.now(),placeName:String(r.placeName||'').slice(0,160),region:String(r.region||'').slice(0,80),mime:'image/jpeg',bytes:r.blob.size,width:small.width,height:small.height,sha256,thumbnail:small.blob},blob:r.blob});}
 assert(s);await transaction(['photos','blobs'],'readwrite',s,tx=>{for(const p of prepared){tx.objectStore('photos').put(p.record);tx.objectStore('blobs').put({key:p.record.key,blob:p.blob});}});window.dispatchEvent(new Event('devicephotoschange'));return {added:prepared.length,skipped};
}
async function number(placeId,preferred,s=scope()){
 member(s);
 const k=[s.owner,String(placeId)];return transaction(['cards'],'readwrite',s,(tx,set)=>{
 const store=tx.objectStore('cards'),req=store.getAll(IDBKeyRange.bound([s.owner,''],[s.owner,'\uffff']));req.onsuccess=()=>{const rows=req.result,old=rows.find(r=>r.key[1]===String(placeId));if(Number.isInteger(old?.number)&&old.number>0){set(old.number);return}const used=new Set(rows.map(r=>r.number).filter(Number.isInteger));const n=Number.isInteger(preferred)&&preferred>0&&!used.has(preferred)?preferred:Math.max(0,...used)+1;store.put({...old,key:k,number:n});set(n)};});
}
async function legacyList(s=scope()){member(s);return transaction(['photos'],'readonly',s,(tx,set)=>{const req=tx.objectStore('photos').index('owner').getAll('guest:'+guest);req.onsuccess=()=>set(req.result)})}
async function legacyGet(row,s=scope()){member(s);if(row.owner!=='guest:'+guest)throw Error('이 브라우저의 이전 게스트 사진만 백업할 수 있어요.');return transaction(['blobs'],'readonly',s,(tx,set)=>{const req=tx.objectStore('blobs').get([row.owner,row.kind,row.placeId,row.id]);req.onsuccess=()=>set(req.result?.blob||null)})}
window.addEventListener('sansaaccountchange',changed);
window.SansaDevicePhotoStore={scope,assert,owner,lock,legacyList,legacyGet,list,get,save,remove,preference,number,restore,hash,thumbnail};
})();
