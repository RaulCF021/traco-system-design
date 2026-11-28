import {mountEditor} from './editor.js';
import {catalog, simulate} from './model.js';
import {scenarios} from './scenarios.js';

const fmt = n => n.toLocaleString('pt-BR', {maximumFractionDigits:1});
const name = type => catalog[type].name;
const fresh = () => ({nodes:[{id:'client',type:'client',x:24,y:36,replicas:1}],edges:[]});
const clone = value => structuredClone(value);
const structure = graph => JSON.stringify([graph.nodes.map(n=>[n.id,n.type,n.replicas,n.offline||false]),graph.edges]);
const add = (type,why) => ({kind:'add',type,why,title:'Adicione '+name(type),
  action:'Na biblioteca Componentes, clique em '+name(type)+' ou arraste a peça para uma área livre do grid.'});
const link = (from,to,why) => ({kind:'link',from,to,why,title:'Conecte '+name(from)+' a '+name(to),
  action:'Clique no pequeno círculo à direita de '+name(from)+' e depois no cartão '+name(to)+'. Pelo teclado, abra '+name(from)+', escolha “Conectar a…” e selecione '+name(to)+'.'});
const unlink = (from,to,why) => ({kind:'unlink',from,to,why,title:'Retire a ligação direta',
  action:'Abra o cartão '+name(from)+'. Nos detalhes abaixo do grid, localize “'+name(from)+' → '+name(to)+'” e clique no × dessa conexão.'});
const scale = (type,count,why) => ({kind:'scale',type,count,why,title:'Configure '+count+' instâncias de '+name(type),
  action:'Abra o cartão '+name(type)+'. Em Instâncias, use + ou − até o contador mostrar '+count+'.'});
const measure = (title,why,load,expected,focus,focusedDemand,backlog=0) => ({kind:'measure',title,why,load,expected,focus,focusedDemand,backlog,
  action:'Clique em “Simular '+fmt(load)+' req/s”. Confira quantas respostas chegam ao cliente e a demanda recebida por '+name(focus)+'.'});

