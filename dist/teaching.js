const link=(text,route)=>'<a class="teach-link" href="#'+route+'">'+text+'</a>';

export function architectSchool(root,state,save){
 let page=0;
 const decisions=[
 {title:'Descubra o problema',speech:'“No sábado começa a promoção. A página do produto costuma travar. Você consegue resolver?”',think:'Antes de desenhar, eu preciso descobrir qual ação falha, para quantas pessoas e o que elas precisam receber.',q:'Qual pergunta faria à equipe da loja?',opts:['Quantas pessoas consultam o mesmo produto por segundo? A descrição muda durante a promoção?','Qual é o banco de dados mais rápido que podemos comprar?'],ok:0,reply:['“Esperamos 700 aberturas por segundo. Quase todo mundo consulta o mesmo produto, e a descrição raramente muda.” Agora temos informações para comparar caminhos.','Um banco mais rápido pode ajudar, mas ainda falta descobrir qual trabalho está se repetindo. Pergunte sobre os compradores e as mudanças no catálogo.']},
 {title:'Localize o limite',speech:'Cada abertura faz uma consulta. O serviço que recebe pedidos consegue tratar 800 por segundo. O banco consegue responder a 450.',think:'Sigo um pedido por vez: o aplicativo pede os detalhes do produto ao serviço; o serviço busca a descrição no banco. Depois conto quantas vezes cada passo acontece.',q:'Com 700 pedidos por segundo, onde a demanda ultrapassa a capacidade?',opts:['Na entrada do serviço','Na consulta ao banco'],ok:1,reply:['Chegam 700 e cabem 800. Acompanhe o pedido mais uma etapa.','O banco recebe 700 consultas e só consegue concluir 450 por segundo. Faltam 250 respostas por segundo nesse modelo.']},
 {title:'Escolha uma mudança',speech:'Muitas pessoas pedem exatamente a mesma descrição. A loja aceita mostrar uma cópia por alguns segundos.',think:'Posso guardar temporariamente uma resposta já pronta. Essa cópia se chama cache. O original continua guardado no banco.',q:'Qual mudança aproveita o que você descobriu sobre os pedidos?',opts:['Guardar a descrição mais consultada para reaproveitar a resposta','Duplicar o serviço de entrada e continuar consultando o banco a cada pedido'],ok:0,reply:['Se a cópia servir 8 de cada 10 pedidos, só 2 chegam ao banco. Você pode testar essa hipótese a seguir.','Isso aumenta a capacidade do serviço que já tinha folga. Os mesmos 700 pedidos continuam chegando ao banco.']}
 ];
 function display(){
  const d=decisions[page];
  root.innerHTML='<article class="teach"><div class="teach-head"><p>Oficina de decisões · '+(page+1)+' de 4</p><h1>A promoção começa amanhã. A loja aguenta?</h1></div><div class="teach-body">'+(d?'<h2>'+d.title+'</h2><blockquote>'+d.speech+'</blockquote><h3>Como eu pensaria</h3><p>'+d.think+'</p><div class="teach-check"><h3>'+d.q+'</h3><div class="teach-options"></div><p role="status" class="teach-feedback"></p></div>':'<h2>Teste sua hipótese</h2><p>Aumente ou diminua a quantidade de pedidos que encontram a cópia pronta. Observe quando o banco volta a dar conta.</p><label for="hit">Pedidos atendidos pela cópia: <output id="pct"></output></label><input type="range" id="hit" min="0" max="100" step="5" value="80"><div class="teach-measure" aria-live="polite"></div><label for="fresh">E se o catálogo mudar?</label><select id="fresh"><option value="rare">Descrições mudam raramente; alguns segundos de atraso são aceitáveis</option><option value="now">Um produto retirado precisa sumir imediatamente</option></select><p id="trade" aria-live="polite"></p>')+'<div class="teach-actions"></div></div></article>';
  const actions=root.querySelector('.teach-actions');
  function button(label,fn,parent=actions){const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b}
  if(page)button('Voltar',()=>{page--;display()});
  if(d){const choices=root.querySelector('.teach-options');let next;
   d.opts.forEach((opt,i)=>{button(opt,()=>{root.querySelector('.teach-feedback').textContent=d.reply[i];[...choices.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));next?.remove();if(i===d.ok)next=button('Continuar',()=>{page++;display()})},choices)});
  }else{
   const range=root.querySelector('#hit'),fresh=root.querySelector('#fresh');
   function calc(){const hit=Number(range.value),reads=700-7*hit;root.querySelector('#pct').value=hit+'%';root.querySelector('.teach-measure').textContent='700 pedidos − '+(7*hit)+' atendidos pela cópia = '+reads+' consultas/s no banco. '+(reads>450?'A demanda excede a capacidade em '+(reads-450)+' consultas/s.':'O banco consegue responder a essa carga.')}
   function trade(){root.querySelector('#trade').textContent=fresh.value==='rare'?'A loja aceita uma cópia com prazo curto. Meça na promoção quantas pessoas encontram a cópia pronta e quanto tempo uma alteração demora para aparecer.':'Uma cópia antiga pode devolver o produto retirado. A carga sozinha já não decide: antes de usar o cache, planeje como invalidar a cópia na remoção e como verificar que ela sumiu. Até lá, consultar a origem exige dimensionar o banco para os 700 pedidos/s.'}
   range.oninput=calc;fresh.onchange=trade;calc();trade();button('Aplicar a decisão no projeto da loja',()=>{state.decision=true;save();location.hash='projeto/loja'});
  }
 }
 display();
}

export function practice(root){
 root.innerHTML='<article class="teach"><div class="teach-head"><p>Aplicar o que aprendeu</p><h1>Prática</h1></div><div class="teach-body">'+[
 ['Como um arquiteto decide','Investigue requisitos e teste uma decisão antes de modificar um projeto.','arquiteto'],
 ['Exemplo guiado de aplicativo de música','Acompanhe um pedido e depois monte as três peças com ajuda.','musica'],
 ['Tutorial do editor','Aprenda os controles e observe uma falha no banco.','tutorial'],
 ['Missões','Resolva desafios com metas de capacidade e custo.','track'],
 ['Experimentos A/B','Compare duas arquiteturas com a mesma carga.','experiments'],
 ['Modo livre','Escolha as peças e monte seu próprio sistema.','sandbox']
 ].map(([t,s,r])=>'<section class="practice-item">'+link(t,r)+'<p>'+s+'</p></section>').join('')+'</div></article>';
}
