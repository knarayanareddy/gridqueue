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
