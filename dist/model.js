// Parameter values describe the laboratory's read workload, never vendor benchmarks.
function component(name, category, description, capacity, baseMs, cost, options = {}) {
  return {name, category, description, capacity, baseMs, cost, ...options};
}

export const catalog = {
  client: component('Cliente', 'Entrada', 'Origem das requisições. Múltiplos clientes dividem a carga total por igual.', Infinity, 0, 0, {needsTarget: true}),
  lb: component('Load balancer', 'Rede', 'Distribui as requisições igualmente entre os destinos disponíveis.', 8000, 2, 4, {needsTarget: true}),
  api: component('API', 'Computação', 'Processa a requisição. Cada saída representa uma dependência chamada em paralelo.', 800, 12, 6),
  redis: component('Redis', 'Cache', 'Atende 80% das leituras em memória. As demais seguem para a origem.', 6000, 1, 5, {hit: 0.8, needsTarget: true}),
  postgres: component('PostgreSQL', 'Dados', 'Atende consultas relacionais. Neste laboratório de leitura, réplicas dividem as consultas.', 450, 14, 12),
  cdn: component('CDN', 'Cache', 'Entrega 90% das leituras na borda. As faltas de cache consultam a origem.', 15000, 4, 8, {hit: 0.9, needsTarget: true}),
  storage: component('Object storage', 'Dados', 'Armazena e entrega objetos, como imagens, músicas e segmentos de vídeo.', 1500, 25, 3),
  queue: component('Fila', 'Mensageria', 'Confirma o recebimento e desacopla o consumidor. Trabalho pendente aparece como crescimento da fila.', 4000, 3, 3, {needsTarget: true}),
  worker: component('Worker', 'Computação', 'Executa trabalho em segundo plano. Cada réplica aumenta a capacidade de consumo.', 350, 30, 5),
  search: component('Índice de busca', 'Dados', 'Responde a pesquisas usando um índice preparado para consulta.', 600, 9, 9),
  nosql: component('Banco NoSQL', 'Dados', 'Atende consultas por chave. O modelo pressupõe que as chaves estão bem distribuídas.', 1200, 8, 10),
  gateway: component('API gateway', 'Rede', 'Recebe e encaminha chamadas para os serviços internos.', 2200, 4, 5, {needsTarget: true}),
  broker: component('Broker pub/sub', 'Mensageria', 'Confirma a publicação e envia uma cópia a cada assinatura. O acúmulo soma as entregas pendentes em todas as assinaturas.', 3000, 4, 6, {needsTarget: true}),
  proxy: component('Proxy reverso', 'Rede', 'Recebe chamadas em nome do serviço de origem. Com vários destinos, encaminha cada chamada a um destino disponível por vez.', 3200, 2, 3, {needsTarget: true}),
  limiter: component('Rate limiter', 'Rede', 'Aplica uma política fixa de 600 pedidos/s ao conjunto de réplicas desta peça. O excesso é recusado antes de alcançar a origem.', 600, 1, 2, {needsTarget: true, fixedLimit: true}),
  auth: component('Serviço de identidade', 'Segurança', 'Valida uma credencial por pedido. Neste exercício todas as credenciais são válidas. A peça mede o custo dessa verificação.', 900, 7, 7),
  timeseries: component('Banco temporal', 'Dados', 'Ingere uma amostra com marca de tempo por operação. A capacidade pressupõe uma carga uniforme, sem simular retenção ou compressão.', 1600, 6, 9),
  warehouse: component('Armazém analítico', 'Dados', 'Executa consultas analíticas de tamanho uniforme. O custo relativo representa a configuração; volumes lidos e preços de provedores ficam fora do modelo.', 250, 75, 18),
};

const round = n => Math.round(n * 100) / 100;
const fmt = n => Math.round(n).toLocaleString('pt-BR');

/** Deterministic steady-state fluid model. Units: requests/s, mean ms, credits/hour.
 * Local admission before propagation, then reverse completion accounting. Parallel
 * calls are paced by the slowest branch; independent failure probabilities are
 * outside this model. A queue acknowledges admission separately from processing.
 */
