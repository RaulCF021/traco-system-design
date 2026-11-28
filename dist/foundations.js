export const foundations = {
  client: {
    name:'Cliente',
    what:'Quando você toca em uma linha de ônibus, o aplicativo pede os horários dessa linha. O programa que inicia esse pedido faz o papel de cliente. A rede leva a mensagem até o programa que vai responder.',
    example:'Você abre a linha 42. O celular envia o número da linha, espera a resposta e mostra as próximas partidas. Outra pessoa pode fazer o mesmo pedido pelo navegador.',
    placement:'Comece o desenho com Cliente. Puxe uma seta dele para quem recebe o pedido. Aqui as setas acompanham a ida. A resposta já faz parte dessa conversa.',
    mistake:'Desenhar uma seta de volta cria outra chamada no simulador. Para mostrar uma única consulta, basta a seta de ida.',
    question:'Você toca em “ver horários” no navegador. Quem inicia o pedido?',
    options:['O navegador no seu computador','O banco que guarda os álbuns','O equipamento que distribui a internet'],
    correct:0,feedback:['Isso. Neste pedido, o navegador é o cliente.','O banco pode ser consultado depois que o pedido chegar.','O equipamento encaminha as mensagens da rede. O clique no navegador inicia a consulta.']
  },
  api: {
    name:'API',
    what:'Uma interface de programação de aplicações (API) combina quais pedidos um programa aceita e como responde. O servidor é o programa ou a máquina que atende esses pedidos. Neste grid, a peça API representa o serviço que executa esse trabalho.',
    example:'O aplicativo envia “quero os horários da unidade 7”. O serviço verifica o número, busca as vagas e devolve a data e o horário de cada opção. Com esse combinado, o aplicativo sabe o que mostrar.',
    placement:'Ligue Cliente → API. Se a resposta depender de dados guardados, conecte também a API à fonte desses dados. Uma calculadora pode responder usando apenas os números recebidos.',
    mistake:'Criar uma peça para cada botão da tela mistura duas decisões. Um único serviço pode atender tanto “ver horários” quanto “listar unidades”.',
    question:'Uma calculadora recebe 3 e 5 e devolve a soma. Que caminho já basta?',
    options:['Cliente → API → banco de dados','Cliente → API','Cliente → fila → armazenamento'],
    correct:1,feedback:['Um banco faria sentido se houvesse histórico a guardar. Para somar, o serviço já tem os dois números.','Isso. O serviço calcula a resposta com os dados do próprio pedido.','Essas peças seriam úteis para guardar ou adiar trabalho. A soma pode ser calculada na hora.']
  },
  postgres: {
    name:'PostgreSQL',
    what:'É um banco de dados relacional. Ele organiza fatos em tabelas, com linhas para os registros e colunas para seus atributos. Identificadores ligam registros de tabelas diferentes.',
    example:'Uma linha da tabela de pedidos identifica a compra 42. Na tabela de itens, várias linhas guardam o número 42 na coluna do pedido. Uma consulta recupera juntos os itens daquela compra.',
    placement:'Ligue a API ao PostgreSQL quando ela precisar ler dados guardados. Na consulta de pedidos, siga Cliente → API → PostgreSQL. Manter o dado no banco permite consultá-lo depois de fechar e reabrir o aplicativo.',
    mistake:'Guardar uma cópia apenas na memória de cada servidor torna uma atualização difícil de compartilhar. Defina onde fica a versão de referência.',
    question:'O que permite encontrar todos os itens do pedido 42?',
    options:['A posição física do celular','O número de servidores ligados','O identificador do pedido guardado em cada item'],
    correct:2,feedback:['A mesma consulta deve funcionar de qualquer celular.','Mais servidores alteram capacidade. A relação entre os registros depende dos dados.','Isso. Esse vínculo permite selecionar os itens daquela compra.']
  },
  lb: {
    name:'Load balancer · balanceador',
    what:'Um balanceador recebe um pedido e escolhe um dos servidores disponíveis para atendê-lo. A rede transporta o pedido até o servidor escolhido. A utilidade aparece quando vários servidores podem fazer o mesmo trabalho.',
    example:'No dia da matrícula, duas cópias do serviço que valida inscrições recebem juntas 1.400 pedidos por segundo. Com uma divisão uniforme, cada cópia recebe cerca de 700.',
    placement:'Acrescente o balanceador quando quiser distribuir tráfego entre cópias. Desenhe Cliente → Load balancer e ligue suas saídas às APIs equivalentes.',
    mistake:'Adicionar um balanceador diante de um único servidor mantém a capacidade daquele servidor. Para repartir trabalho, é preciso ter capacidade disponível nos destinos.',
    question:'Um pedido chega ao balanceador com duas APIs equivalentes e saudáveis. O que ele faz no laboratório?',
    options:['Escolhe uma das APIs para atender o pedido','Envia uma cópia obrigatória para cada API','Guarda a resposta em disco para sempre'],
    correct:0,feedback:['Isso. Ao longo de muitos pedidos ele distribui o trabalho.','Duplicar cada pedido dobraria o trabalho. Aqui os destinos são alternativas.','O balanceador encaminha tráfego. Persistência requer outra função.']
  },
  redis: {
    name:'Redis · cache em memória',
    what:'Cache é uma cópia que ajuda a responder mais rápido quando os mesmos dados são pedidos várias vezes. Redis guarda valores identificados por chaves e pode fazer esse papel na memória do servidor.',
    example:'Depois de buscar a descrição do produto 42, o serviço guarda uma cópia com a chave “produto-42”. No próximo pedido ele procura essa chave. Se a cópia tiver expirado, consulta o banco e pode preencher o cache novamente.',
    placement:'Para simular leituras repetidas, monte API → Redis → PostgreSQL. A última seta representa a consulta à fonte quando falta uma cópia. No software real, a aplicação pode coordenar essas etapas.',
    mistake:'Se alguém corrigir a descrição do produto, a cópia antiga pode continuar visível. Combine um prazo para expirar a cópia com uma regra para apagá-la quando o original mudar.',
    question:'Com dez consultas e oito respostas encontradas no cache, quantas precisam do banco?',
    options:['Dez','Duas','Oito'],
    correct:1,feedback:['Dez chegariam ao banco se todas consultassem a fonte.','Isso. As duas consultas que ficaram sem cópia seguem até a fonte.','Oito é a quantidade atendida pela cópia em memória.']
  },
  cdn: {
    name:'CDN · distribuição de conteúdo',
    what:'Uma rede de distribuição de conteúdo (CDN) guarda e entrega cópias de arquivos em locais próximos de quem pede. Aproximar os dados reduz o caminho de rede e pode aliviar o servidor que conserva os arquivos de origem.',
    example:'Várias pessoas abrem o mapa do mesmo bairro. Um ponto de distribuição da região entrega cópias das pequenas imagens que compõem o mapa. Se uma imagem ainda falta, a origem fornece o arquivo.',
    placement:'Coloque Cliente → CDN → Object storage para estudar a entrega de arquivos. O último componente guarda os originais. Um pequeno site pode começar servindo arquivos direto da origem.',
    mistake:'Usar a mesma cópia para respostas privadas pode mostrar dados de uma pessoa a outra. Escolha conteúdo que possa ser reutilizado com segurança, como um mapa público de ruas.',
    question:'Qual conteúdo se presta melhor a uma cópia compartilhada por toda uma região?',
    options:['O saldo bancário de cada pessoa','Um código individual de recuperação de senha','A imagem pública do mapa de um bairro'],
    correct:2,feedback:['O saldo é particular e pode mudar a qualquer momento.','Esse código é secreto e específico de uma pessoa.','Isso. Quem abre aquele bairro pode receber a mesma imagem pública.']
  },
  storage: {
    name:'Object storage · armazenamento de objetos',
    what:'Esse serviço guarda arquivos como objetos, cada um com uma chave para recuperá-lo. O objeto pode ser uma foto, um áudio ou uma parte de vídeo. A chave funciona como um endereço dentro do armazenamento.',
    example:'O registro de uma vistoria guarda data, endereço e a chave “vistorias/42/fachada.jpg”. Ao abrir a foto, o aplicativo usa essa chave para recuperar o arquivo.',
    placement:'Ligue a peça que precisa do arquivo ao Object storage. Use CDN antes dele se cópias regionais ajudarem a atender muitos leitores.',
    mistake:'Saber onde está um arquivo não resolve perguntas como “quais vistorias deste bairro ocorreram em abril?”. Dados pesquisáveis sobre o arquivo podem ficar em uma tabela ou índice.',
    question:'Você já sabe a chave exata da foto. Qual peça devolve o arquivo guardado?',
    options:['Object storage','Load balancer','Fila'],
    correct:0,feedback:['Isso. A chave identifica o objeto a recuperar.','Um balanceador escolhe um destino para o pedido.','Uma fila mantém trabalhos aguardando processamento.']
  },
  queue: {
    name:'Fila',
    what:'Uma fila recebe mensagens de trabalho e as mantém disponíveis para processamento. Isso permite aceitar um pedido agora e executar uma parte dele depois.',
    example:'Uma empresa solicita um relatório mensal. O serviço registra o pedido na fila e devolve seu número de acompanhamento. Outro programa pega a mensagem e gera o documento.',
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
    example:'Ao pesquisar “licença” em um portal de serviços, o sistema consulta o índice e recupera os formulários correspondentes. O texto completo de cada formulário pode continuar no banco do portal.',
    placement:'Ligue a API ao Índice de busca para a consulta textual. Planeje também como alterações nos formulários serão enviadas ao índice. Esse trabalho de atualização fica fora do desenho de leitura.',
    mistake:'O índice pode demorar a refletir uma edição. Atualizar o título apenas no banco e esquecer a atualização do índice deixa a busca mostrando o título antigo.',
    question:'Um formulário recém-cadastrado aparece pela identificação exata, mas ainda falta na pesquisa por palavra. O que vale investigar?',
    options:['Se o índice já recebeu a atualização','Se o formulário ocupa pouco espaço em disco','Se há mais imagens no armazenamento'],
    correct:0,feedback:['Isso. O cadastro e o índice podem receber a mudança em momentos diferentes.','O tamanho do arquivo pouco diz sobre a inclusão de suas palavras no índice.','A quantidade de imagens pouco explica uma palavra que ainda não entrou no índice.']
  },
  nosql: {
    name:'Banco NoSQL · consulta por chave',
    what:'NoSQL reúne famílias de bancos com formas diferentes de organizar dados. A peça deste laboratório representa uma consulta por chave. Você informa um identificador conhecido e recebe o valor associado.',
    example:'Para abrir as preferências da pessoa 184, a API consulta “usuario-184” e recebe idioma, tema e cidade preferida. O caminho de acesso usa uma chave conhecida desde o início.',
    placement:'Conecte API → Banco NoSQL quando o cenário pedir acesso por chave. Escolha a estrutura depois de entender as consultas que o produto precisa responder.',
    mistake:'Uma única chave muito popular concentra trabalho. A capacidade do modelo pressupõe chaves bem distribuídas entre os recursos disponíveis.',
    question:'Qual pedido combina diretamente com o acesso por chave deste laboratório?',
    options:['Calcular a média de todas as notas de uma turma','Recuperar as preferências da pessoa 184','Encontrar termos parecidos em todos os documentos'],
    correct:1,feedback:['Essa agregação precisa ler ou reunir informações de muitos registros.','Isso. A chave da pessoa identifica diretamente os dados procurados.','Comparar texto em todo o catálogo pede outra estratégia de pesquisa.']
  },
  gateway: {
    name:'API gateway · porta de entrada',
    what:'É um serviço na entrada do sistema que recebe chamadas e as encaminha para serviços internos. Ele pode aplicar regras comuns, como verificar credenciais, antes de escolher o serviço responsável.',
    example:'O aplicativo usa um único endereço. Um pedido de entrega segue para o serviço de logística. Um pedido de fatura segue para o financeiro. O aplicativo pode continuar usando o mesmo endereço quando um serviço muda de máquina.',
    placement:'Monte Cliente → API gateway → API para experimentar uma rota. Aqui simulamos capacidade e encaminhamento. A escolha real por endereço e a verificação de credenciais são decisões de implementação.',
    mistake:'Um gateway adiciona custo e mais uma etapa. Se um único serviço já recebe tudo e atende às regras da aplicação, a peça pode ser dispensada.',
    question:'Qual situação dá um motivo concreto para introduzir um gateway?',
    options:['Há uma única soma simples para calcular','Faltou um lugar para guardar o arquivo de uma fatura','Vários serviços precisam de uma entrada comum com regras de acesso'],
    correct:2,feedback:['A própria API pode receber os números e calcular a soma.','Use um armazenamento para guardar o arquivo.','Isso. A entrada comum concentra o encaminhamento e pode aplicar regras compartilhadas.']
  }
};
Object.assign(foundations, {
  broker:{
    name:'Broker de eventos · pub/sub',
    what:'Publicar e assinar é um jeito de distribuir avisos. Um serviço publica um evento, como “encomenda entregue”. Os serviços inscritos naquele assunto podem receber cada um a sua cópia.',
    example:'Ao receber o evento de entrega, o sistema de mensagens avisa a pessoa e o de indicadores atualiza os números do dia. Ambos precisam saber da mesma entrega.',
    placement:'Ligue quem publica ao broker. Crie uma saída para cada assinante que precisa receber o evento. Para dois grupos com objetivos próprios, desenhe dois destinos.',
    mistake:'Dividir os eventos pela quantidade de assinantes subestima o trabalho. Se ambos assinam o mesmo assunto, cada um recebe o fluxo completo.',
    question:'Notificações e indicadores assinam o mesmo assunto. O serviço publica dez eventos. Quantas entregas aos assinantes são necessárias?',
    options:['Cinco','Dez','Vinte'],correct:2,feedback:['Dividir por dois distribuiria o trabalho entre executores equivalentes. Aqui os grupos precisam de cópias.','Dez é a quantidade publicada originalmente.','Isso. Cada um dos dois grupos precisa receber os dez eventos.']
  },
  proxy:{
    name:'Proxy reverso',
    what:'É um intermediário na frente dos servidores de uma aplicação. O navegador chama o endereço público do proxy. O proxy encaminha o pedido ao servidor interno e devolve a resposta pelo mesmo endereço.',
    example:'Uma escola publica um portal em um endereço estável. A equipe muda o servidor interno durante uma atualização e ajusta o destino no proxy. Os alunos continuam usando o endereço conhecido.',
    placement:'Ligue Cliente → Proxy reverso → API. Trace apenas a ida. A resposta da API já retorna pelo intermediário.',
    mistake:'Encaminhar um pedido e guardar a resposta para reutilizá-la são funções diferentes. A presença de um proxy, sozinha, não implica que o banco receberá menos consultas.',
    question:'Quem o proxy reverso representa perante o navegador?',
    options:['O serviço publicado atrás dele','A pessoa que está usando o navegador','O arquivo que a pessoa vai baixar'],correct:0,feedback:['Correto. O proxy recebe chamadas em nome do serviço publicado.','Um proxy de saída pode agir em nome do cliente. A peça estudada aqui fica na entrada do serviço.','O arquivo é conteúdo. O proxy recebe e encaminha o pedido desse conteúdo.']
  },
  limiter:{
    name:'Limitador de taxa',
    what:'É uma regra de entrada que aceita uma quantidade limitada de pedidos em determinado período. Uma aplicação pode usá-la para manter trabalho suficiente dentro da capacidade de uma dependência.',
    example:'Um portal de inscrições protege o serviço de validação durante a abertura das vagas. Acima do limite, alguns pedidos recebem uma resposta orientando a tentar mais tarde.',
    placement:'Ligue o cliente ao limitador e o limitador ao serviço protegido. Compare o ritmo de chegada com a demanda que efetivamente chega ao serviço seguinte.',
    mistake:'Tratar todo pedido rejeitado como se estivesse guardado para depois confunde limitação com fila. Um pedido recusado só voltará se alguém o enviar de novo.',
    question:'Um pedido excedeu um limite que rejeita o excedente. Onde ele aguarda processamento?',
    options:['Na memória do banco','Em lugar nenhum por padrão','Na próxima réplica da API'],correct:1,feedback:['A rejeição ocorre antes de chegar ao banco.','Isso. Adiar trabalho automaticamente exigiria uma fila ou outra política explícita.','Um limite global pode rejeitar mesmo com outras peças disponíveis.']
  },
  auth:{
    name:'Serviço de identidade',
    what:'Identidade responde à pergunta “quem está fazendo o pedido?”. Um serviço pode conferir uma credencial e fornecer informações sobre a conta. Outra decisão determina se essa conta pode executar uma ação específica.',
    example:'Uma professora entra no portal com sua conta. A escola ainda precisa verificar quais turmas ela pode consultar. Saber quem entrou é apenas a primeira parte.',
    placement:'Represente a verificação de identidade na rota do pedido protegido. Antes de desenhar, decida se a aplicação consultará o serviço a cada chamada ou verificará localmente uma credencial já emitida.',
    mistake:'Confundir uma conta válida com acesso universal permite mostrar documentos de uma pessoa a outra. O acesso a cada recurso precisa de uma regra.',
    question:'Uma estudante entrou com sua própria conta. O que falta para abrir um histórico escolar específico?',
    options:['Duplicar as máquinas do portal','Tornar o histórico público','Verificar se essa conta pode acessar aquele histórico'],correct:2,feedback:['Capacidade de atender pedidos não determina permissões.','Publicar o documento eliminaria a privacidade esperada.','Isso. A aplicação deve aplicar a regra de acesso ao documento pedido.']
  },
  timeseries:{
    name:'Banco de séries temporais',
    what:'É um armazenamento preparado para medições associadas a instantes. Cada amostra pode informar quando foi coletada, qual sensor a produziu e quanto ele mediu.',
    example:'Uma estação mede a temperatura a cada minuto. Para saber quando a câmara fria começou a aquecer, a equipe pede as amostras de um sensor entre 14h e 15h.',
    placement:'Para estudar a entrada de amostras, desenhe Cliente → API → Banco temporal. Cada pedido representa uma amostra recebida. A pergunta sobre a última hora orienta o que guardar. O simulador mede a ingestão.',
    mistake:'Tentar interpretar um dado atrasado usando apenas a hora em que ele chegou pode situar um pico no instante errado. Registre a hora da medição.',
    question:'Qual pergunta combina diretamente com uma série temporal?',
    options:['Como a temperatura do sensor variou na última hora?','Qual é o texto de uma cláusula do contrato?','Quem pode alterar uma senha?'],correct:0,feedback:['Correto. A pergunta procura valores de uma medição ao longo do tempo.','O texto pode ser guardado em documentos ou registros.','Essa é uma questão de identidade e permissão.']
  },
  warehouse:{
    name:'Armazém de dados · warehouse',
    what:'É uma base voltada a análises que cruzam muito histórico. Pode reunir dados de sistemas diferentes e preparar medidas para perguntas de negócio.',
    example:'Uma cooperativa compara as entregas por cidade, por mês e por tipo de veículo durante dois anos. Para isso, reúne dados de rotas e pedidos numa base analítica.',
    placement:'Para simular uma consulta analítica, ligue Cliente → API → Warehouse. Em um desenho de produção, explique também como os dados de origem chegam à base e com que atraso.',
    mistake:'Usar um relatório atualizado de madrugada para decidir se ainda existe um produto na prateleira pode mostrar um saldo antigo. Verifique de qual instante são os dados.',
    question:'Qual tarefa é mais natural para um armazém de dados?',
    options:['Confirmar a última unidade em estoque durante o pagamento','Comparar o faturamento trimestral de cinquenta lojas','Transmitir uma imagem pública ao navegador'],correct:1,feedback:['Essa decisão exige estado operacional atualizado e controle da gravação.','Isso. A análise agrega muitos registros históricos e compara unidades ao longo do tempo.','Um armazenamento de arquivos ou uma rede de distribuição pode entregar a imagem.']
  }
});
