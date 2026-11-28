import {scenarios} from './scenarios.js';
import {catalog, simulate} from './model.js';

const cases={
 loja:{
  interview:[
   ['Produto','Quais dados aceitam atraso?','Título e medidas toleram até 60 s de defasagem. O fechamento da compra verifica preço e estoque na origem.'],
   ['Operação','Como o pico se distribui?','700 leituras/s, com 80% de acertos no cache aquecido. Uma campanha pode concentrar muitas faltas na mesma chave.'],
   ['Confiabilidade','O que significa uma ficha saudável?','Meta proposta: 99,9% das leituras válidas em 30 dias devem devolver a ficha correta em até 250 ms. Conte timeouts e erros do serviço no denominador.']
  ],
  math:['Se o acerto cair para 30% no pico de 700/s, quantas leituras/s chegarão ao banco?','leituras/s',490,'700 × (1 − 0,30) = 490 leituras/s. Um banco de 450/s deixa 40/s sem capacidade.'],
  failure:['O Redis cai durante o pico. O que protege o banco de uma avalanche?',[
   ['Enviar imediatamente os 700 pedidos/s à origem.','O banco admite 450/s. O encaminhamento integral desloca a saturação para a origem.'],
   ['Limitar concorrência, consolidar faltas por chave e definir quando servir uma cópia antiga.','A origem recebe trabalho limitado. A política de atraso precisa respeitar o contrato de cada campo.'],
   ['Aumentar o TTL de todos os itens durante a queda.','Um prazo maior sozinho não torna uma instância indisponível acessível.']
  ],1],
  change:['O jurídico exige remover uma ficha suspensa em até dois segundos, inclusive das cópias.',[
   ['Manter apenas o TTL de 60 segundos.','Uma cópia criada logo antes da suspensão pode ficar visível por quase um minuto.'],
   ['Invalidar por evento versionado, medir o atraso e bloquear a leitura se a versão não for confiável.','A remoção ganha prioridade sobre disponibilidade. Teste perda e reordenação de eventos e o modo conservador de leitura.']
  ],1], risk:'Provoque centenas de faltas simultâneas na mesma chave e uma invalidação perdida. Registre carga na origem e tempo até a remoção.'
 },
 agenda:{
  interview:[
   ['Produto','É uma consulta ou uma reserva?','A lista é informativa e pode ter até 3 s de atraso. A confirmação deve impedir que dois usuários reservem a mesma vaga.'],
   ['Operação','Como chegam os usuários?','1.400 consultas/s no pico, com horários de profissionais muito populares concentrando acessos.'],
   ['Confiabilidade','Como medir sucesso?','Meta proposta: 99,9% das consultas válidas em 30 dias respondem em até 300 ms. Registre separadamente violações de exclusividade de reserva.']
  ],
  math:['Uma réplica de leitura admite 450 consultas/s. Quantas réplicas devem estar provisionadas para suportar 1.400/s após perder uma, com distribuição uniforme?','réplicas',5,'Arredonde 1.400 ÷ 450 para cima: quatro réplicas precisam permanecer disponíveis. Provisione cinco para tolerar uma perda.'],
  failure:['O cliente perde a resposta ao confirmar uma reserva e repete o pedido. Como evitar duplicação?',[
   ['Usar chave idempotente e gravar a reserva com restrição única da vaga na mesma transação.','A chave identifica a tentativa repetida e a restrição protege contra outros clientes concorrentes.'],
   ['Ler uma réplica antes de cada gravação.','Uma réplica atrasada pode mostrar a vaga livre aos dois clientes.'],
   ['Acrescentar um balanceador na frente dos servidores.','A distribuição de chamadas não arbitra a propriedade da vaga.']
  ],0],
  change:['Uma clínica exige ver a reserva confirmada imediatamente ao reabrir a agenda.',[
   ['Ler de qualquer réplica assíncrona.','A réplica escolhida ainda pode estar atrás da gravação confirmada.'],
   ['Usar a origem ou uma réplica que já aplicou a versão confirmada durante essa sessão.','Você oferece leitura das próprias gravações. Meça a pressão extra na origem e o atraso das réplicas.']
  ],1],risk:'Injete atraso de replicação, confirme a mesma vaga em duas sessões e repita um pedido com a resposta perdida.'
 },
 documentos:{
  interview:[
   ['Produto','Quando posso confirmar o pedido?','O protocolo só pode ser enviado depois que o pedido foi persistido. O cidadão pode baixar o documento depois.'],
   ['Operação','Que pico os executores precisam absorver?','Chegam 700 trabalhos/s. Um worker processa 350/s. Reentregas e retomadas podem ocorrer.'],
   ['Confiabilidade','O que o usuário percebe?','Meta proposta: 99% dos pedidos aceitos em 30 dias devem produzir um arquivo em até dois minutos. Acompanhe também a idade do trabalho mais antigo.']
  ],
  math:['Um único worker processa 350/s enquanto chegam 700/s durante dois minutos. Partindo de fila vazia, quantos trabalhos ficam pendentes?','trabalhos',42000,'(700 − 350) × 120 = 42.000 trabalhos. Dois workers param o crescimento nessa carga, mas não drenam o acúmulo.'],
  failure:['O worker grava o arquivo e cai antes de confirmar a mensagem. Qual desenho suporta a reentrega?',[
   ['Confirmar a mensagem antes de iniciar a geração.','Uma falha depois da confirmação pode fazer o pedido desaparecer sem arquivo.'],
   ['Desabilitar todas as novas tentativas.','O usuário pode ficar sem resultado após uma interrupção transitória.'],
   ['Usar identificador estável, escrita idempotente e confirmar a mensagem depois do resultado durável.','A reexecução converge para o mesmo resultado. Proteja também atualizações concorrentes do estado e a retenção dos arquivos.']
  ],2],
  change:['Pedidos urgentes chegam durante uma fila de horas, com a mesma meta de dois minutos.',[
   ['Criar classe de prioridade com capacidade reservada e monitorar a espera de ambas as classes.','A reserva protege os urgentes. Defina um piso para a fila comum e simule o pior pico de prioridades.'],
   ['Apenas responder mais rápido ao receber todos os pedidos.','Reduz a espera pelo protocolo, mas não a espera pelo arquivo concluído.']
  ],0],risk:'Interrompa o worker após gravar o arquivo e antes do ACK. Confira protocolo, reentrega, unicidade do arquivo e idade da fila.'
 },
 mapas:{
  interview:[
   ['Produto','Todos podem acessar as mesmas imagens?','Os tiles públicos podem ser compartilhados. Camadas privadas exigem autorização antes que qualquer imagem seja entregue.'],
   ['Operação','Qual volume sai da borda?','São 6.000 tiles/s no pico. Considere tiles de 32 kB decimais e 90% de acertos na CDN aquecida.'],
   ['Confiabilidade','Qual a meta de experiência?','Meta proposta: 99,9% dos pedidos válidos de tiles públicos em 30 dias devem receber a versão permitida em até 200 ms. Meça por região.']
  ],
  math:['Com 6.000 tiles/s, 90% de acertos e 32 kB por tile, qual banda de saída da origem em MB/s decimais? Ignore cabeçalhos.','MB/s',19.2,'6.000 × 0,10 × 32 kB = 19.200 kB/s = 19,2 MB/s. Mbps seria outra unidade: 153,6 Mbit/s.'],
  failure:['Um novo evento atrai uma região sem tiles pré-carregados. Qual experimento mede o risco?',[
   ['Observar apenas o acerto global já aquecido.','O acerto agregado esconde uma região fria com grande demanda simultânea.'],
   ['Testar cache frio, consolidar buscas pelo mesmo tile e limitar o tráfego para a origem.','Meça separadamente latência regional, falhas e banda na origem, inclusive no primeiro acesso.'],
   ['Diminuir o TTL de todos os tiles.','Expiração mais frequente pode agravar as faltas durante o pico.']
  ],1],
  change:['A equipe acrescenta uma camada paga e individualizada sobre o mapa público.',[
   ['Separar tiles públicos das respostas privadas, verificar autorização e isolar a chave quando houver cache privado.','Uma cópia compartilhada indevidamente expõe dados. Teste dois usuários com permissões diferentes na mesma coordenada.'],
   ['Manter a mesma chave pública baseada só na coordenada.','Ela não representa identidade, permissão nem versão da camada; dados de um usuário podem chegar a outro.']
  ],0],risk:'Esvazie a borda de uma região e teste acesso concorrente a uma área. Compare respostas de dois usuários com autorizações diferentes.'
 }
};
const adrFields=[
 ['context','Contexto e contrato','Quais usuários, pico e SLO orientam a decisão? Especifique janela, população e o evento que indica sucesso.'],
 ['decision','Decisão e alternativa','Que desenho você adota, que alternativa considerou e qual condição faria a alternativa vencer?'],
 ['recovery','Falha e recuperação','Identifique o estado durável, a perda ou duplicação tolerável e a recuperação. Se o estado puder ser reconstruído, identifique a fonte.'],
 ['evidence','Evidência e revisão','Registre uma medição, uma hipótese ainda não testada, o teste e o gatilho para reverter ou revisar a decisão.']
];
const fmt=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function btn(label,fn){const x=el('button','',label);x.type='button';x.onclick=fn;return x;}
function title(box,n,t){const h=el('h2');h.append(el('small','',n+' / '),document.createTextNode(t));box.append(h);}
function numeric(value){const t=String(value??'').trim();return /^\d+(?:[.,]\d+)?$/.test(t)?Number(t.replace(',','.')):NaN;}

