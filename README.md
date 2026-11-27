# Traço

Laboratório interativo de System Design em português. A trilha reúne seis aulas, missões com critérios mensuráveis, um tutorial de montagem e experimentos A/B sobre cache, filas e balanceamento.

## Executar

Com Node.js 22 ou superior instalado, rode `npm start` na raiz do projeto e abra <http://127.0.0.1:5187>. No Windows também é possível usar `Iniciar.cmd`. O projeto serve módulos JavaScript diretamente, sem instalação de dependências. Para usar outro servidor estático, sirva a pasta `dist`.

## Estudar

A entrada **Começar do zero** acompanha um pedido de faixas de um álbum. Em seguida, o guia apresenta as peças, a primeira montagem orienta cada ligação e a oficina **Como decidir** ensina a perguntar, medir e comparar alternativas. A carga e o requisito de atualização podem ser explorados na oficina. O menu **Praticar** reúne os desafios, os experimentos e o editor livre. O navegador guarda as etapas concluídas e os desenhos localmente.

O simulador estima demanda, vazão, latência média, crescimento de fila e custo relativo. Capacidades e taxas de acerto são hipóteses didáticas. As aulas de Netflix e Spotify incluem referências técnicas das empresas.

## Verificar o motor

Execute `npm test`. Os testes cobrem dependências, cache, gargalos, balanceamento, falhas e filas.

A fonte Fraunces acompanha a distribuição sob a licença em `dist/fonts/fraunces-license.txt`.