const api = add('api','O cliente inicia a operação. O serviço representado pela API interpreta o pedido antes de consultar os dados.');
const enter = link('client','api','A seta representa quem solicita algo a quem. Aqui o cliente endereça a chamada ao serviço da aplicação.');
const db = add('postgres','Os registros precisam de uma fonte. O PostgreSQL guarda os dados que o serviço consulta.');
const read = link('api','postgres','A API sabe qual registro buscar. A ligação permite que peça esses dados ao banco e receba a resposta.');
const plans = {
  loja:{order:['client','api','redis','postgres'],steps:[api,enter,db,read,
    measure('Meça a loja durante a promoção','Chegam 700 pedidos por segundo. Com uma instância, o banco atende até 450 leituras/s. Meça o desenho atual antes de tentar reduzir essa pressão.',700,450,'postgres',700),
    add('redis','As fichas de produtos populares se repetem. Um cache em memória pode resolver parte dessas leituras sem consultar a fonte.'),
    unlink('api','postgres','Neste modelo, duas saídas da API chamam os dois destinos. Remova o caminho antigo antes de colocar o cache na frente do banco.'),
    link('api','redis','A API deve procurar a cópia da ficha antes de consultar o banco.'),
    link('redis','postgres','Uma ficha ausente no cache ainda precisa vir da fonte. Esta seta representa o caminho das faltas de cache.'),
    measure('Confira se o cache aliviou o banco','O modelo assume que 80% das 700 leituras encontram uma cópia. Restam 140 consultas/s para o banco e todas as fichas podem ser entregues.',700,700,'postgres',140)]},
  agenda:{order:['client','api','postgres'],steps:[api,enter,db,read,
    measure('Meça a abertura da agenda','O público envia 1.400 pedidos/s. Uma instância da API admite 800; o banco consegue terminar 450. Vamos observar esse primeiro limite.',1400,450,'postgres',800),
    scale('api',2,'Duas instâncias equivalentes somam 1.600 pedidos/s no modelo. Isso permite que todas as consultas cheguem ao banco.'),
    measure('Veja onde a expansão parou','A API ganhou capacidade, mas o banco continua com uma instância. Verifique se aumentar só a entrada melhorou as respostas ao usuário.',1400,450,'postgres',1400),
    scale('postgres',4,'Cada réplica atende 450 leituras/s. Quatro oferecem 1.800/s para a carga de 1.400/s. A reserva de uma mesma vaga exigiria garantias adicionais de escrita.'),
    measure('Confira a leitura dos horários','Com capacidade suficiente na API e no banco, os 1.400 pedidos/s devem obter resposta.',1400,1400,'postgres',1400)]},
  documentos:{order:['client','api','queue','worker','storage'],steps:[api,enter,
    add('worker','Montar o documento consome tempo de processamento. Um worker executa essa tarefa.'),
    link('api','worker','Por enquanto o serviço envia a tarefa ao worker e espera a geração terminar para responder.'),
    add('storage','O arquivo final precisa de um lugar para ser guardado e baixado depois. O armazenamento de objetos representa esse destino.'),
    link('worker','storage','Quem gera o arquivo também envia o resultado para o armazenamento.'),
    measure('Meça a geração síncrona','Chegam 700 pedidos/s. Um worker termina 350 arquivos/s; os demais não obtêm confirmação neste desenho síncrono.',700,350,'storage',350),
    add('queue','Uma fila recebe trabalhos para processamento posterior. Assim, a confirmação pode chegar ao cliente antes de o arquivo ficar pronto.'),
    unlink('api','worker','Vamos trocar o envio direto pela entrega por fila. Manter as duas saídas faria o serviço acionar os dois caminhos.'),
    link('api','queue','A API publica o pedido na fila para confirmar seu recebimento.'),
    link('queue','worker','O worker consome as tarefas pendentes. Seu caminho até o armazenamento continua igual.'),
    measure('Compare confirmação e entrega','A fila confirma 700 pedidos/s. Com um worker, só 350 chegam ao armazenamento por segundo; os demais 350 trabalhos/s se acumulam.',700,700,'storage',350,350),
    scale('worker',2,'Duas instâncias somam 700 arquivos/s e conseguem acompanhar as novas chegadas.'),
    measure('Verifique se a fila estabilizou','Agora compare as confirmações ao cliente com os documentos enviados ao armazenamento. O crescimento da fila deve chegar a zero.',700,700,'storage',700)]},
  mapas:{order:['client','cdn','storage'],steps:[
    add('storage','O mapa é composto por pequenos arquivos de imagem. A origem guarda esses quadrados e os entrega por chave.'),
    link('client','storage','Sem uma cópia próxima do usuário, cada imagem visível é buscada diretamente na origem.'),
    measure('Meça a demanda da origem','Durante o evento chegam 6.000 pedidos de imagem por segundo. Uma origem oferece 1.500/s. Meça quanto chega ao fim.',6000,1500,'storage',6000),
    add('cdn','Muitas pessoas abrem as mesmas regiões. Uma CDN guarda cópias das imagens na borda da rede.'),
    unlink('client','storage','O cliente passará a pedir as imagens à CDN. Retire a consulta direta que alcançava a origem em todos os pedidos.'),
    link('client','cdn','O pedido chega primeiro à borda, onde a imagem pode estar disponível.'),
    link('cdn','storage','Quando a borda não possui a imagem, a CDN busca o arquivo na origem.'),
    measure('Confira as imagens entregues','Com 90% de acertos na borda, apenas 600 dos 6.000 pedidos/s devem chegar à origem. Confira se o conjunto atende toda a demanda.',6000,6000,'storage',600)]}
};

