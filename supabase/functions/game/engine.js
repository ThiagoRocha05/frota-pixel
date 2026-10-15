export const SIZES = [5,4,3,3,2];
export class GameError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const requireGame=(ok,message,status=409)=>{if(!ok)throw new GameError(message,status);};
export function validFleet(fleet){
 if(!Array.isArray(fleet)||fleet.length!==5)return false;
 const used=new Set();
 return fleet.every((s,i)=>Array.isArray(s)&&s.length===SIZES[i]&&s.every(n=>Number.isInteger(n)&&n>=0&&n<100&&!used.has(n)&&(used.add(n),true))&&((s.every((n,k)=>n===s[0]+k)&&Math.floor(s[0]/10)===Math.floor(s.at(-1)/10))||s.every((n,k)=>n===s[0]+k*10)));
}
export function newPlayer(name,tokenHash,now=Date.now()){return {name:String(name||'Capitão').trim().slice(0,24)||'Capitão',tokenHash,fleet:null,shots:[],seen:now,rematch:false,requests:[]};}
export function newRoom(code,name,tokenHash,now=Date.now()){return {code,players:[newPlayer(name,tokenHash,now)],phase:'setup',turn:0,winner:null,round:1};}
export function playerView(r,p,now=Date.now()){const i=r.players.indexOf(p),other=r.players[1-i];return {code:r.code,you:i,names:r.players.map(p=>p.name),ready:r.players.map(p=>!!p.fleet),fleet:p.fleet,shots:p.shots,incoming:other?.shots||[],phase:r.phase,turn:r.turn,winner:r.winner,round:r.round,rematch:r.players.map(p=>p.rematch),opponentOnline:!!other&&now-other.seen<45000};}
export function applyAction(r,action,b,hash,{now=Date.now(),first=Math.floor(Math.random()*2)}={}){
 let p=r.players.find(p=>p.tokenHash===hash);
 if(action==='join'){
  if(p){p.seen=now;return playerView(r,p,now);}
  requireGame(r.players.length===1,'Esta sala já tem dois jogadores.');
  p=newPlayer(b.name,hash,now);r.players.push(p);return playerView(r,p,now);
 }
 requireGame(!!p,'Sessão inválida. Entre novamente em uma sala.',403);
 if(action==='state'){p.seen=now;return playerView(r,p,now);}
 requireGame(typeof b.requestId==='string'&&/^[a-f0-9-]{20,64}$/.test(b.requestId),'Identificador da ação inválido.',400);
 // Repetir uma solicitação após perda de conexão não duplica a jogada.
 if(p.requests.includes(b.requestId))return playerView(r,p,now);
 const i=r.players.indexOf(p);
 if(action==='ready'){
  requireGame(r.phase==='setup'&&!p.fleet,'Frota já confirmada.');
  requireGame(validFleet(b.fleet),'Posicionamento de navios inválido.',400);p.fleet=b.fleet;
  if(r.players.length===2&&r.players.every(p=>p.fleet)){r.phase='battle';r.turn=first;}
 }else if(action==='fire'){
  requireGame(r.phase==='battle'&&r.turn===i,'Aguarde sua vez.');
  const cell=b.cell;requireGame(Number.isInteger(cell)&&cell>=0&&cell<100&&!p.shots.some(s=>s.cell===cell),'Disparo inválido ou repetido.',400);
  const enemy=r.players[1-i],ship=enemy.fleet.find(s=>s.includes(cell));p.shots.push({cell,hit:!!ship,sunk:null});
  if(ship&&ship.every(c=>p.shots.some(s=>s.cell===c)))for(const shot of p.shots)if(ship.includes(shot.cell))shot.sunk=ship;
  if(enemy.fleet.every(s=>s.every(c=>p.shots.some(shot=>shot.cell===c)))){r.phase='finished';r.winner=i;}else r.turn=1-i;
 }else if(action==='rematch'){
  requireGame(r.phase==='finished','A partida ainda está em andamento.');p.rematch=true;
  if(r.players.every(p=>p.rematch)){for(const player of r.players){player.fleet=null;player.shots=[];player.rematch=false;}r.phase='setup';r.winner=null;r.round++;}
 }else throw new GameError('Ação inexistente.',404);
 p.seen=now;p.requests.push(b.requestId);p.requests=p.requests.slice(-220);return playerView(r,p,now);
}
