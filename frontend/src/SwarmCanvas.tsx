import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { groups, type Sim } from './swarm';
import { useLanguage } from './i18n';

type Props = { sim:Sim; round:number; dimension:number; threshold:number; mode:'survey'|'opinion'|'adoption'; adoption:boolean[][]; responded:Set<number>; selected:number|null; onSelect:(i:number)=>void };
type Dot = {x:number;y:number;vx:number;vy:number};
type Pulse = {source:number; target:number; start:number; survey:boolean};

export default function SwarmCanvas(props:Props){
  const {t,language}=useLanguage();
  const languageRef=useRef(language);languageRef.current=language;
  const canvas=useRef<HTMLCanvasElement>(null), dots=useRef<Dot[]>([]), live=useRef(props), pulses=useRef<Pulse[]>([]);
  const [fps,setFps]=useState<number|null>(null);
  const prior=useRef({round:props.round, responded:props.responded, mode:props.mode, sim:props.sim});
  live.current=props;
  useEffect(()=>{
    const previous=prior.current;
    const now=performance.now();
    if(previous.sim!==props.sim || previous.mode!==props.mode) pulses.current=[];
    else if(props.mode!=='survey' && props.round===previous.round+1){
      pulses.current=props.sim.interactions[props.round].filter(x=>x.dimension===props.dimension && Math.abs(x.change)>0.00001).slice(0,45).map(x=>({source:x.source,target:x.target,start:now,survey:false}));
    }else if(props.mode==='survey'){
      pulses.current=[...props.responded].filter(i=>!previous.responded.has(i)).slice(0,25).map(i=>({source:i,target:-1,start:now,survey:true}));
    }
    prior.current={round:props.round,responded:props.responded,mode:props.mode,sim:props.sim};
  },[props.round,props.responded,props.sim,props.mode,props.dimension]);

  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const ctx=el.getContext('2d');if(!ctx)return;
    let w=0,h=0,dpr=1,raf=0,alpha=1,frameCount=0,lastFps=performance.now();
    const resize=()=>{
      const rect=el.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(window.devicePixelRatio||1,2);
      el.width=Math.max(1,Math.round(w*dpr));el.height=Math.max(1,Math.round(h*dpr));
      dots.current=[];alpha=1;
    };
    const obs=new ResizeObserver(resize);obs.observe(el);resize();
    const frame=(now:number)=>{
      const {sim,round,dimension,threshold,mode,responded,selected,adoption}=live.current;
      const cx=w/2,cy=h/2;
      const center=(group:number)=>{const angle=group*2*Math.PI/groups.length-Math.PI/2;return {x:cx+Math.cos(angle)*w*.32,y:cy+Math.sin(angle)*h*.32}};
      if(dots.current.length!==sim.agents.length){
        const counts=Array(groups.length).fill(0);dots.current=sim.agents.map(a=>{const j=counts[a.group]++,p=center(a.group),angle=j*2.399963,r=6+Math.sqrt(j)*5;return {x:p.x+Math.cos(angle)*r,y:p.y+Math.sin(angle)*r,vx:0,vy:0}});alpha=1;
      }
      const nodes=dots.current;
      // Layout only: motion never changes opinions or the seeded simulation.
      for(let i=0;i<nodes.length;i++){
        const n=nodes[i],p=center(sim.agents[i].group);n.vx+=(p.x-n.x)*.012*alpha;n.vy+=(p.y-n.y)*.012*alpha;
        for(let j=i+1;j<nodes.length;j++){
          const other=nodes[j],dx=n.x-other.x,dy=n.y-other.y,dist2=dx*dx+dy*dy;
          if(dist2<400 && dist2>.01){const force=400/dist2*.007*alpha;n.vx+=dx*force;n.vy+=dy*force;other.vx-=dx*force;other.vy-=dy*force;}
        }
      }
      sim.agents.forEach((agent,i)=>agent.edges.forEach(j=>{
        const a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1,force=(dist-34)*.005*alpha;
        a.vx+=dx/dist*force;a.vy+=dy/dist*force;b.vx-=dx/dist*force;b.vy-=dy/dist*force;
      }));
      nodes.forEach(n=>{n.vx*=.84;n.vy*=.84;n.x=Math.max(12,Math.min(w-12,n.x+n.vx));n.y=Math.max(12,Math.min(h-12,n.y+n.vy));});alpha*=.992;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#132c23';ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1;
      for(let x=0;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      groups.forEach((_,i)=>{const p=center(i),g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,85);g.addColorStop(0,'rgba(159,194,166,.09)');g.addColorStop(1,'rgba(159,194,166,0)');ctx.fillStyle=g;ctx.fillRect(p.x-85,p.y-85,170,170);});
      ctx.lineWidth=.55;ctx.strokeStyle='rgba(175,203,182,.13)';ctx.beginPath();
      sim.agents.forEach((a,i)=>a.edges.forEach(j=>{ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y)}));ctx.stroke();
      if(mode==='survey'){
        ctx.strokeStyle='rgba(197,225,195,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d8e8d3';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText(languageRef.current==='nl'?'ENQUÊTE':'SURVEY',cx,cy+4);
      }
      nodes.forEach((n,i)=>{
        const value=sim.snapshots[round][i][dimension];ctx.globalAlpha=mode==='survey'&&!responded.has(i)?.25:1;
        ctx.fillStyle=mode==='survey'?'#b7d4b9':mode==='adoption'?(adoption[round][i]?'#8fcb9d':'#ec8a78'):value>=threshold?'#8fcb9d':value<threshold-.16?'#ec8a78':'#98a99f';
        ctx.beginPath();ctx.arc(n.x,n.y,selected===i?5.5:3,0,Math.PI*2);ctx.fill();
        if(selected===i){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();}
      });ctx.globalAlpha=1;
      pulses.current=pulses.current.filter(p=>now-p.start<550);
      pulses.current.forEach(p=>{const a=nodes[p.source],b=p.survey?{x:cx,y:cy}:nodes[p.target],t=Math.min(1,(now-p.start)/450);ctx.fillStyle='rgba(234,246,198,'+(1-t)+')';ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,3,0,Math.PI*2);ctx.fill();});
      frameCount++;if(now-lastFps>=1500){setFps(Math.round(frameCount*1000/(now-lastFps)));lastFps=now;frameCount=0;}
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);obs.disconnect()};
  },[props.sim]);
  const pick=(e:MouseEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;let best=-1, distance=15;dots.current.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;best=i;}});if(best>=0)props.onSelect(best);};
  return <div className="swarm-visual"><canvas ref={canvas} onClick={pick} role="img" aria-label={t('Geanimeerd netwerk van synthetische agenten. Gebruik de profielkeuze onder de grafiek voor toetsenbordbediening.','Animated network of synthetic agents. Use the profile selector below the chart for keyboard access.')}/><div className="swarm-hud"><span>{props.mode==='survey'?t('ENQUÊTE','SURVEY'):props.mode==='adoption'?t('FICTIEF GEBRUIK','FICTIONAL USE'):t('MENINGEN','OPINIONS')} · {props.sim.agents.length} {t('AGENTEN','AGENTS')}</span><span>{fps===null?t('FPS meten…','Measuring FPS…'):`${fps} FPS · ${t('gemeten','measured')}`}</span></div><div className="visual-legend">{props.mode==='survey'?<><span><i className="legend-light"/> {t('Antwoord getoond','Response shown')}</span><span><i className="legend-dim"/> {t('Nog niet getoond','Not yet shown')}</span></>:props.mode==='adoption'?<><span><i className="legend-pos"/> {t('Zou gebruiken','Would use')}</span><span><i className="legend-neg"/> {t('Zou niet gebruiken','Would not use')}</span></>:<><span><i className="legend-neg"/> {t('Links','Left')}</span><span><i className="legend-mid"/> {t('Midden','Middle')}</span><span><i className="legend-pos"/> {t('Rechts','Right')}</span></>}</div></div>;
}
