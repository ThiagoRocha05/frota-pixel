// Geometria independente do DOM para o mapa caber na área realmente disponível.
export function fitOcean({maxWidth,maxHeight,extraHeight=0}){return Math.max(0,Math.floor(Math.min(maxWidth,maxHeight-extraHeight)));}
export function yourTurn(state){return state?.phase==='battle'&&state.turn===state.you;}
export function shouldNotifyTurn(previous,next,resuming=false){if(!yourTurn(next))return false;return resuming||!previous||previous.phase!=='battle'||previous.turn!==next.you||previous.round!==next.round||previous.code!==next.code;}
