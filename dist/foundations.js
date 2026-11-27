export const foundations = {
  client: {
    name:'Cliente',
    what:'Quando você toca numa capa de disco, o aplicativo do celular pede a lista de faixas. O programa que inicia esse pedido faz o papel de cliente. A rede leva a mensagem até o programa que vai responder.',
    example:'Você abre o álbum 42. O celular envia o número 42, espera a resposta e mostra as faixas na tela. Outra pessoa pode fazer o mesmo pedido pelo navegador.',
    placement:'Comece o desenho com Cliente. Puxe uma seta dele para quem recebe o pedido. Aqui as setas acompanham a ida. A resposta já faz parte dessa conversa.',
    mistake:'Desenhar uma seta de volta cria outra chamada no simulador. Para mostrar uma única consulta, basta a seta de ida.',
    question:'Você toca em “ver faixas” no navegador. Quem inicia o pedido?',
    options:['O navegador no seu computador','O banco que guarda os álbuns','O equipamento que distribui a internet'],
    correct:0,feedback:['Isso. Neste pedido, o navegador é o cliente.','O banco pode ser consultado depois que o pedido chegar.','O equipamento encaminha as mensagens da rede. O clique no navegador inicia a consulta.']
  },
  api: {
    name:'API',
    what:'Uma interface de programação de aplicações (API) combina quais pedidos um programa aceita e como responde. O servidor é o programa ou a máquina que atende esses pedidos. Neste grid, a peça API representa o serviço que executa esse trabalho.',
    example:'O aplicativo envia “quero as faixas do álbum 42”. O serviço verifica o número, procura as faixas e devolve título e duração de cada uma. Com esse combinado, o aplicativo sabe o que mostrar.',
    placement:'Ligue Cliente → API. Se a resposta depender de dados guardados, conecte também a API à fonte desses dados. Uma calculadora pode responder usando apenas os números recebidos.',
    mistake:'Criar uma peça para cada botão da tela mistura duas decisões. Um único serviço pode atender tanto “ver álbum” quanto “listar artistas”.',
    question:'Uma calculadora recebe 3 e 5 e devolve a soma. Que caminho já basta?',
    options:['Cliente → API → banco de dados','Cliente → API','Cliente → fila → armazenamento'],
    correct:1,feedback:['Um banco faria sentido se houvesse histórico a guardar. Para somar, o serviço já tem os dois números.','Isso. O serviço calcula a resposta com os dados do próprio pedido.','Essas peças seriam úteis para guardar ou adiar trabalho. A soma pode ser calculada na hora.']
  },
  postgres: {
    name:'PostgreSQL',
    what:'É um banco de dados relacional. Ele organiza fatos em tabelas, com linhas para os registros e colunas para seus atributos. Identificadores ligam registros de tabelas diferentes.',
    example:'Uma linha da tabela de álbuns identifica o disco 42. Na tabela de faixas, várias linhas guardam o número 42 na coluna do álbum. Uma consulta recupera essas linhas pela ordem de reprodução.',
    placement:'Ligue a API ao PostgreSQL quando ela precisar ler dados guardados. No catálogo, siga Cliente → API → PostgreSQL. Manter o dado no banco permite consultá-lo depois de fechar e reabrir o aplicativo.',
    mistake:'Guardar uma cópia apenas na memória de cada servidor torna uma atualização difícil de compartilhar. Defina onde fica a versão de referência.',
    question:'O que permite encontrar todas as faixas do disco 42?',
    options:['A posição física do celular','O número de servidores ligados','O identificador do álbum guardado nas faixas'],
    correct:2,feedback:['A mesma consulta deve funcionar de qualquer celular.','Mais servidores alteram capacidade. A relação entre os registros depende dos dados.','Isso. Esse vínculo permite selecionar as faixas daquele disco.']
  },
  lb: {
    name:'Load balancer · balanceador',
    what:'Um balanceador recebe um pedido e escolhe um dos servidores disponíveis para atendê-lo. A rede transporta o pedido até o servidor escolhido. A utilidade aparece quando vários servidores podem fazer o mesmo trabalho.',
    example:'Duas cópias iguais de um serviço recebem juntas 1.400 pedidos por segundo. Com uma divisão uniforme, cada cópia recebe cerca de 700.',
    placement:'Acrescente o balanceador quando quiser distribuir tráfego entre cópias. Desenhe Cliente → Load balancer e ligue suas saídas às APIs equivalentes.',
    mistake:'Adicionar um balanceador diante de um único servidor mantém a capacidade daquele servidor. Para repartir trabalho, é preciso ter capacidade disponível nos destinos.',
    question:'Um pedido chega ao balanceador com duas APIs equivalentes e saudáveis. O que ele faz no laboratório?',
    options:['Escolhe uma das APIs para atender o pedido','Envia uma cópia obrigatória para cada API','Guarda a resposta em disco para sempre'],
    correct:0,feedback:['Isso. Ao longo de muitos pedidos ele distribui o trabalho.','Duplicar cada pedido dobraria o trabalho. Aqui os destinos são alternativas.','O balanceador encaminha tráfego. Persistência requer outra função.']
  },
  redis: {
    name:'Redis · cache em memória',
    what:'Cache é uma cópia que ajuda a responder mais rápido quando os mesmos dados são pedidos várias vezes. Redis guarda valores identificados por chaves e pode fazer esse papel na memória do servidor.',
    example:'Depois de buscar a ficha do álbum 42, o serviço guarda uma cópia com a chave “album-42”. No próximo pedido ele procura essa chave. Se a cópia tiver expirado, consulta o banco e pode preencher o cache novamente.',
    placement:'Para simular leituras repetidas, monte API → Redis → PostgreSQL. A última seta representa a consulta à fonte quando falta uma cópia. No software real, a aplicação pode coordenar essas etapas.',
    mistake:'Se alguém corrigir o nome do disco, a cópia antiga pode continuar visível. Combine um prazo para expirar a cópia com uma regra para apagá-la quando o original mudar.',
    question:'Com dez consultas e oito respostas encontradas no cache, quantas precisam do banco?',
    options:['Dez','Duas','Oito'],
    correct:1,feedback:['Dez chegariam ao banco se todas consultassem a fonte.','Isso. As duas consultas que ficaram sem cópia seguem até a fonte.','Oito é a quantidade atendida pela cópia em memória.']
  },
  cdn: {
    name:'CDN · distribuição de conteúdo',
    what:'Uma rede de distribuição de conteúdo (CDN) guarda e entrega cópias de arquivos em locais próximos de quem pede. Aproximar os dados reduz o caminho de rede e pode aliviar o servidor que conserva os arquivos de origem.',
    example:'Várias pessoas na mesma região assistem ao mesmo trecho de vídeo. Um ponto de distribuição da região pode entregar a cópia do trecho a cada pessoa. Quando o trecho falta, o sistema precisa buscá-lo.',
    placement:'Coloque Cliente → CDN → Object storage para estudar a entrega de arquivos. O último componente guarda os originais. Um pequeno site pode começar servindo arquivos direto da origem.',
    mistake:'Usar a mesma cópia para respostas privadas pode mostrar dados de uma pessoa a outra. Escolha conteúdo que possa ser reutilizado com segurança, como uma capa pública.',
    question:'Qual conteúdo se presta melhor a uma cópia compartilhada por toda uma região?',
    options:['O saldo da conta de cada ouvinte','Um código individual de recuperação de senha','A imagem pública da capa de um disco'],
    correct:2,feedback:['O saldo é particular e pode mudar a qualquer momento.','Esse código é secreto e específico de uma pessoa.','Isso. Muitos ouvintes podem receber exatamente a mesma imagem pública.']
  },
  storage: {
    name:'Object storage · armazenamento de objetos',
    what:'Esse serviço guarda arquivos como objetos, cada um com uma chave para recuperá-lo. O objeto pode ser uma foto, um áudio ou uma parte de vídeo. A chave funciona como um endereço dentro do armazenamento.',
    example:'A ficha do álbum no banco guarda título, ano e a chave “capas/42.jpg”. Ao abrir a capa, o aplicativo busca os bytes da imagem usando essa chave.',
    placement:'Ligue a peça que precisa do arquivo ao Object storage. Use CDN antes dele se cópias regionais ajudarem a atender muitos leitores.',
    mistake:'Saber onde está um arquivo não resolve perguntas como “quais álbuns deste artista saíram em 2020?”. Dados pesquisáveis sobre o arquivo podem ficar em uma tabela ou índice.',
    question:'Você já sabe a chave exata da capa. Qual peça devolve o arquivo guardado?',
    options:['Object storage','Load balancer','Fila'],
    correct:0,feedback:['Isso. A chave identifica o objeto a recuperar.','Um balanceador escolhe um destino para o pedido.','Uma fila mantém trabalhos aguardando processamento.']
  },
  queue: {
    name:'Fila',
    what:'Uma fila recebe mensagens de trabalho e as mantém disponíveis para processamento. Isso permite aceitar um pedido agora e executar uma parte dele depois.',
    example:'Um ouvinte termina uma música. O serviço publica uma mensagem com a escuta e confirma que a recebeu. Outro programa pega a mensagem e atualiza as estatísticas.',
    placement:'Conecte API → Fila → Worker quando fizer sentido responder antes da conclusão da tarefa. Se a pessoa precisa da resposta calculada imediatamente, essa separação exige outro jeito de entregar o resultado.',
    mistake:'Uma confirmação rápida esconde atrasos se você olhar só para o cliente. Se entram dez trabalhos por segundo e saem seis, o volume pendente cresce quatro por segundo.',
    question:'O aplicativo confirmou a entrada de um evento na fila. O que já aconteceu?',
    options:['O relatório final foi atualizado','A fila aceitou o evento para processamento','Todos os trabalhos anteriores terminaram'],
    correct:1,feedback:['Atualizar o relatório é uma etapa posterior.','Isso. O processamento pode estar pendente.','Uma nova mensagem pode entrar enquanto outras ainda esperam.']
  },
  worker: {
    name:'Worker · executor em segundo plano',
    what:'Um worker é um programa que realiza uma tarefa, muitas vezes depois que o cliente recebeu uma confirmação. Ele pode buscar mensagens de uma fila, transformar dados e guardar o resultado.',
    example:'Ao publicar uma foto, você vê “recebida”. Em segundo plano, um worker cria a miniatura e grava o novo arquivo. Até lá, a foto original já existe e a miniatura ainda está pendente.',
    placement:'Ligue Fila → Worker → Object storage para representar esse fluxo. Se a fila crescer continuamente, compare a chegada de mensagens com o trabalho que cada réplica consegue terminar.',
    mistake:'Dobrar os workers também aumenta o volume que eles enviam ao próximo serviço. Confira a capacidade de gravação antes de atribuir todo atraso ao executor.',
    question:'Chegam 700 tarefas por segundo. Cada worker termina 350. Quantos acompanham esse ritmo se as próximas etapas suportam a carga?',
    options:['Um','Sete','Dois'],
    correct:2,feedback:['Um deixaria 350 tarefas a mais na fila a cada segundo.','Sete ultrapassariam a capacidade necessária para acompanhar essa chegada constante.','Isso. Duas réplicas fornecem 700 tarefas/s. Para recuperar atraso anterior, reserve capacidade extra.']
  },
  search: {
    name:'Índice de busca',
    what:'Um índice prepara dados para encontrar resultados rapidamente. Em uma busca de texto, ele pode associar palavras aos itens que as contêm, como o índice no fim de um livro.',
    example:'Ao pesquisar “lua”, o serviço procura essa palavra no índice e recupera os discos correspondentes. A ficha completa de cada disco pode continuar guardada na base do catálogo.',
    placement:'Ligue a API ao Índice de busca para a consulta textual. Planeje também como alterações no catálogo serão enviadas ao índice. Esse trabalho de atualização fica fora do desenho de leitura.',
    mistake:'O índice pode demorar a refletir uma edição. Atualizar o título apenas no catálogo e esquecer a atualização do índice deixa a busca mostrando o título antigo.',
    question:'Um disco recém-cadastrado aparece pela identificação exata, mas ainda falta na pesquisa por palavra. O que vale investigar?',
    options:['Se o índice já recebeu a atualização','Se o telefone está com volume suficiente','Se há mais imagens no armazenamento'],
    correct:0,feedback:['Isso. O cadastro e o índice podem receber a mudança em momentos diferentes.','O volume do aparelho afeta a reprodução de áudio.','A quantidade de imagens pouco explica uma palavra que ainda não entrou no índice.']
  },
  nosql: {
    name:'Banco NoSQL · consulta por chave',
    what:'NoSQL reúne famílias de bancos com formas diferentes de organizar dados. A peça deste laboratório representa uma consulta por chave. Você informa um identificador conhecido e recebe o valor associado.',
    example:'Para abrir as preferências da ouvinte 184, a API consulta “usuario-184” e recebe idioma, tema e volume preferido. O caminho de acesso usa uma chave conhecida desde o início.',
    placement:'Conecte API → Banco NoSQL quando o cenário pedir acesso por chave. Escolha a estrutura depois de entender as consultas que o produto precisa responder.',
    mistake:'Uma única chave muito popular concentra trabalho. A capacidade do modelo pressupõe chaves bem distribuídas entre os recursos disponíveis.',
    question:'Qual pedido combina diretamente com o acesso por chave deste laboratório?',
    options:['Calcular a média de todas as avaliações de todos os artistas','Recuperar as preferências da pessoa 184','Encontrar versos parecidos em todos os álbuns'],
    correct:1,feedback:['Essa agregação precisa ler ou reunir informações de muitos registros.','Isso. A chave da pessoa identifica diretamente os dados procurados.','Comparar texto em todo o catálogo pede outra estratégia de pesquisa.']
  },
  gateway: {
    name:'API gateway · porta de entrada',
    what:'É um serviço na entrada do sistema que recebe chamadas e as encaminha para serviços internos. Ele pode aplicar regras comuns, como verificar credenciais, antes de escolher o serviço responsável.',
    example:'O aplicativo usa um único endereço. Um pedido de catálogo segue para o serviço de discos. Um pedido de perfil segue para o serviço de contas. O aplicativo pode continuar usando o mesmo endereço quando um serviço muda de máquina.',
    placement:'Monte Cliente → API gateway → API para experimentar uma rota. Aqui simulamos capacidade e encaminhamento. A escolha real por endereço e a verificação de credenciais são decisões de implementação.',
    mistake:'Um gateway adiciona custo e mais uma etapa. Se um único serviço já recebe tudo e atende às regras da aplicação, a peça pode ser dispensada.',
    question:'Qual situação dá um motivo concreto para introduzir um gateway?',
    options:['Há uma única soma simples para calcular','Faltou um lugar para guardar a capa do disco','Vários serviços precisam de uma entrada comum com regras de acesso'],
    correct:2,feedback:['A própria API pode receber os números e calcular a soma.','Use um armazenamento para guardar o arquivo.','Isso. A entrada comum concentra o encaminhamento e pode aplicar regras compartilhadas.']
  }
};
