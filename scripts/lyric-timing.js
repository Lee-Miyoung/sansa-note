/* Approximate a complete lyric timeline from one or more administrator cues. */
(function(root){
  'use strict';
  const validIndex=key=>/^\d+$/.test(key);
  function durationFor(lyrics,provided){
    if(Number.isFinite(provided)&&provided>1)return provided;
    const known=lyrics.map(line=>line.t).filter(Number.isFinite);
    return Math.max(12,known.length?Math.max(...known)+8:lyrics.filter(line=>!line.text.startsWith('[')).length*3.5+12);
  }
  function baseline(lyrics,provided){
    const duration=durationFor(lyrics,provided),count=lyrics.length;if(!count)return [];
    let times;
    if(lyrics.every(line=>Number.isFinite(line.t)&&line.t>=0)){
      const max=Math.max(...lyrics.map(line=>line.t)),scale=max>=duration?(duration-Math.min(6,duration*.025))/Math.max(1,max):1;
      times=lyrics.map(line=>line.t*scale);
    }else{
      const weights=lyrics.map(line=>line.text.startsWith('[')?2:Math.max(4,Math.min(30,[...line.text.replace(/[\s.,!?—·]/g,'')].length)));
      const total=weights.reduce((a,b)=>a+b,0),lead=Math.min(8,duration*.04),tail=Math.min(6,duration*.025),span=duration-lead-tail;let elapsed=0;
      times=weights.map(weight=>{const time=lead+span*elapsed/total;elapsed+=weight;return time;});
    }
    const epsilon=Math.min(.001,duration/(count*10));let last=-epsilon;
    return times.map((time,index)=>{const next=Math.min(duration-(count-index)*epsilon,Math.max(last+epsilon,time));last=next;return next;});
  }
  function estimate(lyrics,provided,rawAnchors,offset=0,priorityIndex){
    const duration=durationFor(lyrics,provided),base=baseline(lyrics,duration),minimum=-offset,maximum=duration-offset;
    const points=Object.entries(rawAnchors||{}).filter(([key,time])=>validIndex(key)&&Number(key)<base.length&&Number.isFinite(time)&&time>=minimum&&time<=maximum).map(([index,time])=>({index:Number(index),time})).sort((a,b)=>a.index-b.index);
    const pivot=points.find(point=>point.index===priorityIndex);let chosen=[];
    if(pivot){
      let limit=pivot.time;const left=[];
      for(let i=points.indexOf(pivot)-1;i>=0;i--)if(points[i].time<=limit){left.push(points[i]);limit=points[i].time;}
      chosen=[...left.reverse(),pivot];limit=pivot.time;
      for(let i=points.indexOf(pivot)+1;i<points.length;i++)if(points[i].time>=limit){chosen.push(points[i]);limit=points[i].time;}
    }else{
      let limit=minimum;for(const point of points)if(point.time>=limit){chosen.push(point);limit=point.time;}
    }
    const anchors=Object.fromEntries(chosen.map(point=>[point.index,point.time]));
    if(!chosen.length)return {lines:Object.fromEntries(base.map((time,index)=>[index,Math.round(time*10)/10])),anchors};
    const knots=chosen.map(point=>({x:base[point.index],y:point.time}));
    if(knots[0].x>0)knots.unshift({x:0,y:minimum});
    if(knots[knots.length-1].x<duration)knots.push({x:duration,y:maximum});
    let segment=0;
    const lines=Object.fromEntries(base.map((x,index)=>{
      while(segment<knots.length-2&&x>knots[segment+1].x)segment++;
      const a=knots[segment],b=knots[Math.min(segment+1,knots.length-1)];
      const y=Number.isFinite(anchors[index])?anchors[index]:a.y+(b.x===a.x?0:(x-a.x)/(b.x-a.x)*(b.y-a.y));
      return [index,Math.max(minimum,Math.min(maximum,Number.isFinite(anchors[index])?anchors[index]:Math.round(y*10)/10))];
    }));
    return {lines,anchors};
  }
  const api={durationFor,baseline,estimate};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SansaLyricTiming=api;
})(typeof window!=='undefined'?window:globalThis);
