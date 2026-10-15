import {randomFleet} from './placement.js';
// A escolha da IA recebe somente resultados dos próprios tiros, nunca a frota humana.
export function chooseBotShot(shots,random=Math.random){
 const used=new Set(shots.map(s=>s.cell)),hits=shots.filter(s=>s.hit&&!s.sunk).map(s=>s.cell),candidates=[];
 const add=(n)=>{if(n>=0&&n<100&&!used.has(n)&&!candidates.includes(n))candidates.push(n);};
 for(const n of hits){if(hits.includes(n+1)&&n%10<9){if(n%10>0)add(n-1);if(n%10<8)add(n+2);}if(hits.includes(n+10)){add(n-10);add(n+20);}}
 if(!candidates.length)for(const n of hits){if(n%10>0)add(n-1);if(n%10<9)add(n+1);add(n-10);add(n+10);}
 if(!candidates.length)for(let n=0;n<100;n++)if((Math.floor(n/10)+n%10)%2===0)add(n);
 if(!candidates.length)for(let n=0;n<100;n++)add(n);
 return candidates.length?candidates[Math.floor(random()*candidates.length)]:null;
}
export function createSoloGame(engine,{name='Capitão',snapshot=null,random=Math.random,onSave=()=>{}}={}){
 let room;const human='solo-human',bot='solo-bot';
 const validSnapshot=s=>s?.code==='TREINO'&&s.players?.length===2&&s.players[0].tokenHash===human&&s.players[1].tokenHash===bot&&['setup','battle','finished'].includes(s.phase)&&s.players.every(p=>Array.isArray(p.shots)&&(!p.fleet||engine.validFleet(p.fleet)));
 if(validSnapshot(snapshot))room=structuredClone(snapshot);else{room=engine.newRoom('TREINO',name,human);engine.applyAction(room,'join',{name:'Almirante Pixel'},bot);prepareBot();}
 function prepareBot(){engine.applyAction(room,'ready',{fleet:randomFleet(random),requestId:crypto.randomUUID()},bot,{first:0});}
 function save(){onSave(structuredClone(room));}
 function view(){return structuredClone(engine.playerView(room,room.players[0]));}
 save();return {
 view,snapshot:()=>structuredClone(room),
 command(action,data={}){if(action==='state')return view();engine.applyAction(room,action,{...data,requestId:data.requestId||crypto.randomUUID()},human,{first:0});if(action==='rematch'){engine.applyAction(room,'rematch',{requestId:crypto.randomUUID()},bot);prepareBot();}save();return view();},
 botMove(){if(room.phase==='battle'&&room.turn===1){const cell=chooseBotShot(room.players[1].shots,random);if(cell!==null)engine.applyAction(room,'fire',{cell,requestId:crypto.randomUUID()},bot);}save();return view();}
 };
}
export function battleStats(shots){const hits=shots.filter(s=>s.hit).length,ships=new Set(shots.filter(s=>s.sunk).map(s=>s.sunk.join(','))).size;return {shots:shots.length,hits,ships,accuracy:shots.length?Math.round(hits/shots.length*100):0};}
