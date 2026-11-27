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
 app.innerHTML='<div class="lib"><p><a class="lesson-help" href="#aprender">Primeira vez? Comece com um pedido no aplicativo de música.</a></p><div class="lib-head"><div class="lib-meta">Escola / Currículo</div><h1>Currículo de System Design</h1><p>'+lessons.length+' módulos · '+finished+' concluído'+(finished===1?'':'s')+'</p>'+jump+'</div>'+
 '<div class="lib-body"><div class="lib-toolbar"><h2>Trilha de estudos</h2><label class="lib-search"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input type="search" aria-label="Buscar no currículo" placeholder="Buscar aula, tema ou componente"></label><span class="lib-count" aria-live="polite"></span></div><div class="lib-groups"></div></div></div>';
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
const illustrations = {
 leituras: {labels:['Cliente','API','Redis','PostgreSQL'],icons:['client','api','redis','postgres'],flows:['700/s','700/s','140/s'],caption:'Cache aquecido · 560 leituras/s resolvidas em memória, 140/s na origem'},
 balanceamento:{labels:['Cliente','Balanceador','API × 2'],icons:['client','lb','api'],flows:['1.400/s','2 × 700/s'],caption:'Distribuição uniforme · 700 validações/s por instância'},
 netflix:{labels:['Reprodutor','CDN','Origem'],icons:['client','cdn','storage'],flows:['6.000/s','600/s'],caption:'Entrega de segmentos · nove em cada dez pedidos atendidos na borda'},
 spotify:{labels:['API','Fila','Worker × 2','Storage'],icons:['api','queue','worker','storage'],flows:['700/s','700/s','700/s'],caption:'Ingestão e processamento · duas réplicas acompanham o fluxo de entrada'},
 orcamento:{labels:['Balanceador','API × 3','Redis','PostgreSQL'],icons:['lb','api','redis','postgres'],flows:['1.800/s','1.800/s','360/s'],caption:'Arquitetura dimensionada · 39 créditos por hora para o pico de pré-venda'}
};
const symbols = {
 client:'<rect x="-20" y="-17" width="40" height="27" rx="2"/><path d="M-11 17h22m-11-7v7m-14-28h26"/>',
 api:'<g><path d="m-22-12 14-8 30 12-14 9zM-22-12v9L8 10l14-9v-9M-22 1v8l30 13 14-9V5M-17-5l6 2m-6 10 6 2"/></g>',
 redis:'<path d="m-23-6 23-12 23 12L0 6Zm0 8L0 14 23 2m-46 8L0 22l23-12"/><path d="m-5-8 5-2 5 2-5 3Z"/>',
 postgres:'<ellipse cy="-12" rx="20" ry="8"/><path d="M-20-12v23c0 10 40 10 40 0v-23M-20-4c0 10 40 10 40 0M-20 4c0 10 40 10 40 0"/>',
 lb:'<path d="M-21 0h15m0 0 14-14h11M-6 0h24M-6 0 8 14h12"/><path d="m15-18 5 4-5 4m0 6 5 4-5 4m0 6 5 4-5 4"/>',
 cdn:'<circle r="19"/><ellipse rx="8" ry="19"/><path d="M-18-6h36m-36 12h36"/><circle r="3" cx="12" cy="-12" fill="#c68c40"/>',
 storage:'<path d="m-21-10 20-10 22 10-21 11Zm0 0v22l21 11 21-11v-22M0 1v22m-11-37L9-3"/>',
 queue:'<path d="M-23-13h46m-46 26h46"/><rect x="-17" y="-8" width="7" height="16"/><rect x="-4" y="-8" width="7" height="16"/><rect x="9" y="-8" width="7" height="16"/>',
 worker:'<path d="m-15-10 12-8 16 5 6 12-7 15-16 3-13-10Z"/><circle r="8"/><circle r="3"/>'
};
function figure(id){
 if(id==='catalogo')return '<figure class="desk-figure"><a href="./press.svg" target="_blank" rel="noopener" aria-label="Ampliar o desenho em uma nova aba"><img src="./press.svg" alt="Desenho axonométrico de um balanceador ligado a servidores e banco de dados"></a><figcaption>Do balanceador ao banco de dados</figcaption></figure>';
 const f=illustrations[id], width=610, margin=66, gap=(width-2*margin)/(f.labels.length-1);
 const connectors=f.flows.map((v,i)=>{const x=margin+i*gap+35,end=margin+(i+1)*gap-36;return '<path d="M'+x+' 110H'+end+'" stroke="#1e4141" stroke-width="4"/><path d="M'+x+' 110H'+end+'" stroke="#cf9d53" stroke-width="1.7"/><path d="m'+(end-5)+' 105 7 5-7 5" fill="none" stroke="#1e4141" stroke-width="2"/><text class="desk-flow" x="'+((x+end)/2)+'" y="96">'+v+'</text>'}).join('');
 const parts=f.labels.map((v,i)=>{const x=margin+gap*i;return '<g transform="translate('+x+' 110)"><circle r="34" fill="#eee0bc" stroke="#52665c" stroke-width="1"/><circle r="29" fill="#f6ecd1" stroke="#b5ac8d" stroke-width=".7"/><g fill="none" stroke="#173e40" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+symbols[f.icons[i]]+'</g><text class="desk-label" y="61">'+v+'</text></g>'}).join('');
 return '<figure class="desk-figure"><svg class="desk-schema" viewBox="0 0 610 215" role="img" aria-label="'+f.labels.join(' → ')+'. '+f.caption+'"><defs><pattern id="deskgrid" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" fill="none" stroke="#9da38a" stroke-width=".5"/></pattern></defs><rect width="610" height="215" fill="#f1e6c9"/><rect width="610" height="215" fill="url(#deskgrid)"/><path d="M17 27v-9h9m558 0h9v9m0 161v9h-9m-558 0h-9v-9" stroke="#738273" fill="none"/>'+connectors+parts+'</svg><figcaption>'+f.caption+'</figcaption></figure>';
}
export function reader(app,l,saved,save){
 const unit=course[l.id], i=lessons.indexOf(l);
 saved.positions??={};saved.knowledge??={};
 const count=unit.sections.length;
 let page=Math.max(0,Math.min(count,saved.positions[l.id]??0));
 const sectionLabels=l.id==='catalogo'?['Do toque à API','Caminho de volta','Carga no banco','Validação da leitura']:unit.sections.map(s=>s.title);
 app.innerHTML='<article class="lesson-desk"><div class="desk-stage"><div class="desk-top">'+action('← Currículo','school','desk-link')+'<span>'+['Fundamentos','Fundamentos','Distribuição de tráfego','Distribuição de tráfego','Operação em escala','Operação em escala'][i]+' / Aula '+String(i+1).padStart(2,'0')+'</span></div><h1>'+l.title+'</h1>'+figure(l.id)+'</div><section class="desk-dock"><div class="desk-tabs" aria-label="Etapas da aula"></div><div class="desk-detail"></div></section></article>';
 const tabs=app.querySelector('.desk-tabs'),detail=app.querySelector('.desk-detail');
 function display(focus=false){
  const section=unit.sections[page],quiz=unit.prediction,last=page===count;
  tabs.innerHTML=[...sectionLabels,'Teste sua previsão'].map((t,n)=>'<button type="button" data-page="'+n+'" aria-current="'+(page===n?'step':'false')+'">'+t+'</button>').join('');
  detail.innerHTML='<p class="desk-lead">'+(l.id==='catalogo'?'Ao abrir um álbum, de onde vem a lista de faixas?':unit.questionIntro)+'</p><h2 tabindex="-1">'+(last?'Teste sua previsão':sectionLabels[page])+'</h2>'+
   (last?'<p>'+quiz.question+'</p><div class="desk-answers">'+quiz.options.map((v,n)=>'<button data-answer="'+n+'"><b>'+String.fromCharCode(65+n)+'</b>'+v.text+'</button>').join('')+'</div><p class="desk-response" role="status"></p>':'<p>'+section.text+'</p>')+
   '<div class="desk-actions">'+(page?'<button data-back>Anterior</button>':'')+(last?action('Abrir missão no grid','missao/'+l.id,'desk-primary'):'<button data-next class="desk-primary">'+(page===count-1?'Fazer previsão':'Próxima etapa')+'</button>')+'</div>'+
   '<div class="desk-tools"><details><summary>Como ler os números desta aula</summary><p>Um pedido também se chama requisição. Se aparecem 300 req/s, chegam 300 pedidos a cada segundo. Capacidade é quantos a peça consegue atender nesse tempo. Latência é a espera de um pedido até a resposta: 100 ms equivalem a um décimo de segundo. Uma réplica é outra instância da mesma peça para dividir o trabalho.</p></details><details><summary>Conhecer as peças deste desenho</summary><p>Abra uma explicação com exemplo e uma pergunta para praticar.</p>'+[...new Set(l.graph.nodes.map(n=>n.type))].map(t=>'<p>'+action(catalog[t].name,'pecas/'+t,'desk-link')+'</p>').join('')+'</details><details><summary>Carga do cenário inicial</summary><div class="baseline"></div></details><details><summary>Roteiro do laboratório</summary><ol>'+unit.steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>'+action('Abrir laboratório','missao/'+l.id,'desk-link')+'</details><details><summary>Fontes para aprofundar</summary>'+l.sources.map(s=>'<p><a target="_blank" rel="noopener" class="desk-link" href="'+s.url+'">'+s.title+'</a></p>').join('')+'</details></div>';
  baseline(detail.querySelector('.baseline'),l);
  function move(n){page=n;saved.positions[l.id]=page;save();display(true)}
  tabs.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>move(Number(b.dataset.page)));
  detail.querySelector('[data-back]')?.addEventListener('click',()=>move(page-1));
  detail.querySelector('[data-next]')?.addEventListener('click',()=>move(page+1));
  if(last){
   const buttons=[...detail.querySelectorAll('[data-answer]')];
   function respond(n){const ok=n===quiz.correct;buttons.forEach((b,j)=>{b.setAttribute('aria-pressed',String(j===n));b.classList.toggle('selected',n===j)});detail.querySelector('.desk-response').textContent=(ok?'Correto. ':'Revise sua previsão. ')+quiz.options[n].feedback;if(ok&&!saved.knowledge[l.id]){saved.knowledge[l.id]=true;save()}}
   buttons.forEach((b,n)=>b.onclick=()=>respond(n));
   if(saved.knowledge[l.id])respond(quiz.correct);
  }
  if(focus)detail.querySelector('h2').focus({preventScroll:true});
 }
 display();
}
