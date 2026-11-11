// A reproducible toy model, not an empirical sample or grid forecast.
export const dims = ['accept', 'refusal', 'payer', 'legit', 'operator', 'fair'] as const;
export type Dim = typeof dims[number];
export const labels: Record<Dim, string> = {accept:'Niet-bindende datum',refusal:'Weigeren boven gokken',payer:'Bereidheid om te betalen',legit:'Onafhankelijke verificatie',operator:'Medewerking netbeheerder',fair:'Eerlijkheid wachtlijst'};
export const groups = [
 ['MKB op wachtlijst',46,[.66,.44,.58,.60,.48,.30],[.58,.60,.52]],
 ['MKB zonder wachtrij',30,[.48,.40,.44,.54,.52,.44],[.50,.62,.44]],
 ['Installateurs',34,[.72,.72,.86,.66,.56,.46],[.68,.52,.56]],
 ['Aggregatoren',24,[.60,.50,.78,.58,.44,.52],[.72,.42,.64]],
 ['Netbeheerders',22,[.40,.66,.20,.28,.26,.70],[.74,.26,.80]],
 ['ACM',12,[.52,.70,.24,.48,.60,.68],[.66,.22,.82]],
 ['Gemeente / provincie',26,[.62,.56,.46,.72,.58,.40],[.62,.44,.60]],
 ['Financiers',18,[.58,.74,.72,.70,.60,.50],[.56,.34,.72]],
 ['Adviesbureaus',16,[.70,.58,.64,.62,.62,.48],[.60,.46,.58]],
 ['Projectontwikkelaars',12,[.64,.52,.80,.56,.50,.34],[.64,.40,.62]],
] as const;
export const events = [
 ['weigering','Een netbeheerder weigert een publieke kaart te publiceren', [0,.06,0,-.06,-.14,0]],
 ['acm','De ACM verscherpt de prioriteringsregels',[-.08,0,-.04,0,0,.10]],
 ['boete','Een adviesbureau krijgt een boete voor een onjuiste claim',[0,.14,.08,.06,0,0]],
 ['vrijval','Er valt capaciteit vrij; bedrijven reageren',[.08,0,.05,0,0,-.10]],
 ['verruiming','Een verruiming wordt uitgesteld',[-.10,.05,0,0,-.08,0]],
 ['ai_fout','Een AI-tool verzint een capaciteitsdatum',[0,.18,.04,-.10,0,0]],
 ['openbaarmaking','Congestiedata worden openbaar gemaakt',[.06,0,0,.10,.12,0]],
 ['procedure','Een bezwaarprocedure duurt langer',[-.04,.06,0,0,0,-.12]],
 ['buitenland','Een buitenlandse netbeheerder publiceert realtime capaciteit',[.10,0,0,.08,.08,0]],
] as const;
function rng(seed:number) { let a=seed>>>0; return () => {a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; }
function shuffle<T>(arr:T[], random:()=>number) { for(let i=arr.length-1;i>0;i--){let j=Math.floor(random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export type Agent={id:string;group:number;prior:number[];op:number[];edges:number[]};
export type Sim={agents:Agent[];snapshots:number[][][]; plan:{round:number;event:number}[]};
export function simulate(seed=20261111,mixing=.18,pressure=1, inject=-1):Sim {
 const random=rng(seed), agents:Agent[]=[];
 groups.forEach((g,k)=>{for(let i=0;i<g[1];i++){const prior=g[2].map(x=>clamp(x+(random()-.5)*.08)); agents.push({id:`G-${String(agents.length+1).padStart(3,'0')}`,group:k,prior,op:prior.map(x=>clamp(x+(random()-.5)*.18)),edges:[]});}});
 const rounds=shuffle(Array.from({length:20},(_,i)=>i+3),random).slice(0,3); let chosen=shuffle(Array.from({length:events.length},(_,i)=>i),random).slice(0,3); if(inject>=0&&!chosen.includes(inject))chosen[0]=inject;
 const plan=rounds.map((round,i)=>({round,event:chosen[i]})).sort((a,b)=>a.round-b.round);
 agents.forEach((a,i)=>{const same=shuffle(agents.map((_,j)=>j).filter(j=>j!==i&&agents[j].group===a.group),random);const other=shuffle(agents.map((_,j)=>j).filter(j=>j!==i),random);const local=Math.round(7*(1-mixing));a.edges=[...new Set([...same.slice(0,local),...other])].slice(0,7);});
 const snapshots=[agents.map(a=>[...a.op])];
 for(let r=1;r<=24;r++){
   for(const i of shuffle(agents.map((_,i)=>i),random)){const a=agents[i], j=a.edges[Math.floor(random()*a.edges.length)], b=agents[j], d=Math.floor(random()*6), gap=b.op[d]-a.op[d]; const likeness=1-Math.min(1,Math.abs(gap)*1.4), influence=(.35+.65*groups[b.group][3][0])*(.4+.6*likeness), openness=groups[a.group][3][1]*(1-.75*groups[a.group][3][2]);let move=gap*influence*openness*.42*pressure;if(Math.abs(gap)>.45&&groups[a.group][3][2]>.6&&random()<.5)move=-Math.sign(gap)*Math.abs(gap)*.10*pressure;a.op[d]=clamp(a.op[d]+move);}
   const event=plan.find(x=>x.round===r); if(event) agents.forEach(a=>events[event.event][2].forEach((v,d)=>{a.op[d]=clamp(a.op[d]+v*(.6+.8*random()));})); snapshots.push(agents.map(a=>[...a.op]));
 }
 return {agents,snapshots,plan};
}
export function wilson(x:number,n:number){if(!n)return [0,0];const p=x/n,z=1.959964,d=1+z*z/n,c=p+z*z/(2*n),s=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return [(c-s)/d,(c+s)/d];}
export function ensemble(){const totals=[0,0,0,0,0,0], ns=[0,0,0,0,0,0];for(let r=0;r<200;r++){const sim=simulate(20261111+r*7919), a=sim.agents; const majority=(d:number,filter:(g:number)=>boolean)=>{const pop=a.filter(x=>filter(x.group));return pop.filter(x=>x.op[d]>=.5).length>pop.length/2;};const checks=[majority(0,g=>g===0||g===1),majority(1,()=>true),majority(2,g=>[2,3,7,9].includes(g)),majority(3,()=>true),majority(4,g=>g!==4),majority(1,()=>true)];checks.forEach((v,i)=>{if(i===5&&!sim.plan.some(p=>p.event===5))return;ns[i]++;if(v)totals[i]++;});}return totals.map((x,i)=>({x,n:ns[i],ci:wilson(x,ns[i])}));}
