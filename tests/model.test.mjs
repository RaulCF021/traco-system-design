import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../dist/model.js';

function chain(...types) {
  return {
    nodes: types.map(type => ({ id: type, type })),
    edges: types.slice(1).map((to, index) => ({ from: types[index], to })),
  };
}

test('limite compartilhado recusa excesso sem pressionar a API', () => {
  const graph=chain('client','limiter','api');
  graph.nodes[1].replicas=3;
  const result=simulate(graph,900);
  assert.equal(result.nodes.api.demand,600);
  assert.equal(result.nodes.limiter.rejected,300);
  assert.equal(result.throughput,600);
  assert.match(result.issues.join(' '),/política fixa/);
  assert.equal(result.backlog,0);
});

test('um assinante lento não bloqueia o ACK nem as outras assinaturas', () => {
  const graph=chain('client','broker','worker');
  graph.nodes.push({id:'extra',type:'worker',replicas:2});
  graph.edges.push({from:'broker',to:'extra'});
  const result=simulate(graph,500);
  assert.equal(result.throughput,500);
  assert.equal(result.nodes.worker.completed,350);
  assert.equal(result.nodes.extra.completed,500);
  assert.equal(result.nodes.broker.pendingDeliveries,150);
  assert.equal(result.backlog,150);
});

test('proxy encaminha uma vez e retira um upstream indisponível da distribuição', () => {
  const graph=chain('client','proxy','api');
  graph.nodes.push({id:'extra',type:'api',offline:true});
  graph.edges.push({from:'proxy',to:'extra'});
  assert.equal(simulate(graph,700).nodes.api.demand,700);
  graph.nodes.at(-1).offline=false;
  assert.equal(simulate(graph,700).nodes.api.demand,350);
});

test('relational storage limits completed reads and cache hits bypass it', () => {
  assert.equal(simulate(chain('client', 'api', 'postgres'), 700).throughput, 450);
  const warm = simulate(chain('client', 'api', 'redis', 'postgres'), 700);
  assert.equal(warm.throughput, 700);
  assert.equal(warm.nodes.postgres.demand, 140);
  assert.equal(warm.cost, 23);
});

test('replicas increase modeled service capacity and hourly cost', () => {
  const graph = chain('client', 'api', 'postgres');
  graph.nodes[2].replicas = 2;
  assert.equal(simulate(graph, 900).throughput, 800);
  assert.equal(simulate(graph, 900).cost, 30);
});

test('load balancer divides demand among available backends and skips failed peers', () => {
  const graph = chain('client', 'lb', 'api');
  graph.nodes.push({id:'peer',type:'api'});
  graph.edges.push({from:'lb',to:'peer'});
  assert.equal(simulate(graph, 1400).throughput, 1400);
  graph.nodes[2].offline = true;
  assert.equal(simulate(graph, 1400).throughput, 800);
  assert.equal(simulate(graph, 1400).nodes.peer.demand, 1400);
});

test('queue reports ack separately from completion', () => {
  const result = simulate(chain('client','api','queue','worker','storage'), 700);
  assert.equal(result.throughput, 700);
  assert.equal(result.backlog, 350);
});

test('missing targets, cycles and disconnected nodes produce actionable diagnostics', () => {
  const graph = chain('client','lb');
  graph.nodes.push({id:'db',type:'postgres'});
  const invalid = simulate(graph, 100);
  assert.equal(invalid.throughput, 0);
  assert.equal(invalid.cost, 16);
  assert.ok(invalid.issues.length >= 2);
  graph.edges.push({from:'lb',to:'client'});
  assert.equal(simulate(graph, 100).throughput, 0);
  assert.match(simulate(graph, 100).issues.join(' '), /ciclo/i);
});

test('fan-out requires both dependencies and fan-in shares a capacity budget', () => {
  const graph = chain('client','api','postgres');
  graph.nodes.push({id:'search',type:'search'});
  graph.edges.push({from:'api',to:'search'}, {from:'search',to:'postgres'});
  assert.equal(simulate(graph, 400).throughput, 225);
});