export function mountArchitectureReview(container,id,state={},save=()=>{}){
 if(!Object.hasOwn(cases,id))id='loja';
 if(!document.querySelector('link[data-review-style]')){const l=el('link');l.rel='stylesheet';l.href=new URL('./architecture-review.css',import.meta.url).href;l.dataset.reviewStyle='';document.head.append(l);}
 const cfg=cases[id],scenario=scenarios[id];state.reviews??={};
 const draft=state.reviews[id]??={};draft.interview??={};draft.adr??={};
 const root=el('article','ar-review');container.replaceChildren(root);
 const heading=el('div','ar-heading');heading.append(el('small','','Revisão de arquitetura'),el('h1','',scenario.title),el('p','','Defenda uma decisão perante produto, operação e confiabilidade. As respostas da entrevista introduzem as condições deste exercício.'));
 const link=el('a','ar-editor','Abrir desenho no estúdio →');link.href='#projeto/'+id;heading.append(link);root.append(heading);
 const terms=el('details','ar-sheet');terms.append(el('summary','','Termos usados nesta revisão'));
 for(const [name,definition] of [
  ['SLO','Objetivo de nível de serviço. Exemplo: em 30 dias, 99% das consultas válidas devem terminar em até 300 ms. Defina quem entra na contagem e como medir.'],
  ['p95 e p99','Ordene os tempos de resposta. O p95 é um limite que cobre 95% das observações; o p99 cobre 99%. Uma média baixa ainda pode esconder uma espera longa para parte dos usuários.'],
  ['Consistência e durabilidade','Consistência envolve as regras que os dados precisam respeitar, como impedir duas reservas da mesma vaga. Durabilidade é a garantia de que uma operação confirmada sobrevive às falhas previstas.'],
  ['Registro de decisão (ADR)','Um texto curto para que outra pessoa entenda o problema, a solução escolhida, uma alternativa e a evidência que faria você reconsiderar.']
 ]){const line=el('p');line.append(el('strong','',name+' · '),document.createTextNode(definition));terms.append(line)}
 root.append(terms);
 const notes=state.designSchool?.projects?.[id]?.notes||{};
 if(Object.values(notes).some(Boolean)){const context=el('details','ar-sheet');context.append(el('summary','','Recuperar meu levantamento de requisitos'));['Ação','Critério de aceitação','Restrição','Hipótese'].forEach((name,i)=>{if(notes[i])context.append(el('p','',name+' · '+notes[i]))});root.append(context)}

 const results=el('section','ar-sheet ar-rubric'),rubric=el('ul');title(results,'06','Rubrica da revisão');results.append(el('p','','A rubrica verifica escolhas do exercício e a presença dos registros. A qualidade do texto livre exige leitura crítica.'),rubric);
 function assess(){
  const rows=[
   [cfg.interview.every((_,i)=>draft.interview[i]),'Entrevista','Consulte as três áreas para descobrir a garantia de produto, a carga e o indicador de serviço.','As três áreas foram consultadas. Compare a meta com a capacidade do seu desenho.'],
   [draft.checked && Math.abs(numeric(draft.math)-cfg.math[2])<0.00001,'Capacidade',draft.checked?cfg.math[3]:'Calcule a carga com as unidades pedidas e confira o resultado.','Cálculo de capacidade conferido.'],
   [draft.failure===cfg.failure[2],'Falha',Number.isInteger(draft.failure)?cfg.failure[1][draft.failure]?.[1]:'Escolha como conter a falha e proteger o estado.','A resposta selecionada contém a falha descrita.'],
   [draft.change===cfg.change[2],'Mudança',Number.isInteger(draft.change)?cfg.change[1][draft.change]?.[1]:'Reavalie a arquitetura sob a nova exigência.','A proposta atende à mudança apresentada.'],
   [adrFields.every(([key])=>String(draft.adr[key]??'').trim()),'Registro de decisão','Complete os campos do registro e use a pergunta de cada campo como critério de revisão.','Os quatro campos foram preenchidos. Releia o contrato, a alternativa descartada e o gatilho de revisão.']
  ];
  rubric.replaceChildren(...rows.map(([ok,name,missing,done])=>{const li=el('li');li.dataset.ok=String(Boolean(ok));li.append(el('strong','',(ok?'✓ ':'○ ')+name),el('span','',ok?done:missing));return li;}));
 }
 const interviews=el('section','ar-sheet');title(interviews,'01','Entrevista de requisitos');
 interviews.append(el('p','','Abra as perguntas e use as respostas para escrever seu contrato. Os números são hipóteses do caso didático.'));
 const people=el('div','ar-people');interviews.append(people);
 cfg.interview.forEach(([who,q,a],i)=>{const d=el('details'),sum=el('summary');sum.append(el('small','',who),el('strong','',q));d.append(sum,el('p','',a));d.open=Boolean(draft.interview[i]);d.ontoggle=()=>{if(d.open&&!draft.interview[i]){draft.interview[i]=true;save();assess();}};people.append(d);});root.append(interviews);
 const math=el('section','ar-sheet');title(math,'02','Dimensionamento');const field=el('label','ar-number',cfg.math[0]),input=el('input');input.type='text';input.inputMode='decimal';input.placeholder=cfg.math[1];input.value=draft.math??'';
 field.append(input,el('small','',cfg.math[1]));const check=btn('Conferir cálculo',()=>{draft.checked=true;save();showMath();assess();}),feedback=el('p','ar-feedback');feedback.setAttribute('role','status');
 function showMath(){feedback.textContent=!draft.checked?'':!Number.isFinite(numeric(draft.math))?'Informe um número sem separador de milhar, usando vírgula ou ponto decimal.':(Math.abs(numeric(draft.math)-cfg.math[2])<0.00001?'Cálculo correto. ':'Revise o cálculo. ')+cfg.math[3];}
 input.oninput=()=>{draft.math=input.value;draft.checked=false;save();showMath();assess();};showMath();math.append(field,check,feedback);root.append(math);
 function dilemma(key,n,label){
  const [prompt,options,correct]=cfg[key],s=el('section','ar-sheet');title(s,n,label);s.append(el('p','',prompt));const choices=el('div','ar-choices'),response=el('p','ar-feedback');response.setAttribute('role','status');
  function highlight(){[...choices.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(draft[key]===i)));const v=options[draft[key]];response.textContent=v?((draft[key]===correct?'Decisão defensável. ':'Risco aberto. ')+v[1]):'';}
  options.forEach(([text],i)=>choices.append(btn(text,()=>{draft[key]=i;save();highlight();assess();})));highlight();s.append(choices,response);return s;
 }
 root.append(dilemma('failure','03','Falha em produção'),dilemma('change','04','Mudança de requisito'));
 const adr=el('section','ar-sheet');title(adr,'05','Registro de decisão arquitetural');
 const studio=state.studios?.[id],last=studio?.last;
 const evidence=el('aside','ar-evidence');evidence.append(el('strong','','Evidência do estúdio'));
 if(last&&Number.isFinite(last.load)&&Array.isArray(last.graph?.nodes)&&Array.isArray(last.graph?.edges)&&last.graph.nodes.every(n=>n&&Object.hasOwn(catalog,n.type))&&last.graph.edges.every(e=>e&&typeof e==='object')){
  const r=simulate(last.graph,last.load);
  const graphText=last.graph.nodes.map(n=>catalog[n.type].name+' ×'+(n.replicas||1)+(n.offline?' (fora do ar)':'')).join(', ');
  evidence.append(el('p','','Configuração salva para simulação: '+(graphText||'quadro vazio')+'.'),el('p','','Estimativa recalculada para '+fmt(last.load)+' pedidos/s: vazão '+fmt(r.throughput)+'/s, fila +'+fmt(r.backlog)+'/s, custo '+fmt(r.cost)+' cr/h'+(r.throughput>0?', latência média '+fmt(r.latency)+' ms':'')+'.'));
  if(studio.graph&&JSON.stringify(studio.graph)!==JSON.stringify(last.graph)||Number.isFinite(studio.load)&&studio.load!==last.load)evidence.append(el('p','','O rascunho atual difere desta configuração salva.'));
 }else evidence.append(el('p','','Ainda não há configuração de simulação salva para este projeto. Abra o estúdio, execute um cenário e volte para registrar os números.'));
 evidence.append(el('p','','A simulação calcula fluxo, média de latência e custo relativo. Distribuição de cauda, retenção durável, atraso de réplica e SLO em uma janela de dias exigem evidência externa.'));
 adr.append(evidence,el('p','ar-risk','Teste de revisão: '+cfg.risk));
 for(const [key,label,hint] of adrFields){const field=el('label','ar-field');field.append(el('strong','',label),el('span','',hint));const area=el('textarea');area.rows=3;area.value=draft.adr[key]??'';area.oninput=()=>{draft.adr[key]=area.value;save();assess();};field.append(area);adr.append(field);}
 root.append(adr,results);assess();return {destroy(){root.remove();}};
}
