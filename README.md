# Vila Moeda — jogo de literacia financeira ao estilo Game Boy Advance (protótipo)

Protótipo jogável de um simulador de vida focado em literacia financeira, seguindo a
[especificação](#especificação) de um jogo com 3 modos por faixa etária. Este protótipo
implementa **apenas o modo 8-14** (título de trabalho original: "O Reino"; no jogo, a
vila chama-se **Vila Moeda**), conforme a recomendação da especificação de validar
primeiro a mecânica com o modo mais simples.

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
  | Gastar em diversão | Sr. Doce, ao balcão da Loja |
  | Investir (baixo / alto risco) | Sofia, ao balcão do Banco |
  | Estudar | Professora Luz, na Escola |
  | Exercício | Treinador Zé, no Parque |
  | Sair com amigos | Leo e Bia, no Parque |
  | Passar a semana | Dormir na tua cama |

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

## Estrutura do código

```
src/
  game/
    types.ts, data.ts, engine.ts, events.ts  - lógica financeira pura (sem React)
    mentor.ts, npcs.ts                        - falas do Mestre Moedas, Marta e Tiago
    crachas.ts                                - os 6 crachás, objetivos e lições
    pixel/
      draw.ts     - utilitários de pixel art (grelhas de caracteres → imagem, cores)
      sprites.ts  - personagens 16×24, 4 direções × 3 frames, recoloridas pelo avatar
      cenario.ts  - tiles, edifícios, mobília e ícones dos crachás
    world/
      tipos.ts    - tipos de mapas, edifícios, objetos, NPCs
      mapas.ts    - a Vila Moeda e os interiores
      motor.ts    - movimento, colisões, câmara, portas, NPCs, transições, desenho
      scripts.ts  - todas as conversas e a manhã de cada semana
  components/
    gba/
      Consola.tsx    - ecrã ampliado, teclado e botões tácteis
      GameScreen.tsx - liga o motor, os diálogos, o menu, os crachás e o dormir
      Intro.tsx      - introdução, nome e aspeto
      dialogo.tsx    - caixa de texto letra a letra e caixa de escolha
      StartMenu.tsx  - menu START
      ui.tsx         - escala, sprites em HTML, cursores
    AgeGate.tsx, ModoIndisponivel.tsx, FimDeJogo.tsx, GrowthChart.tsx
```

## Próximos passos (não implementados neste protótipo)

- Guardar o progresso (continuar o jogo noutro dia).
- Som e música.
- Mais zonas para explorar fora da vila e mais personagens com histórias.
- **Modo 15-17 ("A Cidade")**: termos reais (ações, ETFs, obrigações, inflação) com
  dinheiro simulado, primeiro emprego, notícias de mercado simuladas e diversificação.
- **Modo 18+ ("O Mercado")**: painel mais sério, ativos fictícios com padrões de
  volatilidade real, comissões e impostos, eventos de vida adulta — com aviso claro de
  que é uma simulação educativa, não aconselhamento financeiro.

## Perguntas em aberto (da especificação original)

- Nome definitivo do jogo e da moeda.
- Elementos multiplayer/social ou 100% solo.
- Se o modo 18+ vai ligar a dados reais de mercado ou manter tudo simulado.
- Modelo de negócio (gratuito, freemium, pago).

## Especificação

O documento completo de especificação (conceito, modos por idade, mecânicas, áreas de
vida e referências visuais) foi fornecido como base deste protótipo e norteou as
decisões de escopo acima.
