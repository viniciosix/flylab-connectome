// Educational discrete LIF model on directed structural connectivity.
// Neither neurotransmitter signs nor calibrated biological parameters are inferred.
function simulate(neurons, edges, config, silence, seed=783){
 const count=neurons.length, dt=5, steps=Math.ceil(config.duration/dt), bins=Math.ceil(config.duration/25);
 const outgoing=Array.from({length:count},()=>[]);
 edges.forEach(([a,b,w],index)=>outgoing[a].push([b,Math.log1p(w)/6,index]));
 const v=new Float32Array(count), refractory=new Uint8Array(count), spikeCount=new Uint32Array(count), edgeCount=new Uint32Array(edges.length), frameBins=Array.from({length:bins},()=>[]), spikesByBin=new Uint32Array(bins), activated=new Set(config.activated), silenced=new Set(silence);
 let prev=[], state=seed>>>0, total=0;
 const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296};
 for(let step=0;step<steps;step++){
  const input=new Float32Array(count);
  for(const pre of prev)for(const [post,weight,index] of outgoing[pre])if(!silenced.has(post)){input[post]+=weight*config.gain*.27;edgeCount[index]++}
  const now=[], bin=Math.min(bins-1,Math.floor(step*dt/25));
  for(let i=0;i<count;i++){
   if(silenced.has(i)){v[i]=0;continue}
   if(refractory[i]){refractory[i]--;continue}
   v[i]+=(-v[i]*dt/22)+input[i];
   const drive=activated.has(i)&&random()<config.frequency*dt/1000*Math.min(3,config.intensity);
   if(drive||v[i]>=config.threshold){v[i]=0;refractory[i]=1;now.push(i);spikeCount[i]++;spikesByBin[bin]++;frameBins[bin].push(i);total++}
  }
  prev=now;
 }
 const seconds=config.duration/1000;
 return {total, rates:Array.from(spikeCount,x=>+(x/seconds).toFixed(2)),bins:Array.from(spikesByBin),frames:frameBins,edgeUses:Array.from(edgeCount),duration:config.duration};
}
self.onmessage=e=>{
 try{
  const {neurons,edges,config,comparison}=e.data;
  const experiment=simulate(neurons,edges,config,config.silenced);
  const control=comparison?simulate(neurons,edges,config,[]):null;
  self.postMessage({experiment,control});
 }catch(error){self.postMessage({error:String(error)})}
};
