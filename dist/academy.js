import {simulate,catalog} from './model.js';
import {course} from './course.js';
import {lessons} from './lessons.js';

const motifs = [
  'M5 26H26L42 11H66', 'M5 26H24L38 11H66 M24 26L40 40H66',
  'M5 25H25L40 10H66 M25 25H66 M25 25L40 40H66',
  'M5 38L27 15H48L65 32 M27 15L52 42',
  'M5 25H22 M27 16V34 M35 16V34 M43 16V34 M49 25H67',
  'M5 36H20V26H37V16H52V8H67'
];
function motif(i){return '<svg class="motif" viewBox="0 0 72 50" aria-hidden="true"><path d="'+motifs[i]+'" /></svg>'}
function action(label,hash,cls='action'){return '<a class="'+cls+'" href="#'+hash+'">'+label+'</a>'}
function status(l,saved){
 const read=saved.knowledge?.[l.id], solved=saved.completed[l.id];
 return solved&&read?'Módulo concluído':solved?'Missão concluída':read?'Previsão resolvida':saved.positions?.[l.id]!==undefined?'Em estudo':'Disponível';
}
export function academy(app,saved){
 const next=lessons.find(l=>!saved.knowledge?.[l.id]||!saved.completed[l.id])||lessons[0];
 const progress=lessons.reduce((sum,l)=>sum+Number(!!saved.knowledge?.[l.id])+Number(!!saved.completed[l.id]),0);
 app.innerHTML='<div class="academy-intro"><div class="academy-copy"><div class="over"><i></i>Caderno de System Design</div><h1>Arquitetura <br>de <em>sistemas.</em></h1><p>Siga uma consulta até o banco. Descubra onde a fila cresce. Depois, redesenhe o caminho.</p><div class="academy-actions">'+action(progress?'Continuar a trilha':'Abrir a primeira aula','aula/'+next.id)+action('Tutorial do editor','tutorial','ghost')+'</div></div><figure class="plate"><img src="./press.svg" alt="Esquema de um balanceador ligado a servidores e a um banco de dados"><figcaption>Prancha de estudo · Infraestrutura de uma consulta</figcaption></figure></div>'+
 '<div class="academy-layout"><section><div class="course-heading"><div><div class="micro">Índice do caderno</div><h2>Aulas e missões</h2></div><span>6 módulos</span></div><div class="module-list">'+lessons.map((l,i)=>'<a class="module-row theme-'+i+'" href="#aula/'+l.id+'"><span class="tile">'+motif(i)+'</span><div><small>Módulo '+String(i+1).padStart(2,'0')+' · '+l.level+'</small><h3>'+course[l.id].title+'</h3><p>'+l.subtitle+'</p></div><span class="module-state">'+status(l,saved)+'</span><span aria-hidden="true">›</span></a>').join('')+'</div></section>'+
 '<aside class="study-side"><section><div class="micro">Seu progresso</div><h2>'+progress+' <small>/ 12 etapas</small></h2><progress value="'+progress+'" max="12" aria-label="Etapas concluídas"></progress><p>Cada módulo tem uma previsão para resolver e uma missão para completar no grid.</p></section><section><div class="micro">Bancada de experimentos</div><h3>Uma variável por vez.</h3><p>Compare duas arquiteturas sob a mesma carga. Observe também como filas e balanceadores afetam o resultado.</p>'+action('Abrir experimentos','experiments','textlink')+'</section></aside></div>';
}
function baseline(container,lesson){
 const result=simulate(lesson.graph,lesson.load);
 const nodes=lesson.graph.nodes.filter(n=>n.type!=='client');
 container.innerHTML='<div class="micro">Radiografia do cenário inicial</div><p>'+lesson.load.toLocaleString('pt-BR')+' requisições por segundo na entrada</p>'+
 nodes.map(n=>{const m=result.nodes[n.id],ratio=m.capacity?m.demand/m.capacity:0;return '<div class="meter"><span>'+catalog[n.type].name+'</span><i><em style="width:'+Math.min(100,ratio*100)+'%;background:'+(ratio>1?'#b35530':'#28666a')+'"></em></i><small>'+m.demand.toLocaleString('pt-BR')+' / '+m.capacity.toLocaleString('pt-BR')+' req/s</small></div>'}).join('')+
 '<small>Demanda recebida / capacidade disponível por componente.</small>';
}
export function reader(app,l,saved,save){
 const unit=course[l.id], i=lessons.indexOf(l);
 saved.positions??={};saved.knowledge??={};
 const count=unit.sections.length;
 let page=Math.max(0,Math.min(count,saved.positions[l.id]??0));
 function display(focus=false){
  const section=unit.sections[page],quiz=unit.prediction, last=page===count;
  app.innerHTML='<div class="reader-top">'+action('‹ Todas as aulas','school','textlink')+'<span>Módulo '+(i+1)+' de 6</span></div><div class="reader-layout"><aside class="syllabus"><div class="micro">Nesta aula</div><h2>'+unit.title+'</h2>'+[...unit.sections.map(s=>s.title),'Teste sua previsão'].map((title,n)=>'<button data-page="'+n+'" aria-current="'+(n===page?'step':'false')+'"><b>'+String(n+1).padStart(2,'0')+'</b>'+title+'</button>').join('')+action('Laboratório deste módulo','missao/'+l.id,'textlink')+'</aside>'+
  '<article class="reading theme-'+i+'"><div class="reading-banner"><div class="micro">'+l.concept+'</div>'+motif(i)+'</div><div class="reading-content"><div class="micro">'+(last?'Previsão':'Parte '+(page+1)+' de '+count)+'</div><h1 tabindex="-1">'+(last?'Teste sua previsão':section.title)+'</h1>'+
  (last?'<p>'+quiz.question+'</p><div class="answers">'+quiz.options.map((v,n)=>'<button data-answer="'+n+'"><b>'+String.fromCharCode(65+n)+'</b>'+v.text+'</button>').join('')+'</div><p class="response" role="status"></p>':'<p class="lesson-text">'+section.text+'</p>'+(page===0?'<div class="scenario-question">'+unit.questionIntro+'</div>':'')+'<div class="baseline"></div>')+
  (last?'<details class="prep"><summary>Roteiro para o laboratório</summary><ol>'+unit.steps.map(s=>'<li>'+s+'</li>').join('')+'</ol></details>':'')+
  '<div class="reader-controls">'+(page?'<button data-back class="secondary">Anterior</button>':'')+(last?action('Abrir missão no grid','missao/'+l.id):'<button data-next class="run">'+(page===count-1?'Fazer previsão':'Continuar aula')+'</button>')+'</div>'+
  '<details class="prep"><summary>Fontes para aprofundar</summary>'+l.sources.map(s=>'<p><a target="_blank" rel="noopener" href="'+s.url+'">'+s.title+'</a></p>').join('')+'</details></div></article></div>';
  if(!last)baseline(app.querySelector('.baseline'),l);
  function move(n){page=n;saved.positions[l.id]=n;save();display(true)}
  app.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>move(Number(b.dataset.page)));
  app.querySelector('[data-back]')?.addEventListener('click',()=>move(page-1));
  app.querySelector('[data-next]')?.addEventListener('click',()=>move(page+1));
  if(last){
   const buttons=[...app.querySelectorAll('[data-answer]')];
   function respond(n){const ok=n===quiz.correct;buttons.forEach((b,j)=>{b.classList.toggle('yes',j===n&&ok);b.classList.toggle('no',j===n&&!ok);b.setAttribute('aria-pressed',String(j===n))});app.querySelector('.response').textContent=(ok?'Correto. ':'Revise sua previsão. ')+quiz.options[n].feedback;if(ok){saved.knowledge[l.id]=true;save()}}
   buttons.forEach((b,n)=>b.onclick=()=>respond(n));
   if(saved.knowledge[l.id])respond(quiz.correct);
  }
  if(focus)app.querySelector('h1').focus();
 }
 display();
}

