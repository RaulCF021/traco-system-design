import {academy,reader} from './academy.js';
import {mountTutorial} from './tutorial.js';
import {mountExperiments} from './experiments.js';
import {mountEditor} from './editor.js';
import {simulate,catalog} from './model.js';
import {lessons} from './lessons.js';

const app=document.querySelector('#app');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});
const storageKey='traco.lab.v1';
let saved={};
try {saved=JSON.parse(localStorage.getItem(storageKey))||{}}catch{}
saved.drafts??={}; saved.completed??={};
let selected=lessons.find(x=>x.id===saved.selected)||lessons[0];
let view='lab', editor, graph, load, result, previous;
const sandbox={id:'sandbox',title:'Modo livre',subtitle:'Experimente topologias e compare o efeito de cada mudança.',graph:{nodes:[{id:'client',type:'client',x:40,y:90,replicas:1}],edges:[]},load:500};
const current=()=>view==='sandbox'?sandbox:selected;
function save(){
  try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch{document.querySelector('#status').textContent='O navegador não conseguiu salvar o progresso.'}
}
function updateXP(){document.querySelector('#xp').textContent=Object.keys(saved.completed).length*100}
function persist(){saved.drafts[current().id]={graph,load};save()}
function hero(label,title,sub){return '<div class="hero"><div class="heroCopy"><div class="over"><i></i>'+esc(label)+'</div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div></div>'}
function selectLesson(id){selected=lessons.find(x=>x.id===id)||lessons[0];saved.selected=selected.id;save();navigate('lab')}
function navigate(v){if(location.hash==='#'+v) render(v);else location.hash=v}
const menu=document.querySelector('#menu-toggle');
function setMenu(open){
  menu.setAttribute('aria-expanded',String(open));
  document.querySelector('.site-shell').classList.toggle('expanded',open);
}
menu.onclick=()=>setMenu(menu.getAttribute('aria-expanded')==='false');
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus()}});
function render(v){
  setMenu(false);
  const [route,id]=v.split('/');
  if(route==='missao'||route==='aula'){
    selected=lessons.find(l=>l.id===id)||lessons[0];
    saved.selected=selected.id;save();
  }
  view=route==='missao'?'lab':['school','tutorial','experiments','aula','lab','track','sandbox'].includes(route)?route:'school';
  window.scrollTo(0,0);
  editor?.destroy?.();editor=null;result=null;previous=null;
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===(view==='aula'?'school':view==='lab'?'track':view)));
  updateXP();
  if(view==='school'){academy(app,saved);return}
  if(view==='aula'){reader(app,selected,saved,save);return}
  if(view==='tutorial'){app.innerHTML='<div id="tutorial"></div>';editor=mountTutorial(app.firstElementChild,()=>navigate('missao/'+lessons[0].id));return}
  if(view==='experiments'){app.innerHTML=hero('Laboratório comparativo','Experimentos A/B','Registre sua previsão e coloque duas arquiteturas sob a mesma carga.')+'<div id="experiments"></div>';editor=mountExperiments(app.lastElementChild);return}
  if(view==='track'){
    showMissionDesk(selected);return;
  }
  const l=current(), free=view==='sandbox',draft=saved.drafts[l.id];
  graph=structuredClone(draft?.graph??l.graph);load=draft?.load??l.load;
  app.innerHTML=hero(free?'Laboratório aberto':'Laboratório / Missão '+String(lessons.indexOf(l)+1).padStart(2,'0')+' de '+String(lessons.length).padStart(2,'0'),l.title,l.subtitle)+
  '<div class="workspace"><div><div id="editor"></div><div id="result" aria-live="polite"></div></div><aside class="panel side"><div class="micro">'+(free?'Experimento livre':esc(l.level)+' · '+esc(l.minutes)+' min')+'</div><h2>'+(free?'Bancada de testes':'Briefing da missão')+'</h2><p>'+esc(free?'Monte sua arquitetura no grid e ajuste a carga para investigar capacidade, latência e custo.':l.brief)+'</p>'+
  (free?'':'<a class="textlink lesson-link" href="#aula/'+l.id+'">Estudar esta aula</a><a class="textlink lesson-link" href="#tutorial">Tutorial do editor</a>')+
  (free?'':'<section><h3>Critérios de sucesso</h3><div id="goals"></div></section>')+
  '<section><div class="row"><label for="loadnum">Carga de entrada</label><span class="loadnumber"><input type="number" id="loadnum" min="1" max="100000" step="1"> req/s</span></div><input aria-label="Ajustar carga de entrada" class="range" id="load" type="range" min="1" max="'+Math.max(5000,l.load*2,load)+'" value="'+load+'"><button class="run" id="run">▷ &nbsp; Simular tráfego</button></section>'+
  (free?'':'<details><summary>Pistas da missão</summary><ol>'+l.hints.map(h=>'<li>'+esc(h)+'</li>').join('')+'</ol></details><details><summary>Conceito e referências</summary><p>'+esc(l.concept)+'</p>'+l.sources.map(s=>'<p><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a></p>').join('')+'</details>')+'<details><summary>Controles do laboratório</summary><p>Clique ou arraste um componente da biblioteca. Selecione um bloco para configurar suas instâncias ou simular uma falha. Para ligar dois blocos, clique no conector de saída e depois no destino.</p><button class="secondary" id="reset">Restaurar topologia inicial</button></details></aside></div>';
  const range=app.querySelector('#load');
  const numeric=app.querySelector('#loadnum'); function setLoad(){numeric.value=load;range.max=Math.max(Number(range.max),load);range.value=load} numeric.onchange=()=>{load=Math.max(1,Math.min(100000,Math.round(Number(numeric.value)||l.load)));setLoad();invalidate();persist()}; const reset=app.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('Restaurar os blocos e as conexões iniciais deste cenário?')){delete saved.drafts[l.id];save();render(view)}};
  setLoad();
  range.oninput=()=>{load=Number(range.value);setLoad();invalidate();persist()};
  editor=mountEditor(app.querySelector('#editor'),graph,g=>{graph=g;invalidate();persist()});
  app.querySelector('#run').onclick=run;goals();
}
function showMissionDesk(lesson){
  const {nodes,edges}=lesson.graph;
  const byId=new Map(nodes.map(node=>[node.id,node]));
  const width=Math.max(...nodes.map(n=>n.x))+160;
  const height=Math.max(...nodes.map(n=>n.y))+65;
  const wires=edges.map(edge=>{
    const a=byId.get(edge.from),b=byId.get(edge.to);
    return '<line x1="'+(a.x+65)+'" y1="'+(a.y+17)+'" x2="'+(b.x+65)+'" y2="'+(b.y+17)+'"/>';
  }).join('');
  const blocks=nodes.map(n=>'<g transform="translate('+n.x+' '+n.y+')"><rect width="130" height="35" rx="3"/><text x="65" y="23">'+esc(catalog[n.type].name)+'</text></g>').join('');
  app.innerHTML='<div class="ms-stage"><div class="ms-heading"><h1>Missões de arquitetura</h1><span>'+Object.keys(saved.completed).length+' de '+lessons.length+' concluídas</span></div><svg class="ms-diagram" role="img" aria-label="Topologia inicial de '+esc(lesson.title)+'" viewBox="0 0 '+width+' '+height+'">'+wires+blocks+'</svg><div class="ms-caption">Topologia inicial · '+esc(lesson.title)+'</div></div>'+
  '<section class="ms-dock"><nav aria-label="Selecionar missão">'+lessons.map((l,i)=>'<button type="button" data-mission="'+i+'" aria-pressed="'+(l===lesson)+'">'+esc(l.title)+'</button>').join('')+'</nav><div class="ms-detail"><div><small>'+esc(lesson.level)+' · '+lesson.minutes+' min · '+fmt(lesson.load)+' req/s</small><h2>'+esc(lesson.title)+'</h2><p>'+esc(lesson.brief)+'</p></div><button class="run" id="launch">Abrir missão no grid</button></div></section>';
  app.querySelectorAll('[data-mission]').forEach(button=>button.onclick=()=>{
    showMissionDesk(lessons[Number(button.dataset.mission)]);
    app.querySelector('[aria-pressed="true"]').focus();
  });
  app.querySelector('#launch').onclick=()=>selectLesson(lesson.id);
}
function invalidate(){if(result){previous=result;result=null;app.querySelector('#result').innerHTML='<p class="footnote">Cenário alterado. Simule novamente para atualizar as métricas.</p>';goals()}}
function goals(){const el=app.querySelector('#goals');if(!el)return;
  el.innerHTML=current().goals.map(g=>{const done=result&&g.test(graph,result);return '<div class="goal '+(done?'done':'')+'"><span aria-label="'+(done?'Atingido':'Pendente')+'">'+(done?'✓':'○')+'</span><span>'+esc(g.text)+'</span></div>'}).join('');
}
function run(){
  if(result)previous=result;
  result=simulate(graph,load);goals();const l=current();
  const completed=view==='lab'&&load>=l.load&&l.goals.every(g=>g.test(graph,result));
  if(completed){saved.completed[l.id]=true;save();updateXP()}
  const stats=[['Vazão',fmt(result.throughput)+' req/s'],['Latência média',!result.throughput||result.latency==null||!Number.isFinite(result.latency)?'—':fmt(result.latency)+' ms'],['Custo',fmt(result.cost)+' cr/h'],['Crescimento da fila',fmt(result.backlog)+' itens/s'],['Atendimento',fmt(result.successRate)+'%']];
  const box=app.querySelector('#result');
  box.innerHTML='<section class="panel result"><h2>'+(completed?'Missão concluída · 100 XP':'Resultado da simulação')+'</h2><div class="stats">'+stats.map(([k,v])=>'<div class="stat"><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+'</div>'+
    (previous?'<p class="footnote">Execução anterior · '+fmt(previous.throughput)+' req/s · '+fmt(previous.cost)+' cr/h</p>':'')+
    (result.issues.length?'<ul>'+result.issues.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="footnote">O modelo não encontrou gargalos para esta carga.</p>')+
    (view==='lab'&&load<l.load?'<p>Teste com pelo menos '+fmt(l.load)+' req/s para concluir a missão.</p>':'')+
    '<details class="telemetry"><summary>Tráfego por componente</summary><div class="tablewrap"><table><thead><tr><th>Componente</th><th>Demanda</th><th>Capacidade</th><th>Utilização</th></tr></thead><tbody>'+graph.nodes.map(n=>{const m=result.nodes[n.id];return m?'<tr><td>'+esc(catalog[n.type].name)+'</td><td>'+fmt(m.demand)+' req/s</td><td>'+(m.capacity===null?'Sem limite':fmt(m.capacity)+' req/s')+'</td><td>'+(m.capacity?fmt(m.utilization*100)+'%':'—')+'</td></tr>':''}).join('')+'</tbody></table></div></details><p class="footnote">Modelo didático de leitura com cache aquecido. Latência média das requisições concluídas e custo relativo em créditos por hora.</p>'+
    (completed?'<button class="secondary" id="next">Ver missões</button>':'')+'</section>';
  box.querySelector('#next')?.addEventListener('click',()=>navigate('track'));
  box.scrollIntoView({block:'nearest',behavior:'instant'});
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
window.addEventListener('hashchange',()=>render(location.hash.slice(1)));render(location.hash.slice(1));



