import {catalog, simulate} from './model.js';

const format = n => n.toLocaleString('pt-BR', {maximumFractionDigits: 1});
const node = (id, type = id, replicas = 1) => ({id, type, replicas});
function chain(nodes) {
  return {nodes, edges: nodes.slice(1).map((n, i) => ({from:nodes[i].id, to:n.id}))};
}
function pool(size) {
  const graph = chain([node('client'), node('lb')]);
  for (let i = 0; i < size; i++) {
    const api = node('api' + i, 'api');
    graph.nodes.push(api);
    graph.edges.push({from:'lb', to:api.id});
  }
  return graph;
}
const scenarios = {
  cache: {
    title:'Leituras com cache', note:'Um catálogo de discos recebe leituras repetidas. Compare a consulta direta ao banco com uma camada de Redis aquecida.',
    config:'Réplicas de PostgreSQL em A e B', initial:1, load:700, max:2400,
    names:['Consulta direta','Cache antes do banco'],
    graphs:n => [chain([node('client'),node('api'),node('db','postgres',n)]),chain([node('client'),node('api'),node('redis'),node('db','postgres',n)])],
    question:'Qual arquitetura conclui mais consultas por segundo?',
    metric:'throughput',
    explain:(a,b) => 'Em A, o PostgreSQL recebe '+format(a.nodes.db.demand)+' consultas/s. Em B, o Redis atende 80% das leituras que chegam a ele e encaminha '+format(b.nodes.db.demand)+' consultas/s ao banco. Cada réplica do PostgreSQL suporta 450 consultas/s. A API admite até 800/s em ambas as arquiteturas.',
  },
  queue: {
    title:'Consumo de uma fila', note:'Uma API aceita eventos de escuta e entrega o trabalho a uma fila. Separe a confirmação ao cliente da gravação final do evento.',
    config:'Réplicas de worker em B', initial:2, load:700, max:1600,
    names:['Um consumidor','Grupo de consumidores'],
    graphs:n => [1,n].map(r=>chain([node('client'),node('api'),node('queue'),node('worker','worker',r),node('storage')])),
    question:'Em qual arquitetura o acúmulo de eventos cresce mais devagar?',
    metric:'backlog', lower:true,
    explain:(a,b) => 'A fila aceita '+format(b.nodes.queue.completed)+' eventos/s em B. O armazenamento conclui '+format(a.nodes.storage.completed)+' gravações/s em A e '+format(b.nodes.storage.completed)+' em B. Cada consumidor processa até 350 eventos/s. A latência do cliente mede o tempo até a confirmação da fila.',
  },
  balance: {
    title:'Distribuição de tráfego', note:'Um festival usa uma API sem estado para validar ingressos. Observe o que acontece ao distribuir as validações entre servidores.',
    config:'Destinos de API em B', initial:2, load:1400,max:4000,
    names:['Um destino de API','Pool de destinos'],
    graphs:n=>[pool(1),pool(n)], question:'Qual arquitetura conclui mais validações por segundo?',
    metric:'throughput',
    explain:(a,b) => 'O balanceador envia '+format(a.nodes.api0.demand)+' validações/s à API em A. Cada destino recebe '+format(b.nodes.api0.demand)+'/s em B e pode concluir até 800/s. Quando sobra capacidade nos dois lados, ampliar o pool ainda altera a latência e o custo.',
  }
};

function make(tag,className,text) {
  const el=document.createElement(tag);
  if(className) el.className=className;
  if(text !== undefined) el.textContent=text;
  return el;
}

// The same graph drives the flow view and both measurements. Each column is a
// topological depth. A load balancer's destinations occupy independent lanes.
function diagram(graph,run) {
  const ns='http://www.w3.org/2000/svg';
  const s=(tag,attrs,text) => {
    const el=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
    if(text!==undefined) el.textContent=text;
    return el;
  };
  const depth=new Map();
  for(const n of graph.nodes) {
    const parents=graph.edges.filter(e=>e.to===n.id);
    depth.set(n.id,parents.length ? 1+Math.max(...parents.map(e=>depth.get(e.from))) : 0);
  }
  const levels=[];
  for(const n of graph.nodes) (levels[depth.get(n.id)]??=[]).push(n);
  const lanes=Math.max(...levels.map(l=>l.length)), width=174*levels.length-30,height=lanes*72+10;
  const svg=s('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':graph.edges.map(e=>{
    const name=id=>catalog[graph.nodes.find(n=>n.id===id).type].name;
    return name(e.from)+' para '+name(e.to);
  }).join(', ')});
  const pos=new Map();
  levels.forEach((level,col)=>level.forEach((n,row)=>pos.set(n.id,{x:col*174+2,y:height/2+(row-(level.length-1)/2)*72})));
  for(const e of graph.edges) {
    const a=pos.get(e.from),b=pos.get(e.to),x=a.x+138,end=b.x-3,mid=(x+end)/2;
    svg.append(s('path',{d:'M '+x+' '+a.y+' C '+mid+' '+a.y+' '+mid+' '+b.y+' '+end+' '+b.y,fill:'none',stroke:'#47685e','stroke-width':2}));
    svg.append(s('path',{d:'m '+(end-5)+' '+(b.y-4)+' 5 4 -5 4',fill:'none',stroke:'#47685e','stroke-width':2}));
  }
  for(const n of graph.nodes) {
    const {x,y}=pos.get(n.id), measure=run?.nodes[n.id];
    const label=n.type==='storage'?'Object storage':catalog[n.type].name;
    svg.append(s('rect',{x,y:y-25,width:137,height:50,rx:6,fill:measure?.utilization>1?'#ffe4a9':'#fffef6',stroke:measure?.utilization>1?'#a5660b':'#83988a'}));
    svg.append(s('text',{x:x+9,y:y-3,class:'ex-svg-name'},label));
    svg.append(s('text',{x:x+9,y:y+14,class:'ex-svg-data'},measure ? format(measure.demand)+' req/s' : '×'+n.replicas+' '+(n.replicas===1?'instância':'instâncias')));
  }
  return svg;
}

