const postgresSource = {
  title: 'PostgreSQL · Chaves e restrições de integridade',
  url: 'https://www.postgresql.org/docs/current/ddl-constraints.html'
};
const redisSource = {
  title: 'Redis · Cache-aside e invalidação',
  url: 'https://redis.io/docs/latest/develop/use-cases/cache-aside/'
};
const loadSource = {
  title: 'HAProxy · Distribuição entre servidores',
  url: 'https://www.haproxy.com/documentation/haproxy-configuration-tutorials/proxying-essentials/configuration-basics/backends/'
};

function node(type, x, y = 100, replicas = 1, id = type) {
  return { id, type, x, y, replicas };
}

function graph(nodes, pairs) {
  return { nodes, edges: pairs.map(([from, to]) => ({ from, to })) };
}

const catalogGraph = (complete = true) => graph(
  [node('client', 40), node('api', 260), node('postgres', 480)],
  complete ? [['client', 'api'], ['api', 'postgres']] : [['client', 'api']]
);

function nextNodes(g, id) {
  const targets = new Set(g.edges.filter(e => e.from === id).map(e => e.to));
  return g.nodes.filter(n => targets.has(n.id));
}

// A disconnected example path must never satisfy a mission. Walk from the clients
// and keep branching only along edges whose endpoints have the requested types.
function endsOf(g, ...types) {
  let frontier = g.nodes.filter(n => n.type === types[0]);
  for (const type of types.slice(1)) {
    const next = new Set(frontier.flatMap(n => nextNodes(g, n.id)).filter(n => n.type === type));
    frontier = [...next];
  }
  return frontier;
}

const path = (...types) => g => endsOf(g, ...types).length > 0;
const served = target => (_, r) => (r?.throughput ?? 0) >= target;
const goal = (text, test) => ({ text, test });
const originLoad = (types, ceiling) => (g, r) => {
  const ends = endsOf(g, ...types);
  const demands = ends.map(n => r?.nodes?.[n.id]?.demand);
  return ends.length > 0 && demands.every(Number.isFinite) &&
    demands.reduce((a, b) => a + b, 0) > 0 &&
    demands.reduce((a, b) => a + b, 0) <= ceiling + 0.01;
};

