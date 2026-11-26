import {mountEditor} from './editor.js';
import {simulate} from './model.js';

const LOAD = 300;
const steps = [
  {title:'Coloque o acervo no grid', action:'Arraste PostgreSQL da biblioteca para o espaço à direita da API. Você também pode clicar no componente para adicioná-lo.', why:'O cliente já consegue pedir um álbum à API. Falta o banco que guarda as faixas.', control:'Biblioteca de componentes'},
  {title:'Ligue a API ao banco', action:'Clique no círculo à direita da API e depois no cartão PostgreSQL. Pelo teclado, abra os detalhes da API e escolha “Conectar a…”.', why:'A seta aponta para quem recebe a consulta. A resposta volta pelo mesmo caminho.', control:'Conexão direcionada'},
  {title:'Meça a operação normal', action:'Clique em “Testar 300 consultas/s”. Compare o que entrou pelo cliente com o que a arquitetura conseguiu entregar.', why:'Essa primeira medição será a referência para investigar uma falha.', control:'Teste de carga'},
  {title:'Interrompa o PostgreSQL', action:'Abra o cartão PostgreSQL. Nos detalhes abaixo do grid, escolha “Simular falha”.', why:'Imagine que o processo do banco parou enquanto os clientes continuam abrindo álbuns.', control:'Estado do serviço'},
  {title:'Meça o impacto da falha', action:'Clique em “Testar 300 consultas/s” novamente. Observe quantas consultas chegam ao banco e quantas respostas voltam ao cliente.', why:'A API ainda recebe pedidos. Uma dependência indisponível pode impedir a conclusão de todos eles.', control:'Teste durante a falha'},
  {title:'Recupere e confirme', action:'Nos detalhes do PostgreSQL, escolha “Restabelecer serviço”. Rode o teste novamente para confirmar a recuperação.', why:'O serviço pode estar ligado e ainda assim o caminho estar quebrado. A medição verifica a entrega de ponta a ponta.', control:'Restabelecimento e reteste'}
];
const startGraph=()=>({nodes:[{id:'client',type:'client',x:24,y:30,replicas:1},{id:'api',type:'api',x:216,y:30,replicas:1}],edges:[{from:'client',to:'api'}]});
const num=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
function tag(type,cls,text){const el=document.createElement(type);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function btn(text,cls,fn){const b=tag('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function findPath(graph) {
  const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const entry of graph.nodes.filter(n=>n.type==='client')){
    for(const link of graph.edges.filter(e=>e.from===entry.id&&nodes.get(e.to)?.type==='api')){
      const edge=graph.edges.find(e=>e.from===link.to&&nodes.get(e.to)?.type==='postgres');
      if(edge)return {client:entry.id,api:link.to,db:edge.to};
    }
  }
  return null;
}
export function mountTutorial(container,onDone=()=>{}){
  const page=tag('section','tg-page'),top=tag('div','tg-top'),topCopy=tag('div'),eyebrow=tag('span','tg-eyebrow','OFICINA GUIADA'),title=tag('h2','tg-title','Uma consulta, de ponta a ponta'),intro=tag('p','tg-lead','Monte o caminho de uma consulta de álbum e descubra o que o cliente vê quando o banco cai.');
  topCopy.append(eyebrow,title,intro);top.append(topCopy,btn('Recomeçar','tg-reset',restart));
  const chips=tag('ol','tg-progress'),body=tag('div','tg-body'),bench=tag('div','tg-bench'),lesson=tag('section','tg-lesson'),host=tag('div','tg-host'),rail=tag('aside','tg-rail'),runPanel=tag('div','tg-panel'),record=tag('div','tg-panel'),runHint=tag('p','tg-hint'),runBtn=btn('Testar 300 consultas/s','tg-run',run),status=tag('p','tg-status'),log=tag('ol','tg-log');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');chips.setAttribute('aria-label','Etapas do tutorial');
  runPanel.append(tag('div','tg-label','Bancada de testes'),tag('h3','','Carga constante'),tag('div','tg-load','300 req/s'),runHint,runBtn);
  record.append(tag('div','tg-label','Caderno de medições'),tag('h3','','Ensaios da oficina'),log);
  lesson.setAttribute('aria-live','polite');bench.append(lesson,host);rail.append(runPanel,record);body.append(bench,rail);page.append(top,chips,body,status);container.replaceChildren(page);
  let graph,stage,editor,lastStage=-1,logs,dead=false;
  function restart(){
    editor?.destroy();graph=startGraph();stage=0;lastStage=-1;logs=[];
    status.textContent='';editor=mountEditor(host,graph,changed);paint();if(document.activeElement?.classList.contains('tg-reset'))lesson.scrollIntoView({block:'nearest'});
  }
  function changed(next){
    if(dead)return;graph=next;const path=findPath(graph),db=path&&graph.nodes.find(n=>n.id===path.db);
    if(stage===0&&graph.nodes.some(n=>n.type==='postgres'))advance('PostgreSQL adicionado ao grid.');
    else if(stage===1&&path)advance('Caminho criado. A API já pode consultar o acervo.');
    else if(stage===3&&db?.offline)advance('O banco está fora do ar. Meça o impacto antes de restabelecer.');
    else if(stage===5&&db&&!db.offline){status.textContent='Banco disponível. Teste a arquitetura para confirmar a recuperação.';paint();}
    else paint();
  }
  function advance(msg){stage++;status.textContent=msg;paint();}
  function run(){
    if(![2,4,5].includes(stage))return;
    const path=findPath(graph);
    if(!path){status.textContent='Reconecte Cliente → API → PostgreSQL para medir o caminho da consulta.';return;}
    const db=graph.nodes.find(n=>n.id===path.db),r=simulate(graph,LOAD),reads=r.nodes[path.db]?.demand||0,ok=r.throughput===LOAD&&reads>=LOAD;
    const msg=stage===4
      ?(!db.offline?'Interrompa o PostgreSQL antes de medir a falha.':r.throughput>0||reads===0?'Mantenha o banco indisponível no caminho das 300 consultas para observar a interrupção.':'')
      :(db.offline?'O PostgreSQL está indisponível. Abra o componente e restabeleça o serviço.':!ok?'O caminho ainda não entregou as 300 consultas ao banco. Revise as conexões e os componentes indisponíveis.':'');
    if(msg){status.textContent=msg;runHint.textContent=msg;return;}
    const name=stage===2?'Operação normal':stage===4?'Banco indisponível':'Recuperação';
    logs.push({name,r,reads});advance('Ensaio registrado. '+num(r.throughput)+' respostas/s chegaram ao cliente.');
  }
  function paint(){
    if(dead)return;
    chips.replaceChildren();
    ['Adicionar','Conectar','Testar','Interromper','Medir','Recuperar'].forEach((label,i)=>{
      const item=tag('li',i<stage?'tg-past':i===stage?'tg-now':'');if(i===stage)item.setAttribute('aria-current','step');item.append(tag('span','',i<stage?'✓':String(i+1)),document.createTextNode(label));chips.append(item);
    });
    if(lastStage!==stage){
      lesson.replaceChildren();const step=steps[stage];
      if(step){lesson.append(tag('div','tg-kicker','Passo '+(stage+1)+' de '+steps.length+' · '+step.control),tag('h3','',step.title),tag('p','tg-instruction',step.action),tag('p','tg-why',step.why));}
      else{lesson.classList.add('tg-complete');lesson.append(tag('div','tg-kicker','Oficina concluída'),tag('h3','','Consulta restabelecida'),tag('p','tg-instruction','Você ligou a API ao acervo, mediu as respostas durante uma indisponibilidade e confirmou a recuperação com uma nova carga.'),btn('Abrir a primeira missão →','tg-run',()=>onDone()));}
      if(step)lesson.classList.remove('tg-complete');
      lastStage=stage;
    }
    const canRun=[2,4,5].includes(stage);
    runBtn.disabled=!canRun;runHint.textContent=stage===steps.length?'As três medições ficam registradas abaixo.':canRun?'Envie a mesma carga em cada ensaio para comparar os resultados.':'O teste abre quando você concluir a ação indicada no grid.';
    log.replaceChildren();
    if(!logs.length)log.append(tag('li','tg-log-empty','Sua primeira medição aparece aqui depois de ligar a API ao banco.'));
    logs.forEach(({name,r,reads},i)=>{
      const li=tag('li','tg-observation'+(r.throughput?'':' tg-failed'));
      li.append(tag('small','','Ensaio 0'+(i+1)),tag('strong','',name),tag('span','',num(reads)+' consultas/s ao banco'),tag('b','',num(r.throughput)+' respostas/s ao cliente'));
      log.append(li);
    });
  }
  restart();
  return {destroy(){dead=true;editor?.destroy();page.remove();}};
}