export function mountExperiments(container) {
  const css=new URL('./experiments.css',import.meta.url).href;
  if(![...document.styleSheets].some(sheet=>sheet.href===css) && !document.querySelector('link[data-traco-experiments]')) {
    const link=document.createElement('link');link.rel='stylesheet';link.href=css;link.dataset.tracoExperiments='';document.head.append(link);
  }
  const root=make('section','ex-lab');container.replaceChildren(root);
  root.innerHTML='<div class="ex-setup"><div><label>Experimento<select class="ex-scenario"></select></label><p class="ex-note"></p></div><div class="ex-config"><label>Carga de entrada (req/s)<input class="ex-load" type="number" min="1" step="1" required></label><label><span class="ex-knob-label"></span><select class="ex-knob"></select></label></div></div><div class="ex-pair"></div><form class="ex-predict"><fieldset><legend></legend><div class="ex-options"></div></fieldset><button type="submit" class="run">Comparar resultados</button></form><div class="ex-results" aria-live="polite"></div>';
  const $=q=>root.querySelector(q);
  const scenario=$('.ex-scenario'),knob=$('.ex-knob'),load=$('.ex-load'),form=$('form'),results=$('.ex-results');
  for(const [key,entry] of Object.entries(scenarios)) scenario.add(new Option(entry.title,key));
  for(let i=1;i<=4;i++) knob.add(new Option(String(i),String(i)));
  for(const [v,text] of [['A','Arquitetura A'],['B','Arquitetura B'],['equal','As duas empatam']]) {
    const label=make('label');const radio=make('input');radio.type='radio';radio.name='prediction';radio.value=v;radio.required=true;label.append(radio,text);$('.ex-options').append(label);
  }
  let graphs;
  function paint(runs) {
    const cfg=scenarios[scenario.value];
    $('.ex-pair').replaceChildren(...graphs.map((g,i)=>{
      const article=make('article','ex-variant');const head=make('div','ex-variant-title');
      head.append(make('b','ex-letter',i?'B':'A'),make('h3','',cfg.names[i]));
      const scroll=make('div','ex-flow');const scrollContent=diagram(g,runs?.[i]);
      scrollContent.style.setProperty('--ex-depth',scrollContent.viewBox.baseVal.width);
      scroll.append(scrollContent);article.append(head,scroll);return article;
    }));
  }
  function invalidate() {
    graphs=scenarios[scenario.value].graphs(Number(knob.value));paint();
    results.replaceChildren();form.reset();
  }
  function select() {
    const cfg=scenarios[scenario.value];
    $('.ex-note').textContent=cfg.note;$('.ex-knob-label').textContent=cfg.config;knob.value=cfg.initial;
    load.value=cfg.load;load.max=cfg.max;$('legend').textContent=cfg.question;invalidate();
  }
  scenario.onchange=select;knob.onchange=invalidate;load.oninput=invalidate;
  form.onsubmit=e=>{
    e.preventDefault();if(!load.reportValidity())return;
    const predicted=new FormData(form).get('prediction');if(!predicted)return;
    const cfg=scenarios[scenario.value],runs=graphs.map(g=>simulate(g,Number(load.value)));
    const [a,b]=runs,diff=(a[cfg.metric]-b[cfg.metric])*(cfg.lower?-1:1),winner=diff===0?'equal':diff>0?'A':'B';
    paint(runs);
    const summary=make('div','ex-summary');const title=make('h3','',predicted===winner?'Sua previsão se confirmou':'Confira o que aconteceu');
    const outcome=winner==='equal'?'As arquiteturas empataram neste critério.':'A arquitetura '+winner+' obteve o melhor resultado neste critério.';
    summary.append(title,make('p','',outcome+' '+cfg.explain(a,b)));
    const table=make('table','ex-table'),head=table.createTHead().insertRow();
    for(const v of ['Métrica','Arquitetura A','Arquitetura B']) {const th=make('th','',v);th.scope='col';head.append(th);}
    const body=table.createTBody();
    const metrics=[['throughput',scenario.value==='queue'?'Recebimento confirmado':'Vazão concluída',' req/s'],['latency','Latência média',' ms'],['cost','Custo relativo',' cr/h']];
    if(scenario.value==='queue') metrics.push(['backlog','Crescimento da fila',' eventos/s']);
    for(const [key,label,unit] of metrics) {
      const row=body.insertRow(),th=make('th','',label);th.scope='row';row.append(th);
      for(const result of runs) row.insertCell().textContent=format(result[key])+unit;
    }
    results.replaceChildren(summary,table);
  };
  select();
  return {destroy(){root.remove();}};
}

