/* Lightweight metadata only. Episode runtimes and artwork stay on their own pages. */
(async () => {
  const root = document.getElementById('homeAtlasEntry');
  const track = document.getElementById('homeAtlasTrack');
  if (!root || !track) return;
  root.querySelector('#homeAtlasNext').disabled = true;
  try {
    const response = await fetch('/scripts/atlas/episodes.json', { cache: 'no-store' });
    if (!response.ok) throw Error('Episode list unavailable');
    const episodes = await response.json();
    if (!Array.isArray(episodes) || !episodes.length || episodes.length > 100 ||
        new Set(episodes.map(e => e.id)).size !== episodes.length ||
        episodes.some(e => !/^[a-z][a-z-]*-\d{3}$/.test(e.id) || !/^\d{3}$/.test(e.number) ||
          !/^\/atlas\/(?:[a-z][a-z-]*\/)?$/.test(e.href) ||
          !/^\/(?:atlas\/[a-z-]+|admin-atlas\/images\/secret-atlas)\/(?:images\/)?[a-z0-9-]+-small\.webp$/.test(e.thumbnail) ||
          typeof e.title !== 'string' || e.title.length > 160 || typeof e.temple !== 'string')) throw Error('Invalid episode list');
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text) node.textContent = text;
      return node;
    };
    const allEpisodes=episodes;
    const seasonLabel = root.querySelector('#homeAtlasSeason');
    const seasonIds=[...new Set(allEpisodes.map(e=>e.season||'01'))];
    const titles={'01':'천년의 이야기를 찾아서','02':'사라진 시간의 단서들'};
    const tabs=root.querySelector('#homeAtlasSeasons');
    let selected='',requested='01',stop=()=>{};
    try{requested=localStorage.getItem('sansaAtlasHomeSeason_v1')||'01';}catch(_){}
    const eligible=id=>id==='01'||root.dataset.publicationConfirmed==='true';
    const tabButtons=seasonIds.map(id=>{
      const button=element('button','',`시즌 ${Number(id)}`);button.type='button';button.dataset.season=id;
      button.id='homeAtlasSeasonTab'+id;button.setAttribute('role','tab');button.setAttribute('aria-controls','homeAtlasTrack');
      button.onclick=()=>{requested=id;try{localStorage.setItem('sansaAtlasHomeSeason_v1',id);}catch(_){}refreshSeason();};
      button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
        e.preventDefault();const enabled=tabButtons.filter(b=>!b.hidden);let i=enabled.indexOf(button);
        i=e.key==='Home'?0:e.key==='End'?enabled.length-1:(i+(e.key==='ArrowRight'?1:-1)+enabled.length)%enabled.length;
        enabled[i].focus();enabled[i].click();};
      return button;
    });
    tabs?.replaceChildren(...tabButtons);
    function refreshSeason(){
      const next=seasonIds.includes(requested)&&eligible(requested)?requested:'01';
      tabButtons.forEach(b=>{b.hidden=!eligible(b.dataset.season);b.setAttribute('aria-selected',String(b.dataset.season===next));b.tabIndex=b.dataset.season===next?0:-1;});
      if(seasonLabel)seasonLabel.textContent=`SEASON ${next} · ${titles[next]||''}`;
      if(selected!==next){selected=next;showSeason(next);}
    }
    root.addEventListener('atlaspublicationchange',refreshSeason);
    fetch('/scripts/atlas/seasons.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(seasons=>{
      Object.entries(seasons).forEach(([id,v])=>{if(typeof v?.title==='string')titles[id]=v.title;});refreshSeason();
    }).catch(()=>{});
    function showSeason(id){
    stop();const controller=new AbortController();let observer=null;
    stop=()=>{controller.abort();observer?.disconnect();cancelAnimationFrame(frame);};
    const episodes=allEpisodes.filter(e=>(e.season||'01')===id);
    track.setAttribute('role','tabpanel');track.setAttribute('aria-labelledby','homeAtlasSeasonTab'+id);
    const images = [];
    const cards = episodes.map(e => {
      const card = element('a', 'home-atlas-card'); card.href = e.href;
      card.setAttribute('aria-label', `제${Number(e.number)}화 ${e.temple}, ${e.title}`);
      const copy = element('span', 'home-atlas-copy');
      copy.append(element('b', '', `${String(Number(e.number)).padStart(2,'0')} ${e.temple}`), element('span', '', e.title));
      const image = element('img'); image.alt = `${e.temple} 이야기 표지 삽화`;
      image.width = 720; image.height = 480; image.loading = 'lazy'; image.decoding = 'async';
      images.push({ node: image, url: e.thumbnail }); card.append(copy, image); return card;
    });
    track.replaceChildren(...cards);
    const dots = episodes.map((e, i) => {
      const dot = element('button'); dot.type = 'button'; dot.dataset.atlasSlide = i;
      dot.setAttribute('aria-label', `제${Number(e.number)}화 ${e.temple} 보기`);
      dot.append(element('span')); return dot;
    });
    root.querySelector('.home-atlas-dots').replaceChildren(...dots);
    const prev = root.querySelector('#homeAtlasPrev'), next = root.querySelector('#homeAtlasNext'), page = root.querySelector('#homeAtlasPage');
    let active = 0, frame = 0;
    const stride = () => cards.length > 1 ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left : track.clientWidth;
    const visible = () => !track.clientWidth || !stride() ? (innerWidth>=1100?4:innerWidth>=701?3:1) : Math.min(4,Math.max(1,Math.floor((track.clientWidth+12)/stride()+.01)));
    const maxStart = () => Math.max(0,cards.length-visible());
    const target = i => Math.min(i*stride(),Math.max(0,track.scrollWidth-track.clientWidth));
    function render() {
      dots.forEach((d, i) => {d.hidden=i>maxStart();d.setAttribute('aria-current', String(i === active));});
      prev.disabled = active === 0; next.disabled = active >= maxStart();
      page.textContent = visible()===1 ? `${active + 1} / ${dots.length}` : `${active + 1}–${Math.min(cards.length,active+visible())} / ${dots.length}`;
      // Only nearby thumbnails receive a URL. No episode body, cards or quizzes.
      images.forEach((image, i) => { if (i >= Math.max(0,active-1) && i <= active+Math.max(1,visible()-1) && !image.node.hasAttribute('src')) image.node.src = image.url; });
    }
    function select(i) {
      active = Math.max(0, Math.min(maxStart(), i)); render();
      track.scrollTo({ left: target(active), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
        if (!track.clientWidth) return;
        active = Math.max(0, Math.min(maxStart(), track.scrollLeft>=track.scrollWidth-track.clientWidth-2 ? maxStart() : Math.round(track.scrollLeft / stride()))); render();
      });
    }, { passive: true,signal:controller.signal });
    prev.onclick = () => select(active - 1); next.onclick = () => select(active + 1);
    dots.forEach((d, i) => d.onclick = () => select(i));
    track.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); select(active + (e.key === 'ArrowRight' ? 1 : -1)); } },{signal:controller.signal});
    const resized = () => { if (track.clientWidth) {active=Math.min(active,maxStart());render();track.scrollTo({ left: target(active), behavior: 'auto' });} };
    if ('ResizeObserver' in window){observer=new ResizeObserver(resized);observer.observe(track);}else window.addEventListener('resize',resized,{signal:controller.signal});
    track.scrollTo({left:0,behavior:'auto'});render();root.dataset.catalogReady='true';
    }
    refreshSeason();
  } catch (_) {
    root.querySelector('#homeAtlasPrev').disabled = true;
    root.querySelector('#homeAtlasNext').disabled = true;
    root.querySelector('#homeAtlasPage').textContent = '제1화 바로 열기';
    // Keep the ordinary fallback link usable even with a blocked metadata request.
  }
})();