export function simulate(graph, load) {
  const demand = Math.max(0, Number.isFinite(Number(load)) ? Number(load) : 0);
  const nodes = Object.create(null);
  const issues = [];
  const state = new Map();
  let cost = 0;
  for (const item of graph?.nodes || []) {
    if (!item || !Object.hasOwn(catalog, item.type) || state.has(item.id)) continue;
    const spec = catalog[item.type];
    const replicas = Math.min(32, Math.max(1, Math.floor(Number(item.replicas) || 1)));
    const cap = item.offline ? 0 : spec.capacity * (spec.fixedLimit ? 1 : replicas);
    cost += spec.cost * replicas;
    state.set(item.id, { item, spec, cap, next: new Set(), incoming: 0, demand: 0, admitted: 0, success: 0, latency: 0 });
    nodes[item.id] = { demand: 0, utilization: 0, capacity: Number.isFinite(cap) ? cap : null, completed: 0 };
  }
  for (const edge of graph?.edges || []) {
    if (state.has(edge?.from) && state.has(edge.to)) state.get(edge.from).next.add(state.get(edge.to));
  }
  const sources = [...state.values()].filter(s => s.item.type === 'client');
  const reachable = new Set(sources);
  for (const s of reachable) for (const dest of s.next) reachable.add(dest);
  const empty = {throughput:0, latency:0, cost, backlog:0, successRate:0, issues, nodes};
  if (!sources.length) {
    issues.push('Adicione um cliente para gerar tráfego.');
    return empty;
  }
  for (const s of state.values()) {
    if (!reachable.has(s)) issues.push(s.spec.name + ' está fora do caminho do cliente e consome créditos sem atender tráfego.');
    else for (const dest of s.next) dest.incoming++;
  }
  const order = [...reachable].filter(s => !s.incoming);
  for (const s of order) for (const dest of s.next) if (!--dest.incoming) order.push(dest);
  if (order.length !== reachable.size) {
    issues.push('O fluxo contém um ciclo. Remova a conexão de retorno para simular a ida da requisição.');
    return empty;
  }
  for (const src of sources) src.demand = demand / sources.length;
  for (const s of order) {
    s.admitted = Math.min(s.demand, s.cap);
    const util = s.cap ? s.demand / s.cap : 0;
    s.routesOne = s.item.type === 'lb' || s.item.type === 'proxy';
    s.targets = [...s.next].filter(dest => !s.routesOne || !dest.item.offline);
    const outbound = s.admitted * (1 - (s.spec.hit || 0));
    const perTarget = s.routesOne ? outbound / Math.max(1, s.targets.length) : outbound;
    for (const dest of s.targets) dest.demand += perTarget;
    nodes[s.item.id].demand = round(s.demand);
    nodes[s.item.id].utilization = round(util);
    if (s.item.offline && s.demand) issues.push(s.spec.name + ' está indisponível e recebeu ' + fmt(s.demand) + ' req/s.');
    else if (s.spec.fixedLimit && util > 1) {
      nodes[s.item.id].rejected = round(s.demand - s.admitted);
      issues.push('O rate limiter recusou ' + fmt(s.demand - s.admitted) + ' pedidos/s acima da política fixa de ' + fmt(s.cap) + '/s. Réplicas da mesma peça compartilham esse limite.');
    }
    else if (util > 1) issues.push(s.spec.name + ' recebe ' + fmt(s.demand) + ' req/s para uma capacidade de ' + fmt(s.cap) + ' req/s. Amplie as réplicas ou reduza a carga que chega aqui.');
    if (s.spec.needsTarget && !s.targets.length) issues.push(s.spec.name + ' precisa de um destino disponível. Conecte a próxima etapa do fluxo.');
  }
  let backlog = 0;
  for (const s of order.reverse()) {
    const targets = s.targets;
    const util = s.cap ? Math.min(0.95, s.admitted / s.cap) : 0;
    const localMs = s.spec.fixedLimit ? s.spec.baseMs : s.spec.baseMs / (1 - util);
    const admissionRate = s.demand ? s.admitted / s.demand : 0;
    let downstream = targets.length ? Math.min(...targets.map(d => d.success)) : Number(!s.spec.needsTarget);
    let childMs = targets.length ? Math.max(...targets.map(d => d.latency)) : 0;
    if (s.routesOne && targets.length) {
      downstream = targets.reduce((sum, d) => sum + d.success, 0) / targets.length;
      childMs = downstream ? targets.reduce((sum, d) => sum + d.latency * d.success, 0) / (downstream * targets.length) : 0;
    } else if (s.item.type === 'broker' && targets.length) {
      const pending = targets.reduce((sum, target) => sum + s.admitted * (1 - target.success), 0);
      backlog += pending;
      nodes[s.item.id].pendingDeliveries = round(pending);
      if (pending > 0.01) issues.push('As assinaturas do broker acumulam ' + fmt(pending) + ' entregas/s no total. Cada assinatura recebe uma cópia de cada publicação.');
      downstream = 1;
      childMs = 0;
    } else if (s.item.type === 'queue' && targets.length) {
      const pending = s.admitted * (1 - downstream);
      backlog += pending;
      if (pending > 0.01) issues.push('A fila cresce ' + fmt(pending) + ' trabalhos/s. Aumente a capacidade de quem consome o trabalho.');
      downstream = 1;
      childMs = 0;
    } else if (s.spec.hit && targets.length) {
      const missSuccess = (1 - s.spec.hit) * downstream;
      downstream = s.spec.hit + missSuccess;
      childMs *= missSuccess / downstream;
    }
    s.success = admissionRate * downstream;
    s.latency = s.success ? localMs + childMs : 0;
    nodes[s.item.id].completed = round(s.demand * s.success);
  }
  const served = sources.reduce((sum, src) => sum + src.success * demand / sources.length, 0);
  const latency = served ? sources.reduce((sum, src) => sum + src.latency * src.success * demand / sources.length, 0) / served : 0;
  return {throughput: round(served), latency: round(latency), cost, backlog: round(backlog),
    successRate: demand ? round(100 * served / demand) : 0, issues, nodes};
}
