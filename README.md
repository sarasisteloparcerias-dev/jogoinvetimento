# O Reino — Simulador de Vida & Finanças (protótipo)

Protótipo jogável de um simulador de vida focado em literacia financeira, seguindo a
[especificação](#especificação) de um jogo com 3 modos por faixa etária. Este protótipo
implementa **apenas o modo 8-14 ("O Reino")**, conforme a recomendação da especificação
de validar primeiro a mecânica com o modo mais simples antes de expandir.

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

## O que está implementado

- **Formulário de idade**: pede a idade e escolhe o modo. Idades 15-17 e 18+ mostram um
  ecrã "em construção" a explicar o que vai lá estar (ver `src/components/ModoIndisponivel.tsx`),
  para que a estrutura de 3 modos já exista mesmo só com um implementado.
- **Criação de personagem**: nome + avatar 2D original (SVG desenhado em código),
  personalizável em cor de pele, cabelo e roupa. Sem dependência de nenhum serviço
  externo — chegámos a integrar o Ready Player Me para avatares 3D reais, mas o serviço
  foi descontinuado em janeiro de 2026 (adquirido pela Netflix), por isso optámos por
  esta solução própria e sempre disponível.
- **Cena tipo "Sims"**: em vez de uma lista de botões, o avatar aparece dentro de um
  "bairro" com 6 sítios (Mealheiro, Loja, Banco, Escola, Parque, Amigos). Tocar num
  sítio faz o avatar andar até lá, executa a ação e mostra uma bolha flutuante com o
  resultado (ex. `-10 🪙 +10 🐷`), antes de voltar ao centro.
- **Loop de jogo semanal**:
  1. O jogador recebe mesada (aumenta ligeiramente com a Educação).
  2. Pode gastar moedas em várias ações — Poupar, Gastar em diversão, Investir
     (baixo/alto risco), Estudar, Exercício, Sair com amigos — cada uma com custo e
     efeito nas 4 áreas (Dinheiro, Relações, Saúde, Educação).
  3. Ao clicar em "Avançar Semana": a poupança rende juros compostos automaticamente,
     o investimento sobe ou desce conforme o risco escolhido, as estatísticas sofrem um
     pequeno desgaste natural, e surge um evento aleatório de uma das 4 áreas.
  4. O jogador escolhe como reagir ao evento e vê a consequência imediatamente.
  5. Ao fim de 20 semanas, é mostrado um resumo com património final, estatísticas e o
     gráfico de evolução.
- **20 eventos de vida** (5 por área) com escolhas reais com trade-offs, ex: gastar tudo
  na feira da escola vs. guardar uma parte; usar a poupança para um imprevisto vs. pedir
  emprestado a um amigo (e perder pontos de relação).
- **Gráfico de evolução** (saldo / poupança / investimento por semana) com tooltip e
  crosshair ao passar o rato, para tornar visível o crescimento composto ao longo do
  tempo — o pedido central do modo 8-14 na especificação.
- Linguagem simples, sem jargão de mercado (ações, ETFs, etc. ficam para os modos
  seguintes), cores vivas e cantos arredondados, alinhado com a referência visual do
  modo 8-14.

## Estrutura do código

```
src/
  game/
    types.ts     - modelos de dados (PlayerState, eventos, ações)
    data.ts      - constantes e avatares
    events.ts    - banco de 20 eventos das 4 áreas de vida
    engine.ts    - lógica pura: ações, avanço de semana, juros, investimento
  components/
    AgeGate.tsx           - formulário de idade e seleção de modo
    ModoIndisponivel.tsx  - placeholder para os modos 15-17 e 18+
    CharacterCreation.tsx - nome + criação de avatar
    CharacterSVG.tsx       - personagem 2D original (SVG), recolorível via props
    Dashboard.tsx         - ecrã principal do jogo
    RoomScene.tsx          - cena tipo Sims com o avatar e os 6 sítios de ação
    StatBar.tsx           - barra de estatística (Relações/Saúde/Educação)
    GrowthChart.tsx        - gráfico SVG de evolução financeira
    EventModal.tsx         - modal de evento com escolhas e resultado
    FimDeJogo.tsx           - resumo final
```

A lógica de jogo (`src/game/`) é pura e independente de React, o que facilita testar e
reaproveitar quando os modos 15-17 e 18+ forem construídos.

## Próximos passos (não implementados neste protótipo)

- **Modo 15-17 ("A Cidade")**: introduzir termos reais (ações, ETFs, obrigações,
  inflação) com dinheiro simulado, primeiro emprego, "notícias" de mercado simuladas e
  diversificação de carteira.
- **Modo 18+ ("O Mercado")**: dashboard mais sério, ativos fictícios com padrões de
  volatilidade real, comissões e impostos, eventos de vida adulta (renda, carro,
  seguro, reforma) — com aviso claro de que é uma simulação educativa, não
  aconselhamento financeiro real.
- Persistência de progresso (guardar estado localmente).
- Mais opções de personalização do avatar (penteados, acessórios) — atualmente só cor
  de pele, cabelo e roupa.
- Avatares 3D reais, se um dia fizer sentido investir num serviço pago (ex. MetaPerson/
  Avatar SDK) ou numa pipeline 3D própria.

## Perguntas em aberto (da especificação original)

- Nome definitivo do jogo (título de trabalho: "O Reino").
- Nome da moeda do jogo (atualmente genérico, "moedas").
- Elementos multiplayer/social ou 100% solo.
- Se o modo 18+ vai ligar a dados reais de mercado via API ou manter tudo
  pré-calculado/simulado.
- Modelo de negócio (gratuito, freemium, pago).

## Especificação

O documento completo de especificação (conceito, modos por idade, mecânicas, áreas de
vida e referências visuais) foi fornecido como base deste protótipo e norteou as
decisões de escopo acima.
