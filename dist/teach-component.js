import {foundations} from './foundations.js';
import {componentCourse} from './component-course.js';

const order=Object.keys(foundations);
export function teachComponent(root,id,state,save){
 const key=Object.hasOwn(foundations,id)?id:'client', base=foundations[key],extra=componentCourse[key];
 state.componentStudy??={};const record=state.componentStudy[key]??={page:0};
 const labels=['Entender','Decidir quando usar','Montar','Aprofundar'];
 function paragraph(label,text){return '<h3>'+label+'</h3><p>'+text+'</p>'}
 function display(){
  const page=record.page;
  root.innerHTML='<article class="teach"><div class="teach-head"><a class="atlas-back" href="#pecas">‹ Todos os componentes</a><h1>'+base.name+'</h1><label>Componente <select>'+order.map(k=>'<option value="'+k+'" '+(k===key?'selected':'')+'>'+foundations[k].name+'</option>').join('')+'</select></label></div><div class="teach-body"><div class="cc-tabs"></div><section class="cc-body"></section><div class="teach-actions"></div></div></article>';
  root.querySelector('select').onchange=e=>location.hash='pecas/'+e.target.value;
  const tabs=root.querySelector('.cc-tabs'),body=root.querySelector('.cc-body'),actions=root.querySelector('.teach-actions');
  function go(i){record.page=i;save();display();const title=root.querySelector('.cc-body h2');title.tabIndex=-1;title.focus({preventScroll:true})}
  labels.forEach((l,i)=>{const b=document.createElement('button');b.textContent=l;b.setAttribute('aria-pressed',String(i===page));b.onclick=()=>go(i);tabs.append(b)});
  const quiz=page===0?{q:base.question,options:base.options,correct:base.correct,feedback:base.feedback}:page===3?extra.check:null;
  if(page===0)body.innerHTML='<h2>Qual é o trabalho dessa peça?</h2><p>'+base.what+'</p>'+paragraph('Onde você já viu isso',base.example);
  if(page===1)body.innerHTML='<h2>Como escolher</h2>'+paragraph('Sinal de que ajuda',extra.when)+paragraph('Quando deixar de fora',extra.avoid)+paragraph('O que você passa a ter de cuidar',extra.tradeoff)+paragraph('Outra solução possível',extra.alternative);
  if(page===2)body.innerHTML='<h2>Como a peça entra no caminho</h2><p>'+base.placement+'</p>'+paragraph('Exemplo explicado',extra.example)+'<ol>'+extra.walkthrough.map(x=>'<li>'+x+'</li>').join('')+'</ol><div class="piece-next"><a class="teach-link" href="#ensaio/'+key+'">Experimentar esta peça no grid</a></div>'+paragraph('Erro frequente',base.mistake);
  if(page===3)body.innerHTML='<h2>Decisão de arquitetura</h2><p>'+extra.advanced+'</p>';
  if(quiz){
   const check=document.createElement('section');check.className='teach-check course-check';check.innerHTML='<h3>'+quiz.q+'</h3><div class="teach-options"></div><p role="status" class="teach-feedback"></p>';body.append(check);
   function choose(i){record['answer'+page]=i;if(page===0&&i===quiz.correct)state.parts[key]=true;save();[...check.querySelectorAll('button')].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));check.querySelector('[role=status]').textContent=quiz.feedback[i]}
   quiz.options.forEach((o,i)=>{const b=document.createElement('button');b.textContent=o;b.onclick=()=>choose(i);check.querySelector('.teach-options').append(b)});
   if(Number.isInteger(record['answer'+page]))choose(record['answer'+page]);
  }
  if(page){const b=document.createElement('button');b.textContent='Voltar';b.onclick=()=>go(page-1);actions.append(b)}
  if(page<3){const b=document.createElement('button');b.textContent='Continuar: '+labels[page+1];b.onclick=()=>go(page+1);actions.append(b)}
  else {const a=document.createElement('a');a.className='teach-link';a.href='#ensaio/'+key;a.textContent='Testar minha decisão';actions.append(a)}
 }
 display();
}
