import {catalog} from './model.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 148, H = 76, GRID = 12;
const artwork = {
  client: ['#375c9a','#e7effd','<rect x="4" y="5" width="24" height="16" rx="2"/><path d="M12 26h8m-4-5v5M7 17h18"/>'],
  balance: ['#71468f','#f0e8f7','<rect x="12" y="3" width="8" height="6" rx="1"/><path d="M16 9v6M6 21v-6h20v6"/><rect x="2" y="21" width="8" height="7" rx="1"/><rect x="22" y="21" width="8" height="7" rx="1"/>'],
  cache: ['#ad553a','#fbe9df','<path d="m3 11 13-7 13 7-13 7zM3 16l13 7 13-7M3 21l13 7 13-7"/>'],
  store: ['#306f93','#e4f1f7','<ellipse cx="16" cy="7" rx="10" ry="4"/><path d="M6 7v17c0 5.5 20 5.5 20 0V7M6 14c0 5.5 20 5.5 20 0M6 20c0 5.5 20 5.5 20 0"/>'],
  queue: ['#92641c','#fbefce','<rect x="4" y="8" width="5" height="16" rx="1"/><rect x="13" y="8" width="5" height="16" rx="1"/><path d="M23 16h7m-4-4 4 4-4 4"/>'],
  edge: ['#287363','#dcf3ec','<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M6 10h20M6 22h20"/>'],
  bucket: ['#99662e','#f8ecd7','<ellipse cx="16" cy="7" rx="11" ry="4"/><path d="m5 7 3 17c1 4 15 4 16 0l3-17M12 16h8"/>'],
  service: ['#367763','#e2f2e8','<rect x="4" y="4" width="24" height="10" rx="2"/><rect x="4" y="18" width="24" height="10" rx="2"/><path d="M9 9h1m4 0h1m-6 14h1m4 0h1"/>'],
  worker: ['#866344','#f5eadd','<rect x="8" y="8" width="16" height="16" rx="3"/><path d="M12 3v5m8-5v5m-8 16v5m8-5v5M3 12h5m-5 8h5m16-8h5m-5 8h5m-15-7h6v6h-6z"/>'],
  search: ['#685aa0','#eeeafa','<circle cx="13" cy="13" r="8"/><path d="m19 19 8 8"/>'],
};
const tools = {minus:'<path d="M7 16h18"/>',plus:'<path d="M6 16h20M16 6v20"/>',fit:'<path d="M4 12V4h8m8 0h8v8m0 8v8h-8m-8 0H4v-8"/>',undo:'<path d="m11 5-7 7 7 7M5 12h14c11 0 11 15 1 15"/>',close:'<path d="m8 8 16 16m0-16L8 24"/>',arrow:'<path d="M4 16h23m-8-8 8 8-8 8"/>',link:'<circle cx="7" cy="23" r="4"/><circle cx="25" cy="7" r="4"/><path d="m10 20 12-10"/>',grid:'<rect x="4" y="4" width="9" height="9" rx="1"/><rect x="19" y="4" width="9" height="9" rx="1"/><rect x="4" y="19" width="9" height="9" rx="1"/><rect x="19" y="19" width="9" height="9" rx="1"/>'};
function icon(path) { return '<svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>'; }
function styleFor(type) {
  const name=(type+' '+catalog[type]?.name).toLowerCase();
  const key=[[/cliente|client|browser|usuário|device/,'client'],[/balanc|gateway|proxy/,'balance'],[/redis|cache/,'cache'],[/bucket|object|objeto|blob|storage/,'bucket'],[/sql|database|banco|cassandra|mongo|persist|dynamo/,'store'],[/kafka|queue|fila|stream|broker|mensager/,'queue'],[/cdn|dns|edge/,'edge'],[/worker|processador|consumidor/,'worker'],[/busca|search|índice/,'search']].find(([re])=>re.test(name));
  return artwork[key?.[1] || 'service'];
}
function element(tag, cls, content) {const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
function button(label, glyph, action, cls='') {const b=element('button','te-button '+cls);b.type='button';b.title=label;b.setAttribute('aria-label',label);if(glyph)b.innerHTML=icon(glyph);else b.textContent=label;b.addEventListener('click',action);return b;}
function emblem(type){const [ink,bg,path]=styleFor(type);const e=element('span','te-emblem');e.style.setProperty('--te-ink',ink);e.style.setProperty('--te-tint',bg);e.innerHTML=icon(path);return e;}
function clone(value){return JSON.parse(JSON.stringify(value));}
function snap(value){return Math.max(0,Math.round(value/GRID)*GRID);}
function edgeCurve(a,b){
  const ac={x:a.x+W/2,y:a.y+H/2},bc={x:b.x+W/2,y:b.y+H/2};
  const dx=bc.x-ac.x,dy=bc.y-ac.y;
  if(Math.abs(dx)/W >= Math.abs(dy)/H || Math.abs(dx)>W+16){
    const dir=dx>=0?1:-1, x1=ac.x+dir*W/2,x2=bc.x-dir*(W/2+5),m=Math.max(18,Math.abs(x2-x1)*.49);
    return 'M '+x1+' '+ac.y+' C '+(x1+dir*m)+' '+ac.y+', '+(x2-dir*m)+' '+bc.y+', '+x2+' '+bc.y;
  }
  const dir=dy>=0?1:-1, y1=ac.y+dir*H/2,y2=bc.y-dir*(H/2+5),m=Math.max(16,Math.abs(y2-y1)*.49);
  return 'M '+ac.x+' '+y1+' C '+ac.x+' '+(y1+dir*m)+', '+bc.x+' '+(y2-dir*m)+', '+bc.x+' '+y2;
}
let instance=0;
export function mountEditor(container, initialGraph, onChange=()=>{}){
  const graph=clone(initialGraph), history=[], uid='te-'+(++instance);
  let selected=null,source=null,zoom=1,autoFit=true,offsetX=16,offsetY=16,drag=null,ignoreClick=false;
  const root=element('section','te-editor');root.setAttribute('aria-label','Editor da arquitetura');
  const bar=element('div','te-bar'),title=element('strong','te-title','Topologia'),counter=element('span','te-count'),toolsBar=element('div','te-tools'),percent=element('span','te-percent');
  const undo=button('Desfazer última alteração',tools.undo,undoLast),fitBtn=button('Enquadrar arquitetura',tools.fit,fit);
  toolsBar.append(undo,element('i','te-divider'),button('Diminuir zoom',tools.minus,()=>setZoom(zoom/1.2)),percent,button('Aumentar zoom',tools.plus,()=>setZoom(zoom*1.2)),fitBtn);
  bar.append(title,counter,toolsBar);
  const viewport=element('div','te-viewport'),extent=element('div','te-extent'),world=element('div','te-world'),svg=document.createElementNS(NS,'svg'),layer=element('div','te-nodes');
  svg.classList.add('te-wires');svg.setAttribute('aria-hidden','true');world.append(svg,layer);extent.append(world);viewport.append(extent);
  const info=element('div','te-info'),notice=element('div','te-notice');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const lib=element('section','te-library'),libHead=element('div','te-lib-head'),libTitle=element('strong','','Componentes'),libHint=element('small','','Arraste ou clique para adicionar'),palette=element('div','te-palette');
  libHead.append(libTitle,libHint);lib.append(libHead,palette);
  for(const [type,data] of Object.entries(catalog)){
    const card=button(data.name,null,()=>add(type));card.className='te-part';card.replaceChildren(emblem(type),element('span','',data.name));card.title=data.description;card.draggable=true;
    card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/x-traco-component',type);e.dataTransfer.effectAllowed='copy';});palette.append(card);
  }
  root.append(bar,viewport,notice,info,lib);container.replaceChildren(root);
  function checkpoint(){history.push(clone(graph));if(history.length>70)history.shift();}
  function change(msg){draw();onChange(clone(graph));if(msg)notice.textContent=msg;}
  function undoLast(){const prev=history.pop();if(!prev)return;Object.assign(graph,prev);selected=source=null;change('Alteração desfeita.');}
  function getBounds(){return {w:Math.max(0,...graph.nodes.map(n=>n.x+W)),h:Math.max(0,...graph.nodes.map(n=>n.y+H))};}
  function size(){const {w,h}=getBounds(),vw=viewport.clientWidth,vh=viewport.clientHeight;
    offsetX=Math.max(14,(vw-w*zoom)/2);const minY=graph.nodes.length?Math.min(...graph.nodes.map(n=>n.y)):0;offsetY=Math.max(14-minY*zoom,(vh-(h+minY)*zoom)/2);
    world.style.width=(w+30)+'px';world.style.height=(h+30)+'px';world.style.transform='translate('+offsetX+'px,'+offsetY+'px) scale('+zoom+')';
    extent.style.width=Math.max(vw,offsetX+w*zoom+14)+'px';extent.style.height=Math.max(vh,offsetY+h*zoom+14)+'px';percent.textContent=Math.round(zoom*100)+'%';
  }
  function fit(){autoFit=true;const {w,h}=getBounds();zoom=Math.max(.32,Math.min(1.12,(viewport.clientWidth-28)/Math.max(w,1),(viewport.clientHeight-32)/Math.max(h,1)));size();viewport.scrollTo(0,0);}
  function setZoom(z){autoFit=false;zoom=Math.min(2,Math.max(.32,z));size();}
  function coords(e){const r=viewport.getBoundingClientRect();return {x:(e.clientX-r.left+viewport.scrollLeft-offsetX)/zoom,y:(e.clientY-r.top+viewport.scrollTop-offsetY)/zoom};}
  function add(type,point){
    if(!Object.hasOwn(catalog,type))return;
    let x,y;
    if(point){x=snap(point.x-W/2);y=snap(point.y-H/2);}
    else {let slot=0;do{x=24+slot%3*192;y=30+Math.floor(slot/3)*120;slot++;}while(graph.nodes.some(n=>Math.abs(n.x-x)<W+8&&Math.abs(n.y-y)<H+8));}
    checkpoint();const id=globalThis.crypto?.randomUUID?.() || 'n'+Date.now()+Math.random().toString(36).slice(2);graph.nodes.push({id,type,x,y,replicas:1});selected=id;source=null;change(catalog[type].name+' adicionado.');if(autoFit)fit();
  }
  viewport.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/x-traco-component')){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
  viewport.addEventListener('drop',e=>{const type=e.dataTransfer.getData('text/x-traco-component');if(type){e.preventDefault();add(type,coords(e));}});
  function pick(id){
    if(!source){selected=id;notice.textContent='';draw();return;}
    if(source===id){source=null;draw();return;}
    if(graph.edges.some(e=>e.from===source&&e.to===id)){notice.textContent='Essa conexão já existe.';return;}
    const explored=new Set();function reaches(node){if(node===source)return true;if(explored.has(node))return false;explored.add(node);return graph.edges.some(e=>e.from===node&&reaches(e.to));}
    if(reaches(id)){notice.textContent='A conexão fecharia um ciclo. Escolha um destino adiante no fluxo.';return;}
    checkpoint();graph.edges.push({from:source,to:id});source=null;selected=id;change('Conexão criada.');
  }
  function connect(id){source=source===id?null:id;selected=id;notice.textContent=source?'Selecione o componente que recebe as requisições.':'';draw();}
  function removeNode(n){checkpoint();graph.nodes=graph.nodes.filter(v=>v.id!==n.id);graph.edges=graph.edges.filter(e=>e.from!==n.id&&e.to!==n.id);selected=source=null;change(catalog[n.type].name+' removido.');}
  function removeEdge(edge){checkpoint();graph.edges=graph.edges.filter(e=>e!==edge);change('Conexão removida.');}
  function lines(){
    svg.innerHTML='<defs><marker id="'+uid+'-arrow" markerWidth="7" markerHeight="7" refX="5.2" refY="3.5" orient="auto"><path d="M1 1 L5.6 3.5 L1 6" fill="none" stroke="#638e78" stroke-width="1.4"/></marker></defs>';
    const byId=new Map(graph.nodes.map(n=>[n.id,n]));
    for(const e of graph.edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;
      const p=document.createElementNS(NS,'path');p.setAttribute('d',edgeCurve(a,b));p.setAttribute('class','te-edge');p.setAttribute('marker-end','url(#'+uid+'-arrow)');svg.append(p);
    }
  }
  function inspector(){
    info.replaceChildren();const n=graph.nodes.find(x=>x.id===selected);
    if(!n){info.hidden=true;return;}info.hidden=false;
    const data=catalog[n.type],head=element('div','te-insp-head'),body=element('div','te-insp-body'),copy=element('div','te-insp-copy');
    head.append(emblem(n.type),element('strong','',data.name),button('Fechar detalhes',tools.close,()=>{selected=source=null;notice.textContent='';draw();},'te-close'));
    copy.append(element('p','',data.description));const guide=element('a','lesson-help','Entender esta peça passo a passo');guide.href='#pecas/'+n.type;copy.append(guide);body.append(copy);
    if(Number.isFinite(data.capacity)){const model=element('small','te-spec',data.capacity.toLocaleString('pt-BR')+' req/s por instância · '+data.baseMs+' ms de serviço · '+data.cost+' créditos/h');copy.append(model);} const settings=element('div','te-settings'),replicas=element('div','te-replicas'),less=button('Reduzir instâncias',tools.minus,()=>{checkpoint();n.replicas--;change();}),more=button('Aumentar instâncias',tools.plus,()=>{checkpoint();n.replicas++;change();});
    less.disabled=n.replicas<=1;more.disabled=n.replicas>=32;
    replicas.append(element('span','','Instâncias'),less,element('b','',String(n.replicas)),more);
    settings.append(replicas,button(source?'Cancelar conexão':'Conectar a…',null,()=>connect(n.id),'te-text'),button('Remover',null,()=>removeNode(n),'te-text te-danger'));if(n.type!=='client'){const outage=button(n.offline?'Restabelecer serviço':'Simular falha',null,()=>{checkpoint();n.offline=!n.offline;change(n.offline?'Serviço fora do ar. Simule o tráfego para medir o impacto.':'Serviço restabelecido.');},'te-text');settings.append(outage);}body.append(settings);
    const adjacent=graph.edges.filter(e=>e.from===n.id||e.to===n.id);
    if(adjacent.length){const links=element('div','te-links');for(const e of adjacent){const a=graph.nodes.find(v=>v.id===e.from),b=graph.nodes.find(v=>v.id===e.to);if(!a||!b)continue;const label=catalog[a.type].name+' → '+catalog[b.type].name;const item=element('span','te-link');item.append(element('span','',label),button('Remover conexão '+label,tools.close,()=>removeEdge(e)));links.append(item);}body.append(links);}
    info.append(head,body);
  }
  function draw(){
    layer.replaceChildren();counter.textContent=graph.nodes.length+(graph.nodes.length===1?' bloco · ':' blocos · ')+graph.edges.length+(graph.edges.length===1?' conexão':' conexões');undo.disabled=!history.length;
    root.classList.toggle('te-connecting',!!source);
    if(!graph.nodes.length){const empty=element('p','te-empty','Adicione um componente da biblioteca para começar.');layer.append(empty);}
    for(const n of graph.nodes){const d=catalog[n.type];if(!d)continue;
      const card=element('div','te-node'+(selected===n.id?' te-selected':'')+(source===n.id?' te-source':''));card.style.left=n.x+'px';card.style.top=n.y+'px';card.dataset.id=n.id;
      const face=button(d.name,null,()=>{if(!ignoreClick)pick(n.id);});face.className='te-node-face';face.replaceChildren();
      face.setAttribute('aria-label',d.name+', '+n.replicas+' instâncias. Abrir detalhes');
      const line=element('div','te-node-top'),tag=element('span','te-node-tag',n.offline?'OFF':'×'+n.replicas);line.append(emblem(n.type),tag);face.append(line,element('strong','te-node-name',d.name));
      const port=button('Conectar a partir de '+d.name,null,()=>connect(n.id));port.className='te-port';port.textContent='';card.append(face,port);layer.append(card);
      face.addEventListener('pointerdown',e=>{if(e.button!==0||source)return;drag={id:n.id,n,card,face,pid:e.pointerId,sx:e.clientX,sy:e.clientY,ox:n.x,oy:n.y,moved:false};face.setPointerCapture(e.pointerId);});
      face.addEventListener('pointermove',e=>{if(!drag||drag.pid!==e.pointerId||drag.id!==n.id)return;const dx=(e.clientX-drag.sx)/zoom,dy=(e.clientY-drag.sy)/zoom;
        if(!drag.moved&&Math.hypot(dx,dy)<4)return;
        if(!drag.moved){checkpoint();drag.moved=true;card.classList.add('te-moving');}
        n.x=snap(drag.ox+dx);n.y=snap(drag.oy+dy);card.style.left=n.x+'px';card.style.top=n.y+'px';lines();
      });
      const done=e=>{if(!drag||drag.id!==n.id||e.pointerId!==drag.pid)return;const moved=drag.moved;drag=null;if(moved){ignoreClick=true;change();setTimeout(()=>ignoreClick=false,0);}};
      face.addEventListener('pointerup',done);face.addEventListener('pointercancel',done);
      face.addEventListener('keydown',e=>{const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!dirs[e.key])return;e.preventDefault();checkpoint();n.x=snap(n.x+dirs[e.key][0]*GRID);n.y=snap(n.y+dirs[e.key][1]*GRID);change();[...layer.querySelectorAll('.te-node')].find(el=>el.dataset.id===n.id)?.querySelector('button')?.focus();});
    }
    lines();size();inspector();
  }
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=source=null;notice.textContent='';draw();}});
  viewport.addEventListener('click',e=>{if(!e.target.closest('.te-node')&&!ignoreClick){selected=source=null;notice.textContent='';draw();}});
  draw();fit();const observer=new ResizeObserver(()=>{if(autoFit)fit();else size();});observer.observe(viewport);
  return {destroy(){observer.disconnect();root.remove();},getGraph:()=>clone(graph),fit};
}


