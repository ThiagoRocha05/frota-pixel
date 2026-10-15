import {test} from 'node:test';import assert from 'node:assert/strict';
import {shipCells,canPlace,rotated,randomFleet,dragPlacement,edgeScroll} from '../docs/placement.js';
import {validFleet} from '../supabase/functions/game/engine.js';
const blank=()=>Array(5).fill(null);
test('prévia de encaixe respeita bordas e não atravessa linhas',()=>{assert.ok(canPlace(blank(),0,shipCells(0,5)));assert.equal(canPlace(blank(),0,shipCells(8,5)),false);assert.equal(canPlace(blank(),0,shipCells(70,5,true)),false);assert.equal(canPlace(blank(),0,shipCells(-10,5,true)),false);});
test('mover o próprio navio permite sobreposição anterior, mas bloqueia outra embarcação',()=>{const f=blank();f[0]=shipCells(0,5);f[1]=shipCells(10,4);assert.ok(canPlace(f,0,shipCells(1,5)));assert.equal(canPlace(f,0,shipCells(10,5)),false);});
test('arrastar pelo meio do navio mantém a casa agarrada no destino',()=>{const f=blank();f[0]=shipCells(0,5);let d=dragPlacement(f,0,23,2,false);assert.deepEqual(d.cells,[21,22,23,24,25]);assert.ok(d.valid);d=dragPlacement(f,0,42,2,true);assert.deepEqual(d.cells,[22,32,42,52,62]);assert.ok(d.valid);assert.equal(dragPlacement(f,0,1,4,false).valid,false);});
test('girar perto da borda reposiciona dentro do oceano sem sobrepor outra frota',()=>{const f=blank();f[0]=shipCells(90,5);assert.deepEqual(rotated(f,0),[50,60,70,80,90]);f[1]=[50,51,52,53];assert.equal(rotated(f,0),null);});
test('distribuição automática produz 500 frotas válidas para o servidor',()=>{for(let i=0;i<500;i++)assert.ok(validFleet(randomFleet()));});

test('arraste rola nas bordas da tela e permanece estável no centro',()=>{assert.ok(edgeScroll(10,800)<0);assert.ok(edgeScroll(790,800)>0);assert.equal(edgeScroll(400,800),0);assert.equal(edgeScroll(75,800),0);});
