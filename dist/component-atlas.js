import {catalog} from './model.js';
import {foundations} from './foundations.js';

const groups=[
 ['Comece por aqui','Quem pede, quem responde e onde o dado fica guardado?',['client','api','postgres']],
 ['Entrada e proteção','Como encaminhar, identificar ou limitar um pedido?',['proxy','gateway','auth','limiter','lb']],
 ['Reutilização e entrega','Como evitar buscar a mesma resposta várias vezes?',['redis','cdn']],
 ['Trabalho em segundo plano','Quem espera pelo trabalho e quem o executa?',['queue','worker','broker']],
 ['Armazenamento e consulta','Você precisa de um arquivo, uma chave, uma busca, um histórico ou um relatório?',['storage','nosql','search','timeseries','warehouse']]
];
const jobs={
 client:'Inicia o pedido e usa a resposta.',api:'Define como pedir algo a um serviço.',postgres:'Guarda registros relacionados em tabelas.',
 proxy:'Recebe o pedido em nome de um serviço e o encaminha.',gateway:'Oferece uma entrada para várias APIs.',auth:'Verifica a identidade de quem pede acesso.',limiter:'Limita quantos pedidos podem passar em certo intervalo.',lb:'Divide o tráfego entre destinos disponíveis.',
 redis:'Reutiliza respostas frequentes em memória.',cdn:'Entrega cópias de conteúdo perto de quem o acessa.',
 queue:'Guarda tarefas até que alguém possa processá-las.',worker:'Executa tarefas fora do caminho da resposta imediata.',broker:'Entrega um evento a vários assinantes interessados.',
 storage:'Guarda arquivos como imagens e documentos.',nosql:'Localiza um registro pela chave.',search:'Encontra itens por texto ou termo indexado.',timeseries:'Organiza medições pela hora em que aconteceram.',warehouse:'Reúne dados para análises e relatórios.'
};
const aliases={postgres:'bd banco relacional sql database transação',auth:'login autenticação identidade',limiter:'limite taxa rate limiting cota',lb:'distribuir carga balanceador load balancer',broker:'mensageria publicação assinatura pub sub eventos',queue:'fila processamento assíncrono',timeseries:'série temporal métricas sensores',warehouse:'data warehouse analítico BI relatório',redis:'cache memória',cdn:'borda edge',storage:'arquivos objeto bucket',api:'backend aplicação',client:'cliente navegador celular'};
const caseParts={loja:['client','api','postgres','redis'],agenda:['client','api','postgres','lb'],documentos:['api','queue','worker','storage'],mapas:['client','cdn','storage']};
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const componentCount=()=>Object.keys(catalog).length;

export function componentShelf(id){
 const box=document.createElement('section');box.className='part-shelf';
 box.innerHTML='<div><h2>Componentes deste projeto</h2><a href="#pecas">Ver todos os '+componentCount()+' componentes</a></div><ul></ul>';
 const list=box.querySelector('ul');
 for(const key of caseParts[id]||caseParts.loja){
  const li=document.createElement('li'),a=document.createElement('a');a.href='#pecas/'+key;a.textContent=foundations[key].name;
  li.append(a,document.createTextNode(' · '+jobs[key]));list.append(li);
 }
 return box;
}

export function componentAtlas(root,state){
 root.innerHTML='<article class="atlas"><div class="atlas-head"><p>Guia de arquitetura</p><h1>Componentes de um sistema</h1><p>Explore as '+componentCount()+' peças que você pode montar no simulador. Cada aula explica a função, quando usar, quando evitar e como testar a peça em um desenho real.</p><label>Buscar componente ou função<input type="search" placeholder="Ex.: banco, login, guardar arquivos"></label></div><div class="atlas-content"><p class="atlas-count" role="status"></p><div class="atlas-groups"></div></div></article>';
 const input=root.querySelector('input'),results=root.querySelector('.atlas-groups'),count=root.querySelector('.atlas-count');
 function draw(){
  const words=norm(input.value.trim()).split(/\s+/).filter(Boolean);let total=0;results.replaceChildren();
  for(const [title,question,keys] of groups){
   const matches=keys.filter(k=>words.every(w=>norm([title,question,k,catalog[k].name,foundations[k].name,aliases[k]||'',jobs[k],foundations[k].what].join(' ')).includes(w)));
   if(!matches.length)continue;
   const section=document.createElement('section');section.innerHTML='<h2>'+title+'</h2><p>'+question+'</p><ul></ul>';
   for(const k of matches){
    const li=document.createElement('li');li.innerHTML='<div><a href="#pecas/'+k+'">'+foundations[k].name+'</a><p>'+jobs[k]+'</p></div><a class="atlas-lab" href="#ensaio/'+k+'" aria-label="Abrir ensaio de '+catalog[k].name+'">Ensaio no grid</a>';section.querySelector('ul').append(li);total++;
   }
   results.append(section);
  }
  count.textContent=words.length?(total===1?'1 componente encontrado':total+' componentes encontrados'):'';
  if(!total){const clear=document.createElement('button');clear.textContent='Limpar busca';clear.onclick=()=>{input.value='';draw();input.focus()};results.append(clear)}
 }
 input.oninput=draw;draw();
}
