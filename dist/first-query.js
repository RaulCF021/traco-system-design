const tracks = ['Maré de dentro', 'Farol das seis', 'Rua do sal'];

const steps = [
  { title:'Abra um álbum', copy:'Você está num aplicativo de música. A capa já apareceu na tela, mas os nomes das faixas ainda precisam ser buscados. Toque na capa para abrir o álbum.', phase:'Antes do toque', active:[], packet:'Nenhum pedido enviado.', origin:'Ouvinte', recipient:'Aplicativo' },
  { title:'O cliente pede as faixas', copy:'O aplicativo no seu celular é o cliente. Ele sabe qual álbum você abriu e envia o número 42 à API, a porta de entrada do serviço. Assim, o serviço sabe de qual disco você quer a lista.', phase:'Pedido do cliente', active:['client'], packet:'Quais são as faixas do álbum 42?', origin:'Cliente', recipient:'API', action:'Entregar o pedido à API' },
  { title:'A API consulta o catálogo', copy:'A API recebeu o número 42. Ela precisa dos nomes e da ordem das músicas. Para encontrá-los, pede ao banco de dados os registros desse álbum, ordenados pelo número da faixa.', phase:'Consulta ao catálogo', active:['api'], packet:'Buscar as faixas do álbum 42 em ordem.', origin:'API', recipient:'Banco', action:'Consultar o banco' },
  { title:'O banco encontra três faixas', copy:'O banco guarda o catálogo. Ele seleciona os três registros ligados ao álbum 42 e devolve a lista à API. A API prepara a resposta que o aplicativo consegue ler.', phase:'Registros encontrados', active:['db'], origin:'Banco', recipient:'API', action:'Devolver a lista ao aplicativo' },
  { title:'A resposta chega ao cliente', copy:'A API devolveu os títulos na ordem certa. Com esses dados, o aplicativo preenche a tela do álbum. Você já pode ler os nomes. Reproduzir o áudio seria outro pedido.', phase:'Resposta entregue', active:['client'], packet:'Álbum 42 · 3 faixas recebidas', origin:'API', recipient:'Cliente', action:'Verificar o que aprendi' },
];

const question = 'Seu amigo abre outro álbum. Qual informação permite buscar as faixas certas?';
const answers = [
  ['O número que identifica o álbum escolhido.', 'Isso mesmo. O cliente envia o identificador do álbum e a API o usa para consultar os registros correspondentes no banco.'],
  ['A quantidade de músicas que aparecem na tela.', 'Dois álbuns podem ter o mesmo número de faixas. Pense no dado que o cliente enviou antes de saber quantas músicas havia.'],
  ['O nome do aplicativo instalado no celular.', 'O aplicativo é o mesmo ao abrir discos diferentes. Pense no dado que muda quando você escolhe outro álbum.'],
];
const icons = {
  client:'<rect x="8" y="3" width="16" height="26" rx="3"/><path d="M13 7h6m-5 18h4"/>',
  api:'<path d="m10 9-7 7 7 7m12-14 7 7-7 7m-4-18-4 22"/>',
  db:'<ellipse cx="16" cy="7" rx="11" ry="4"/><path d="M5 7v17c0 5.5 22 5.5 22 0V7M5 15c0 5.5 22 5.5 22 0"/>',
};
function icon(type) {
  return '<svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[type]+'</svg>';
}
function list() {
  return '<ol class="fq-tracks">'+tracks.map(name=>'<li>'+name+'</li>').join('')+'</ol>';
}
function cover() {
  return '<span class="fq-cover" aria-hidden="true"><span>Pista Sul</span><strong>Maré<br>inversa</strong></span>';
}

