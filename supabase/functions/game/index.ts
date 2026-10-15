import {applyAction,newRoom,playerView,GameError,roomExpiry} from './engine.js';
const base=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Endereço exato de origem do GitHub Pages, sem caminho do repositório.
const allowed=(Deno.env.get('ALLOWED_ORIGINS')||'https://thiagorocha05.github.io').split(',').map(s=>s.trim()).filter(Boolean);
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const random=(n:number)=>hex(crypto.getRandomValues(new Uint8Array(n)));
const hash=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))));
async function db(path:string,method='GET',body?:unknown){
 const res=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!res.ok)throw new GameError('Serviço temporariamente indisponível.',503);
 return res.status===204?null:res.json();
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const permitted=allowed.includes(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':permitted?origin:'null','Access-Control-Allow-Headers':'content-type,apikey','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(!allowed.length)return reply({error:'O administrador precisa configurar ALLOWED_ORIGINS no backend.'},503);
 if(!permitted)return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método inválido.'},405);
 try{
  // Corpo limitado também em transferências sem Content-Length.
  const reader=req.body?.getReader();let bytes=0,text='';const decoder=new TextDecoder();
  if(reader)while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8192){await reader.cancel();throw new GameError('Solicitação muito grande.',413);}text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();const b=JSON.parse(text||'{}');
  if(!b||typeof b!=='object'||Array.isArray(b))throw new GameError('Solicitação inválida.');
  const action=b.action;if(!['create','join','state','ready','fire','rematch','activity'].includes(action))throw new GameError('Ação inválida.');
  // Controle persistente funciona entre instâncias, sem guardar IP em texto puro.
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const bucket=await hash(secret+':'+ip)+':'+Math.floor(Date.now()/60000);
  if(!await db('rpc/frota_consume_limit','POST',{p_bucket:bucket,p_max:180}))throw new GameError('Muitas solicitações. Aguarde um minuto.',429);
  if(action==='create'){
   if(typeof b.clientToken!=='string'||!/^[a-f0-9]{64}$/.test(b.clientToken))throw new GameError('Sessão inválida.');
   const tokenHash=await hash(b.clientToken);
   // Código é escolhido criptograficamente pelo cliente para permitir retry idempotente.
   if(typeof b.code!=='string'||!/^[A-F0-9]{8}$/.test(b.code))throw new GameError('Código inválido.');
   await db('frota_rooms?expires_at=lt.'+encodeURIComponent(new Date().toISOString()),'DELETE');
   await db('frota_limits?expires_at=lt.'+encodeURIComponent(new Date().toISOString()),'DELETE');
   const r=newRoom(b.code,b.name,tokenHash),expiresAt=roomExpiry();
   const res=await fetch(base+'/rest/v1/frota_rooms',{method:'POST',headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({code:b.code,state:r,expires_at:expiresAt})});
   if(res.status===409){const rows=await db('frota_rooms?code=eq.'+b.code);const existing=rows[0]?.state;const p=existing?.players.find((p:any)=>p.tokenHash===tokenHash);if(p)return reply({...playerView(existing,p),expiresAt:rows[0].expires_at});throw new GameError('Código ocupado. Crie outra sala.',409);}
   if(!res.ok)throw new GameError('Não foi possível criar a sala.',503);
   return reply({...playerView(r,r.players[0]),expiresAt});
  }
  if(typeof b.code!=='string'||!/^[A-F0-9]{8}$/.test(b.code)||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))throw new GameError('Código ou sessão inválidos.');
  const tokenHash=await hash(b.token);
  for(let attempt=0;attempt<6;attempt++){
   const rows=await db('frota_rooms?code=eq.'+b.code+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString()));
   const row=rows[0];if(!row)throw new GameError('Sala não encontrada ou expirada.',404);
   const previousSeen=row.state.players.find((p:any)=>p.tokenHash===tokenHash)?.seen||0;
   const view=applyAction(row.state,action,b,tokenHash,{first:crypto.getRandomValues(new Uint8Array(1))[0]%2});
   if(action==='state'&&Date.now()-previousSeen<15000)return reply({...view,expiresAt:row.expires_at});
   const expiresAt=action==='state'?row.expires_at:roomExpiry();
   const changed=await db('frota_rooms?code=eq.'+b.code+'&version=eq.'+row.version,'PATCH',{state:row.state,version:row.version+1,expires_at:expiresAt});
   if(changed.length)return reply({...view,expiresAt});
   // Outra ação ganhou a corrida. Releia e revalide antes de gravar.
  }
  throw new GameError('Sala ocupada. Tente novamente.',409);
 }catch(e){if(e instanceof GameError)return reply({error:e.message},e.status);return reply({error:'Solicitação inválida ou serviço indisponível.'},400);}
});
