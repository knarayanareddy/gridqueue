import { ensemble } from './swarm';

// Run ensembles away from the rendering thread so the interface remains responsive.
self.onmessage = (event:MessageEvent<{mix:number;pressure:number;story:number}>) => {
  const {mix,pressure,story}=event.data;
  self.postMessage({baseline:ensemble(),scenario:ensemble(mix,pressure,story)});
};
