const pieces = [
  {name:'Cliente',role:'Faz o pedido',icon:'<rect x="3" y="4" width="26" height="18" rx="2"/><path d="M9 27h14m-7-5v5M6 18h20"/>'},
  {name:'API',role:'Organiza a consulta',icon:'<rect x="4" y="4" width="24" height="10" rx="2"/><rect x="4" y="18" width="24" height="10" rx="2"/><path d="M8 9h1m4 0h1m-6 14h1m4 0h1"/>'},
  {name:'PostgreSQL',role:'Guarda as faixas',icon:'<ellipse cx="16" cy="7" rx="10" ry="4"/><path d="M6 7v17c0 5.5 20 5.5 20 0V7M6 14c0 5.5 20 5.5 20 0M6 20c0 5.5 20 5.5 20 0"/>'}
];
const lessons = [
  {phase:'Peças',name:'Comece por quem pede',why:'Você toca em um álbum no celular para ver as faixas. O aplicativo que pede essa informação recebe o nome de cliente.',act:'Escolha Cliente na bandeja e toque no primeiro espaço da mesa.',kind:'place',target:0},
  {phase:'Peças',name:'Acrescente quem atende',why:'O cliente envia o número do álbum para um serviço. A API é a interface usada para fazer esse pedido. Aqui, o bloco API representa o serviço que recebe o número e procura as faixas.',act:'Escolha API na bandeja e toque no segundo espaço.',kind:'place',target:1},
  {phase:'Peças',name:'Coloque o acervo no caminho',why:'As faixas ficam registradas em um banco de dados. Neste exemplo usamos o PostgreSQL. O serviço consegue pedir a ele todas as faixas que pertencem a um álbum.',act:'Escolha PostgreSQL na bandeja e toque no terceiro espaço.',kind:'place',target:2},
  {phase:'Conexões',name:'Dê um destino ao pedido',why:'Uma seta mostra quem pede algo a quem. O pedido sai do Cliente e chega à API. A porta é o ponto usado para ligar dois blocos no desenho.',act:'Toque na saída do Cliente. Depois, toque na entrada da API.',kind:'wire',from:0,target:1},
  {phase:'Conexões',name:'Ligue o serviço ao acervo',why:'A API recebeu o número do álbum. Para saber quais faixas devolver, ela precisa consultar o PostgreSQL.',act:'Toque na saída da API. Depois, toque na entrada do PostgreSQL.',kind:'wire',from:1,target:2},
  {phase:'Percurso',name:'Envie o pedido do ouvinte',why:'Agora você é o aplicativo. Alguém abriu o álbum 42. O primeiro pedido leva o número do álbum até o serviço que atende o aplicativo.',act:'Toque na peça que recebe o pedido do Cliente.',kind:'trace',from:0,target:1,packet:'Pedido · álbum 42'},
  {phase:'Percurso',name:'Busque as faixas',why:'A API recebeu “álbum 42”. Para montar a lista, precisa consultar os registros que pertencem a esse álbum.',act:'Toque na peça que guarda as faixas.',kind:'trace',from:1,target:2,packet:'Consulta · faixas do álbum 42'},
  {phase:'Percurso',name:'Traga os registros de volta',why:'O PostgreSQL encontrou duas faixas. Na resposta, os registros voltam pela conexão que a API abriu. Nenhuma nova seta precisa ser criada.',act:'Toque em quem fez a consulta ao banco e agora recebe os registros.',kind:'trace',from:2,target:1,packet:'Resposta · 2 registros'},
  {phase:'Percurso',name:'Entregue a lista ao ouvinte',why:'A API organizou os registros em uma lista. A resposta final precisa chegar ao aplicativo para que as duas faixas apareçam na tela.',act:'Toque na peça que exibe a lista para o ouvinte.',kind:'trace',from:1,target:0,packet:'Resposta · 2 faixas'}
];
const svg=path=>'<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function button(text,cls,action){const b=el('button',cls,text);b.type='button';b.addEventListener('click',action);return b;}
function glyph(i){const e=el('span','fb-glyph fb-color-'+i);e.innerHTML=svg(pieces[i].icon);return e;}
export function mountFirstBuild(container,onDone=()=>{}){
  const root=el('section','fb-root'),head=el('div','fb-heading'),headingText=el('div'),progress=el('ol','fb-progress');
  headingText.append(el('span','fb-meta','Primeira montagem'),el('h1','','Do toque no álbum à lista de faixas'));
  progress.setAttribute('aria-label','Fases da montagem');head.append(headingText,progress);
  const briefing=el('div','fb-briefing'),briefTitle=el('h2'),why=el('p','fb-why'),action=el('p','fb-action');
  briefTitle.tabIndex=-1;briefing.append(briefTitle,why,action);
  const stage=el('section','fb-stage'),stageBar=el('div','fb-stagebar'),count=el('span',''),board=el('div','fb-board');
  stage.setAttribute('aria-label','Mesa de arquitetura');stageBar.append(el('strong','','Mesa de arquitetura'),count);stage.append(stageBar,board);
  const dock=el('div','fb-dock'),dockTitle=el('strong','fb-dock-label'),trays=el('div','fb-trays'),report=el('p','fb-message');
  report.setAttribute('role','status');report.setAttribute('aria-live','polite');dock.append(dockTitle,trays,report);
  root.append(head,briefing,stage,dock);container.replaceChildren(root);
  let step=0,chosen=false,origin=false,travel=null,dead=false;
  const placed=new Set(),links=new Set();
  const say=(msg,wrong=false)=>{report.textContent=msg;report.classList.toggle('fb-error',wrong);};
  function go(message){
    step++;chosen=false;origin=false;paint();
    say(message);
    if(step<lessons.length)briefTitle.focus({preventScroll:true});
  }
  function place(i){
    const l=lessons[step];if(!l||l.kind!=='place')return;
    if(!chosen){say('Primeiro escolha '+pieces[l.target].name+' na bandeja abaixo da mesa.',true);return;}
    if(i!==l.target){say('Coloque '+pieces[l.target].name+' no espaço '+(l.target+1)+', destacado no desenho.',true);return;}
    placed.add(i);go(pieces[i].name+' colocado na mesa.');
  }
  function wire(i,side){
    const l=lessons[step];if(l?.kind!=='wire')return;
    if(!origin){
      if(i!==l.from||side!=='out'){say('Comece pela saída de '+pieces[l.from].name+'. É daí que parte o pedido.',true);return;}
      origin=true;paint();say('Saída selecionada. Toque na entrada de '+pieces[l.target].name+'.');
      board.querySelector('.fb-port.current')?.focus({preventScroll:true});return;
    }
    if(i!==l.target||side!=='in'){say('O pedido sai de '+pieces[l.from].name+' e deve entrar em '+pieces[l.target].name+'. Escolha a entrada destacada.',true);return;}
    links.add(l.from);go('Conexão criada. '+pieces[l.from].name+' pode pedir dados a '+pieces[l.target].name+'.');
  }
  function pickNode(i){
    const l=lessons[step];if(!l)return;
    if(l.kind==='place'){place(i);return;}
    if(l.kind==='wire'){say('Use o botão '+(origin?'Entrada de '+pieces[l.target].name:'Saída de '+pieces[l.from].name)+' junto à peça.',true);return;}
    if(i!==l.target){say(i===l.from?'O pacote já está em '+pieces[i].name+'. Escolha quem o recebe agora.':pieces[i].name+' não recebe esta mensagem. '+l.why,true);return;}
    travel={from:l.from,to:i,text:l.packet};
    go(l.packet+' · '+pieces[l.from].name+' → '+pieces[i].name+'.');
  }
  function choose(i){
    if(lessons[step]?.target!==i||lessons[step]?.kind!=='place')return;
    chosen=true;paint();say(pieces[i].name+' selecionado. Toque no espaço '+(i+1)+' da mesa.');
    board.querySelector('.fb-slot.current .fb-piece')?.focus({preventScroll:true});
  }
  function port(i,side){
    const l=lessons[step],name=(side==='in'?'Entrada de ':'Saída de ')+pieces[i].name;
    const current=(!origin&&side==='out'&&l.from===i)||(origin&&side==='in'&&l.target===i);
    const b=button(side==='in'?'Entrada':'Saída','fb-port '+(current?'current':''),()=>wire(i,side));
    b.setAttribute('aria-label',name);return b;
  }
  function drawBoard(){
    board.replaceChildren();const l=lessons[step];
    for(let i=0;i<3;i++){
      const isPlaced=placed.has(i),active=l?.kind==='place'&&l.target===i;
      const slot=el('div','fb-slot'+(active?' current':'')+(!isPlaced?' empty':'')+(l?.kind==='trace'&&l.from===i?' fb-sender':''));
      const face=button('','fb-piece',()=>pickNode(i));
      if(isPlaced){face.append(glyph(i),el('strong','',pieces[i].name),el('small','',pieces[i].role));face.setAttribute('aria-label',pieces[i].name+' · '+pieces[i].role);}
      else {face.append(el('span','fb-slotno',String(i+1).padStart(2,'0')),el('strong','','Espaço '+(i+1)));face.setAttribute('aria-label','Espaço '+(i+1)+' da mesa');}
      if(!l)face.disabled=true;
      slot.append(face);
      if(l?.kind==='wire'&&isPlaced){const ports=el('div','fb-ports');if(i>0)ports.append(port(i,'in'));if(i<2)ports.append(port(i,'out'));slot.append(ports);}
      board.append(slot);
      if(i<2){
        const wire=el('div','fb-wire'+(links.has(i)?' linked':''));
        if(links.has(i)){const arrow=el('span','fb-arrow','→');arrow.setAttribute('aria-label','Pedido da peça '+(i+1)+' para a peça '+(i+2));wire.append(arrow);}
        if(travel&&Math.min(travel.from,travel.to)===i){const packet=el('span','fb-packet'+(travel.to<travel.from?' reverse':''),'');packet.setAttribute('aria-hidden','true');wire.append(packet);}
        board.append(wire);
      }
    }
  }
  function paint(){
    if(dead)return;
    const l=lessons[step];
    progress.replaceChildren();['Peças','Conexões','Percurso'].forEach((title,i)=>{const done=!l||step>=[3,5,9][i];const li=el('li',done?'done':l.phase===title?'current':'',title);if(l?.phase===title)li.setAttribute('aria-current','step');progress.append(li);});
    briefTitle.textContent=l?.name||'As duas faixas chegaram ao cliente';
    why.textContent=l?.why||'Você montou Cliente → API → PostgreSQL. O pedido levou o número do álbum até o banco. Na volta, os registros passaram pela API e viraram a lista que o ouvinte vê.';
    action.textContent=l?.act||'Agora você vai escolher como essa arquitetura deve mudar quando a carga aumenta.';
    count.textContent=l?'Passo '+(step+1)+' de '+lessons.length:'Percurso completo';
    drawBoard();trays.replaceChildren();
    if(!l){dockTitle.textContent='Montagem concluída';trays.append(button('Pensar como arquiteto','fb-primary',onDone),button('Refazer montagem','fb-secondary',()=>{step=0;chosen=origin=false;travel=null;placed.clear();links.clear();paint();say('Mesa reiniciada.');}));return;}
    if(l.kind==='place'){
      dockTitle.textContent='Bandeja de peças';const b=button('','fb-tray'+(chosen?' chosen':''),()=>choose(l.target));b.setAttribute('aria-pressed',String(chosen));b.append(glyph(l.target),el('strong','',pieces[l.target].name));
      trays.append(b,el('span','fb-tray-hint',chosen?'Selecionado · coloque na mesa':'Selecione a peça para posicionar'));
    }else if(l.kind==='wire'){dockTitle.textContent='Conexão em construção';trays.append(el('span','fb-route',pieces[l.from].name+' → '+pieces[l.target].name),el('span','fb-tray-hint',origin?'Escolha a entrada de destino':'Escolha a porta de saída'));}
    else{dockTitle.textContent='Mensagem em trânsito';trays.append(el('span','fb-route',l.packet),el('span','fb-tray-hint','Partida · '+pieces[l.from].name));}
  }
  paint();return {destroy(){dead=true;root.remove();}};
}

