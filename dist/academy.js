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
 const groups=[
  {title:'Fundamentos',ids:['catalogo','leituras'],note:'Caminho de leitura, persistência e cache.'},
  {title:'Distribuição de tráfego',ids:['balanceamento','netflix'],note:'Escala horizontal e entrega de conteúdo na borda.'},
  {title:'Operação em escala',ids:['spotify','orcamento'],note:'Consumidores assíncronos, gargalos e orçamento.'}
 ];
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const next=lessons.find(l=>!saved.knowledge?.[l.id]||!saved.completed[l.id]);
 const finished=lessons.filter(l=>saved.knowledge?.[l.id]&&saved.completed[l.id]).length;
 const isMission=next&&saved.knowledge?.[next.id]&&!saved.completed[next.id];
 const jump=next?'<a class="lib-resume" href="#'+(isMission?'missao/':'aula/')+next.id+'">'+(isMission?'Continuar na missão':saved.positions?.[next.id]!==undefined?'Retomar aula':'Próxima aula')+'<strong>'+next.title+'</strong><span aria-hidden="true">→</span></a>':'<a class="lib-resume" href="#sandbox">Continuar no modo livre <span aria-hidden="true">→</span></a>';
 app.innerHTML='<div class="lib"><div class="lib-head"><h1>Currículo de System Design</h1><p>'+lessons.length+' módulos <span aria-hidden="true">·</span> '+finished+' concluído'+(finished===1?'':'s')+'</p></div>'+jump+
 '<div class="lib-toolbar"><label class="lib-search"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input type="search" aria-label="Buscar no currículo" placeholder="Buscar aula, tema ou componente"></label><span class="lib-count" aria-live="polite"></span></div><div class="lib-groups"></div></div>';
 const results=app.querySelector('.lib-groups'),count=app.querySelector('.lib-count'),input=app.querySelector('input');
 function render(){
  const words=normalize(input.value.trim()).split(/\s+/).filter(Boolean);
  let found=0;
  results.innerHTML=groups.map((group,g)=>{
   const items=group.ids.map(id=>lessons.find(l=>l.id===id)).filter(l=>{
    const content=normalize([group.title,l.title,l.subtitle,l.concept,l.brief,course[l.id].title,...l.graph.nodes.flatMap(n=>[n.type,catalog[n.type]?.name])].join(' '));
    return words.every(w=>content.includes(w));
   });
   if(!items.length)return '';
   found+=items.length;
   return '<section class="lib-group"><div class="lib-group-head"><div><h2>'+group.title+'</h2><p>'+group.note+'</p></div>'+(g===0?'<a class="lib-figure-link" href="./press.svg" target="_blank" rel="noopener" aria-label="Ampliar desenho da arquitetura em uma nova aba"><img class="lib-figure" src="./press.svg" alt="Desenho de balanceador, servidores e banco de dados"><span aria-hidden="true">↗</span></a>':'')+'</div><ul>'+items.map(l=>{
    const i=lessons.indexOf(l),state=status(l,saved);
    return '<li><a class="lib-lesson" href="#aula/'+l.id+'"><span class="lib-icon">'+motif(i)+'</span><span class="lib-description"><strong>'+course[l.id].title+'</strong><span>'+l.title+' · '+l.minutes+' min</span></span><small>'+state+'</small><span class="lib-arrow" aria-hidden="true">→</span></a></li>';
   }).join('')+'</ul></section>';
  }).join('');
  count.textContent=words.length?found+' módulo'+(found===1?'':'s'):'';
  if(!found){
   results.innerHTML='<div class="lib-empty"><p>Nenhuma aula encontrada.</p><button type="button">Limpar busca</button></div>';
   results.querySelector('button').onclick=()=>{input.value='';render();input.focus()};
  }
 }
 input.addEventListener('input',render);
 render();
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
