/* Native scroll snapping: no touch interception, autoplay, or stored user data. */
(()=>{
 const root=document.getElementById('homeAtlasEntry'),track=document.getElementById('homeAtlasTrack');if(!root||!track)return;
 const dots=[...root.querySelectorAll('[data-atlas-slide]')],prev=root.querySelector('#homeAtlasPrev'),next=root.querySelector('#homeAtlasNext'),page=root.querySelector('#homeAtlasPage');let active=0,frame=0;
 function render(){dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===active)));prev.disabled=active===0;next.disabled=active===dots.length-1;page.textContent=(active+1)+' / '+dots.length;}
 function select(i){active=Math.max(0,Math.min(dots.length-1,i));track.scrollTo({left:active*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});render();}
 track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!track.clientWidth)return;active=Math.max(0,Math.min(dots.length-1,Math.round(track.scrollLeft/track.clientWidth)));render();});},{passive:true});
 prev.addEventListener('click',()=>select(active-1));next.addEventListener('click',()=>select(active+1));dots.forEach((d,i)=>d.addEventListener('click',()=>select(i)));
 track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();select(active+(e.key==='ArrowRight'?1:-1));}});
 function resized(){if(track.clientWidth)track.scrollTo({left:active*track.clientWidth,behavior:'auto'});}
 if('ResizeObserver'in window)new ResizeObserver(resized).observe(track);else window.addEventListener('resize',resized);render();
})();
