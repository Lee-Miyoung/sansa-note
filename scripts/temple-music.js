/* Separate collections and screens; the same controls and audio engine avoid overlap. */
(()=>{
  'use strict';
  const audio=document.getElementById('playlistAudio'),playlist=document.getElementById('playlistOverlay');
  if(!audio||!playlist)return;
  audio.preload='none';
  const legacy=SONGS.map(song=>({...song})),modal=playlist.querySelector('.modal'),body=modal.querySelector('.modal-body');
  const room=document.createElement('div');room.id='musicRoomOverlay';room.className=playlist.className;
  room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','산사 음악방');room.setAttribute('aria-hidden','true');document.body.append(room);
  const shells=[playlist,room],remembered={playlist:null,temple:null};
  let catalog=[],ready=false,collection='playlist';
  const kindOf=song=>song?.templeId?'temple':'playlist';
  const indices=(kind=collection)=>SONGS.map((song,index)=>kindOf(song)===kind?index:-1).filter(index=>index>=0);
  const identity=song=>song?.musicId||song?.title;
  function mount(){const target=collection==='temple'?room:playlist;target.append(modal);return target;}
  window.renderSongPicks=function(){
    const wrap=document.getElementById('songOrderList');if(!wrap)return;
    wrap.innerHTML=indices().map((index,position)=>{const song=SONGS[index],label=song.templeId?(song.templeName||song.templeId.replace('temple:',''))+' · '+song.title:song.title;return `<div class="song-sort-item" data-title="${escapeAttr(song.title)}"><button class="song-drag-handle" type="button" aria-label="노래 순서 바꾸기">☰</button><button class="btn btn-ghost song-pick ${index===currentSongIdx?'active':''}" onclick="loadSong(${index})">${position+1}. ${escapeHtml(label)}</button></div>`;}).join('');
    if(wrap._sortable)wrap._sortable.destroy();
    if(window.Sortable)wrap._sortable=new Sortable(wrap,{animation:160,handle:'.song-drag-handle',delay:80,delayOnTouchOnly:true,touchStartThreshold:3,forceFallback:true,fallbackTolerance:3,onEnd:()=>{
      const current=SONGS[currentSongIdx],byTitle=new Map(SONGS.map(song=>[song.title,song]));
      const ordered=[...wrap.querySelectorAll('.song-sort-item')].map(node=>byTitle.get(node.dataset.title));let cursor=0;
      SONGS=SONGS.map(song=>kindOf(song)===collection?ordered[cursor++]:song);currentSongIdx=SONGS.indexOf(current);
      try{localStorage.setItem(SONG_ORDER_KEY,JSON.stringify(SONGS.map(song=>song.title)));}catch(_){}renderSongPicks();
    }});
  };
  const actions=document.createElement('div');actions.className='music-share-actions';
  actions.innerHTML='<button type="button" class="btn btn-ghost" id="playlistMusicShare">이 노래 공유</button><button type="button" class="btn btn-ghost" id="templeMusicTemple" hidden>이 절 둘러보기</button><p id="playlistMusicStatus" role="status"></p>';
  body.append(actions);
  const status=document.getElementById('playlistMusicStatus'),templeButton=document.getElementById('templeMusicTemple');
  const current=()=>SONGS[currentSongIdx];
  function sync(){
    const song=current(),temple=song?.templeName||song?.templeId?.replace('temple:','');
    modal.querySelector('.modal-head h2').textContent=collection==='temple'?'산사 음악방':'극락왕생 플레이리스트';
    modal.querySelector('.room-eyebrow').textContent=collection==='temple'?'SANSANOTE · TEMPLE MUSIC':'SANSANOTE · LISTENING CLUB';
    document.getElementById('playlistSongTitle').textContent=kindOf(song)==='temple'?temple+' · '+song.title:song?.title||'';
    document.getElementById('miniPlayerTitle').textContent=document.getElementById('playlistSongTitle').textContent;
    templeButton.hidden=collection!=='temple'||!song?.templeId;
    for(const shell of shells)shell.classList.toggle('is-playing',!audio.paused&&!audio.ended);
  }
  function hush(){window.sansaMeditationSound?.stop();for(const other of document.querySelectorAll('audio'))if(other!==audio)other.pause();}
  const originalLoad=window.loadSong;
  window.loadSong=function(index,autoplay){
    if(!SONGS[index])return;
    const kind=kindOf(SONGS[index]),wasOpen=shells.some(shell=>shell.classList.contains('show'));
    if(kind!==collection){collection=kind;const target=mount();if(wasOpen)for(const shell of shells){shell.classList.toggle('show',shell===target);shell.setAttribute('aria-hidden',String(shell!==target));}}
    if(autoplay||!audio.paused)hush();
    remembered[kind]=identity(SONGS[index]);const result=originalLoad(index,autoplay);sync();return result;
  };
  function selectTrack(index){if(index!==currentSongIdx||!audio.getAttribute('src')){audio.pause();loadSong(index,false);}else renderPlaylistLyrics();}
  const originalOpen=window.openPlaylistOverlay;
  function openCollection(kind,id){
    const available=indices(kind);if(!available.length){showToast('아직 등록된 사찰 노래가 없어요.');return;}
    collection=kind;
    let index=id?available.find(index=>identity(SONGS[index])===id):undefined;
    if(index===undefined)index=available.find(index=>identity(SONGS[index])===remembered[kind]);
    if(index===undefined)index=available.includes(currentSongIdx)?currentSongIdx:available[0];
    const target=mount();selectTrack(index);originalOpen();
    for(const shell of shells){shell.classList.toggle('show',shell===target);shell.setAttribute('aria-hidden',String(shell!==target));}
    target.style.zIndex='2147483647';target.scrollTop=0;modal.scrollTop=0;body.scrollTop=0;
    renderSongPicks();sync();lastLyricIdx=-1;updatePlaylistProgress();syncMiniPlayerVisibility();
  }
  window.openPlaylistOverlay=()=>openCollection('playlist');
  window.openSansaMusicRoom=function(id){
    const choose=()=>{const song=id?SONGS.find(song=>identity(song)===id):null;openCollection(song?kindOf(song):'temple',id);};
    if(ready)choose();else loaded.then(choose);
  };
  window.openCurrentMusicPlayer=()=>openCollection(kindOf(current()),identity(current()));
  function selectInfo(id){const song=SONGS.find(song=>identity(song)===id);if(!song){status.textContent='곡을 찾지 못했어요.';return;}openCollection(kindOf(song),id);}
  function play(index=currentSongIdx){
    if(!SONGS[index])return;hush();
    if(index!==currentSongIdx||!audio.getAttribute('src'))loadSong(index,true);
    else if(audio.paused)audio.play().catch(()=>{status.textContent='음원을 재생하지 못했어요. 연결 상태를 확인하고 다시 눌러 주세요.';});
    else audio.pause();sync();
  }
  function step(delta){const group=indices(kindOf(current())),position=group.indexOf(currentSongIdx);if(group.length)loadSong(group[(position+delta+group.length)%group.length],true);}
  window.prevSong=()=>step(-1);window.nextSong=()=>step(1);
  // Back/Forward may reveal either shell; reattach its controls without duplicating IDs.
  const observeShell=new MutationObserver(()=>{
    const shown=shells.find(shell=>shell.classList.contains('show'));
    if(shown&&modal.parentElement!==shown){openCollection(shown===room?'temple':'playlist');}
    syncMiniPlayerVisibility();
  });
  for(const shell of shells)observeShell.observe(shell,{attributes:true,attributeFilter:['class']});
  for(const event of ['play','pause','ended'])audio.addEventListener(event,sync);
  for(const event of ['seeked','loadedmetadata'])audio.addEventListener(event,updatePlaylistProgress);
  const link=()=>location.origin+'/?music='+encodeURIComponent(current()?.musicId||'');
  async function copyLink(){
    try{await navigator.clipboard.writeText(link());status.textContent='공유 링크를 복사했어요.';}
    catch(_){const input=document.createElement('input');input.readOnly=true;input.value=link();input.setAttribute('aria-label','복사할 음악 공유 링크');status.replaceChildren(input);input.focus();input.select();}
  }
  document.getElementById('playlistMusicShare').onclick=()=>{
    if(navigator.share)navigator.share({title:current()?.title||'산사 음악방',url:link()}).catch(error=>{if(error.name!=='AbortError')copyLink();});
    else copyLink();
  };
  templeButton.onclick=()=>{
    const song=current();if(!song?.templeId)return;
    const hit=Object.entries(destinations||{}).find(([,place])=>place.placeId===song.templeId||'temple:'+place.name===song.templeId);
    if(hit){closePlaylistOverlay();openDetail(hit[0]);}else showToast('절 둘러보기에서 '+(song.templeName||'해당 사찰')+'를 찾아보세요.');
  };
  audio.addEventListener('error',()=>{status.textContent='음원을 불러오지 못했어요. 연결 상태를 확인해 주세요.';});
  const loaded=fetch('/music/catalog.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(rows=>{
    if(!Array.isArray(rows))throw Error();
    const used=new Set();
    catalog=rows.filter(song=>{
      if(!song||song.published!==true||!/^[-a-z0-9]+$/.test(song.musicId)||used.has(song.musicId)||typeof song.title!=='string'||typeof song.artist!=='string'||!/^\/(?!\/)[a-zA-Z0-9/_-]+\.(mp3|m4a|wav|ogg)$/.test(song.audioUrl)||!/^\/(?!\/)[a-zA-Z0-9/_-]+\.(webp|png|jpg)$/.test(song.coverUrl))return false;
      const old=legacy.find(item=>new URL(item.src,location.href).pathname===song.audioUrl);
      if((!old||song.templeId)&&song.rightsConfirmed!==true)return false;
      used.add(song.musicId);return true;
    });
    const source=audio.getAttribute('src')?new URL(audio.src).pathname:null;
    let order=[];try{const saved=JSON.parse(localStorage.getItem(SONG_ORDER_KEY)||'[]');if(Array.isArray(saved))order=saved;}catch(_){}
    catalog.sort((a,b)=>{const rank=song=>{const saved=order.indexOf(song.title);if(saved>=0)return saved;const i=legacy.findIndex(item=>new URL(item.src,location.href).pathname===song.audioUrl);return i<0?20000:10000+i;};return rank(a)-rank(b);});
    const unified=catalog.map(song=>{
      const old=legacy.find(item=>new URL(item.src,location.href).pathname===song.audioUrl);
      const lyrics=Array.isArray(song.lyrics)?song.lyrics.filter(line=>line&&typeof line.text==='string'&&(line.t===null||Number.isFinite(line.t)&&line.t>=0)).map(line=>({...line})):old?.lyrics||[];
      return {...old,...song,src:song.audioUrl,lyrics};
    });
    if(unified.length){SONGS=unified;currentSongIdx=Math.max(0,SONGS.findIndex(song=>song.audioUrl===source));}
    ready=true;
    // A catalog arriving after first open must also update the already visible lyric view.
    if(shells.some(shell=>shell.classList.contains('show'))){renderSongPicks();renderPlaylistLyrics();sync();}
    const id=new URLSearchParams(location.search).get('music');if(id)openSansaMusicRoom(id);
    return catalog;
  }).catch(()=>{status.textContent='음악 목록 연결을 확인해 주세요. 기존 플레이리스트는 그대로 이용할 수 있어요.';return [];});
  const originalDetail=window.openDetail;
  window.openDetail=function(id,...args){
    const result=originalDetail(id,...args);document.getElementById('templeSongButton')?.remove();
    loaded.then(()=>{
      const place=destinations[id];if(currentDetailId!==id||!place)return;
      const song=SONGS.find(song=>song.templeId&&(song.templeId===place.placeId||song.templeId==='temple:'+place.name));if(!song)return;
      const button=document.createElement('button');button.id='templeSongButton';button.className='btn btn-ghost';button.textContent='이 절의 노래 듣기';button.onclick=()=>openSansaMusicRoom(song.musicId);document.getElementById('dName')?.parentElement.append(button);
    });return result;
  };
  window.addEventListener('sansaaccountchange',()=>{syncLyricAdminAccess();});
  window.SansaTempleMusic={ready:loaded,open:window.openSansaMusicRoom,close:window.closePlaylistOverlay,play,selectInfo,get catalog(){return catalog;},get media(){return audio;},get activeCollection(){return collection;}};
})();