const getNode=(g,type)=>g.nodes.find(n=>n.type===type);
const edge=(g,a,b)=>g.edges.find(e=>e.from===getNode(g,a)?.id&&e.to===getNode(g,b)?.id);
function apply(graph,s){
  if(s.kind==='add'&&!getNode(graph,s.type)){
    const i=graph.nodes.length;
    graph.nodes.push({id:crypto.randomUUID(),type:s.type,x:24+(i%3)*205,y:36+Math.floor(i/3)*124,replicas:1});
  }
  if(s.kind==='scale'&&getNode(graph,s.type))getNode(graph,s.type).replicas=s.count;
  const a=getNode(graph,s.from),b=getNode(graph,s.to);
  if(s.kind==='link'&&a&&b&&!edge(graph,s.from,s.to))graph.edges.push({from:a.id,to:b.id});
  if(s.kind==='unlink')graph.edges=graph.edges.filter(e=>e.from!==a?.id||e.to!==b?.id);
}
function targets(steps){
  const checkpoints=[fresh()];
  for(const s of steps){const next=clone(checkpoints.at(-1));apply(next,s);checkpoints.push(next);}
  return checkpoints;
}
function mismatch(graph,target,steps){
  for(const n of target.nodes){
    const nodes=graph.nodes.filter(candidate=>candidate.type===n.type);
    if(!nodes.length)return 'Falta '+name(n.type)+'. Adicione a peça em Componentes.';
    if(nodes.length>1)return 'Há dois ou mais cartões '+name(n.type)+'. Neste exercício use um cartão desse tipo e configure as réplicas em Instâncias.';
    if(nodes[0].offline)return name(n.type)+' está fora do ar. Abra o cartão e clique em “Restabelecer serviço”.';
    if((nodes[0].replicas||1)!==n.replicas)return 'Configure '+name(n.type)+' com '+n.replicas+' instância(s) nos detalhes do cartão.';
  }
  const canonical=id=>target.nodes.find(n=>n.id===id).type;
  for(const e of target.edges){const a=canonical(e.from),b=canonical(e.to);if(!edge(graph,a,b))return 'Falta a conexão '+name(a)+' → '+name(b)+'. Use o círculo de saída e selecione o destino.';}
  for(const s of steps){if(s.kind==='unlink'&&edge(graph,s.from,s.to)&&!edge(target,s.from,s.to))return 'Remova a ligação direta '+name(s.from)+' → '+name(s.to)+' nos detalhes de '+name(s.from)+'.';}
  return '';
}
function traceExtra(graph,target){
  const expected=target.edges.map(e=>[target.nodes.find(n=>n.id===e.from).type,target.nodes.find(n=>n.id===e.to).type]);
  const types=new Map(graph.nodes.map(n=>[n.id,n.type]));
  for(const e of graph.edges){const a=types.get(e.from),b=types.get(e.to);if(a&&b&&!expected.some(([x,y])=>a===x&&b===y))return 'O desenho tem a ligação adicional '+name(a)+' → '+name(b)+'. Confira se essa chamada adicional pertence ao exemplo.';}
  return 'Confira as peças extras da mesa, em especial clientes que também geram tráfego.';
}
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function button(text,cls,fn){const el=node('button',cls,text);el.type='button';el.addEventListener('click',fn);return el;}
function mini(target,order,s,cols){
  const types=order.filter(t=>getNode(target,t));
  const ns='http://www.w3.org/2000/svg', make=(tag,attrs,text)=>{const a=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>a.setAttribute(k,v));if(text!==undefined)a.textContent=text;return a;};
  const colsUsed=Math.min(cols,types.length),rowCount=Math.ceil(types.length/cols),step=135,w=105,h=33;
  const svg=make('svg',{viewBox:'0 0 '+(colsUsed*step-14)+' '+(rowCount*69),'aria-hidden':'true',class:cols===3?'gb-mobile-diagram':'gb-wide-diagram'});
  const centers=new Map(types.map((t,i)=>{const row=Math.floor(i/cols);const col=row%2===0?i%cols:colsUsed-1-i%cols;return [t,{x:8+col*step,y:9+row*69}];}));
  target.edges.forEach(e=>{const a=centers.get(target.nodes.find(n=>n.id===e.from).type),b=centers.get(target.nodes.find(n=>n.id===e.to).type);
    let command,tx,ty,rot=0;
    if(a.y===b.y){const dir=b.x>a.x?1:-1;const x=a.x+(dir>0?w:0);tx=b.x+(dir>0?-2:w+2);ty=a.y+h/2;rot=dir>0?0:180;
      command=Math.abs(a.x-b.x)>step?'M '+x+' '+ty+' V '+(a.y+h+10)+' H '+(tx-dir*5)+' V '+ty+' H '+tx:'M '+x+' '+ty+' H '+tx;
    }else{const x=a.x+w/2,via=(a.y+b.y+h)/2;tx=b.x+w/2;ty=b.y-2;rot=90;command='M '+x+' '+(a.y+h)+' V '+via+' H '+tx+' V '+ty;}
    svg.append(make('path',{d:command,class:'gb-mini-line'}),make('path',{d:'M -5 -3 L 0 0 L -5 3',transform:'translate('+tx+' '+ty+') rotate('+rot+')',class:'gb-mini-line'}));
  });
  for(const t of types){const p=centers.get(t),n=getNode(target,t),active=t===s?.type||t===s?.from||t===s?.to;
    svg.append(make('rect',{x:p.x,y:p.y,width:w,height:h,rx:4,class:active?'gb-mini-node hot':'gb-mini-node'}),make('text',{x:p.x+w/2,y:p.y+h/2+4,'text-anchor':'middle',class:'gb-mini-text'},name(t)+(n.replicas>1?' ×'+n.replicas:'')));}
  return svg;
}

