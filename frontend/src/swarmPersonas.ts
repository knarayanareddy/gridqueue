import { rng, shuffle, type Agent } from './swarm';

// Fictional, reproducible labels; never real identities or survey respondents.
const first = ['Merel', 'Bram', 'Noor', 'Daan', 'Iris', 'Joris', 'Lotte', 'Milan', 'Sanne', 'Jesse', 'Eline', 'Sam'];
const last = ['van Daal', 'de Vink', 'Bergman', 'Voskamp', 'Termeer', 'van Loon', 'de Ruiter', 'Kramer', 'Dijkstra', 'Bosman', 'van Dijk', 'Mulder'];
const sectors = ['logistiek', 'maakindustrie', 'agrarisch', 'datacenter', 'woningbouw', 'dienstverlening'];
const provinces = ['Groningen', 'Friesland', 'Drenthe', 'Overijssel', 'Flevoland', 'Gelderland', 'Utrecht', 'Noord-Holland', 'Zuid-Holland', 'Zeeland', 'Noord-Brabant', 'Limburg'];
const roles = ['ondernemer', 'ondernemer', 'installateur', 'aggregator', 'netbeheerder', 'toezichthouder', 'beleidsmedewerker', 'financier', 'adviseur', 'projectontwikkelaar'];
const questions = [
  'Hoe bruikbaar is een indicatieve datum?',
  'Hoe belangrijk is weigeren boven gokken?',
  'Zouden bedrijven betalen voor een controleerbaar antwoord?',
  'Hoe nuttig is onafhankelijke verificatie?',
  'Verwacht u medewerking van netbeheerders?',
  'Hoe eerlijk vindt u de wachtlijst?',
];
export type SurveyAnswer = { question: string; value: number | null };
export type Persona = { name:string; role:string; sector:string; province:string; kw:number; synthetic:true; answers:SurveyAnswer[] };
export function persona(agent:Agent, index:number):Persona {
  const random=rng(20261111 + index * 7919);
  const name=`${first[Math.floor(random()*first.length)]} ${last[Math.floor(random()*last.length)]} (${agent.id})`;
  const sector=sectors[Math.floor(random()*sectors.length)], province=provinces[Math.floor(random()*provinces.length)];
  const kw=[25,60,100,250,500,1000,2500][Math.floor(random()*7)];
  const answers=questions.map((question,i)=>({question,value:random()<.05+.28*(1-agent.prior[3]) ? null : 1+Math.round(agent.prior[i]*4)}));
  return {name,role:roles[agent.group],sector,province,kw,synthetic:true,answers};
}
export function surveyOrder(n:number){return shuffle(Array.from({length:n},(_,i)=>i),rng(20261111+42));}

// Hypothetical use decisions, not measured adoption. Each agent has a fixed synthetic
// threshold; its willingness follows opinion snapshots and a small peer-use term.
// Updates are synchronous so iteration order does not alter the result.
export function adoption(sim:import('./swarm').Sim):boolean[][] {
  const thresholds=sim.agents.map((_,i)=>.46+rng(9001+i*7919)()*.26);
  const score=(op:number[])=>.30*op[0]+.30*op[1]+.25*op[3]+.15*op[2];
  const rounds=[sim.snapshots[0].map((op,i)=>score(op)>=thresholds[i])];
  for(let r=1;r<sim.snapshots.length;r++){
    const previous=rounds[r-1];
    rounds.push(sim.snapshots[r].map((op,i)=>{
      const edges=sim.agents[i].edges;
      const peerUse=edges.filter(j=>previous[j]).length/edges.length;
      return score(op)+.12*(peerUse-.5)>=thresholds[i];
    }));
  }
  return rounds;
}
