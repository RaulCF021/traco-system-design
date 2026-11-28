import {componentShelf} from './component-atlas.js';
import {scenarios} from './scenarios.js';

const steps=['Entender o pedido','Definir requisitos','Delimitar o projeto','Medir e evoluir'];
const number = n => Number(n).toLocaleString('pt-BR');
const facts = {
  loja:{
    name:'Loja',from:'Pessoa comprando',request:'Abrir um produto',depends:'Dados do produto',action:'Consultar o título e as medidas de um produto.',
    limit:'Combinar quanto tempo uma medida antiga pode continuar aparecendo após uma correção.',trade:'Uma cópia em memória pode aliviar leituras repetidas. Se a ficha mudar, combinar atualização ou expiração da cópia passa a fazer parte do desenho.',
    secondary:'Número de produtos cadastrados',metric:'Consultas por segundo que chegam ao banco',
    next:'Coloque um Redis entre a API e o banco. Compare a demanda do PostgreSQL antes e depois. No produto real, teste também quanto demora para uma medida corrigida aparecer.',
  },
  agenda:{
    name:'Agenda',from:'Pessoa agendando',request:'Ver horários livres',depends:'Horários cadastrados',action:'Listar os horários disponíveis de uma agenda.',
    limit:'A consulta precisa acompanhar a abertura de novas vagas.',trade:'Separar as leituras entre réplicas pode ampliar a capacidade. Uma vaga recém-ocupada pode permanecer visível durante a sincronização. Para confirmar uma reserva, valide novamente na origem.',
    secondary:'Número de calendários cadastrados',metric:'Consultas atendidas por segundo no pico',
    next:'Aumente primeiro só as réplicas da API. Execute outra vez e procure o próximo limite no banco. Compare essa execução com uma terceira, ampliando a leitura no banco.',
  },
  documentos:{
    name:'Documentos',from:'Pessoa solicitante',request:'Pedir um documento',depends:'Trabalho de geração',action:'Solicitar a geração de um documento e obter o resultado quando ficar pronto.',
    limit:'O usuário pode receber o protocolo antes de o arquivo ficar pronto.',trade:'Uma fila permite confirmar o recebimento assim que o trabalho entra. Quem gera os arquivos precisa acompanhar o ritmo de chegada para a espera não crescer.',
    secondary:'Rapidez da confirmação inicial',metric:'Crescimento da fila em trabalhos por segundo',
    next:'Adicione capacidade ao worker e repita a carga. Compare o crescimento da fila com a taxa de confirmação ao cliente. Verifique se os arquivos chegam ao armazenamento.',
  },
  mapas:{
    name:'Mapas',from:'Pessoa navegando',request:'Abrir área do mapa',depends:'Imagens do mapa',action:'Entregar as imagens que compõem a área do mapa aberta pelo usuário.',
    limit:'As imagens públicas podem ser reutilizadas por pessoas que abrem a mesma área.',trade:'Uma CDN aproxima cópias dessas imagens dos usuários. A primeira consulta a uma área ausente ainda precisa chegar à origem. Uma atualização exige renovar ou expirar as cópias.',
    secondary:'Quantidade de ruas no mapa',metric:'Buscas por segundo no armazenamento de origem',
    next:'Encaminhe os pedidos por uma CDN com origem no armazenamento. Compare as buscas recebidas na origem para a mesma carga. Depois discuta o que mudaria numa região ainda sem cópias.',
  }
};

