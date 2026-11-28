import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,simulate} from '../dist/model.js';
import {pieceWorkspace} from '../dist/personal-projects.js';
import {componentCourse} from '../dist/component-course.js';

test('cada aula de componente tem um experimento e feedback para todas as alternativas',()=>{
  assert.deepEqual(Object.keys(componentCourse).sort(),Object.keys(catalog).sort());
  for(const unit of Object.values(componentCourse)){
    assert.equal(unit.walkthrough.length,3);
    assert.equal(unit.check.options.length,unit.check.feedback.length);
    assert.ok(unit.check.options[unit.check.correct]);
  }
});

test('os ensaios abrem na carga e no gargalo pedidos pelo primeiro passo da aula',()=>{
  const expected={client:[300,300],api:[300,300],postgres:[900,450],lb:[1400,1400],
    redis:[700,450],cdn:[6000,1500],storage:[2000,1500],queue:[700,700],worker:[700,700],
    search:[750,600],nosql:[1400,1200],gateway:[2400,2200]};
  for(const [type,[load,throughput]] of Object.entries(expected)){
    const work=pieceWorkspace(type);
    assert.equal(work.load,load,type);
    const result=simulate(work.graph,work.load);
    assert.equal(result.throughput,throughput,type);
    if(type==='queue'||type==='worker')assert.equal(result.backlog,type==='queue'?350:0,type);
  }
});
