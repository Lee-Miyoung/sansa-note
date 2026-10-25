/* Small stored-ZIP writer/reader for the versioned photo backup format. No dependency. */
(()=>{'use strict';
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true}),MAX=256*1024*1024;
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
const crc=b=>{let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0};
function bytes(n){const b=new Uint8Array(n);return [b,new DataView(b.buffer)]}
async function pack(files){
 if(files.length>2500)throw Error('한 번에 백업할 수 있는 사진 수를 초과했어요. 사찰별로 백업해 주세요.');
 let offset=0,total=0;const chunks=[],directory=[],names=new Set();
 for(const [name,blob]of files){if(names.has(name)||!validName(name))throw Error('백업 파일 이름이 올바르지 않아요.');names.add(name);total+=blob.size;if(total>MAX)throw Error('백업이256MB를 넘어요. 사찰별로 나누어 백업해 주세요.');
 const nameBytes=enc.encode(name),checksum=crc(new Uint8Array(await blob.arrayBuffer()));let [h,v]=bytes(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,2048,true);v.setUint16(12,33,true);v.setUint32(14,checksum,true);v.setUint32(18,blob.size,true);v.setUint32(22,blob.size,true);v.setUint16(26,nameBytes.length,true);chunks.push(h,nameBytes,blob);
 let [c,w]=bytes(46);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,2048,true);w.setUint16(14,33,true);w.setUint32(16,checksum,true);w.setUint32(20,blob.size,true);w.setUint32(24,blob.size,true);w.setUint16(28,nameBytes.length,true);w.setUint32(42,offset,true);directory.push(c,nameBytes);offset+=30+nameBytes.length+blob.size;
 }
 const dirSize=directory.reduce((n,b)=>n+b.length,0),[end,v]=bytes(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,dirSize,true);v.setUint32(16,offset,true);return new Blob([...chunks,...directory,end],{type:'application/zip'});
}
function validName(n){return n==='manifest.json'||/^(photos|thumbnails)\/[a-zA-Z0-9-]+\.jpg$/.test(n)}
async function unpack(file){
 if(!(file instanceof Blob)||file.size<22||file.size>MAX)throw Error('지원하는 사진 백업 ZIP(최대256MB)을 선택해 주세요.');
 const tail=new Uint8Array(await file.slice(Math.max(0,file.size-65557)).arrayBuffer()),tv=new DataView(tail.buffer);let at=-1;
 for(let i=tail.length-22;i>=0;i--)if(tv.getUint32(i,true)===0x06054b50&&i+22+tv.getUint16(i+20,true)===tail.length){at=i;break;}
 if(at<0)throw Error('ZIP 끝 정보를 읽지 못했어요.');
 const count=tv.getUint16(at+10,true),size=tv.getUint32(at+12,true),start=tv.getUint32(at+16,true);
 if(tv.getUint16(at+4,true)||tv.getUint16(at+6,true)||count!==tv.getUint16(at+8,true)||count>2500||size>2*1024*1024||start+size>file.size-tail.length+at)throw Error('지원하지 않는 ZIP 구조예요.');
 const raw=await file.slice(start,start+size).arrayBuffer(),d=new DataView(raw),entries=new Map();let pos=0,total=0;
 for(let i=0;i<count;i++){
 if(pos+46>size||d.getUint32(pos,true)!==0x02014b50)throw Error('ZIP 목록이 손상되었어요.');const flags=d.getUint16(pos+8,true),method=d.getUint16(pos+10,true),compressed=d.getUint32(pos+20,true),length=d.getUint32(pos+24,true),n=d.getUint16(pos+28,true),extra=d.getUint16(pos+30,true),comment=d.getUint16(pos+32,true),offset=d.getUint32(pos+42,true),checksum=d.getUint32(pos+16,true);
 if(pos+46+n+extra+comment>size||method!==0||(flags&~2048)||compressed!==length||offset+30>start||length>2*1024*1024)throw Error('내 사진 백업하기로 만든 ZIP 파일을 선택해 주세요.');
 const name=dec.decode(new Uint8Array(raw,pos+46,n));if(!validName(name)||entries.has(name))throw Error('중복되거나 잘못된 백업 파일 이름이에요.');total+=length;if(total>MAX)throw Error('백업 용량이 너무 커요.');entries.set(name,{offset,length,checksum,flags,method,name});pos+=46+n+extra+comment;
 }
 if(pos!==size)throw Error('ZIP 목록 크기가 올바르지 않아요.');
 async function read(name){const e=entries.get(name);if(!e)throw Error('백업 파일이 빠져 있어요.');const h=new DataView(await file.slice(e.offset,e.offset+30).arrayBuffer());if(h.getUint32(0,true)!==0x04034b50||h.getUint16(6,true)!==e.flags||h.getUint16(8,true)!==0)throw Error('ZIP 파일 헤더가 손상되었어요.');const n=h.getUint16(26,true),extra=h.getUint16(28,true),from=e.offset+30+n+extra;if(from+e.length>start)throw Error('백업 파일 범위가 올바르지 않아요.');const localName=dec.decode(await file.slice(e.offset+30,e.offset+30+n).arrayBuffer());if(localName!==name)throw Error('백업 파일 이름이 일치하지 않아요.');const blob=file.slice(from,from+e.length,'image/jpeg');if(crc(new Uint8Array(await blob.arrayBuffer()))!==e.checksum)throw Error('백업 파일이 손상되었어요.');return blob;}
 return {read,names:[...entries.keys()]};
}
window.SansaPhotoZIP={pack,unpack};
})();
