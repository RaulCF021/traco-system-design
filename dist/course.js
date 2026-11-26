export const course = {
  catalogo: {
    title: 'Siga uma consulta de ponta a ponta',
    questionIntro: 'Imagine que você tocou no álbum e está esperando os nomes das faixas. Quem sabe responder?',
    sections: [
      {title:'Do toque ao identificador', text:'O aplicativo envia o identificador do álbum à API. A API traduz o pedido em uma consulta pelas faixas daquele álbum e organiza a resposta na ordem do disco. Os dados continuam disponíveis quando o aplicativo fecha.'},
      {title:'Leia as setas na ida', text:'Cliente → API → PostgreSQL significa que a API depende do banco para terminar a consulta. A resposta volta pelas mesmas etapas. Desenhar outra seta de volta criaria uma nova chamada e um ciclo no modelo.'},
      {title:'Conte o trabalho em cada etapa', text:'Com 300 pedidos/s e uma consulta por pedido, a API processa 300/s e o banco recebe 300/s. A API usa 300 ÷ 800 = 37,5% da capacidade. O banco usa 300 ÷ 450 ≈ 67%. Se o tráfego aumentar, o banco será o primeiro limite.'},
      {title:'Quando uma métrica engana', text:'Um HTTP 200 pode trazer uma resposta vazia. No laboratório, uma API isolada também consegue encerrar chamadas. Para confirmar que a solução atende ao catálogo, verifique se o banco recebeu as consultas e se está conectado à API.'}
    ],
    prediction:{question:'Se o catálogo conectado receber 600 pedidos/s, quantos podem terminar por segundo com uma réplica em cada etapa?',correct:1,options:[
      {text:'300, como na simulação inicial',feedback:'300 era a carga inicial. Aumentar a demanda ocupa a capacidade que ainda estava livre.'},
      {text:'450, a capacidade do banco',feedback:'Isso. A API admite os 600 pedidos/s, mas apenas 450 consultas/s conseguem terminar no banco.'},
      {text:'600, a quantidade recebida pela API',feedback:'A entrada da API mede a demanda. A conclusão depende também da etapa que busca os dados.'}
    ]},
    steps:['Execute o desenho inicial e procure o alerta do PostgreSQL desconectado.','Conecte a API ao PostgreSQL na direção da consulta.','Simule 300 pedidos/s e confira as metas. Experimente depois a carga da pergunta.']
  },
  leituras: {
    title:'Calcule o tráfego que escapa do cache',
    questionIntro:'Milhares de pessoas abrem o mesmo álbum. Quantas vezes é preciso buscar a mesma ficha no banco?',
    sections:[
      {title:'Escolha o dado que se repete',text:'A ficha pública de um álbum serve a vários ouvintes. O identificador do álbum pode ser a chave da cópia. Uma resposta personalizada exigiria uma chave que também distinguisse o usuário.'},
      {title:'Acompanhe um acerto e uma falta',text:'No padrão cache-aside a aplicação procura a chave no Redis. Em um acerto, ela devolve a ficha. Em uma falta, busca o original no banco e guarda uma cópia para a próxima consulta. O caminho API → Redis → PostgreSQL resume essa decisão no diagrama.'},
      {title:'Transforme acertos em carga poupada',text:'Para 700 leituras/s com 80% de acertos, 560/s terminam com a cópia e 140/s consultam o original. O banco de 450/s passa a operar com folga. Continue contando as 700 consultas/s na API.'},
      {title:'O que acontece quando o título muda?',text:'Quem lê a cópia pode ver o título anterior até a expiração. Invalidar a chave após editar o álbum reduz essa janela. Um lançamento com cache inicialmente vazio também pode concentrar consultas simultâneas ao banco. A missão simula o cache já aquecido.'}
    ],
    prediction:{question:'Em uma hora mais tranquila chegam 500 leituras/s. Mantendo os 80% de acertos, quantas chegam ao PostgreSQL?',correct:2,options:[
      {text:'400 leituras/s',feedback:'400 é a parcela que encontra a resposta no Redis. Calcule agora os 20% restantes.'},
      {text:'500 leituras/s',feedback:'Esse total chegaria ao banco se todas as leituras ignorassem o cache ou dessem falta.'},
      {text:'100 leituras/s',feedback:'Exato. A taxa de faltas é 1 − 0,80 = 0,20. Portanto, 500 × 0,20 = 100.'}
    ]},
    steps:['Simule a rota direta e observe quantas das 700 leituras terminam.','Substitua a ligação direta API → PostgreSQL pelo caminho que consulta Redis antes do banco.','Simule novamente e localize os 140 acessos/s ao original.']
  },
  balanceamento: {
    title:'Dimensione um conjunto de APIs',
    questionIntro:'Duas catracas consultam a mesma aplicação. Como distribuir a abertura dos portões sem validar cada ingresso duas vezes?',
    sections:[
      {title:'Uma chamada, um destino',text:'O balanceador recebe o pedido e escolhe uma instância disponível. Com dois destinos iguais e saudáveis, a divisão uniforme do laboratório envia metade a cada um. O segundo servidor permite que mais ingressos sejam verificados simultaneamente.'},
      {title:'Faça as instâncias intercambiáveis',text:'Nesta missão, cada instância tem os dados necessários para verificar uma assinatura. Se a sessão existisse apenas na memória do primeiro servidor, um pedido seguinte poderia chegar a outro servidor que desconhece a sessão.'},
      {title:'Calcule a folga',text:'Duas instâncias de 800/s fornecem 1.600/s. Sob uma carga de 1.400/s, cada uma recebe 700/s, opera a 87,5% e conserva margem de 100/s. O balanceador admite até 8.000/s neste exercício.'},
      {title:'Considere a perda de capacidade',text:'Se uma das duas instâncias parar, as requisições passam a disputar uma capacidade de 800/s. Na abertura, isso deixaria 600/s sem atendimento. Uma terceira instância saudável antes do incidente deixaria duas disponíveis durante a falha.'}
    ],
    prediction:{question:'Com três instâncias de 800/s e a perda de uma delas, qual é a capacidade restante do conjunto?',correct:0,options:[
      {text:'1.600 validações/s',feedback:'Correto. Sobram duas instâncias. Elas atendem os 1.400 pedidos/s e ainda têm 200/s de margem.'},
      {text:'2.400 validações/s',feedback:'Esse era o teto com as três instâncias saudáveis. Desconte a capacidade da instância perdida.'},
      {text:'700 validações/s',feedback:'700 é a carga por instância ao repartir uma demanda de 1.400 entre duas. A capacidade individual permanece em 800/s.'}
    ]},
    steps:['Simule o pico com a API de uma réplica e identifique o componente saturado.','Configure duas réplicas na API ou ligue outra API ao balanceador.','Compare a vazão com a de uma réplica. Calcule a margem a partir de 1.600 − 1.400.']
  },
  netflix: {
    title:'Aproxime os segmentos de vídeo do espectador',
    questionIntro:'Muitos espectadores da mesma região assistem à estreia. Que parte do tráfego precisa percorrer a rede até a origem?',
    sections:[
      {title:'O precedente do Open Connect',text:'A Netflix documenta parcerias com provedores que hospedam equipamentos Open Connect dentro de suas redes. Conteúdo pré-posicionado pode ser entregue perto do assinante, aliviando enlaces que transportariam os mesmos vídeos de locais mais distantes.'},
      {title:'Isole a entrega de vídeo',text:'Conte um pedido para cada segmento solicitado pelo reprodutor. Cliente → CDN representa o pedido à borda. CDN → Armazenamento representa a parte que depende da origem no exercício. Seleção de servidor, interconexões e preenchimento proativo ficam descritos nas fontes da missão.'},
      {title:'Dimensione em duas escalas',text:'A borda recebe 6.000 pedidos/s e atende 5.400/s localmente. Os outros 600/s usam 40% da capacidade de 1.500/s da origem. Os 90% de acertos são uma hipótese da simulação. A Netflix descreve o mecanismo, sem atribuir essa taxa ao caso estudado.'},
      {title:'Pedidos e bytes medem coisas diferentes',text:'Dois segmentos podem ter tamanhos diferentes. Para dimensionar um enlace, multiplique a taxa de pedidos pelo tamanho médio. Se todos os 600 segmentos/s buscados na origem tiverem 1 MB, serão 600 MB/s, aproximadamente 4,8 Gbit/s antes de overhead.'}
    ],
    prediction:{question:'Se 8.000 segmentos/s passarem pela CDN do exercício, qual tráfego chegará à origem?',correct:1,options:[
      {text:'7.200 buscas/s',feedback:'7.200 segmentos/s correspondem aos 90% encontrados perto do espectador.'},
      {text:'800 buscas/s',feedback:'Isso. Os 10% de faltas geram 800 buscas/s. As capacidades de borda e origem comportam essa carga.'},
      {text:'1.500 buscas/s',feedback:'1.500/s é o teto de serviço da origem. A demanda real depende da parcela que falta na borda.'}
    ]},
    steps:['Execute o cenário direto e veja quanto a origem entrega sozinha.','Insira uma CDN no caminho entre o cliente e os arquivos. Remova o acesso direto à origem.','Simule 6.000 segmentos/s e compare o tráfego da CDN com o da origem.']
  },
  spotify: {
    title:'Separe confirmação e processamento',
    questionIntro:'O aplicativo terminou de tocar uma faixa. Em que instante podemos dizer que a escuta entrou nas estatísticas?',
    sections:[
      {title:'Um evento com consequências',text:'O Spotify documentou o EndSong, evento de fim de faixa usado em métricas e no cálculo de royalties. Seu relato de engenharia de 2019 descreve uma entrada que identifica tipos de evento, publica em tópicos do Pub/Sub e usa pipelines para levar os dados ao armazenamento.'},
      {title:'Siga os dois instantes',text:'No desenho, a API publica na fila e pode confirmar o recebimento. Depois, o worker consome o evento e grava o resultado. Meça separadamente a taxa de eventos aceitos e a taxa que chega ao armazenamento.'},
      {title:'Estime o atraso que cresce',text:'Entram 700 eventos/s e um worker consome 350/s. A diferença de 350/s acumularia 21.000 eventos em um minuto. A métrica do laboratório mostra a taxa de crescimento. Com duas réplicas, 700 entram e 700 saem a cada segundo.'},
      {title:'Recupere o atraso anterior',text:'Duas réplicas sustentam o fluxo novo, mas também é preciso capacidade extra para esvaziar uma fila acumulada. Com três workers, a capacidade nominal chega a 1.050/s. Em um sistema com 21.000 pendentes e 700 chegadas/s, os 350/s de folga poderiam drená-los em 60 segundos.'}
    ],
    prediction:{question:'Com a entrada constante em 700 eventos/s, o que duas réplicas de 350/s fazem com 21.000 eventos já pendentes?',correct:2,options:[
      {text:'Esvaziam a fila em 30 segundos',feedback:'Esse cálculo usa 21.000 ÷ 700 e pressupõe que as novas chegadas pararam. Aqui continuam chegando 700/s.'},
      {text:'Confirmam apenas 350 eventos/s para os clientes',feedback:'A confirmação acompanha a admissão na fila. A quantidade de workers determina o processamento posterior.'},
      {text:'Mantêm o total pendente estável',feedback:'Isso. As 700 saídas/s compensam as 700 entradas/s. O estoque pendente só diminui quando o consumo supera as chegadas.'}
    ]},
    steps:['Simule o fluxo inicial e compare a taxa confirmada com o crescimento da fila.','Configure duas réplicas no worker e rode novamente com a mesma carga.','Confira as três metas e identifique por que uma terceira réplica ajudaria após um período de acúmulo.']
  },
  orcamento: {
    title:'Defenda uma arquitetura com números',
    questionIntro:'A pré-venda tem meta de vazão e limite de 40 créditos/h. Que investimento remove o gargalo pelo menor custo?',
    sections:[
      {title:'Fixe o contrato de serviço',text:'Registre as três condições da missão. Os usuários precisam consultar o catálogo persistente por uma API balanceada. A plataforma precisa entregar 1.800 leituras/s. O custo das peças provisionadas precisa caber em 40 créditos por hora.'},
      {title:'Compare dois projetos',text:'Atender 1.800/s requer ao menos três APIs de 800/s. Com consultas diretas, quatro réplicas de banco de 450/s forneceriam capacidade nominal de 1.800/s. Balanceador, APIs e bancos somariam 4 + 18 + 48 = 70 créditos/h, antes de reservar qualquer margem no banco.'},
      {title:'Pague para evitar trabalho repetido',text:'Adicionar Redis ao caminho reduz a demanda no banco para 1.800 × 20% = 360 leituras/s. Um banco suporta esse volume. O custo fica em 4 do balanceador + 18 das APIs + 5 do Redis + 12 do banco = 39 créditos/h.'},
      {title:'Explicite a condição de validade',text:'Um banco de 450/s tolera até 25% de faltas a 1.800/s. Abaixo de 75% de acertos, ele passa a saturar. O plano de 39 créditos depende do perfil de leitura repetida. Um teste com dados frios ajudaria a verificar essa premissa antes da estreia.'}
    ],
    prediction:{question:'Se os acertos do cache caíssem de 80% para 70%, qual seria a demanda no banco com 1.800 leituras/s?',correct:0,options:[
      {text:'540 leituras/s, 90 acima da capacidade',feedback:'Correto. As faltas passam a 30%. Multiplicar 1.800 por 0,30 revela um gargalo que aumentar as APIs não resolve.'},
      {text:'360 leituras/s, ainda dentro da capacidade',feedback:'360 corresponde ao cenário de 80% de acertos. Uma queda de 10 pontos percentuais leva mais 180 leituras/s ao banco.'},
      {text:'1.260 leituras/s, 810 acima da capacidade',feedback:'1.260 é o número de leituras encontradas no cache. O banco recebe as 540 restantes.'}
    ]},
    steps:['Rode a pré-venda como está. Compare a demanda com a capacidade de cada etapa.','Ajuste a quantidade de APIs e o caminho de leitura. Compare a despesa de cada alternativa.','Com as três metas atingidas, identifique qual peça voltaria a saturar primeiro caso o cache perdesse eficácia.']
  }
};
