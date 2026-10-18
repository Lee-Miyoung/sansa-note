/* Canonical catalog identities only. Never changes saved photographs or user IDs. */
(()=>{
 const entries=Object.freeze({
  "temple:해인사":Object.freeze({"id":"temple:해인사","name":"해인사","region":"경상","file":"haeinsa-hapcheon.webp"}),
  "temple:관음사":Object.freeze({"id":"temple:관음사","name":"관음사","region":"제주","file":"gwaneumsa-jeju.webp"}),
  "temple:개암사":Object.freeze({"id":"temple:개암사","name":"개암사","region":"전라","file":"gaeamsa-buan.webp"}),
  "temple:갑사":Object.freeze({"id":"temple:갑사","name":"갑사","region":"충청","file":"gapsa-gongju.webp"}),
  "temple:개심사":Object.freeze({"id":"temple:개심사","name":"개심사","region":"충청","file":"gaesimsa-seosan.webp"}),
  "temple:건봉사":Object.freeze({"id":"temple:건봉사","name":"건봉사","region":"강원","file":"geonbongsa-goseong.webp"}),
  "temple:고운사":Object.freeze({"id":"temple:고운사","name":"고운사","region":"경상","file":"gounsa-uiseong.webp"})
 });
 function find(place){
  if(!place||typeof place.name!=='string')return null;
  const id='temple:'+place.name.normalize('NFC'),entry=entries[id];
  return entry&&place.region===entry.region?entry:null;
 }
 function failed(img){
  const holder=img.parentElement;if(holder)holder.dataset.templeCoverId=img.dataset.templeCoverId;
  if(!img.dataset.localRetry){img.dataset.localRetry='1';setTimeout(()=>{if(img.isConnected)img.src='/images/temple-covers/'+img.src.split('/').pop().split('?')[0]+'?retry=1';},500);return;}
  img.remove();
 }
 const style=document.createElement('style');style.textContent=`
 #catalogOverlay .catalog-card:has(.catalog-thumb[data-photo-kind="temple"]){grid-template-columns:120px minmax(0,1fr) auto!important;column-gap:14px!important}
 #catalogOverlay .catalog-thumb[data-photo-kind="temple"]{width:120px!important;height:80px!important;min-height:80px!important;flex:0 0 120px!important;aspect-ratio:3/2;border-radius:12px!important}
 .temple-watercolor-underlay{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse at 20% 80%,#b9c7ab88,transparent 65%),linear-gradient(130deg,#f8f4e8,#e8ecdf);pointer-events:none}
 .temple-watercolor-cover{transition:none!important;opacity:1!important;object-fit:cover!important;object-position:center!important}
 #app .card-photo:has(.temple-watercolor-cover){aspect-ratio:3/2;height:auto!important}
 .temple-art-information{padding:14px 4px;font-size:12px;color:#748069}.temple-art-information a{color:inherit}
 @media(max-width:700px){#catalogOverlay .catalog-card:has(.catalog-thumb[data-photo-kind="temple"]){grid-template-columns:96px minmax(0,1fr)!important;grid-template-areas:"thumb copy" "thumb actions"!important;column-gap:12px!important;row-gap:8px!important}#catalogOverlay .catalog-thumb[data-photo-kind="temple"]{width:96px!important;height:64px!important;min-height:64px!important;flex-basis:96px!important}}
 `;document.head.append(style);
 const info=document.createElement('div');info.className='temple-art-information';info.innerHTML='<a href="/images/temple-covers/CREDITS.html" target="_blank" rel="noopener">이미지 이용 안내</a>';document.querySelector('#catalogOverlay .modal-body')?.append(info);
 window.sansaTempleCovers=Object.freeze({find,failed,entries});
})();
