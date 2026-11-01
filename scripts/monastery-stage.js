/* A viewport-sized stage, a shared ritual rail, and explicit-gesture original sound. */
(() => {
  'use strict';
  const ids=['onlineSansaOverlay','dharmaHallOverlay','mindRestOverlay','oracleOverlay'];
  const root=document.documentElement, hall=document.getElementById('dharmaHallOverlay');
  if(!hall||!window.SansaHallUX)return;
  function viewport(){const v=window.visualViewport;root.style.setProperty('--monastery-vh',(v?.height||innerHeight)+'px');root.style.setProperty('--monastery-vw',(v?.width||innerWidth)+'px');root.style.setProperty('--monastery-top',(v?.offsetTop||0)+'px');root.style.setProperty('--monastery-left',(v?.offsetLeft||0)+'px');root.dataset.monasteryCompact=String((v?.height||innerHeight)<700);}
  viewport();window.addEventListener('resize',viewport,{passive:true});window.visualViewport?.addEventListener('resize',viewport,{passive:true});window.visualViewport?.addEventListener('scroll',viewport,{passive:true});
  function retire(id){if(id==='dharmaHallOverlay')SansaDharmaHall.close();else if(id==='onlineSansaOverlay')window.closeOnlineSansa?.();else if(id==='oracleOverlay')window.closeOracleOverlay?.();else{const el=document.getElementById(id);el?.classList.remove('show');el?.setAttribute('aria-hidden','true');}}
  const observer=new MutationObserver(changes=>{
    const opened=changes.filter(c=>c.target.classList.contains('show')&&!String(c.oldValue).split(/\s+/).includes('show')).at(-1)?.target;
    if(!opened)return;
    for(const id of ids)if(id!==opened.id&&document.getElementById(id)?.classList.contains('show'))retire(id);
    viewport();const modal=opened.querySelector('.modal');if(modal)modal.scrollTop=0;
    for(const node of opened.querySelectorAll('.modal-body,.hall-guidance'))node.scrollTop=0;
    opened.querySelector('.close-x')?.focus({preventScroll:true});
  });
  for(const id of ids){const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class'],attributeOldValue:true});}

  hall.classList.add('hall-immersive');
  const art=hall.querySelector('.hall-art'),guide=hall.querySelector('.hall-guidance');
  // Keep room/free-prayer switches in the utility row, without covering the painting.
  const modeLine=hall.querySelector('.hall-mode-line'),help=document.getElementById('hallHelpOpen');
  for(const id of ['hallCourtyard','hallToFree'])modeLine.insertBefore(document.getElementById(id),help);
  document.getElementById('hallCourtyard').textContent='다른 법당';document.getElementById('hallToFree').textContent='내 속도로';document.getElementById('hallToFree').setAttribute('aria-label','자유 기도로 전환');
  hall.querySelector('.hall-room-links').remove();
  const rail=document.createElement('ol');rail.id='hallRitualRail';rail.setAttribute('aria-label','함께하는 예불 순서');
  const labels=['입장','숨 고르기','삼배','염불','발원','마무리'];
  for(const [i,label]of labels.entries()){const li=document.createElement('li');const n=document.createElement('span');n.textContent=String(i+1);const t=document.createElement('b');t.textContent=label;li.append(n,t);rail.append(li);}
  art.append(rail);
  const beads=document.createElement('div');beads.id='hallParticipationBloom';beads.setAttribute('role','status');beads.hidden=true;art.append(beads);
  const welcome=document.getElementById('hallWelcome');
  const title=welcome.querySelector('h3');title.textContent='잠시, 법당에 함께 앉아요';
  const description=document.createElement('p');description.className='hall-arrival-copy';description.textContent='종의 여운을 따라 자리에 앉고, 무념스님과 한 걸음씩 마음을 모읍니다.';title.after(description);
  const details=document.createElement('details');details.className='hall-first-steps';details.innerHTML='<summary>처음이라면 · 예불 순서 살펴보기</summary>';details.append(welcome.querySelector('ol'));welcome.append(details);
  const enter=document.createElement('button');enter.type='button';enter.id='hallEnterRitual';enter.innerHTML='<span>종을 울리고, 예불에 입장</span><small>창작 종·목탁 소리로 마음 모으기</small>';
  description.after(enter);document.getElementById('hallQuickStart').textContent='조용히 입장할게요';document.getElementById('hallExplain').textContent='예불이 처음이에요';
  enter.onclick=()=>{document.getElementById('hallQuickStart').click();SansaDharmaHall.perform('opening');};
  let lastCount=-1,lastSerial=-1;
  function render(){
    if(!hall.classList.contains('show'))return;
    const s=SansaDharmaHall.state,e=SansaDharmaHall.experience,scheduled=s.session?.kind==='scheduled';
    hall.classList.toggle('hall-before-seat',!s.seated);hall.classList.toggle('hall-is-listening',e.activeTrack?.kind==='chant');
    if(lastSerial!==e.serial){lastSerial=e.serial;lastCount=-1;}
    enter.hidden=scheduled||e.isPreview;
    document.getElementById('hallSeatStatus').textContent=s.seated?'무념스님과 함께, 자리에 앉았습니다.':'법당에 도착했습니다.';
    let index=e.freeStep;
    if(scheduled||e.isPreview){const pose=e.sequence[s.stage]?.pose;index={sit:0,breathe:1,bow:2,listen:3,vow:4,bell:5,quiet:5}[pose]??0;}
    const done=[s.gassho>0,e.stepResults.breath==='done',s.three===3,e.listened>0,s.vowed,s.completed];
    for(const[ i,li]of [...rail.children].entries()){li.classList.toggle('is-current',i===index&&!s.completed);li.classList.toggle('is-done',done[i]);if(i===index&&!s.completed)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');li.firstChild.textContent=done[i]?'✓':String(i+1);}
    rail.hidden=s.mode==='bows'||e.isPreview;
    const count=s.mode==='bows'?s.count:s.three,max=s.mode==='bows'?108:3;
    beads.hidden=!s.seated||!count||s.completed;
    if(count!==lastCount){lastCount=count;beads.replaceChildren();const petals=document.createElement('span');petals.className='hall-earned-petals';petals.setAttribute('aria-hidden','true');petals.textContent=max===3?'✿'.repeat(count)+'○'.repeat(3-count):'✿';const text=document.createElement('b');text.textContent=max===108?'내가 올린 마음 '+count+' / 108배':'직접 함께한 삼배 '+count+' / 3';beads.append(petals,text);}
  }
  const original=window.SansaHallUX.render;window.SansaHallUX.render=()=>{original();render();};
  render();
})();
