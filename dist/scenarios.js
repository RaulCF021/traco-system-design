function route(types, replicas = {}) {
  return {
    nodes: types.map((type, i) => ({
      id: type, type, replicas: replicas[type] ?? 1,
      x: 40 + Math.min(i, 2) * 220, y: i < 3 ? 90 : 235
    })),
    edges: types.slice(1).map((to, i) => ({from: types[i], to}))
  };
}

export const scenarios = {
  loja: {
    title: 'Loja online',
    goal: 'Exibir a ficha de um produto sem sobrecarregar o banco.',
    brief: 'Uma promoção trouxe 700 consultas por segundo. As mesmas descrições de produto se repetem. A tela precisa do título e das medidas do item. Estoque e preço no fechamento da compra têm regras próprias.',
    load: 700, graph: route(['client','api','postgres']),
    experiments: [
      {title:'Descubra onde as consultas param',instruction:'Rode o cenário como está. Compare as 700 consultas recebidas pela API com o volume que o banco consegue terminar.',why:'A API admite 800/s. O PostgreSQL atende 450/s. O serviço entrega 450 fichas/s mesmo com capacidade livre na API.'},
      {title:'Sirva cópias das fichas populares',instruction:'Remova API → PostgreSQL. Adicione Redis e conecte API → Redis → PostgreSQL. Rode de novo com a mesma carga.',why:'O modelo assume 80% de acertos em memória. Das 700 consultas, 560 encontram uma cópia e 140 precisam da fonte. A aplicação real coordena a busca e o preenchimento do cache.'},
      {title:'Compare com uma réplica de leitura',instruction:'Anote o custo do desenho com Redis. Retire Redis, reconecte API → PostgreSQL, configure duas réplicas no banco e simule 700/s.',why:'As duas alternativas atendem 700/s. O banco duplicado custa 30 créditos/h com a API. A alternativa com cache custa 23 e depende da repetição das leituras.'}
    ],
    questions:['Quais campos do produto podem esperar alguns segundos por uma atualização?','O que mudaria se quase todo visitante procurasse um produto diferente?'],
    lifecycle:[
      {title:'Abrir a ficha',text:'O navegador envia à API o identificador do produto que a pessoa escolheu.'},
      {title:'Procurar os dados',text:'Na versão inicial, a API consulta a tabela de produtos. Na variante com cache, procura primeiro a cópia e busca o original se ela faltar.'},
      {title:'Exibir a resposta',text:'A API devolve os campos e o navegador monta a ficha. A confirmação de compra exigiria verificar preço e disponibilidade atualizados. Esta simulação mede apenas leitura.'}
    ]
  },
  agenda:{
    title:'Agenda de consultas',
    goal:'Mostrar horários disponíveis durante a abertura de novas vagas.',
    brief:'Às oito da manhã, 1.400 pessoas por segundo pedem a lista de horários de unidades diferentes. A equipe quer dimensionar a leitura da agenda antes de implementar a reserva de uma vaga.',
    load:1400, graph:route(['client','api','postgres']),
    experiments:[
      {title:'Reparta o tráfego de entrada',instruction:'Rode a versão inicial. Retire Cliente → API, insira um Load balancer entre os dois e aumente a API para duas réplicas. Mantenha uma réplica no banco.',why:'A entrada passa a comportar 1.600/s. O banco continua entregando 450/s. Ampliar o primeiro gargalo revela a capacidade exigida da etapa seguinte.'},
      {title:'Escale as consultas ao banco',instruction:'Com as duas APIs atrás do balanceador, passe o PostgreSQL para três réplicas e simule. Depois experimente quatro réplicas.',why:'Três réplicas oferecem 1.350 leituras/s, ainda 50 abaixo da entrada. Quatro fornecem 1.800/s e a rota passa a entregar os 1.400 horários/s pedidos.'},
      {title:'Examine a folga da API',instruction:'Conserve quatro réplicas no banco e duas na API. Eleve a carga de 1.400 para 1.700 pedidos/s.',why:'O banco comporta 1.800/s. As duas APIs passam a limitar o fluxo a 1.600/s. Sob a carga inicial, elas tinham margem de 200/s.'}
    ],
    questions:['Até que instante um horário mostrado na tela ainda pode ser reservado?','Se duas pessoas escolherem a última vaga ao mesmo tempo, qual regra precisa valer na confirmação?'],
    lifecycle:[
      {title:'Escolher uma unidade',text:'O cliente informa unidade e dia. A API valida o período antes de consultar a agenda.'},
      {title:'Consultar os horários',text:'O balanceador pode dividir a entrada entre APIs equivalentes. O serviço busca os horários em uma réplica de leitura do banco.'},
      {title:'Atualizar a tela',text:'O aplicativo mostra as vagas que encontrou. Reservar exige uma operação separada, capaz de impedir reservas concorrentes da mesma vaga. Concorrência de escrita, transações e atraso entre réplicas ficam fora deste modelo.'}
    ]
  },
  documentos:{
    title:'Geração de documentos',
    goal:'Confirmar os pedidos e manter a geração dos arquivos em dia.',
    brief:'Um portal recebe 700 pedidos de comprovante por segundo. O usuário quer um número de acompanhamento imediato e pode baixar o documento depois. Um executor só consegue montar 350 arquivos/s.',
    load:700, graph:route(['client','api','worker','storage']),
    experiments:[
      {title:'Meça a geração síncrona',instruction:'Simule a rota inicial. Siga o pedido até o armazenamento e compare a capacidade do worker com as 700 chegadas/s.',why:'O cliente depende do último passo para receber a resposta. Um executor limita a conclusão a 350 documentos/s.'},
      {title:'Confirme o recebimento antes da geração',instruction:'Substitua API → Worker por API → Fila → Worker. Mantenha Worker → Object storage e simule com uma réplica do worker.',why:'A fila aceita os 700 pedidos/s. O worker só termina 350/s. Agora a confirmação e a geração têm taxas diferentes, e o acúmulo cresce 350 trabalhos por segundo.'},
      {title:'Acompanhe as novas chegadas',instruction:'Configure duas réplicas no worker. Simule 700/s e compare o crescimento da fila e o volume recebido pelo armazenamento.',why:'Os dois executores entregam 700/s e estabilizam a fila. O indicador mede crescimento por segundo. Para drenar pendências anteriores seria preciso capacidade excedente.'}
    ],
    questions:['Qual mensagem o portal deve mostrar logo após aceitar o pedido?','Se a mesma mensagem chegar duas vezes ao executor, como evitar gerar ou cobrar o documento duas vezes?'],
    lifecycle:[
      {title:'Solicitar',text:'A pessoa pede um comprovante. Na variante assíncrona, o serviço registra o pedido para processamento e devolve um identificador.'},
      {title:'Gerar o arquivo',text:'Um worker pega a mensagem, monta o documento e grava o arquivo com uma chave no armazenamento.'},
      {title:'Liberar o download',text:'Em produção, o portal precisa atualizar o estado para “pronto” e verificar se a pessoa pode baixar o arquivo. O laboratório calcula capacidade e crescimento da fila. O estado por pedido e as permissões ficam a cargo da aplicação.'}
    ]
  },
  mapas:{
    title:'Mapas da cidade',
    goal:'Entregar as imagens públicas de um mapa sem concentrar todas as buscas na origem.',
    brief:'Ao mover o mapa no celular, ele carrega pequenos quadrados de imagem, chamados tiles. Em um evento, a região recebe 6.000 pedidos de quadrados por segundo. Muitas pessoas olham os mesmos bairros.',
    load:6000, graph:route(['client','storage']),
    experiments:[
      {title:'Observe a origem sozinha',instruction:'Execute o desenho inicial. Compare os 6.000 pedidos/s com a capacidade do Object storage.',why:'O armazenamento atende 1.500 pedidos/s. O modelo mede pedidos de arquivos. A banda em bytes depende também do tamanho de cada imagem.'},
      {title:'Distribua os quadrados populares',instruction:'Apague Cliente → Object storage. Insira uma CDN e ligue Cliente → CDN → Object storage. Simule os mesmos 6.000 pedidos/s.',why:'Com 90% de acertos na borda, 5.400 pedidos/s são atendidos perto do público. A origem recebe 600/s. A capacidade das duas peças é suficiente para o pico.'},
      {title:'Compare com multiplicar a origem',instruction:'Anote o custo com a CDN. Retire a CDN, reconecte o cliente à origem e configure quatro réplicas no Object storage.',why:'As quatro réplicas fornecem 6.000/s por 12 créditos/h, exatamente a carga pedida. A alternativa com CDN usa 11 créditos/h, reduz a carga na origem e depende de acertos nas cópias.'}
    ],
    questions:['Quais coordenadas e nível de zoom identificam cada quadrado?','Como o aplicativo saberia que passou a valer uma versão nova do mapa?'],
    lifecycle:[
      {title:'Descobrir as imagens visíveis',text:'O celular calcula quais quadrados correspondem à área visível e ao nível de zoom e envia um pedido para cada um.'},
      {title:'Entregar uma cópia',text:'Na variante distribuída, a CDN procura o quadrado em uma cópia regional. Se ele faltar, busca o arquivo identificado por sua chave na origem.'},
      {title:'Compor o mapa',text:'O aplicativo encaixa as imagens na tela. Publicar uma nova versão dos quadrados, definir validade e medir distância de rede são decisões de produção. O modelo usa taxa de acerto fixa.'}
    ]
  }
};
