import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../dist/model.js';

function chain(...types) {
  return {
    nodes: types.map(type => ({ id: type, type })),
    edges: types.slice(1).map((to, index) => ({ from: types[index], to })),
  };
}

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
