import {catalog} from './model.js';

const recipes={
 client:['client','api'],api:['client','api','postgres'],postgres:['client','api','postgres'],
 redis:['client','api','redis','postgres'],lb:['client','lb','api'],cdn:['client','cdn','storage'],
 storage:['client','api','storage'],queue:['client','api','queue','worker'],worker:['client','queue','worker'],
 gateway:['client','gateway','api'],search:['client','api','search'],nosql:['client','api','nosql']
};
export function pieceWorkspace(type){
 const chain=recipes[type]||recipes.client;
 const nodes=chain.map((type,i)=>({id:'n'+i,type,x:25+i*180,y:80,replicas:1}));
 const edges=nodes.slice(1).map((n,i)=>({from:nodes[i].id,to:n.id}));
 if(type==='lb'){nodes.push({id:'peer',type:'api',x:385,y:200,replicas:1});edges.push({from:'n1',to:'peer'})}
 return {id:'ensaio-'+type,title:'Experimentar '+catalog[type].name,subtitle:'Simule o caminho inicial. Depois mude uma peça, conexão ou réplica e compare os resultados.',graph:{nodes,edges},load:700};
}
export function projectLibrary(root,saved,save,navigate){
 saved.projects??={};
 root.innerHTML='<article class="teach"><div class="teach-head"><h1>Seus projetos de arquitetura</h1><p>Desenhe um sistema para um problema seu. Cada projeto tem um desenho e uma carga salvos neste navegador.</p></div><div class="teach-body"><form class="project-form"><label>O que você quer projetar?<input required maxlength="100" name="name" placeholder="Ex.: reservas de quadras do bairro"></label><label>Qual ação o usuário precisa conseguir fazer?<textarea name="goal" maxlength="500" placeholder="Ex.: consultar horários antes de reservar"></textarea></label><button class="run">Criar projeto no grid vazio</button></form><div id="my-projects"></div></div></article>';
 const list=root.querySelector('#my-projects');
 for(const [key,project] of Object.entries(saved.projects).reverse()){
  const a=document.createElement('a');a.className='teach-link';a.href='#meu/'+key;a.textContent=project.title;list.append(a);
 }
 root.querySelector('form').onsubmit=e=>{
  e.preventDefault();const data=new FormData(e.currentTarget),title=String(data.get('name')).trim();if(!title){e.currentTarget.elements.name.focus();return}
  const key=crypto.randomUUID();saved.projects[key]={title,goal:String(data.get('goal')).trim()};save();navigate('meu/'+key);
 };
}