export const lessons = [
  {
    id: 'catalogo', title: 'Catálogo de discos', subtitle: 'O caminho de uma consulta',
    level: 'Inicial', minutes: 4, load: 300, concept: 'Cliente, API e persistência',
    brief: 'Uma loja de discos digitalizou seu acervo. Ao abrir um álbum, o cliente pede à API a lista de faixas. Os registros já estão no PostgreSQL. Complete o caminho para que as 300 consultas por segundo cheguem ao acervo.',
    graph: catalogGraph(false),
    goals: [
      goal('Enviar consultas do cliente à API', path('client', 'api')),
      goal('Ligar a API ao PostgreSQL', path('client', 'api', 'postgres')),
      goal('Entregar 300 consultas/s ao banco', (g, r) => served(300)(g, r) &&
        endsOf(g, 'client', 'api', 'postgres').some(n => r?.nodes?.[n.id]?.demand >= 300))
    ],
    hints: [
      'Leia a seta como “solicita a”. A consulta nasce no cliente e chega primeiro à API.',
      'Conecte a saída da API à entrada do PostgreSQL. A resposta percorre o caminho de volta automaticamente.',
      'A API pode responder sozinha em um serviço sem estado. Para este catálogo, a missão também exige que a consulta alcance o banco. Uma chave estrangeira pode vincular cada faixa ao álbum correto.'
    ],
    sources: [postgresSource]
  },
  {
    id: 'leituras', title: 'O álbum mais ouvido', subtitle: 'Leituras repetidas e cache',
    level: 'Inicial', minutes: 7, load: 700, concept: 'Cache-aside',
    brief: 'Um lançamento concentra 700 consultas/s nos mesmos álbuns. O banco atende 450/s. Preserve a fonte de dados e faça as consultas repetidas encontrarem uma cópia em memória. No exercício, o cache aquecido atende 80% das leituras.',
    graph: catalogGraph(),
    goals: [
      goal('Consultar Redis antes de recorrer ao PostgreSQL', path('client', 'api', 'redis', 'postgres')),
      goal('Manter o banco em até 150 consultas/s', originLoad(['client', 'api', 'redis', 'postgres'], 150)),
      goal('Atender as 700 consultas/s', served(700))
    ],
    hints: [
      'Observe a carga antes de editar. Acrescentar réplicas de API ajuda quando a API satura. Aqui o limite está no banco.',
      'Remova a ligação direta API → PostgreSQL. Monte API → Redis → PostgreSQL. A última seta representa a consulta que a aplicação faz quando o cache não tem o álbum.',
      'Com 80% de acertos, apenas 140 das 700 leituras/s chegam ao banco. Em produção, a aplicação também precisa expirar ou invalidar a cópia quando alguém editar o álbum.'
    ],
    sources: [redisSource]
  },
  {
    id: 'balanceamento', title: 'Abertura dos portões', subtitle: 'Distribuição de tráfego',
    level: 'Intermediário', minutes: 8, load: 1400, concept: 'Escala horizontal',
    brief: 'A API sem estado de um festival valida passes assinados. Cada instância suporta 800 validações/s, e a abertura exige 1.400/s. Encaminhe as chamadas por um balanceador e distribua o trabalho entre pelo menos duas instâncias.',
    graph: graph([node('client', 40), node('lb', 260), node('api', 480)], [['client', 'lb'], ['lb', 'api']]),
    goals: [
      goal('Receber tráfego pelo balanceador', path('client', 'lb', 'api')),
      goal('Distribuir validações entre pelo menos duas instâncias de API', g =>
        endsOf(g, 'client', 'lb').some(balancer =>
          nextNodes(g, balancer.id).filter(n => n.type === 'api').reduce((total, n) => total + Number(n.replicas || 1), 0) >= 2)),
      goal('Concluir 1.400 validações/s', served(1400))
    ],
    hints: [
      'O balanceador escolhe um destino por requisição. Conectar duas dependências diretamente à API expressaria outro comportamento.',
      'Configure duas réplicas na API ou conecte uma segunda API ao mesmo balanceador.',
      'Com dois destinos iguais, cada um recebe cerca de 700/s. A perda de uma instância deixaria 800/s de capacidade para 1.400/s de demanda. Avalie quanto custa manter folga.'
    ],
    sources: [loadSource]
  },
  {
    id: 'netflix', title: 'Netflix · Vídeo na borda', subtitle: 'Um estudo do Open Connect',
    level: 'Intermediário', minutes: 9, load: 6000, concept: 'CDN e origem',
    brief: 'O Open Connect aproxima o vídeo do público com equipamentos em redes de provedores e interconexões. Modele a entrega de 6.000 segmentos/s. Neste recorte didático, uma CDN aquecida atende 90% na borda. A origem supre o restante.',
    graph: graph([node('client', 40), node('storage', 480)], [['client', 'storage']]),
    goals: [
      goal('Buscar segmentos pela CDN, com origem no armazenamento', path('client', 'cdn', 'storage')),
      goal('Limitar a origem a 650 buscas/s', originLoad(['client', 'cdn', 'storage'], 650)),
      goal('Entregar os 6.000 segmentos/s', served(6000))
    ],
    hints: [
      'A origem só suporta 1.500 buscas/s neste laboratório. Coloque uma camada de distribuição entre o espectador e os arquivos de vídeo.',
      'Retire a ligação direta à origem. Conecte Cliente → CDN → Armazenamento e observe o tráfego restante na origem.',
      'A Netflix descreve preenchimento proativo de conteúdo popular nos equipamentos. O modelo usa taxa fixa de acerto e omite BGP, escolha de servidores, bitrate adaptativo e agendamento do preenchimento.'
    ],
    sources: [
      { title: 'Netflix · Open Connect e redes de provedores', url: 'https://openconnect.netflix.com/' },
      { title: 'Netflix · Distribuição e preenchimento de conteúdo (PDF)', url: 'https://openconnect.netflix.com/Open-Connect-Overview.pdf' }
    ]
  },
  {
    id: 'spotify', title: 'Spotify · Eventos de escuta', subtitle: 'Ingestão e processamento assíncrono',
    level: 'Avançado', minutes: 12, load: 700, concept: 'Fila e consumidores',
    brief: 'O Spotify documentou o evento de fim de faixa e uma plataforma de entrega baseada em Pub/Sub. Modele um fluxo de 700 eventos/s até o armazenamento. O recebimento pode ser confirmado assim que a fila aceita a mensagem. Descubra se o processamento acompanha a entrada.',
    graph: graph([node('client', 40), node('api', 260), node('queue', 480), node('worker', 260, 240), node('storage', 480, 240)],
      [['client', 'api'], ['api', 'queue'], ['queue', 'worker'], ['worker', 'storage']]),
    goals: [
      goal('Encaminhar o evento da API até fila, worker e armazenamento', path('client', 'api', 'queue', 'worker', 'storage')),
      goal('Confirmar o recebimento de 700 eventos/s', served(700)),
      goal('Processar o fluxo contínuo sem acumular eventos', (g, r) =>
        path('client', 'api', 'queue', 'worker', 'storage')(g) && served(700)(g, r) && r?.backlog === 0 &&
        endsOf(g, 'client', 'api', 'queue', 'worker', 'storage').some(n => r?.nodes?.[n.id]?.demand >= 700))
    ],
    hints: [
      'Uma confirmação rápida ao cliente pode esconder atraso no processamento. Compare a entrada da fila com a capacidade de quem a consome.',
      'Cada réplica de worker consome 350 eventos/s. Duas acompanham 700/s. Para eliminar um acúmulo anterior, seria preciso consumir acima da taxa de chegada.',
      'O caso real separa tipos de evento em tópicos e pipelines com objetivos próprios. Aqui há um único fluxo. Em produção, um consumidor precisa considerar reentregas para evitar contabilizar a mesma escuta duas vezes.'
    ],
    sources: [
      { title: 'Spotify Engineering · Event Delivery, 2019', url: 'https://engineering.atspotify.com/2019/11/spotifys-event-delivery-life-in-the-cloud' },
      { title: 'Spotify Engineering · Data Platform Explained, 2024', url: 'https://engineering.atspotify.com/2024/05/data-platform-explained-part-ii' }
    ]
  },
  {
    id: 'orcamento', title: 'Plantão de lançamento', subtitle: 'Capacidade com orçamento limitado',
    level: 'Avançado', minutes: 15, load: 1800, concept: 'Capacidade, custo e gargalos',
    brief: 'A pré-venda começa em uma hora. O catálogo precisa suportar 1.800 leituras/s usando até 40 créditos/h. Cada rota passa por balanceamento, API e dados persistentes. Compare o custo de ampliar o banco com o de reduzir as consultas que chegam a ele.',
    graph: graph([node('client', 40), node('lb', 260), node('api', 480), node('postgres', 480, 240)],
      [['client', 'lb'], ['lb', 'api'], ['api', 'postgres']]),
    goals: [
      goal('Servir o catálogo via balanceador, API e banco persistente', g =>
        path('client', 'lb', 'api', 'postgres')(g) || path('client', 'lb', 'api', 'redis', 'postgres')(g)),
      goal('Entregar 1.800 leituras/s com até 450 acessos/s ao banco', (g, r) => served(1800)(g, r) &&
        (originLoad(['client', 'lb', 'api', 'redis', 'postgres'], 450)(g,r) || originLoad(['client', 'lb', 'api', 'postgres'], 450)(g,r))),
      goal('Operar dentro de 40 créditos/h', (_, r) => Number.isFinite(r?.cost) && r.cost <= 40)
    ],
    hints: [
      'Identifique dois limites independentes. Uma API faz até 800 leituras/s e um banco até 450/s. Dobrar apenas uma dessas capacidades deixa o outro gargalo no caminho.',
      'Três réplicas de API fornecem 2.400 leituras/s. Um cache com 80% de acertos encaminha 360 das 1.800 leituras/s ao banco.',
      'O balanceador usa 4 créditos/h, as três APIs usam 18, o Redis usa 5 e o PostgreSQL usa 12. O total chega a 39. Se o cache esfriasse e a taxa de acerto caísse de 80% para 60%, o banco receberia 720 leituras/s e voltaria a saturar.'
    ],
    sources: [redisSource, { title: 'Google SRE · Managing Load', url: 'https://sre.google/workbook/managing-load/' }]
  }
];
