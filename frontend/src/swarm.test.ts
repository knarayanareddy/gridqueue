import { simulate, groups, events, wilson } from './swarm';
function check(v: unknown, message: string) { if (!v) throw new Error(message); }
const a = simulate(), b = simulate();
check(JSON.stringify(a) === JSON.stringify(b), 'simulation is not deterministic');
check(a.agents.length === 240 && a.snapshots.length === 25, 'population or rounds');
groups.forEach((g,i)=>check(a.agents.filter(x=>x.group===i).length===g[1], 'quota'));
check(a.agents.every((x,i)=>x.edges.length===7 && new Set(x.edges).size===7 && !x.edges.includes(i)), 'graph');
check(a.snapshots.every(s=>s.every(o=>o.every(x=>x>=0&&x<=1))), 'opinion outside bounds');
check(a.plan.length===3 && new Set(a.plan.map(x=>x.round)).size===3 && new Set(a.plan.map(x=>x.event)).size===3, 'event plan');
events.forEach((_e,i)=>check(simulate(20261111,.18,1,i).plan.some(p=>p.event===i), 'injected event missing'));
const ci=wilson(50,100); check(ci[0]<.5&&ci[1]>.5, 'Wilson interval');
console.log('Swarm invariants passed');

import { persona, surveyOrder, adoption } from './swarmPersonas';
import { ensemble } from './swarm';
check(a.interactions.length===25 && a.interactions[0].length===0, 'interaction rounds');
a.interactions.slice(1).forEach(round=>{
  check(round.length===240, 'each agent interacts once per round');
  check(new Set(round.map(x=>x.target)).size===240, 'duplicate interaction targets');
  round.forEach(x=>check(a.agents[x.target].edges.includes(x.source) && x.dimension>=0 && x.dimension<6 && Number.isFinite(x.change), 'interaction is not a simulated edge'));
});
const p=persona(a.agents[0],0);
check(JSON.stringify(p)===JSON.stringify(persona(a.agents[0],0)) && p.synthetic && p.answers.length===6, 'synthetic persona reproducibility');
check(p.answers.every(x=>x.value===null || (x.value>=1 && x.value<=5)), 'survey bounds');
const order=surveyOrder(240);check(new Set(order).size===240 && JSON.stringify(order)===JSON.stringify(surveyOrder(240)), 'survey order');
const result=ensemble(.18,1,5);check(result.length===6 && result[5].n===200 && result.every(x=>x.x>=0&&x.x<=x.n), 'ensemble denominators');
console.log('Interaction, survey and scenario invariants passed');

const adoptionRounds=adoption(a);check(adoptionRounds.length===25 && adoptionRounds.every(r=>r.length===240 && r.every(v=>typeof v==='boolean')), 'adoption shape');
check(JSON.stringify(adoptionRounds)===JSON.stringify(adoption(b)), 'adoption reproducibility');
console.log('Synthetic adoption invariants passed');

import { dimensionLabel, groupLabel, eventLabel, reportQuestionsNl, reportQuestionsEn, falsifiersNl, surveyQuestionsEn } from './swarmI18n';
import { dims } from './swarm';
check(dims.every(d=>dimensionLabel(d,'en') && dimensionLabel(d,'nl')), 'dimension translations');
check(groups.every((_,i)=>groupLabel(i,'en') && groupLabel(i,'nl')), 'group translations');
check(events.every((_,i)=>eventLabel(i,'en') && eventLabel(i,'nl')), 'event translations');
check(reportQuestionsNl.length===6 && reportQuestionsEn.length===6 && falsifiersNl.length===5 && surveyQuestionsEn.length===6, 'translation coverage');
console.log('Swarm translation coverage passed');
