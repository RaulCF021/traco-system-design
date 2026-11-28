export const componentCourse = {
  client: {
    when:'Comece identificando quem precisa da resposta. Pode ser um navegador, um aplicativo instalado ou outro serviço. Toda carga do laboratório entra pelas peças Cliente.',
    avoid:'Criar um cliente para cada pessoa torna o desenho ilegível. Um nó pode representar todas as pessoas que fazem o mesmo tipo de pedido.',
    tradeoff:'Separar clientes por origem ajuda a discutir necessidades diferentes. Quanto mais grupos você desenhar, mais importante será explicar como distribuiu o volume entre eles.',
    example:'Em uma bilheteria, 150 pessoas atualizam a disponibilidade duas vezes por segundo. Isso gera 300 consultas/s mesmo que nenhuma compra seja concluída.',
    walkthrough:['Monte Cliente → API e simule 300 pedidos/s. Observe a demanda recebida pela API.','Adicione outro Cliente ligado à mesma API. Mantenha o controle de carga em 300 e observe a demanda de cada cliente.','Remova o segundo cliente e dobre o controle de carga. Compare o efeito de mudar a quantidade de origens com o de mudar o total de pedidos.'],
    advanced:'Depois de um erro, uma nova tentativa pode chegar quando a primeira ainda está em andamento. Para operações com efeitos, como cobrar uma compra, usar um identificador de operação permite reconhecer a repetição. O modelo injeta tráfego constante e não gera novas tentativas sozinho.',
    alternative:'Se navegador e aplicativo seguem a mesma rota e têm o mesmo objetivo de tempo de resposta, represente os dois com uma única origem e anote a carga total.',
    check:{q:'Dois clientes dividem uma carga total configurada em 600 pedidos/s. Ambos chamam a mesma API. Quanto chega à API?',options:['300/s','600/s','1.200/s'],correct:1,feedback:['300/s é a contribuição individual de cada cliente.','Isso. Cada origem envia 300/s e os fluxos se somam na API.','Esse valor exigiria uma carga total configurada em 1.200/s.']}
  },
  api: {
    when:'Use o serviço de aplicação quando o cliente precisar de uma operação com regras próprias, como calcular frete, consultar uma agenda ou verificar um formulário.',
    avoid:'Servir uma imagem pública passando seus bytes pela aplicação pode consumir capacidade de processamento sem acrescentar uma decisão. Um endereço direto para o arquivo pode bastar.',
    tradeoff:'Uma interface estável facilita mudar a implementação sem atualizar todos os clientes. Cada dependência obrigatória, porém, acrescenta uma condição para o pedido terminar.',
    example:'Uma página de inscrição junta dados pessoais e disponibilidade. Se toda resposta precisa dos dois resultados, 300 pedidos/s geram 300 chamadas/s a cada dependência, mesmo quando as consultas ocorrem em paralelo.',
    walkthrough:['Monte Cliente → API e execute 300/s. A API termina o cálculo localmente.','Adicione PostgreSQL e Banco NoSQL como duas saídas da API. Verifique as demandas nos dois destinos.','Eleve a carga para 600/s. Descubra qual dependência limita as respostas completas.'],
    advanced:'Defina prazo e comportamento para a falha de cada dependência. Uma ficha de inscrição pode exigir o cadastro, mas tolerar recomendações temporariamente ausentes. Neste motor, todas as saídas diretas da API são obrigatórias. Uma dependência opcional exigiria outro modelo.',
    alternative:'Para operações pequenas com os dados já no aparelho, um cálculo local elimina uma viagem de rede. Avalie se a resposta depende de informação privada, compartilhada ou que muda no servidor.',
    check:{q:'Com 600 pedidos/s e duas dependências obrigatórias, uma de 450/s e outra de 1.200/s, quantas respostas completas a API consegue entregar?',options:['450/s','600/s','1.650/s'],correct:0,feedback:['Correto. Cada resposta exige o resultado da dependência de 450/s.','600/s chegariam à API, mas uma parte ficaria sem todos os resultados.','Somar as capacidades faria sentido para destinos alternativos equivalentes. Aqui cada pedido precisa dos dois.']}
  },
  postgres: {
    when:'Considere o banco relacional quando os registros têm vínculos importantes. Um atendimento pertence a uma pessoa e ocupa um horário em uma unidade.',
    avoid:'Colocar todos os dados em uma tabela enorme para evitar relações pode repetir dados e tornar uma correção inconsistente entre registros.',
    tradeoff:'Manter regras de integridade no banco ajuda a evitar combinações inválidas. Consultas que cruzam muitas tabelas podem precisar de índices, análise de planos e limites de paginação.',
    example:'Uma agenda recebe 900 leituras/s. No laboratório, duas réplicas de leitura de 450/s atingem esse volume no limite. Uma terceira deixaria 450/s de margem, ao custo adicional de 12 créditos/h.',
    walkthrough:['Monte Cliente → API → PostgreSQL, com duas réplicas de API e uma de banco. Simule 900/s.','Passe o banco para duas réplicas e confira a demanda por capacidade.','Aumente o banco para três réplicas e examine o custo e o tempo estimado. A demanda total permanece em 900/s.'],
    advanced:'Para impedir duas reservas no mesmo horário, a confirmação precisa de uma regra de unicidade e de uma operação transacional. Ler uma réplica antes de gravar não garante exclusividade. O laboratório simula leituras, sem concorrência de escrita nem atraso de replicação.',
    alternative:'Para uma consulta que sempre recupera o mesmo documento por chave, avalie também um banco por chave. Compare as regras de integridade e os outros tipos de consulta que o produto exige.',
    check:{q:'Duas pessoas tentam confirmar a última vaga. O que protege a exclusividade dessa vaga?',options:['Dobrar as réplicas de leitura','Atualizar a tela com mais frequência','Aplicar a regra de unicidade durante a confirmação no banco'],correct:2,feedback:['Réplicas ajudam a consultar. A decisão sobre a vaga acontece na gravação.','Duas telas atualizadas ainda podem enviar a confirmação ao mesmo tempo.','Isso. A operação que grava deve respeitar a regra mesmo sob pedidos concorrentes.']}
  },
  lb: {
    when:'Introduza um balanceador quando houver destinos equivalentes para uma mesma operação e um pedido puder ser atendido por qualquer deles.',
    avoid:'Distribuir os pedidos entre um serviço de cobrança e um de busca ao acaso entregaria alguns pedidos ao destino errado. Esses serviços têm responsabilidades diferentes.',
    tradeoff:'Espalhar chamadas aproveita a capacidade do conjunto. Para funcionar durante falhas, é preciso saber quais destinos estão aptos e manter capacidade suficiente nos sobreviventes.',
    example:'Um evento gera 1.400 validações/s. Duas APIs saudáveis de 800/s recebem 700/s cada. Se uma parar, a restante admite 800/s e deixa 600/s sem atendimento.',
    walkthrough:['Crie Cliente → Load balancer e conecte o balanceador a duas peças API distintas. Execute 1.400/s.','Marque uma das APIs como indisponível e rode novamente. Observe onde a carga foi parar.','Restaure a API e acrescente um terceiro destino. Repita a falha para descobrir qual conjunto ainda suporta o pico.'],
    advanced:'Sessões guardadas apenas no processo que recebeu o primeiro acesso dificultam o redirecionamento. Para que outro servidor possa continuar o atendimento, projete como ele encontrará o estado da sessão. O motor supõe destinos equivalentes e divide pedidos igualmente.',
    alternative:'Um serviço administrado pela plataforma pode oferecer balanceamento na própria entrada. Ao documentar o sistema, registre quem faz essa função para evitar contar capacidade ou custo duas vezes.',
    check:{q:'Três APIs de 800/s recebem 1.400/s. Uma fica indisponível. Quanto sobra de margem nas outras duas?',options:['200/s','600/s','1.000/s'],correct:0,feedback:['Isso. Restam 1.600/s de capacidade para 1.400/s de demanda.','600/s seria o déficit se houvesse apenas uma API disponível.','1.000/s era a margem das três APIs antes da falha.']}
  },
  redis: {
    when:'Use o cache quando muitas leituras pedirem o mesmo dado e uma cópia puder ser reutilizada durante um período conhecido. Descrições públicas de produtos são um bom exemplo.',
    avoid:'Autorizar uma compra apenas pelo estoque presente em cache pode vender a última unidade duas vezes. Revalide a disponibilidade na operação que confirma a compra.',
    tradeoff:'Uma cópia válida por mais tempo poupa consultas, mas pode exibir uma descrição antiga após uma edição. O prazo deve refletir quanto atraso o produto aceita.',
    example:'Em 700 consultas/s, 80% de acertos deixam 140/s para o banco. Se os acessos fossem todos a chaves novas, a taxa real de acerto seria menor e a origem receberia mais tráfego.',
    walkthrough:['Simule Cliente → API → PostgreSQL com 700/s e registre a vazão.','Troque a ligação direta por API → Redis → PostgreSQL. Confira a demanda em cada etapa.','Compare com a versão sem cache e duas réplicas de PostgreSQL. Registre o custo para atender os mesmos 700/s.'],
    advanced:'Quando uma chave popular vence, várias chamadas podem descobrir a mesma falta ao mesmo tempo. A aplicação pode deixar uma chamada buscar o original enquanto as outras aguardam, além de distribuir os horários de expiração. O modelo usa acertos fixos e não reproduz esse pico.',
    alternative:'Um índice melhor no banco ou uma réplica de leitura pode ser mais adequado quando os pedidos usam chaves muito variadas ou exigem sempre o dado atualizado.',
    check:{q:'Se o cache real tiver apenas 50% de acertos em 700 leituras/s, quanto o banco receberá?',options:['140/s','350/s','700/s'],correct:1,feedback:['140/s corresponde aos 80% de acertos do modelo padrão.','Correto. Metade dos 700 pedidos precisa buscar o original.','700/s chegariam na ausência de acertos.']}
  },
  cdn: {
    when:'Uma rede de distribuição de conteúdo é útil quando muitos clientes precisam dos mesmos arquivos e podem obtê-los de pontos próximos. Pense nos quadrados de imagem de um mapa público.',
    avoid:'Colocar respostas personalizadas em uma cópia compartilhada pode expor informações a outra pessoa. Defina quais respostas podem ser reutilizadas e quais características identificam a versão correta.',
    tradeoff:'A borda reduz a carga na origem e pode encurtar o caminho de rede. Em troca, publicar uma correção exige decidir como as cópias antigas serão substituídas.',
    example:'Um mapa recebe 6.000 pedidos de quadrados/s. Com 90% de acertos, 600/s chegam à origem. Se cada quadrado tiver 50 kB, esses pedidos correspondem a 30 MB/s de conteúdo antes dos custos adicionais do protocolo.',
    walkthrough:['Monte Cliente → Object storage e simule 6.000/s.','Insira a CDN entre cliente e origem. Confira os 600/s no armazenamento e a vazão final.','Anote o custo. Retire a CDN e teste quatro réplicas na origem para comparar capacidade e margem.'],
    advanced:'Inclua a versão do conjunto de imagens na chave de cada quadrado. Uma atualização passa a apontar para novos endereços, enquanto as cópias antigas podem expirar. A taxa de acerto inicial de uma versão nova tende a depender do aquecimento. O cenário assume a borda aquecida.',
    alternative:'Uma origem direta pode bastar para um acervo pequeno de acesso esporádico. Meça o volume repetido, a distribuição geográfica e o tamanho dos objetos antes de adotar a camada.',
    check:{q:'A CDN recebe 6.000 pedidos/s e atende 90% localmente. Quantos arquivos por segundo a origem fornece?',options:['5.400','6.000','600'],correct:2,feedback:['5.400 arquivos/s saem da borda.','Esse é o volume total solicitado pelos clientes.','Isso. A origem recebe os 10% que faltam, ou 600 arquivos/s.']}
  },
  storage: {
    when:'Use armazenamento de objetos quando precisar guardar e recuperar arquivos identificados por uma chave, como notas fiscais, anexos de chamados ou fotos de vistoria.',
    avoid:'Guardar as imagens sem registrar a qual pessoa, processo ou vistoria pertencem dificulta encontrá-las depois. Planeje também o registro pesquisável que aponta para a chave.',
    tradeoff:'Separar arquivo e metadados facilita servir arquivos grandes sem transferi-los pela aplicação. Essa separação cria dois estados para coordenar quando uma publicação falha no meio.',
    example:'Para 2.000 buscas/s de imagens, uma réplica do laboratório entrega 1.500/s. Duas atendem os 2.000/s por 6 créditos/h, supondo a mesma capacidade média por pedido.',
    walkthrough:['Monte Cliente → Object storage e configure 2.000/s.','Aumente o armazenamento para duas réplicas e confira a vazão e o custo.','Volte a uma réplica e insira CDN entre o cliente e o armazenamento. Compare a carga na origem.'],
    advanced:'Ao publicar um arquivo, use uma chave ligada à versão e mantenha um estado de processamento. O registro pode ficar pronto só depois que a gravação terminar. Uma limpeza posterior pode recolher arquivos abandonados após falha. O laboratório não executa uploads.',
    alternative:'Para documentos pequenos que precisam ficar na mesma transação de seus metadados, armazenar o conteúdo no banco pode simplificar a consistência. Compare tamanho, frequência de leitura e política de retenção.',
    check:{q:'O arquivo foi enviado, mas o registro da vistoria falhou antes de referenciá-lo. Qual problema merece tratamento?',options:['Um arquivo sem registro correspondente pode continuar ocupando espaço','A CDN necessariamente apagará o arquivo','Todos os arquivos passam a ter a mesma chave'],correct:0,feedback:['Isso. Reconciliação ou limpeza de objetos abandonados pode reparar essa falha parcial.','A CDN serve cópias e não coordena essa transação.','As chaves continuam distintas. O problema é a falta de vínculo com o registro.']}
  },
  queue: {
    when:'Use uma fila para aceitar trabalho que pode terminar depois da resposta ao cliente. O pedido de geração de um comprovante é um exemplo quando existe acompanhamento posterior.',
    avoid:'Quem quer saber se a transferência bancária terminou precisa de um estado explícito. Confirmar apenas que uma mensagem entrou na fila e mostrar “transferência concluída” é incorreto.',
    tradeoff:'A fila acomoda diferenças temporárias entre chegada e consumo. Se os consumidores ficarem continuamente abaixo da entrada, o atraso cresce enquanto o cliente continua recebendo confirmações rápidas.',
    example:'Com 700 mensagens/s e um worker de 350/s, entram 350 mensagens a mais por segundo. Em dez minutos de carga constante isso acumularia 210.000 mensagens.',
    walkthrough:['Monte Cliente → API → Fila → Worker → Object storage e rode com 700/s.','Compare a vazão confirmada pelo cliente, o crescimento da fila e a demanda recebida pelo armazenamento.','Duplique as réplicas do worker. Observe o crescimento chegar a zero, mantendo a confirmação no mesmo nível.'],
    advanced:'O consumidor pode gravar o resultado e falhar antes de confirmar a mensagem. Uma reentrega pode repetir o trabalho. Um identificador de operação e uma gravação capaz de reconhecer duplicatas ajudam a impedir cobranças ou documentos duplicados.',
    alternative:'Se o cliente precisa da resposta final imediatamente e a operação é curta, a execução síncrona pode ser mais simples. Dimensione o tempo e o comportamento em caso de erro antes de decidir.',
    check:{q:'Como interpretar crescimento zero da fila quando ela já contém 5.000 mensagens?',options:['As 5.000 mensagens já foram concluídas','Entradas e saídas se equilibram e o estoque pode permanecer em 5.000','O cliente deixou de enviar mensagens'],correct:1,feedback:['Crescimento mede a variação do estoque por segundo.','Correto. Para reduzir o estoque existente, a taxa de consumo precisa superar as novas chegadas.','Pode haver novas chegadas, desde que o processamento acompanhe o ritmo.']}
  },
  worker: {
    when:'Use um executor em segundo plano para tarefas que exigem tempo de processamento independente do atendimento da tela. Um portal pode enfileirar pedidos de conversão de arquivos.',
    avoid:'Aumentar o número de executores sem medir as próximas etapas pode só deslocar o gargalo para o banco ou para a gravação dos resultados.',
    tradeoff:'Mais réplicas aumentam o trabalho que pode terminar em paralelo e a despesa por hora. Dependências lentas, limites de terceiros e tarefas de tamanhos diferentes afetam o ganho real.',
    example:'Dois workers de 350/s acompanham 700 chegadas/s. Um terceiro cria 350/s de folga. Para 21.000 tarefas já pendentes, essa folga permitiria recuperar o atraso em 60 segundos sob condições constantes.',
    walkthrough:['Na rota Cliente → API → Fila → Worker → Object storage, configure duas réplicas no worker e 700/s.','Reduza o worker para uma réplica. Compare o crescimento da fila com a demanda recebida pelo armazenamento.','Suba para três réplicas. Calcule a folga para recuperação multiplicando a capacidade individual pelas três réplicas e subtraindo a chegada.'],
    advanced:'Um relatório de duas páginas e outro de duas mil podem ter custos muito diferentes. Compare também idade da tarefa mais antiga e tempo de execução por tipo. A capacidade fixa por réplica do modelo representa uma carga homogênea.',
    alternative:'Para uma tarefa periódica previsível, um processamento em lote agendado pode ser suficiente. Verifique quanto tempo cada resultado pode esperar e como recuperar uma execução perdida.',
    check:{q:'Com 700 novas tarefas/s e capacidade de 1.050/s, quanto tempo seria necessário para drenar 7.000 tarefas antigas?',options:['10 segundos','A fila nunca diminuiria','20 segundos'],correct:2,feedback:['Essa conta usaria as 700 chegadas/s como se fossem capacidade excedente.','Há capacidade excedente de 350/s neste caso.','Isso. A folga é 350/s e 7.000 ÷ 350 = 20 segundos.']}
  },
  search: {
    when:'Adote um índice de busca quando as pessoas procuram documentos por palavras ou precisam ordenar resultados por relevância. Uma biblioteca de formulários pode encontrar “licença” em títulos e descrições.',
    avoid:'Transformar o índice na única cópia dos documentos dificulta reconstruí-lo depois de mudar o processamento do texto. Defina a fonte de referência e um processo de reindexação.',
    tradeoff:'Preparar uma estrutura de busca acelera a consulta. Alterações no original precisam chegar ao índice e podem ficar temporariamente invisíveis ou aparecer com texto antigo.',
    example:'Uma API recebe 750 pesquisas/s. Um índice de 600/s limita as respostas. Ao duplicar o índice, a capacidade de busca sobe a 1.200/s, e a API de 800/s passa a ser o próximo limite.',
    walkthrough:['Monte Cliente → API → Índice de busca e execute 750/s.','Duplique as réplicas do índice e compare a vazão final.','Com o índice duplicado, eleve a carga a 1.000/s e identifique qual peça satura primeiro.'],
    advanced:'O usuário pode encontrar no índice um documento cujo acesso foi revogado na fonte. Inclua uma estratégia de atualização das permissões e verificação de acesso antes de entregar conteúdo restrito. O modelo calcula tráfego e não implementa controle de acesso.',
    alternative:'Se basta buscar por um identificador ou por campos simples, comece avaliando os índices do próprio banco. Introduzir um mecanismo externo acrescenta sincronização e operação.',
    check:{q:'Uma API de 800/s consulta duas réplicas de índice de 600/s. Com 1.000 pesquisas/s, qual é a vazão máxima desse caminho?',options:['800/s','1.000/s','1.200/s'],correct:0,feedback:['Isso. A API limita a entrada que o conjunto de índices recebe.','A demanda chega a 1.000/s, mas a API admite apenas 800/s.','Esse é o teto da camada de busca isolada.']}
  },
  nosql: {
    when:'Uma estrutura por chave é natural quando a consulta já conhece o identificador exato. Por exemplo, um aplicativo usa o número de um dispositivo para recuperar sua configuração.',
    avoid:'Escolher esse desenho para responder perguntas abertas sobre todos os dispositivos pode obrigar a percorrer muitos registros. Liste os padrões de acesso antes de escolher o armazenamento.',
    tradeoff:'Agrupar os dados usados juntos em um documento pode reduzir viagens ao armazenamento. Repetir um mesmo atributo em muitos documentos exige decidir como manter essas cópias coerentes.',
    example:'Uma camada de API com duas réplicas comporta 1.600/s. Um nó NoSQL do laboratório atende 1.200 consultas/s quando as chaves se distribuem bem. Para 1.400 pedidos/s, a primeira limitação estará no banco.',
    walkthrough:['Monte Cliente → API → Banco NoSQL. Use duas réplicas da API e 1.400/s de carga.','Aumente o banco para duas réplicas e confira a nova vazão.','Reduza a API a uma réplica e verifique por que aumentar apenas o banco deixou de ajudar.'],
    advanced:'A partição é o grupo de dados servido por uma unidade de armazenamento. Mesmo com muitas partições, uma chave muito popular pode concentrar a carga em uma só. O modelo supõe distribuição equilibrada e não revela esse problema automaticamente.',
    alternative:'Use tabelas relacionais quando consultas cruzadas e regras entre registros forem centrais. As famílias NoSQL têm garantias diferentes, então verifique a implementação concreta antes de decidir sobre transações.',
    check:{q:'Quase todos os pedidos apontam para o mesmo dispositivo. Que premissa do exercício precisa ser revista?',options:['Todos os clientes têm uma tela','As chaves dividem a carga de forma equilibrada','A aplicação conhece o identificador do dispositivo'],correct:1,feedback:['Uma tela não participa da distribuição de dados entre partições.','Correto. Uma chave muito popular pode concentrar o trabalho.','O identificador continua conhecido. O problema é a frequência desigual de acesso.']}
  },
  gateway: {
    when:'Uma porta de entrada de APIs é útil quando clientes acessam vários serviços sob um endereço comum e a equipe quer aplicar regras compartilhadas de entrada.',
    avoid:'Concentrar regras de pedido, estoque e faturamento no gateway faz alterações de produto dependerem da infraestrutura de entrada. Mantenha claras as responsabilidades dos serviços internos.',
    tradeoff:'O gateway oferece um ponto para limitar chamadas e encaminhá-las, mas introduz custo, latência e uma dependência comum. Uma falha nessa entrada pode afetar serviços que continuam saudáveis.',
    example:'Um gateway de 2.200/s encaminha chamadas para uma API com três réplicas de 800/s. Quando chegam 2.400/s, a entrada limita a vazão a 2.200/s, mesmo com capacidade suficiente no destino.',
    walkthrough:['Monte Cliente → API gateway → API, configure três réplicas de API e aplique 2.400/s.','Duplique as réplicas do gateway e compare a capacidade e a vazão.','Reduza a API a duas réplicas para observar quando o gargalo muda de camada.'],
    advanced:'Um gateway real pode encaminhar o caminho de cobrança ao financeiro e o de entrega à logística. O motor não classifica pedidos por endereço. Para representar essas rotas, simule uma operação de cada vez. Múltiplas saídas diretas deste nó modelam dependências simultâneas.',
    alternative:'Uma aplicação com uma API pública pode aplicar autenticação e limites no próprio serviço ou em uma entrada gerenciada existente. Defina primeiro quais políticas realmente precisam ser comuns.',
    check:{q:'Após duplicar o gateway, restam duas réplicas de API de 800/s e chegam 2.400 pedidos/s. Qual camada limita a vazão?',options:['O cliente, a 800/s','O gateway, a 2.200/s','A camada de API, a 1.600/s'],correct:2,feedback:['O cliente injeta a carga definida no exercício.','Duas réplicas do gateway têm capacidade agregada de 4.400/s.','Isso. Duas APIs de 800/s admitem 1.600 pedidos/s no conjunto.']}
  }
};