function el(tag,cls,text) {
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
}
function control(label,run,cls='') {
  const button=el('button',cls,label);button.type='button';button.onclick=run;return button;
}
function goto(label,hash,cls='') {
  const a=el('a',cls,label);a.href='#'+hash;return a;
}
function heading(section,title,body) {
  section.append(el('h2','ds-h2',title));if(body)section.append(el('p','ds-copy',body));
}
export function mountDesignSchool(container,state={},save=()=>{},initialId) {
  if(!document.querySelector('link[data-design-school]')){
    const link=el('link');link.rel='stylesheet';link.href=new URL('./design-school.css',import.meta.url).href;
    link.dataset.designSchool='';document.head.append(link);
  }
  const memory=state.designSchool??={};
  memory.projects??={};
  let id=Object.hasOwn(facts,memory.selected)&&Object.hasOwn(scenarios,memory.selected)?memory.selected:'loja';
  if(Object.hasOwn(scenarios,initialId))id=initialId;
  const root=el('article','ds-school');container.replaceChildren(root);
  const data=()=>{const d=memory.projects[id]??={};d.answers??={};return d};
  function store(){memory.selected=id;save()}
  function choose(next){id=next;store();location.hash='requisitos/'+id}
  function move(step) {
    data().step=step;store();draw();const h=root.querySelector('.ds-body h2');h.tabIndex=-1;h.focus();
  }
  function answers(section,key,prompt,choices) {
    const box=el('fieldset','ds-check'),legend=el('legend','',prompt),options=el('div','ds-answers');
    const feedback=el('p','ds-feedback');feedback.setAttribute('role','status');box.append(legend,options,feedback);
    const buttons=[];
    function mark(i) {
      buttons.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));
      if(choices[i])feedback.textContent=choices[i][1];
    }
    choices.forEach(([text],i)=>{
      const b=control(text,()=>{data().answers[key]=i;mark(i);store()});options.append(b);buttons.push(b);
    });
    mark(data().answers[key]);section.append(box);
  }
  function note(section,title,body) {
    const d=el('details','ds-hint');d.append(el('summary','',title),el('p','',body));section.append(d);
  }
  function draw() {
    const cfg=scenarios[id],f=facts[id],page=Math.max(0,Math.min(3,Number(data().step)||0));
    root.replaceChildren();
    const intro=el('div','ds-intro');intro.append(el('p','ds-kicker','Escola de arquitetura'),el('h1','','Como desenhar um sistema'),el('p','ds-copy','Escolha um problema, descubra o que uma pessoa precisa fazer e desenhe o caminho do pedido. Em seguida, teste suas decisões no editor.'));
    const picker=el('div','ds-picker');picker.setAttribute('role','group');picker.setAttribute('aria-label','Escolher projeto');
    for(const [k,item] of Object.entries(facts)) {
      const b=control(item.name,()=>choose(k));b.setAttribute('aria-pressed',String(k===id));picker.append(b);
    }
    intro.append(picker);root.append(intro);
    const stage=el('div','ds-stage'),meta=el('div','ds-meta');meta.append(el('span','ds-kicker','Projeto selecionado'),el('span','ds-load',number(cfg.load)+' pedidos/s'));
    stage.append(meta,el('h2','ds-title',cfg.title),el('p','ds-brief',cfg.brief));
    const flow=el('ol','ds-flow');
    for(const [a,b] of [['Quem pede',f.from],['Qual ação',f.request],['Do que depende',f.depends]]) {
      const item=el('li');item.append(el('small','',a),el('strong','',b));flow.append(item);
    }
    stage.append(flow,componentShelf(id));root.append(stage);
    const dock=el('div','ds-dock');const nav=el('nav','ds-steps');
    nav.setAttribute('aria-label','Etapas do desenho');
    steps.forEach((label,i)=>{const b=control((i+1)+'. '+label,()=>move(i));if(i===page)b.setAttribute('aria-current','step');nav.append(b)});
    dock.append(nav);
    const body=el('section','ds-body');
    if(page===0) {
      heading(body,'Quem pede o quê?','Um pedido começa com uma ação de uma pessoa ou de outro sistema. O caminho é a sequência de participantes que trabalham para devolver o resultado. Uma dependência é algo que precisa responder ou terminar para que o próximo passo aconteça.');
      const walk=el('div','ds-walk');cfg.lifecycle.forEach((s,i)=>{const item=el('div');item.append(el('span','',String(i+1)),el('div'));item.lastChild.append(el('strong','',s.title),el('p','',s.text));walk.append(item)});body.append(walk);
      note(body,'Pista para ler o caminho','Comece com “'+f.request.toLowerCase()+'”. A cada seta, pergunte o que chega, quem trabalha e o que sai. No quadro acima, os três blocos descrevem o problema. No editor, as peças passam a representar o software que o resolve.');
    } else if(page===1) {
      heading(body,'Qual comportamento precisa existir?','Um requisito funcional descreve uma ação que o produto oferece. Um requisito não funcional descreve uma qualidade esperada dessa ação, como capacidade, tempo de resposta ou confiabilidade.');
      answers(body,'functional','Qual destas frases define uma função do projeto?',[
        ['Atender '+number(cfg.load)+' pedidos/s.','Isso define capacidade, uma qualidade mensurável. A frase ainda não diz qual serviço o usuário recebe.'],
        [f.action,'Sim. Essa frase permite descrever um teste do ponto de vista da pessoa que usa o produto.'],
        ['Usar três servidores.','Isso escolhe uma implementação. Outras arquiteturas também podem oferecer a função exigida.'],
      ]);
      note(body,'Como escrever um critério de aceitação','Descreva uma entrada e o resultado observável. Depois acrescente a meta de qualidade. Aqui a referência de carga é '+number(cfg.load)+' pedidos/s. Para avaliar tempo de resposta, defina também qual espera é aceitável para o usuário.');
    } else if(page===2) {
      heading(body,'O que limita a sua escolha?','Uma restrição coloca limites nas soluções possíveis. Investigue o orçamento, o prazo, a atualização dos dados e o que pode acontecer depois da resposta ao usuário.');
      body.append(el('p','ds-callout',f.limit));
      answers(body,'constraint','Que decisão faz sentido tomar antes de acrescentar componentes?',[
        ['Usar todas as peças disponíveis.','Cada peça acrescenta custo e um novo ponto de falha. Comece verificando qual limite afeta o pedido.'],
        ['Copiar a solução de um serviço muito maior.','O volume, o orçamento e as garantias desse serviço podem ser diferentes. Compare primeiro as condições.'],
        ['Registrar qual garantia este produto precisa manter.',f.trade],
      ]);
      note(body,'Pergunta para conversar com a equipe',cfg.questions[0]??f.limit);
    } else {
      heading(body,'Mude uma coisa e compare','Rode o desenho inicial no editor com '+number(cfg.load)+' pedidos/s. Registre a medida, altere uma peça e execute de novo com a mesma carga. Isso permite associar o efeito à mudança.');
      answers(body,'metric','Qual medida acompanha diretamente o problema deste projeto?',[
        [f.metric,'Essa medida mostra o efeito no ponto investigado. Compare também custo e vazão para identificar possíveis perdas em outro ponto.'],
        [f.secondary,'Esse número sozinho não mostra se o ponto investigado melhorou. Procure uma medida que mude quando a arquitetura passa a suportar melhor a carga.'],
      ]);
      note(body,'Um primeiro experimento para o editor',f.next);
    }
    const prompts=[
      ['Descreva a ação em uma frase','Quem inicia, o que envia e qual resultado precisa receber?',f.action],
      ['Escreva um critério verificável','Complete: quando a pessoa fizer…, o sistema deve…, e eu vou conferir…','Ao abrir a tela, a pessoa recebe o resultado solicitado. No ensaio de pico, vou conferir quantos dos '+number(cfg.load)+' pedidos/s terminam.'],
      ['Anote uma restrição','Qual condição torna uma solução inadequada mesmo que ela seja rápida?',f.limit],
      ['Registre sua hipótese','Qual peça você mudaria? Qual medida espera ver mudar? Por quê?',f.next]
    ];
    const [label,hint,example]=prompts[page],sheet=el('div','req-sheet'),field=el('label');
    field.append(el('strong','',label),el('span','',hint));
    const input=el('textarea');input.rows=2;data().notes??={};input.value=data().notes[page]||'';
    input.oninput=()=>{data().notes[page]=input.value;store()};field.append(input);sheet.append(field);
    note(sheet,'Ver um exemplo de raciocínio',example);body.append(sheet);dock.append(body);
    const actions=el('div','ds-actions');
    if(page<3)actions.append(control('Próxima etapa →',()=>move(page+1),'ds-next'));
    if(page===3)actions.append(goto('Montar com orientação','guiado/'+id,'ds-launch'));
    dock.append(actions);root.append(dock);
    const footer=el('div','ds-foot');footer.append(goto('Abrir catálogo de componentes','pecas'),goto('Começar em um quadro vazio','livre'));root.append(footer);
  }
  draw();return {destroy(){root.remove()}};
}