export function mountFirstQuery(container, onDone) {
  if(!document.querySelector('link[data-first-query]')) {
    const sheet=document.createElement('link');
    sheet.rel='stylesheet';sheet.href=new URL('./first-query.css',import.meta.url).href;
    sheet.dataset.firstQuery='';document.head.append(sheet);
  }
  const root=document.createElement('section');root.className='fq-prologue';
  root.setAttribute('aria-label','Sua primeira consulta');container.replaceChildren(root);
  let index=0, correct=false, choice=null;
  function render(moveFocus=false) {
    const quiz=index===steps.length;
    const s=steps[Math.min(index,steps.length-1)];
    const layout=[
      '<header class="fq-head"><div><small>Prólogo interativo</small><h1>Sua primeira consulta</h1></div><p>Etapa '+(index+1)+' de 6</p></header>',
      '<div class="fq-stage"><div class="fq-album"><span class="fq-cap">Tela do ouvinte</span>',
      index===0?'<button class="fq-open" type="button" data-action="next" aria-label="Abrir o álbum Maré inversa">'+cover()+'<span>Abrir álbum <span aria-hidden="true">↗</span></span></button>':cover(),
      index===0?'':'<strong>Maré inversa</strong><small>Pista Sul · álbum 42</small>',
      index>=4?list():index>0?'<p class="fq-pending">Aguardando as faixas…</p>':'',
      '</div><div class="fq-network"><div class="fq-path" aria-label="Participantes da consulta">',
    ];
    const direction=index===3||index===4?'←':'→';
    for(const [i,[key,label]] of [['client','Cliente'],['api','API'],['db','Banco']].entries()) {
      if(i)layout.push('<span aria-hidden="true" class="fq-wire">'+direction+'</span>');
      layout.push('<div class="fq-node'+(!quiz&&s.active.includes(key)?' fq-lit':'')+'">'+icon(key)+'<span>'+label+'</span></div>');
    }
    layout.push('</div><div class="fq-packet"><span class="fq-cap">'+s.phase+'</span><strong>'+s.origin+' <span aria-hidden="true">→</span> '+s.recipient+'</strong>',
      index===3?list():'<p>'+s.packet+'</p>','</div></div></div>');
    if(quiz) {
      layout.push('<div class="fq-dock"><h2 tabindex="-1">Confira o que aprendeu</h2><fieldset><legend>'+question+'</legend>',
        ...answers.map(([text],i)=>'<label class="fq-answer"><input name="fq-answer" type="radio" value="'+i+'" '+(choice===i?'checked':'')+' '+(correct?'disabled':'')+'>'+text+'</label>'),
        '</fieldset><p role="status" class="fq-feedback">'+(choice===null?'':answers[choice][1])+'</p><div class="fq-actions"><button type="button" class="fq-secondary" data-action="reset">Refazer o percurso</button>',
        correct?'<button type="button" class="fq-primary" data-action="done">Continuar <span aria-hidden="true">→</span></button>':'','</div></div>');
    } else {
      layout.push('<div class="fq-dock"><h2 tabindex="-1">'+s.title+'</h2><p>'+s.copy+'</p><div class="fq-actions">',
        index>0?'<button type="button" class="fq-secondary" data-action="prev">Voltar</button>':'',
        s.action?'<button type="button" class="fq-primary" data-action="next">'+s.action+' <span aria-hidden="true">→</span></button>':'','</div></div>');
    }
    root.innerHTML=layout.join('');
    if(moveFocus) root.querySelector('h2').focus({preventScroll:true});
  }
  function click(event) {
    const button=event.target.closest('[data-action]');
    if(!button || !root.contains(button)) return;
    switch(button.dataset.action) {
      case 'next':index=Math.min(index+1,steps.length);break;
      case 'prev':index=Math.max(0,index-1);break;
      case 'reset':index=0;choice=null;correct=false;break;
      case 'done':if(correct)onDone?.();return;
      default:return;
    }
    render(true);
    if(index===0)root.querySelector('.fq-open').focus();
  }
  function select(event) {
    if(event.target.name!=='fq-answer'||correct)return;
    choice=Number(event.target.value);correct=choice===0;
    if(correct) {
      const feedback=root.querySelector('.fq-feedback');
      feedback.textContent=answers[choice][1];
      root.querySelectorAll('.fq-answer input').forEach(r=>r.disabled=true);
      const next=document.createElement('button');next.type='button';next.className='fq-primary';
      next.dataset.action='done';next.textContent='Continuar →';root.querySelector('.fq-actions').append(next);
      next.focus({preventScroll:true});
    } else root.querySelector('.fq-feedback').textContent=answers[choice][1];
  }
  root.addEventListener('click',click);root.addEventListener('change',select);
  render();return {destroy(){root.removeEventListener('click',click);root.removeEventListener('change',select);root.remove();}};
}
