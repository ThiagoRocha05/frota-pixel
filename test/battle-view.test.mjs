import {test} from 'node:test';import assert from 'node:assert/strict';
import {fitOcean,yourTurn,shouldNotifyTurn} from '../docs/battle-view.js';
const mine={code:'ABCDEF12',round:1,phase:'battle',turn:0,you:0},rival={...mine,turn:1};
test('mapa é limitado pela largura em tablet de pé',()=>{assert.equal(fitOcean({maxWidth:650,maxHeight:820,extraHeight:18}),650);});
test('mapa é limitado pela altura em tablet deitado e celular',()=>{assert.equal(fitOcean({maxWidth:700,maxHeight:420,extraHeight:18}),402);assert.equal(fitOcean({maxWidth:330,maxHeight:290,extraHeight:10}),280);});
test('geometria nunca excede o espaço disponível em 1000 janelas variadas',()=>{for(let i=0;i<1000;i++){const maxWidth=180+Math.random()*1100,maxHeight=150+Math.random()*900,extraHeight=10+Math.random()*24;const n=fitOcean({maxWidth,maxHeight,extraHeight});assert.ok(n<=maxWidth&&n+extraHeight<=maxHeight);assert.ok(n>=0);}});
test('avisa no início e quando o rival entrega a vez, sem repetir durante as consultas',()=>{assert.ok(shouldNotifyTurn(null,mine));assert.ok(shouldNotifyTurn({phase:'setup'},mine));assert.ok(shouldNotifyTurn(rival,mine));assert.equal(shouldNotifyTurn(mine,mine),false);assert.equal(shouldNotifyTurn(mine,rival),false);});
test('retomada de tela avisa somente se for a vez do jogador',()=>{assert.ok(shouldNotifyTurn(mine,mine,true));assert.equal(shouldNotifyTurn(rival,rival,true),false);});
test('nova rodada avisa, mas preparação e fim não anunciam turnos',()=>{assert.ok(shouldNotifyTurn(mine,{...mine,round:2}));assert.equal(yourTurn({...mine,phase:'finished'}),false);assert.equal(shouldNotifyTurn(mine,{...mine,phase:'setup'}),false);});
