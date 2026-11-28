import {componentShelf} from './component-atlas.js';
import {scenarios} from './scenarios.js';

const examples={
 loja:{actor:'uma pessoa comprando',action:'abrir a ficha de uma mochila',input:'Código do produto: 42',result:'Mochila de 22 litros, 40 × 28 cm',types:['Cliente','API','Banco'],steps:['O navegador envia o código 42. Ele faz o papel de cliente, o programa que pede algo.','O serviço da loja recebe o código. A API é o acordo que define como pedir uma ficha e em qual formato ela volta.','O banco encontra o registro 42. O serviço devolve as medidas ao navegador, que as mostra na tela.']},
 agenda:{actor:'uma pessoa agendando',action:'ver os horários de amanhã',input:'Profissional 8, data escolhida',result:'Horários disponíveis: 9h e 14h',types:['Cliente','API','Banco'],steps:['O celular envia a data e o profissional. É o cliente deste pedido.','O serviço recebe o pedido pela API e verifica qual agenda consultar.','O banco devolve os horários. Ver 9h na tela ainda não reserva a vaga: confirmar a reserva é outra operação.']},
 documentos:{actor:'uma pessoa solicitante',action:'obter um comprovante',input:'Gerar comprovante do pedido 72',result:'Comprovante 72 pronto para baixar',types:['Cliente','Serviço','Arquivo'],steps:['O navegador pede o comprovante e identifica o pedido.','Um serviço reúne os dados e gera o documento. Se demorar, pode confirmar o recebimento e terminar depois.','O arquivo pronto fica disponível para download. Um protocolo confirma que o pedido chegou; o arquivo disponível confirma que o trabalho terminou.']},
 mapas:{actor:'uma pessoa navegando',action:'abrir um bairro no mapa',input:'Quadrado x=12, y=9, zoom=6',result:'Uma imagem para compor o mapa',types:['Cliente','Origem','Tela'],steps:['O celular calcula quais quadrados cobrem a região visível e pede cada imagem.','A origem é o lugar que guarda a versão publicada da imagem. Procura o arquivo pela posição e pelo zoom.','O celular recebe os bytes da imagem e a encaixa na tela. Vários celulares podem pedir exatamente o mesmo quadrado.']}
};
const levels=['Primeiros conceitos','Análise de requisitos','Montagem guiada','Laboratório','Revisão de arquitetura'];
const desc=['Acompanhe uma ação e veja quem faz cada parte.','Transforme o pedido em requisitos e escolha como medir o resultado.','Monte peça por peça, com exemplo e correção no desenho.','Altere o sistema e compare duas soluções sob a mesma carga.','Defenda uma decisão diante de falhas e de um requisito novo.'];
export function learningPath(root,state,save){
 const memory=state.learningPath??={};memory.cases??={};
 let id=Object.hasOwn(examples,memory.id)?memory.id:'loja';
 function render(){
  const ex=examples[id],scenario=scenarios[id],record=memory.cases[id]??={step:0};
  const step=record.step,urls=['','requisitos/'+id,'guiado/'+id,'projeto/'+id,'revisao/'+id];
  root.innerHTML='<article class="lp"><header class="lp-head"><div><p>Escola de System Design</p><h1>Do pedido à arquitetura</h1><p>Projetar um sistema começa entendendo o que alguém precisa fazer. Vamos acompanhar uma ação antes de escolher uma tecnologia.</p></div><label>Exemplo desta trilha<select></select></label></header><div class="lp-layout"><aside><h2>Percurso de formação</h2></aside><section class="lp-lesson"><small>Primeiros conceitos · '+scenario.title+'</small><h2>O que acontece depois do clique?</h2><p>Imagine '+ex.actor+' tentando '+ex.action+'. Um <strong>pedido</strong> é a mensagem que inicia esse trabalho. A <strong>resposta</strong> é o resultado que permite seguir em frente.</p><div class="lp-flow"></div><div class="lp-example" aria-live="polite"></div><div class="lp-controls"></div></section></div></article>';
  root.querySelector('.lp-flow').after(componentShelf(id));
  const select=root.querySelector('select');for(const [key,value] of Object.entries(scenarios)){const o=new Option(value.title,key);o.selected=key===id;select.add(o)}
  select.onchange=()=>{id=memory.id=select.value;state.designSchool??={};state.designSchool.selected=id;save();render()};
  const side=root.querySelector('aside');levels.forEach((level,i)=>{const a=document.createElement(i?'a':'div');if(i)a.href='#'+urls[i];a.className='lp-level';a.innerHTML='<small>0'+(i+1)+'</small><span><b>'+level+'</b><em>'+desc[i]+'</em></span>';side.append(a)});
  const flow=root.querySelector('.lp-flow');ex.types.forEach((t,i)=>{const span=document.createElement('span');span.textContent=t;span.classList.toggle('on',step===i);flow.append(span)});
  const detail=root.querySelector('.lp-example'),buttons=root.querySelector('.lp-controls');
  const move=n=>{record.step=n;save();render();root.querySelector('.lp-example').tabIndex=-1;root.querySelector('.lp-example').focus({preventScroll:true})};
  function btn(label,action){const b=document.createElement('button');b.textContent=label;b.onclick=action;buttons.append(b)}
  if(step<3){
   detail.innerHTML='<h3>'+['O pedido sai','Alguém trabalha','O resultado volta'][step]+'</h3><p>'+ex.steps[step]+'</p><code>'+(step===2?ex.result:ex.input)+'</code>';
   if(step)btn('Voltar',()=>move(step-1));btn(step===2?'Conferir meu entendimento':'Acompanhar o próximo passo',()=>move(step+1));
  }else{
   detail.innerHTML='<h3>Como você confirmaria que a ação funcionou?</h3><div class="lp-answers"></div><p role="status"></p>';
   const feedback=detail.querySelector('[role=status]');
   const correct='A pessoa recebeu o resultado esperado: '+ex.result+'.';
   const options=['O sistema recebeu o pedido.',correct,'Existe um servidor ligado.'];
   function answer(i){[...detail.querySelector('.lp-answers').children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));feedback.textContent=['O recebimento só confirma a chegada. Siga o caminho até o que a pessoa consegue ver ou fazer.','Isso. Você já tem um critério de aceitação: descreveu um resultado que alguém pode verificar. Na próxima etapa, acrescente quanto tempo a pessoa pode esperar e o que acontece se algo falhar.','Um servidor ligado pode entregar dados errados ou depender de outro serviço que caiu. Pense no resultado visível para a pessoa.'][i];record.answer=i;save();buttons.querySelector('a')?.remove();if(i===1){const a=document.createElement('a');a.href='#requisitos/'+id;a.textContent='Analisar os requisitos deste projeto';buttons.append(a)}}
   options.forEach((text,i)=>{const b=document.createElement('button');b.textContent=text;b.onclick=()=>answer(i);detail.querySelector('.lp-answers').append(b)});btn('Rever o caminho',()=>move(0));if(record.answer!==undefined)answer(record.answer);
  }
 }
 render();return {destroy(){root.replaceChildren()}};
}
