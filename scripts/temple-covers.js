/* Canonical catalog identities only. Never changes saved photographs or user IDs. */
(()=>{
 const entries=Object.freeze({
  'temple:해인사':Object.freeze({id:'temple:해인사',name:'해인사',region:'경상',file:'haeinsa-hapcheon.webp'}),
  'temple:관음사':Object.freeze({id:'temple:관음사',name:'관음사',region:'제주',file:'gwaneumsa-jeju.webp'}),
  'temple:개암사':Object.freeze({id:'temple:개암사',name:'개암사',region:'전라',file:'gaeamsa-buan.webp'})
 });
 function find(place){
  if(!place||typeof place.name!=='string')return null;
  const id='temple:'+place.name.normalize('NFC'),entry=entries[id];
  return entry&&place.region===entry.region?entry:null;
 }
 function failed(img){
  const holder=img.parentElement;if(holder)holder.dataset.templeCoverId=img.dataset.templeCoverId;
  const status=holder?.querySelector('.place-fallback-status');if(status)status.textContent='수채화를 불러오지 못했어요. 다시 열어 주세요.';
  img.remove();
 }
 const style=document.createElement('style');style.textContent='#catalogOverlay .catalog-thumb>a.temple-cover-credit,#app #mainPinnedGrid .card-photo>a.temple-cover-credit,#app #grid .card-photo>a.temple-cover-credit{position:absolute!important;inset:auto!important;bottom:3px!important;left:50%!important;transform:translateX(-50%)!important;width:max-content!important;max-width:calc(100% - 4px)!important;height:auto!important;min-height:0!important;z-index:7;font:9px/1.5 sans-serif!important;white-space:nowrap;background:#244d3eb3;color:#fff!important;border-radius:4px;padding:2px 5px!important;text-decoration:underline}.temple-watercolor-cover{transition:none!important;opacity:1!important}';document.head.append(style);
 window.sansaTempleCovers=Object.freeze({find,failed,entries});
})();