export function mountGuidedBuild(container,scenarioId,state={},save=()=>{}){
  const id=Object.hasOwn(plans,scenarioId)?scenarioId:'loja',scenario=scenarios[id],{steps,order}=plans[id],expected=targets(steps);
  const initial=()=>({step:0,total:steps.length,complete:false,graph:fresh(),checkpoints:[fresh()],measurements:[]});
  state.guidedBuilds??={};
  const previous=state.guidedBuilds[id];
  let record=previous?.total===steps.length&&previous?.graph?.nodes&&Array.isArray(previous.checkpoints)&&Number.isInteger(previous.step)&&previous.step>=0&&previous.step<=steps.length?previous:initial();
  record.measurements??=[];let editor,observer,confirmOverwrite=false;
  const root=node('section','gb-build'),head=node('div','gb-head'),copy=node('div'),sub=node('p','gb-kicker','Montagem guiada');
  copy.append(sub,node('h1','',scenario.title),node('p','gb-brief',scenario.brief),node('p','gb-objective','Objetivo: '+scenario.goal));head.append(copy);
  const nav=node('div','gb-actions'),instructions=node('section','gb-instructions'),diagram=node('figure','gb-example'),body=node('div','gb-guide');
  body.append(instructions,diagram);
  const status=node('p','gb-status');status.setAttribute('role','status');
  const board=node('div','gb-canvas'),footer=node('section','gb-footer'),timeline=node('section','gb-log');
  root.append(head,body,nav,status,board,footer,timeline);container.replaceChildren(root);
  function persist(){state.guidedBuilds[id]=record;save();}
  function message(text,err=false){status.textContent=text;status.classList.toggle('gb-error',err);}
  function mountBoard(){observer?.disconnect();editor?.destroy();editor=mountEditor(board,record.graph,graph=>{
    const modified=structure(record.graph)!==structure(graph);record.graph=graph;
    if(record.complete&&modified){record.complete=false;record.step=steps.length-1;record.measurements=record.measurements.filter(m=>m.step<record.step);record.checkpoints.length=record.step+1;render();}
    persist();if(steps[record.step]?.kind!=='measure')verify(false);else highlight();
  });observer=new MutationObserver(highlight);observer.observe(board,{childList:true,subtree:true});}
  function highlight(){
    board.querySelectorAll('.gb-next-control').forEach(el=>el.classList.remove('gb-next-control'));
    const s=steps[record.step];if(!s)return;
    const mark=el=>el?.classList.add('gb-next-control');
    if(s.kind==='add'){mark([...board.querySelectorAll('.te-part')].find(b=>b.textContent===name(s.type)));return;}
    const card=type=>[...board.querySelectorAll('.te-node')].find(n=>n.dataset.id===getNode(record.graph,type)?.id);
    if(s.kind==='link'){if(board.querySelector('.te-source'))mark(card(s.to)?.querySelector('.te-node-face'));else mark(card(s.from)?.querySelector('.te-port'));}
    if(s.kind==='unlink'){mark(card(s.from)?.querySelector('.te-node-face'));mark([...board.querySelectorAll('.te-link button')].find(b=>b.getAttribute('aria-label')==='Remover conexão '+name(s.from)+' → '+name(s.to)));}
    if(s.kind==='scale'){mark(card(s.type)?.querySelector('.te-node-face'));if(board.querySelector('.te-selected')===card(s.type))mark(board.querySelector('[aria-label="Aumentar instâncias"]'));}
  }
  function finishStep(text){record.step++;record.complete=record.step===steps.length;record.checkpoints[record.step]=clone(record.graph);persist();render();message(text);}
  function verify(explicit=true){
    const s=steps[record.step];if(!s)return;
    const issue=mismatch(record.graph,expected[record.step+1],steps.slice(0,record.step+1));
    if(issue){message(issue,explicit);highlight();return;}
    if(s.kind==='measure'){
      const r=simulate(record.graph,s.load),focus=getNode(record.graph,s.focus);
      const demand=focus?r.nodes[focus.id]?.demand:0;
      if(Math.abs(r.throughput-s.expected)>.01||Math.abs(demand-s.focusedDemand)>.01||Math.abs(r.backlog-s.backlog)>.01){
        message('Resultado desta montagem: '+fmt(r.throughput)+' respostas/s e '+fmt(demand||0)+' req/s em '+name(s.focus)+'. '+traceExtra(record.graph,expected[record.step+1]),true);return;
      }
      record.measurements.push({step:record.step,title:s.title,load:s.load,throughput:r.throughput,cost:r.cost,backlog:r.backlog,focus:s.focus,demand});
      finishStep('Medição confirmada. '+fmt(r.throughput)+' respostas/s; '+name(s.focus)+' recebeu '+fmt(demand)+' req/s.');return;
    }
    finishStep('Alteração verificada no seu desenho.');
  }
  function demonstrate(){
    const s=steps[record.step];if(!s||s.kind==='measure')return;
    const prior=mismatch(record.graph,expected[record.step],steps.slice(0,record.step));
    const after=mismatch(record.graph,expected[record.step+1],steps.slice(0,record.step+1));
    if(!after){verify();return;}
    if(prior){message('Para demonstrar este passo, primeiro corrija o desenho anterior: '+prior+' Você também pode repetir esta etapa.',true);return;}
    apply(record.graph,s);mountBoard();verify();
  }
  function rewind(index){
    record.step=index;record.complete=false;record.graph=clone(record.checkpoints[index]);
    record.checkpoints.length=index+1;record.measurements=record.measurements.filter(m=>m.step<index);
    persist();mountBoard();render();message('Mesa restaurada ao início desta etapa.');
  }
  function openStudio(replace){
    state.studios??={};
    if(replace){state.studios[id]={graph:clone(record.graph),load:scenario.load};save();}
    location.hash='projeto/'+id;
  }
  function completion(){
    const prior=state.studios?.[id]?.graph;
    if(!prior){footer.append(button('Abrir meu desenho no estúdio','gb-primary',()=>openStudio(true)));return;}
    footer.append(node('p','','Você já tem um rascunho deste projeto no estúdio.'));
    if(!confirmOverwrite){footer.append(button('Abrir rascunho existente','gb-secondary',()=>openStudio(false)),button('Usar esta montagem no estúdio','gb-primary',()=>{confirmOverwrite=true;render();}));return;}
    footer.append(node('p','','Substituir o desenho e as medições desse rascunho pela montagem guiada?'),
      button('Manter o rascunho','gb-secondary',()=>{confirmOverwrite=false;render();}),
      button('Confirmar substituição e abrir','gb-primary',()=>openStudio(true)));
  }
  function render(){
    const s=steps[record.step],target=expected[Math.min(steps.length,record.step+1)];
    instructions.replaceChildren(node('div','gb-kicker',s?'Etapa '+(record.step+1)+' de '+steps.length:'Montagem concluída'),
      node('h2','',s?.title||'Seu desenho passou no teste'),node('p','',s?.why||'Você construiu e mediu o caminho para atender ao objetivo deste cenário. Abra o estúdio para experimentar outras cargas e alternativas.'));
    if(s)instructions.append(node('p','gb-action',s.action));
    diagram.replaceChildren(node('figcaption','',s?'Exemplo do desenho ao fim da etapa':'Desenho de referência'),mini(target,order,s,5),mini(target,order,s,3));
    nav.replaceChildren();footer.replaceChildren();timeline.replaceChildren();
    if(s){nav.append(button(s.kind==='measure'?'Simular '+fmt(s.load)+' req/s':'Verificar minha etapa','gb-primary',()=>verify()));
      if(s.kind!=='measure')nav.append(button('Demonstrar esta mudança','gb-secondary',demonstrate));
      footer.append(button('Repetir esta etapa','gb-secondary',()=>rewind(record.step)));
    }else completion();
    if(record.step>0)footer.append(button('Voltar uma etapa','gb-secondary',()=>rewind(record.step-1)));
    footer.append(button('Reiniciar montagem','gb-secondary',()=>{if(confirm('Recomeçar a montagem guiada deste cenário? O rascunho do estúdio será preservado.')){record=initial();confirmOverwrite=false;persist();mountBoard();render();message('Montagem reiniciada com o Cliente na mesa.');}}));
    if(record.measurements.length){timeline.append(node('h3','','Suas medições'));
      const list=node('ol');record.measurements.forEach(m=>{const li=node('li');li.append(node('strong','',m.title),node('span','',fmt(m.throughput)+' de '+fmt(m.load)+' respostas/s · '+name(m.focus)+' recebeu '+fmt(m.demand)+' req/s · fila +'+fmt(m.backlog)+' itens/s · '+fmt(m.cost)+' cr/h'));list.append(li);});timeline.append(list);}
    highlight();
  }
  persist();mountBoard();render();return {destroy(){observer.disconnect();editor.destroy();root.remove();}};
}

