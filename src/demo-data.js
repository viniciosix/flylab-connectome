export const GROUPS = [
  {name:'Sugar GRN',color:'#72f5b7'},
  {name:'Visual',color:'#8bc8ff'},
  {name:'Interneuron',color:'#b7a4ff'},
  {name:'Descending',color:'#ffd36f'},
  {name:'Motor',color:'#ff7f8f'},
];
const rnd=(seed)=>{const x=Math.sin(seed*999)*10000;return x-Math.floor(x)};
export const neurons=Array.from({length:220},(_,i)=>{
  const gi=i<20?0:i<70?1:i<175?2:i<205?3:4;
  const theta=rnd(i+4)*Math.PI*2,phi=Math.acos(2*rnd(i+9)-1),r=4.4+rnd(i+12)*1.9;
  return {id:720000000000000+i,label:i===5?'GRN-sugar-05':i===214?'MN9-like readout':`${GROUPS[gi].name} ${String(i).padStart(3,'0')}`,group:GROUPS[gi].name,color:GROUPS[gi].color,x:r*Math.sin(phi)*Math.cos(theta)*1.25,y:r*Math.cos(phi),z:r*Math.sin(phi)*Math.sin(theta)*0.72};
});
export const edges=[];
for(let i=0;i<neurons.length;i++){
  const degree=4+Math.floor(rnd(i+31)*8);
  for(let k=0;k<degree;k++){
    let post=Math.floor(rnd(i*17+k*43+7)*neurons.length);if(post===i)post=(post+1)%neurons.length;
    edges.push({pre:i,post,weight:.35+rnd(i*29+k*7)*1.6});
  }
}
for(let i=0;i<14;i++){
  edges.push({pre:i,post:75+i,weight:2.5});
  edges.push({pre:75+i,post:180+(i%18),weight:2.3});
  edges.push({pre:180+(i%18),post:214,weight:2.8});
}
