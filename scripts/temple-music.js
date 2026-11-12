/* One player, one song list and one lyric view for every Sansanote song. */
(()=>{
  'use strict';
  const audio=document.getElementById('playlistAudio'),playlist=document.getElementById('playlistOverlay');
  if(!audio||!playlist)return;
  audio.preload='none';
  const legacy=SONGS.map(song=>({...song})),body=playlist.querySelector('.modal-body');
  let catalog=[],ready=false;
  const actions=document.createElement('div');actions.className='music-share-actions';
  actions.innerHTML='<button type="button" class="btn btn-ghost" id="playlistMusicShare">이 노래 공유</button><button type="button" class="btn btn-ghost" id="templeMusicTemple" hidden>이 절 둘러보기</button><p id="playlistMusicStatus" role="status"></p>';
  body.append(actions);
  const status=document.getElementById('playlistMusicStatus'),templeButton=document.getElementById('templeMusicTemple');
  const current=()=>SONGS[currentSongIdx];
  function sync(){
    const song=current();
    playlist.querySelector('.modal-head h2').textContent=song?.templeId?'산사 음악방':'극락왕생 플레이리스트';
    templeButton.hidden=!song?.templeId;
  }
  function hush(){window.sansaMeditationSound?.stop();for(const other of document.querySelectorAll('audio'))if(other!==audio)other.pause();}
  const originalLoad=window.loadSong;
  window.loadSong=function(index,autoplay){if(!SONGS[index])return;if(autoplay||!audio.paused)hush();const result=originalLoad(index,autoplay);sync();return result;};
  function selectInfo(id){
    const index=SONGS.findIndex(song=>song.musicId===id);
    if(index<0){status.textContent='곡을 찾지 못했어요. 잠시 후 다시 열어 주세요.';return;}
    if(index!==currentSongIdx||!audio.getAttribute('src')){audio.pause();loadSong(index,false);}
    else if(!document.getElementById('lyricsInner').childElementCount)renderPlaylistLyrics();
    sync();
  }
  function play(index=currentSongIdx){
    if(!SONGS[index])return;hush();
    if(index!==currentSongIdx||!audio.getAttribute('src'))loadSong(index,true);
    else if(audio.paused)audio.play().catch(()=>{status.textContent='음원을 재생하지 못했어요. 연결 상태를 확인하고 다시 눌러 주세요.';});
    else audio.pause();
    sync();
  }
  const originalOpen=window.openPlaylistOverlay;
  window.openPlaylistOverlay=function(){
    document.body.append(playlist);playlist.style.zIndex='2147483647';
    const result=originalOpen();playlist.scrollTop=0;playlist.querySelector('.modal').scrollTop=0;body.scrollTop=0;sync();return result;
  };
  window.openSansaMusicRoom=function(id){
    openPlaylistOverlay();
    const choose=()=>{
      if(!playlist.classList.contains('show'))return;
      const target=id||current()?.templeId&&current().musicId||SONGS.find(song=>song.templeId)?.musicId;
      if(target)selectInfo(target);
    };
    if(ready)choose();else loaded.then(choose);
  };
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
    catalog.sort((a,b)=>{const rank=song=>{const i=legacy.findIndex(item=>new URL(item.src,location.href).pathname===song.audioUrl);return i<0?10000:i;};return rank(a)-rank(b);});
    const unified=catalog.map(song=>{
      const old=legacy.find(item=>new URL(item.src,location.href).pathname===song.audioUrl);
      const lyrics=Array.isArray(song.lyrics)?song.lyrics.filter(line=>line&&typeof line.text==='string'&&(line.t===null||Number.isFinite(line.t)&&line.t>=0)).map(line=>({...line})):old?.lyrics||[];
      return {...old,...song,src:song.audioUrl,lyrics};
    });
    if(unified.length){SONGS=unified;currentSongIdx=Math.max(0,SONGS.findIndex(song=>song.audioUrl===source));}
    ready=true;
    // A catalog arriving after first open must also update the already visible lyric view.
    if(playlist.classList.contains('show')){renderSongPicks();renderPlaylistLyrics();sync();}
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
  window.SansaTempleMusic={ready:loaded,open:window.openSansaMusicRoom,close:window.closePlaylistOverlay,play,selectInfo,get catalog(){return catalog;},get media(){return audio;}};
})();
