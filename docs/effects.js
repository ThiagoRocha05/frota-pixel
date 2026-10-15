const wait=ms=>new Promise(r=>setTimeout(r,ms));
export function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
async function animate(el,frames,options){if(!el.animate)return;const animation=el.animate(frames,options);await Promise.race([animation.finished.catch(()=>{}),wait((options.duration||600)+250)]);}
export async function shotEffect({cell,origin,hit,sunk,onImpact=()=>{}}){
 const layer=document.getElementById('fx-layer');if(!cell||!layer)return;
 cell.classList.add('awaiting-impact');
 try{
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const target=cell.getBoundingClientRect(),source=origin?.getBoundingClientRect();if(!target.width||!target.height)return;
 const x=target.left+target.width/2,y=target.top+target.height/2;
 if(!reducedMotion()){
  const startX=source?.width?source.left+source.width/2:window.innerWidth*.5,startY=source?.height?source.top+source.height/2:window.innerHeight-35;
  const midX=(startX+x)/2,midY=Math.min(startY,y)-45,shell=document.createElement('span');shell.className='fx-shell';layer.append(shell);
  try{await animate(shell,[{transform:`translate(${startX}px,${startY}px) rotate(-90deg)`,opacity:0},{transform:`translate(${startX}px,${startY-15}px) rotate(-90deg)`,opacity:1,offset:.12},{transform:`translate(${midX}px,${midY}px) rotate(-45deg)`,opacity:1,offset:.6},{transform:`translate(${x}px,${y}px) rotate(45deg)`,opacity:1}],{duration:600,easing:'ease-in-out',fill:'forwards'});}finally{shell.remove();}
 }
 cell.classList.remove('awaiting-impact');cell.classList.add('burst');onImpact();
 if(reducedMotion()){await wait(120);return;}
 const colors=hit?['#fff0b0','#ffba66','#ff815e','#ffe2b7']:['#d1fff0','#8de9df','#59bdd2'];
 const pieces=Array.from({length:sunk?22:hit?14:9},(_,i)=>{const p=document.createElement('i');p.className='fx-pixel';p.style.background=colors[i%colors.length];const angle=(i/(sunk?22:hit?14:9))*Math.PI*2,distance=(sunk?60:38)+Math.random()*25;layer.append(p);return animate(p,[{transform:`translate(${x}px,${y}px) scale(1.4)`,opacity:1},{transform:`translate(${x+Math.cos(angle)*distance}px,${y+Math.sin(angle)*distance+25}px) scale(.3)`,opacity:0}],{duration:650+Math.random()*200,easing:'ease-out',fill:'forwards'}).finally(()=>p.remove());});
 const ring=document.createElement('span');ring.className='fx-ring '+(hit?'fire-ring':'water-ring');layer.append(ring);pieces.push(animate(ring,[{transform:`translate(${x}px,${y}px) scale(.2)`,opacity:1},{transform:`translate(${x}px,${y}px) scale(${sunk?3:2})`,opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'}).finally(()=>ring.remove()));
 if(hit){const frame=cell.closest('.ocean-frame');frame?.classList.remove('recoil');void frame?.offsetWidth;frame?.classList.add('recoil');}
 await Promise.all(pieces);
 }finally{cell.classList.remove('awaiting-impact');}
}
