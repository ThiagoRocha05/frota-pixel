export const SIZES=[5,4,3,3,2];
export function shipCells(start,size,vertical=false){return Array.from({length:size},(_,i)=>start+i*(vertical?10:1));}
export function canPlace(fleet,index,cells){
 if(!Array.isArray(cells)||cells.length!==SIZES[index]||cells.some(n=>!Number.isInteger(n)||n<0||n>99))return false;
 const horizontal=cells.every((n,i)=>n===cells[0]+i)&&Math.floor(cells[0]/10)===Math.floor(cells.at(-1)/10);
 const vertical=cells.every((n,i)=>n===cells[0]+10*i);
 return (horizontal||vertical)&&!fleet.some((s,i)=>i!==index&&s?.some(c=>cells.includes(c)));
}
export function rotated(fleet,index){const old=fleet[index];if(!old)return null;const vertical=old[1]-old[0]===1,size=SIZES[index];let row=Math.floor(old[0]/10),col=old[0]%10;if(vertical)row=Math.min(row,10-size);else col=Math.min(col,10-size);const next=shipCells(row*10+col,size,vertical);return canPlace(fleet,index,next)?next:null;}
export function randomFleet(random=Math.random){const fleet=Array(5).fill(null);for(let i=0;i<5;i++){let found=false;for(let j=0;j<2000;j++){const ship=shipCells(Math.floor(random()*100),SIZES[i],random()<.5);if(canPlace(fleet,i,ship)){fleet[i]=ship;found=true;break;}}if(!found)throw Error('Não foi possível distribuir a frota. Tente novamente.');}return fleet;}
export function dragPlacement(fleet,index,hoverCell,offset,vertical){const start=hoverCell-offset*(vertical?10:1),cells=shipCells(start,SIZES[index],vertical);return {cells,valid:canPlace(fleet,index,cells)};}

export function edgeScroll(y,height){const edge=75;if(y<edge)return -Math.ceil((edge-y)/edge*12);if(y>height-edge)return Math.ceil((y-height+edge)/edge*12);return 0;}
