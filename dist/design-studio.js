import {mountEditor} from './editor.js';
import {catalog, simulate} from './model.js';
import {scenarios} from './scenarios.js';

const format = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2});
const num = n => format.format(n);
const metrics = [
  ['Vazão', 'throughput', 'req/s'],
  ['Atendimento', 'successRate', '%'],
  ['Latência média', 'latency', 'ms'],
  ['Custo', 'cost', 'cr/h'],
  ['Crescimento da fila', 'backlog', 'itens/s']
];

function element(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function disclosure(title) {
  const panel = element('details', 'ds-detail');
  panel.append(element('summary', '', title));
  return panel;
}
function validGraph(graph) {
  return Array.isArray(graph?.nodes) && Array.isArray(graph?.edges);
}
function validLoad(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function metricText(result, key, unit) {
  if (!result || (key === 'latency' && !result.throughput)) return '—';
  return num(result[key]) + (unit === '%' ? '%' : ' ' + unit);
}
function makeTable(label, columns) {
  const scroll = element('div', 'ds-scroll');
  const table = element('table');
  table.setAttribute('aria-label', label);
  const head = table.createTHead().insertRow();
  columns.forEach(column => {
    const cell = element('th', '', column);
    cell.scope = 'col';
    head.append(cell);
  });
  const body = table.createTBody();
  scroll.append(table);
  return {scroll, body};
}
function appendRow(body, label, values) {
  const row = body.insertRow();
  const first = element('th', '', label);
  first.scope = 'row';
  row.append(first);
  values.forEach(value => row.append(element('td', '', value)));
}
function identifyNodes(graph, result) {
  const counts = new Map();
  graph.nodes.forEach(n => counts.set(n.type, (counts.get(n.type) || 0) + 1));
  const seen = new Map();
  return graph.nodes.map(n => {
    const index = (seen.get(n.type) || 0) + 1;
    seen.set(n.type, index);
    const name = (catalog[n.type]?.name || n.type) + (counts.get(n.type) > 1 ? ' '+index : '');
    return {name, n, m:result.nodes[n.id]};
  }).filter(row => row.m);
}
function limitingNote(rows, result) {
  const unavailable = rows.filter(({n,m}) => n.offline && m.demand > 0);
  if (unavailable.length) return 'Indisponibilidade no caminho: ' + unavailable.map(r => r.name).join(', ') + '. Esses componentes recebem pedidos e têm capacidade zero.';
  const active = rows.filter(({m}) => m.capacity > 0 && m.demand > 0);
  active.sort((a,b) => b.m.demand / b.m.capacity - a.m.demand / a.m.capacity);
  if (!active.length) return 'Nenhum serviço com capacidade finita recebeu tráfego. Verifique o caminho que sai do cliente.';
  const {name,m} = active[0], utilization = 100 * m.demand / m.capacity;
  if (utilization > 100) return name + ' recebe ' + num(m.demand) + ' req/s para ' + num(m.capacity) + ' req/s de capacidade. É o componente mais sobrecarregado desta execução.';
  if (utilization === 100) return name + ' opera no limite de ' + num(m.capacity) + ' req/s. Uma carga maior começa a ultrapassar a capacidade disponível.';
  if (result.successRate < 100) return 'Há pedidos sem resposta, embora os serviços ativos estejam abaixo da capacidade. Confira os destinos e as observações da simulação.';
  return 'Nenhum componente excedeu a capacidade. ' + name + ' ficou mais próximo do limite, com ' + num(utilization) + '% de utilização.';
}
function resultPanel(host, scenario, run, previous) {
  const result = simulate(run.graph, run.load);
  const reference = simulate(scenario.graph, run.load);
  const prev = previous ? simulate(previous.graph, previous.load) : null;
  const rows = identifyNodes(run.graph, result);
  host.replaceChildren();
  host.append(element('h2', '', 'Leitura do teste'), element('p','ds-finding',limitingNote(rows, result)));
  const table = makeTable('Comparação entre execuções', [
    'Métrica', 'Inicial · '+num(run.load)+' req/s', 'Seu teste · '+num(run.load)+' req/s',
    prev ? 'Teste anterior · '+num(previous.load)+' req/s' : 'Teste anterior'
  ]);
  metrics.forEach(([label,key,unit])=>appendRow(table.body,label,
    [metricText(reference,key,unit),metricText(result,key,unit),metricText(prev,key,unit)]));
  host.append(table.scroll);
  host.append(element('p','ds-note','Inicial usa o desenho original deste cenário com a carga do seu teste. '+(prev && previous.load !== run.load ? 'A carga do teste anterior era diferente.' : !prev ? 'O próximo teste também poderá ser comparado com este.' : 'Os dois últimos testes usaram a mesma carga.')));
  const traffic = disclosure('Tráfego por componente · '+rows.length);
  const telemetry = makeTable('Tráfego por componente', ['Peça','Instâncias','Demanda','Capacidade','Utilização','Concluídas']);
  rows.forEach(({name,n,m})=>{
    const capped = m.capacity !== null;
    appendRow(telemetry.body, name + (n.offline?' · fora do ar':''), [
      String(n.replicas || 1), num(m.demand)+' req/s', capped ? num(m.capacity)+' req/s' : 'Sem limite',
      m.capacity > 0 ? num(100*m.demand/m.capacity)+'%' : '—', num(m.completed)+' req/s'
    ]);
  });
  traffic.append(telemetry.scroll);host.append(traffic);
  if (result.issues.length) {
    const notes = element('ul','ds-issues');
    result.issues.forEach(issue=>notes.append(element('li','',issue)));
    host.append(notes);
  }
  host.append(element('p','ds-note','O modelo estima leituras com cache aquecido. A latência considera pedidos concluídos. Os créditos/h representam custo relativo.'));
}
function guidance(scenario) {
  const region = element('section','ds-guidance');
  if (scenario.experiments?.length) {
    const group = disclosure('Experimentos guiados · '+scenario.experiments.length);
    const list = element('div','ds-experiments');
    scenario.experiments.forEach(item=>{
      const experiment=disclosure(item.title);
      experiment.append(element('p','',item.instruction),element('p','ds-note',item.why));
      list.append(experiment);
    });
    group.append(list);region.append(group);
  }
  if (scenario.lifecycle?.length) {
    const lifecycle = disclosure('Como a operação acontece');
    const list=element('ol');
    scenario.lifecycle.forEach(item=>{
      const row=element('li');row.append(element('strong','',item.title),element('p','',item.text));list.append(row);
    });
    lifecycle.append(list);region.append(lifecycle);
  }
  if (scenario.questions?.length) {
    const section = disclosure('Perguntas para revisar seu desenho');
    const list = element('ul');
    scenario.questions.forEach(question=>list.append(element('li','',question)));
    section.append(list);region.append(section);
  }
  return region;
}

export function mountDesignStudio(container, scenarioId, state = {}, save = ()=>{}) {
  const id = Object.hasOwn(scenarios,scenarioId) ? scenarioId : Object.keys(scenarios)[0];
  const scenario = scenarios[id];
  state.studios ??= {};
  const draft = state.studios[id] ??= {};
  let graph = structuredClone(validGraph(draft.graph) ? draft.graph : scenario.graph);
  let load = validLoad(draft.load) ? draft.load : scenario.load;
  const validRun = run => validGraph(run?.graph) && validLoad(run.load);
  let last = validRun(draft.last) ? draft.last : {graph: structuredClone(graph),load};
  let previous = validRun(draft.previous) ? draft.previous : null;

  const root = element('section','ds-studio'), head=element('div','ds-head'), copy=element('div','ds-copy');
  copy.append(element('p','ds-eyebrow','Estúdio de arquitetura'),element('h1','',scenario.title),element('p','ds-brief',scenario.brief));
  const switchLabel = element('label','ds-switch','Trocar projeto');
  const select = element('select');
  for (const [key,value] of Object.entries(scenarios)) {
    const option = element('option','',value.title);option.value=key;option.selected=key===id;select.append(option);
  }
  select.addEventListener('change',()=>{location.hash='projeto/'+select.value;});
  switchLabel.append(select);head.append(copy,switchLabel);
  const goal=element('p','ds-goal');goal.append(element('strong','','Objetivo do projeto'),document.createTextNode(scenario.goal));
  const guide=guidance(scenario),canvas=element('div','ds-canvas');
  const controls=element('form','ds-controls'),loadLabel=element('label','ds-load','Carga de entrada (req/s)'),input=element('input');
  input.type='number';input.min='1';input.step='1';input.required=true;input.value=String(load);
  loadLabel.append(input);
  const submit=element('button','ds-primary','Simular meu desenho');submit.type='submit';
  const status=element('span','ds-status');status.setAttribute('role','status');
  const editHint=disclosure('Controles do editor');
  editHint.append(element('p','','Clique ou arraste uma peça da biblioteca. Clique em uma peça da mesa para configurar instâncias, simular uma falha ou remover o bloco. Para ligar duas peças, clique na porta de saída e depois na peça de destino.'));
  controls.append(loadLabel,submit,status,editHint);
  const results=element('section','ds-results');
  const training=element('div','teach-actions');
  for(const [label,path] of [['Montar com orientação','guiado'],['Revisar requisitos','requisitos'],['Avaliar minha decisão de arquitetura','revisao']]){
    const a=element('a','teach-link',label);a.href='#'+path+'/'+id;training.append(a)
  }
  const plan=disclosure('Meu levantamento de requisitos');
  const notes=state.designSchool?.projects?.[id]?.notes||{};
  ['Ação principal','Critério de aceitação','Restrição','Hipótese'].forEach((name,i)=>{
    const row=element('p');row.append(element('strong','',name+' · '),document.createTextNode(notes[i]||'Ainda não registrado.'));plan.append(row)
  });
  root.append(head,goal,training,plan,guide,canvas,controls,results);container.replaceChildren(root);
  function persist(){Object.assign(draft,{graph,load,last,previous});save();}
  function refreshStatus(){
    const changed=load!==last.load||JSON.stringify(graph)!==JSON.stringify(last.graph);
    status.textContent=changed?'Desenho ou carga alterados. Simule para atualizar a leitura.':'Medição disponível para esta configuração.';
    status.classList.toggle('ds-stale',changed);
  }
  const editor=mountEditor(canvas,graph,next=>{graph=next;persist();refreshStatus();});
  input.addEventListener('input',()=>{
    const value=input.valueAsNumber;
    input.setCustomValidity(Number.isFinite(value)&&!validLoad(value)?'Informe um número inteiro positivo de requisições por segundo.':'');
    if (input.validity.valid) {load=value;persist();refreshStatus();}
  });
  controls.addEventListener('submit',event=>{
    event.preventDefault();
    if (!input.reportValidity() || !validLoad(input.valueAsNumber)) return;
    load=input.valueAsNumber;previous=last;last={graph:structuredClone(graph),load};
    persist();resultPanel(results,scenario,last,previous);refreshStatus();
    status.textContent='Teste concluído com '+num(load)+' req/s.';
    results.scrollIntoView({block:'nearest'});
  });
  resultPanel(results,scenario,last,previous);refreshStatus();persist();
  return {destroy(){editor.destroy();root.remove();}};
}
