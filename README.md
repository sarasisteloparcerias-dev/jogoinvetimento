# Vila Moeda — jogo de literacia financeira ao estilo Game Boy Advance (protótipo)

Protótipo jogável de um simulador de vida focado em literacia financeira, seguindo a
[especificação](#especificação) de um jogo com 3 modos por faixa etária. Os três
modos estão feitos:

| Idade | Modo |
|---|---|
| 8-11 | **Vila Moeda** (título de trabalho original: "O Reino") |
| 12-14 | escolhem entre os dois no ecrã inicial |
| 15-17 | **A Cidade** |
| 18+ | **O Mercado** (vida adulta) |

Jogar online: https://sarasisteloparcerias-dev.github.io/jogoinvetimento/

## Como correr

```bash
npm install
npm run dev
```

Abre o URL indicado pelo Vite (por omissão `http://localhost:5173`).

Para produção:

```bash
npm run build
npm run preview
```

## Como se joga

| Tecla | Botão no ecrã | O que faz |
|---|---|---|
| Setas | D-pad | Andar (um toque curto só vira a personagem) |
| Z, Espaço ou Enter | A | Falar, ler placas, usar objetos, avançar o texto, confirmar |
| X ou Esc | B | Cancelar / voltar |
| M ou Tab | START | Abrir o menu |

## O que está implementado

- **Um jogo, não uma página web**: o ecrã é um `<canvas>` à resolução nativa do GBA
  (240×160), ampliado sem desfocar (`image-rendering: pixelated`), dentro de uma
  "consola" com D-pad, A, B e START tácteis para telemóvel. Não há painéis à volta:
  o dinheiro e as estatísticas vivem no menu START, como nos jogos de GBA.
- **Pixel art desenhada em código**: tiles de 16×16 (relva, terra, água animada,
  árvores, flores, cercas, placas), edifícios com telhado, janelas, porta e letreiro,
  mobília de interiores (cama, mealheiro, estantes, balcões, cofre, quadro, carteiras).
  Tudo original, nada copiado da Nintendo.
- **Personagens a andar a sério**: sprites 16×24 em 4 direções × 3 frames (pernas a
  alternar), movimento tile a tile com deslocação suave, NPCs que passeiam e se viram
  para ti quando lhes falas. O avatar escolhido na introdução (pele, cabelo, penteado,
  roupa) é o mesmo que anda no mundo.
- **Vila Moeda + interiores onde se entra**: mapa de 30×24 tiles com a tua casa, a casa
  da Avó Rosa, Loja, Banco, Escola, Parque com campo de futebol, lago e casas de vizinhos
  (trancadas). Cada porta leva a uma sala onde se anda, com transição para preto, e ao
  sair voltas à frente da porta.
- **Diálogo como no GBA**: texto a aparecer letra a letra, páginas automáticas, seta ▼,
  caixa de escolha SIM/NÃO com cursor ▶, nome de quem fala.
- **Cada ação financeira acontece num sítio do mundo** (a lógica em `engine.ts` é a mesma):

  | Ação | Onde |
  |---|---|
  | Poupar 10 moedas | Mealheiro no teu quarto |
  | Gastar em diversão | Sr. Doce, ao balcão da Loja (mini-jogo do gelado) |
  | Investir (baixo / alto risco) | Sofia, ao balcão do Banco |
  | Estudar | Professora Luz, na Escola |
  | Exercício | Treinador Zé, no Parque (mini-jogo de penáltis) |
  | Sair com amigos | Leo e Bia, no Parque (mini-jogo de bicicleta) |
  | Passar a semana | Dormir na tua cama |

- **Mini-jogos** (ecrã próprio, mesmos botões, com título, instruções e resultado):
  - **Penáltis** com o Treinador Zé: uma mira anda pela baliza e remata-se com A;
    5 remates contra um guarda-redes que se atira para um lado ao acaso.
  - **Passeio de bicicleta** com o Leo e a Bia, ao estilo Subway Surfers: 3 faixas,
    setas para mudar de faixa, A para saltar cones e poças, estrelas para apanhar, 30
    segundos e 3 vidas.
  - **Faz o teu gelado** na Loja: a máquina deixa cair bolas, apanham-se com o cone e
    segue-se o pedido do Sr. Doce para ganhar mais pontos.
  - A **bola** do Parque deixa jogar penáltis **de graça**.

  Paga-se primeiro (como antes); jogar bem só dá um pequeno bónus nas estatísticas,
  nunca moedas. No fim de cada um há uma lição curta: treinar é como poupar (os
  treinos somam-se), vale a pena poupar para coisas que duram (a bicicleta da Marta),
  e gastar em coisas que acabam depressa chama-se CONSUMO.
- **Explicações para crianças dentro do jogo**:
  - **Introdução** com o Mestre Moedas, que explica a vila e te deixa escolher o nome e o aspeto.
  - **Tutorial** da Mãe na primeira manhã (como falar, onde poupar, como passar a semana).
  - **Manhã de cada semana**: a Mãe dá a mesada e explica com os números reais do teu
    jogo o que aconteceu ao teu dinheiro (ex. *"O teu mealheiro tinha 30 moedas e agora
    tem 31,20… isso chama-se JURO"*; *"O teu investimento desceu… calma, há semanas más"*).
  - **Eventos da semana** (20, 5 por área de vida) jogados como diálogo com escolhas, e
    o resultado de cada escolha explicado.
  - **6 crachás** (como os crachás de ginásio): Poupança, Juro, Investidor, Risco,
    Reserva e Objetivo. Cada um ensina um conceito, e ao ganhá-lo o Mestre Moedas
    explica o que aprendeste. O menu **OBJETIVO** diz sempre qual é o próximo desafio.
  - **Personagens que ensinam por histórias** (ao estilo dos vídeos da Tuttle Twins):
    Mestre Moedas (6 temas: poupar, investir, risco, juros, reserva de emergência,
    inflação), Marta (poupar para a bicicleta), Tiago (o pneu furado sem poupanças),
    Avó Rosa (a macieira e o juro composto), e outras falas curtas pela vila.
  - **Placas** com dicas, uma **televisão** com um anúncio (e o truque de esperar um dia
    antes de comprar), e um **quadro** na escola com as palavras-chave.
- **Menu START**: MOCHILA (carteira, mealheiro, investimento e total, com uma frase a
  explicar cada um), FICHA (Relações, Saúde, Educação, semana), CRACHÁS, OBJETIVO e
  GRÁFICO (evolução por semana).
- **Fim das 20 semanas**: o Mestre Moedas faz o resumo e aparece o ecrã final com
  crachás, totais e gráfico.

## A Cidade (12-17 anos)

Usa o mesmo motor (andar, portas, diálogos, mini-jogos), mas com um mundo, personagens
e dinheiro próprios desta idade. Os termos são reais (ações, ETFs, obrigações, cripto,
inflação, comissões); o dinheiro e as empresas são inventados. O jogo diz isto
claramente na introdução e no fim: é uma simulação educativa, não aconselhamento
financeiro.

- **Cidade** de 36×30 tiles com estradas, passadeiras, passeios, semáforos, carros
  estacionados, uma praça em calçada portuguesa com fonte, parque com lago e campo de
  jogos. Prédios de vários andares, com montras e toldos nas lojas.
- **Personagens adolescentes** de 16×32 (dois tiles de altura), com proporções mais
  próximas das reais.
- **Onde se faz cada coisa**:

  | O quê | Onde |
  |---|---|
  | Mesada (10€/semana), lanche e passe (~6€) | Casa (a Mãe explica de manhã) |
  | Orçamento semanal | Computador do quarto |
  | Primeira conta: Conta Jovem (sem custos) ou Conta Standard (brinde, mas 1€/semana) | Rita, no Banco Ponte |
  | Aprender sobre ações, ETFs, obrigações, cripto, inflação, diversificar, risco | Mestre Moedas, consultor no Banco Ponte (abre a app INVESTIR) |
  | Primeiro emprego (escolhe um, até 2 turnos por semana) | Café (D. Clara, mini-jogo **Turno no Café**, 15€ + gorjetas), **Entregas** de bicicleta (Marco, ao pé do cruzamento, 12€ + 1€ por entrega), **Babysitting** (Sra. Helena, no parque, jogo de memória, 16€ + extra) ou **Explicações** (Prof. Nuno, quiz, 20€ + 1€ por resposta certa, pede Educação 60) |
  | Estudar (grátis, 1 vez por semana) | Biblioteca e Prof. Nuno, na Escola Secundária |
  | Compras por impulso, com a regra das 48 horas | Montras da MegaStore |
  | Bicicleta (lanche pago), **bowling** ou só conversar (grátis) | Rui e Inês, no parque |
  | Penáltis (grátis) | Duarte, no campo de jogos |
  | Publicidade disfarçada de conselho | Kiko, o influencer da LuaCoin |

- **Telemóvel** (START) em vez do menu: BANCO (conta, poupança a 3% ao ano,
  débitos diretos que se podem cancelar), INVESTIR (5 ativos, comprar 10€ ou
  50€, vender, gráfico do preço, risco de 1 a 5), JORNAL (notícias), OBJETIVO (Viagem de
  Finalistas e conquistas) e PERFIL (estatísticas e gráfico).
- **5 ativos fictícios**: Obrigações do Tesouro (risco 1), ETF Mundo (3), PixelSoft (4),
  Refrescos Brisa (3) e LuaCoin (5). Os preços mudam todas as semanas com uma notícia.
  Algumas notícias são fixas para contar uma história: a LuaCoin sobe com a moda e cai
  70%, há uma crise a meio do ano seguida de recuperação, e um escândalo afunda só a
  Brisa (quem diversificou quase não sente).
- **Cada manhã**: movimentos da conta (mesada, despesas, comissões, prestações, juro),
  inflação (~0,3% por semana; a Mãe mostra o lanche a ficar mais caro), a notícia, o
  que aconteceu à tua carteira, lições do Mestre Moedas nos momentos certos e um
  evento da semana.
- **17 eventos** desta idade: streaming (2€/semana), a colega que jura que a LuaCoin vai
  triplicar, uma burla por SMS, "compra agora, paga depois" (prestações com multa se
  falhares), anúncios nas redes, emprestar dinheiro a um amigo, ecrã partido, semana de
  exames vs. turno extra, festa de anos, concerto, vender roupa usada, prenda da avó,
  gripe, voluntariado, turno extra e telemóvel novo.
- **7 conquistas**: Primeira Conta, Primeiro Salário, Carteira Diversificada, Mão Firme
  (não vender na crise), Anti-Burla, Fundo de Emergência (100€) e Viagem de Finalistas
  (400€ entre poupança e investimentos, o objetivo do ano).
- **24 semanas** (um ano letivo). No fim, bolsa de mérito de 100€ para quem tiver
  Educação alta, balanço do Mestre Moedas e ecrã final com o gráfico.

## O Mercado (18+)

A vida adulta, na mesma cidade e com o mesmo motor. Cada noite na cama passa **um mês**;
o jogo dura **24 meses**. O objetivo é juntar **8.000€ de património líquido** (o que
tens menos o que deves) para a entrada de uma casa. Os termos são reais e os valores
simplificados; os ativos são inventados. O jogo avisa na introdução e no fim que é uma
simulação educativa e não aconselhamento financeiro.

- **Profissão à escolha** no início: assistente de projeto na Nexo Digital (1.300€,
  mini-jogo **Caixa de entrada**: separar trabalho de spam e burlas), serviço de mesa no
  Café (1.050€ + gorjetas, Turno no Café) ou estafeta na RapidEntregas (1.100€, mais
  saúde, mini-jogo **Entregas**). Uma vez por mês há um dia de trabalho intenso que conta
  para a Carreira. No computador do quarto podes **procurar outro emprego** (entrevista,
  e a Carreira desce um pouco ao mudar de área).
- **Salário**: o recibo (computador do quarto e app MÊS) mostra bruto − Segurança
  Social − retenção de IRS = líquido.
- **Casa**: quarto partilhado (380€), T1 (620€ + contas) ou voltar para casa dos pais
  (150€ de ajuda). Muda-se na Imobiliária, com caução de 2 rendas e a regra de um terço
  do salário.
- **Despesas todos os meses**: renda, supermercado (a marca branca poupa 20%), passe e
  telemóvel, ginásio, débitos diretos e prestações. Inflação de ~3% ao ano.
- **Banco Ponte**: depósito (2,5% ao ano, desce para 1,5% quando o banco central baixa os
  juros; 28% de imposto sobre os juros), PPR (desconta 20% no IRS, até 400€), cartão de
  crédito (~21% ao ano se não pagares tudo) e crédito pessoal com TAEG. Se o dinheiro não
  chegar, sai do depósito e depois fica em dívida, com juros.
- **Corretora** (aberta pelo Mestre Moedas, agora planeador financeiro): 6 ativos com
  oscilações mensais realistas, comissão de 1€ por ordem, 28% de imposto sobre o lucro
  ao vender e um **plano mensal** automático no ETF Mundo (custo médio). Ao longo dos 2
  anos há uma bolha da LuaCoin, uma recessão com lay-off, a recuperação, um escândalo
  numa empresa e a moda das renováveis.
- **Finanças**: o IRS entrega-se de abril a junho (reembolso, mais a dedução do PPR);
  fora do prazo há multa.
- **Trabalho e vida**: avaliação anual com pedido de aumento, turnos ao fim de semana no
  Café, **compras do mês** no supermercado (mini-jogo: apanhar o que está na lista e
  fugir às compras por impulso; seguir a lista baixa a conta do mês seguinte),
  **treino no ginásio** (mini-jogo de força; pagar não chega, é preciso ir), almoço em
  casa dos pais, futebol, bicicleta e bowling com os amigos.
- **20 eventos** da vida adulta: subscrições, o colega da LuaCoin, esquema em pirâmide,
  phishing, lay-off, Black Friday, crédito para férias, telemóvel a prestações,
  casamento, herança, seguro de saúde, dentista, formação, trabalho extra, adotar um cão,
  subida da renda, multa...
- **9 conquistas**: Fundo de Emergência (3 meses de despesas), IRS Entregue, Investidor
  Regular, Carteira Diversificada, Mão Firme, Anti-Burla, Aumento, Zero Juros e Entrada
  da Casa.
- **Painel** (START): BANCO, INVESTIR, MÊS (orçamento e taxa de poupança), JORNAL, METAS
  e PERFIL.

## Estrutura do código

```
src/
  game/
    types.ts, data.ts, engine.ts, events.ts  - lógica financeira pura (sem React)
    mentor.ts, npcs.ts                        - falas do Mestre Moedas, Marta e Tiago
    crachas.ts                                - os 6 crachás, objetivos e lições
    pixel/
      draw.ts     - utilitários de pixel art (grelhas de caracteres → imagem, cores)
      sprites.ts  - personagens 16×24 (crianças) e 16×32 (adolescentes), 4 direções × 3 frames
      cenario.ts  - tiles, edifícios, mobília e ícones dos crachás
    minijogos/
      futebol.ts, bicicleta.ts, gelado.ts, cafe.ts, supermercado.ts, ginasio.ts,
      entregas.ts, babysitting.ts, explicacoes.ts, emails.ts, bowling.ts - os 11 mini-jogos
      tipos.ts, index.ts                  - interface comum e criação por tipo
    modo.ts       - o que todos os modos partilham (estado base e ações dos guiões)
    world/
      tipos.ts    - tipos de mapas, edifícios, objetos, NPCs
      mapas.ts    - a Vila Moeda e os interiores
      motor.ts    - movimento, colisões, câmara, portas, NPCs, transições, desenho (recebe os mapas e sprites do modo)
      scripts.ts  - conversas da Vila Moeda e a manhã de cada semana
    cidade/
      tipos.ts, economia.ts - estado, ativos, notícias, inflação e a semana d'A Cidade
      eventos.ts, conquistas.ts - eventos e conquistas desta idade
      trabalhos.ts              - os 4 part-times (pagamento, mini-jogo, efeitos)
      mapas.ts, scripts.ts      - a cidade, os interiores e as conversas
    mercado/
      tipos.ts, economia.ts - estado, salário, despesas, impostos, dívidas e o mercado de cada mês
      eventos.ts, conquistas.ts, mapas.ts, scripts.ts - eventos, conquistas, mundo e conversas d'O Mercado
      profissoes.ts - as 3 profissões (salário, gorjetas, mini-jogo, efeitos)
  components/
    gba/
      Consola.tsx    - ecrã ampliado, teclado e botões tácteis
      GameScreen.tsx - liga o motor, os diálogos, o menu e as conquistas de qualquer modo
      modo.ts, modoVila.ts, modoCidade.ts, modoMercado.ts - o que define cada modo (mapas, sprites, guiões, menu)
      telefone.tsx   - moldura e peças comuns do telemóvel e do painel
      Telemovel.tsx  - o telemóvel d'A Cidade
      Painel.tsx     - o painel d'O Mercado
      Intro.tsx      - introdução, nome e aspeto
      dialogo.tsx    - caixa de texto letra a letra e caixa de escolha
      StartMenu.tsx  - menu START
      MiniJogoView.tsx - mostra um mini-jogo na consola (título, jogo, resultado)
      ui.tsx         - escala, sprites em HTML, cursores
    AgeGate.tsx, FimDeJogo.tsx, FimCidade.tsx, FimMercado.tsx, GrowthChart.tsx
```

## Próximos passos (não implementados neste protótipo)

- Guardar o progresso (continuar o jogo noutro dia).
- Som e música.
- Mais zonas para explorar fora da vila e mais personagens com histórias.

## Perguntas em aberto (da especificação original)

- Nome definitivo do jogo e da moeda.
- Elementos multiplayer/social ou 100% solo.
- Se o modo 18+ vai ligar a dados reais de mercado ou manter tudo simulado.
- Modelo de negócio (gratuito, freemium, pago).

## Especificação

O documento completo de especificação (conceito, modos por idade, mecânicas, áreas de
vida e referências visuais) foi fornecido como base deste protótipo e norteou as
decisões de escopo acima.
