import type { Modo } from './gravar'

/**
 * Ligação do jogo ao Referencial de Educação Financeira (DGE, ANQEP e CNSF, 2013),
 * o documento que as escolas usam para a educação financeira.
 */
export const TEMAS_REFERENCIAL = [
  'Planeamento e gestão do orçamento',
  'Sistema e produtos financeiros básicos',
  'Poupança',
  'Crédito',
  'Ética',
  'Direitos e deveres',
] as const

export type TemaReferencial = (typeof TEMAS_REFERENCIAL)[number]

export interface FichaFase {
  /** Idade aconselhada para quem joga. */
  idade: string
  /** Níveis de ensino onde a fase encaixa melhor. */
  niveis: string
  referencial: TemaReferencial[]
  /** Temas concretos que aparecem no jogo. */
  temas: string[]
  /** O que a turma deve saber no fim. */
  objetivos: string[]
  /** Pergunta para abrir a aula, antes de jogar. */
  antes: string
  /** O que pedir durante o jogo. */
  missoes: string[]
  /** Perguntas para o debate no fim (também aparecem no resumo de cada fase). */
  conversa: string[]
  /** Uma atividade fora do ecrã. */
  atividade: string
}

export const FICHAS: Record<Modo, FichaFase> = {
  reino: {
    idade: '8-11 anos',
    niveis: '1.º e 2.º ciclo',
    referencial: ['Planeamento e gestão do orçamento', 'Poupança', 'Sistema e produtos financeiros básicos', 'Ética'],
    temas: ['Gastar, poupar e investir', 'Juro e juro composto', 'Risco e paciência', 'Reserva para imprevistos', 'Objetivos de poupança', 'Comparar preços e dar o troco', 'Solidariedade'],
    objetivos: [
      'Distinguir necessidades de desejos.',
      'Dividir o dinheiro entre gastar, poupar e investir.',
      'Perceber que o dinheiro guardado no banco rende juros, e que o juro composto cresce com o tempo.',
      'Comparar preços e calcular trocos.',
      'Perceber porque é útil ter uma reserva para imprevistos.',
    ],
    antes: 'Se recebesses 10 moedas por semana, o que farias com elas?',
    missoes: ['Pôr moedas no mealheiro e no banco.', 'Ganhar 5 crachás para passar à fase seguinte.', 'Jogar o mini-jogo do troco na loja do Sr. Doce.', 'Ajudar a campanha solidária da escola.'],
    conversa: ['Para que estás a poupar? Quanto falta?', 'Quando é que vale a pena esperar antes de comprar?', 'Porque é que o pacote grande nem sempre é o mais barato?'],
    atividade: 'Cada estudante desenha o seu "mealheiro de objetivos": o que quer comprar, quanto custa e quantas semanas precisa de poupar.',
  },
  cidade: {
    idade: '12-17 anos',
    niveis: '3.º ciclo e secundário',
    referencial: ['Sistema e produtos financeiros básicos', 'Poupança', 'Planeamento e gestão do orçamento', 'Direitos e deveres'],
    temas: ['Conta bancária e comissões', 'Primeiro trabalho e rendimento', 'Ações, ETFs, obrigações e cripto', 'Diversificação e crises', 'Inflação', 'Burlas e publicidade escondida', 'Negociar a mesada, bicicleta contra passe'],
    objetivos: [
      'Comparar contas bancárias e as suas comissões.',
      'Explicar a diferença entre ações, ETFs, obrigações e criptomoedas, e o risco de cada um.',
      'Perceber o que é diversificar e porque as crises passam.',
      'Reconhecer publicidade escondida e burlas online.',
      'Perceber como a inflação faz perder valor ao dinheiro parado.',
    ],
    antes: 'Já viste algum anúncio a prometer dinheiro fácil? Como sabes se é verdade?',
    missoes: ['Abrir conta no banco e comparar comissões.', 'Investir sem pôr tudo no mesmo sítio.', 'Encontrar os anúncios escondidos no feed do Kiko.', 'Fazer o orçamento no computador de casa.'],
    conversa: ['Como reconheces publicidade nas redes sociais?', 'O que farias se um investimento descesse 20%?', 'Porque é que guardar dinheiro parado perde valor com a inflação?'],
    atividade: 'Em grupos, a turma analisa três publicações de redes sociais e decide se são publicidade, conselho honesto ou burla, explicando porquê.',
  },
  mercado: {
    idade: '15+ anos',
    niveis: 'Secundário, ensino profissional e formação de adultos',
    referencial: ['Planeamento e gestão do orçamento', 'Crédito', 'Sistema e produtos financeiros básicos', 'Direitos e deveres'],
    temas: ['Salário bruto e líquido, IRS e Segurança Social', 'Orçamento mensal e fundo de emergência', 'Cartão de crédito, TAEG e crédito pessoal', 'Investir todos os meses (custo médio)', 'Contratos de arrendamento', 'Recibos verdes', 'Carta de condução e custo de um carro'],
    objetivos: [
      'Ler um recibo de vencimento: bruto, descontos e líquido.',
      'Montar um orçamento mensal com fundo de emergência.',
      'Comparar créditos pela TAEG e perceber o custo de pagar só o mínimo do cartão.',
      'Identificar cláusulas importantes num contrato de arrendamento.',
    ],
    antes: 'Se ganhasses 1000€ brutos por mês, quanto achas que receberias na conta?',
    missoes: ['Pagar a renda e as contas todos os meses sem falhar.', 'Juntar um fundo de emergência.', 'Comparar ofertas com a Rita (mini-jogo de comparar).', 'Ler o contrato da casa com a Carla.'],
    conversa: ['Quanto do salário vai para despesas fixas?', 'Como se compara o custo de dois créditos?', 'Que cláusulas de um contrato merecem atenção?'],
    atividade: 'Com um recibo de vencimento fictício, a turma calcula o líquido e faz um orçamento para um mês a viver sozinho.',
  },
  casa: {
    idade: '15+ anos',
    niveis: 'Secundário, ensino profissional e formação de adultos',
    referencial: ['Crédito', 'Planeamento e gestão do orçamento', 'Direitos e deveres', 'Sistema e produtos financeiros básicos'],
    temas: ['Entrada, escritura e crédito à habitação', 'Taxa fixa e variável (Euribor)', 'Taxa de esforço', 'IMI, condomínio e seguros', 'Amortizar e vender casa (mais-valias)', 'Obras e reparações', 'Família e orçamento'],
    objetivos: [
      'Perceber os custos de comprar casa além do preço: entrada, impostos e escritura.',
      'Comparar taxa fixa e variável e o efeito da Euribor na prestação.',
      'Calcular a taxa de esforço.',
      'Planear despesas que aparecem com a família e com a casa.',
    ],
    antes: 'Comprar casa ou arrendar: o que achas que sai mais caro ao fim de 30 anos?',
    missoes: ['Comprar casa com um crédito que caiba no orçamento.', 'Decidir entre taxa fixa e variável.', 'Manter a taxa de esforço controlada quando os juros sobem.', 'Ajudar os vizinhos Silva.'],
    conversa: ['Quanto pode subir a prestação se os juros subirem?', 'Porque é que comprar e vender casa custa tanto?', 'Que despesas aparecem quando nasce um filho?'],
    atividade: 'A turma escolhe um anúncio de casa real e calcula a entrada, a prestação aproximada e a taxa de esforço para um salário dado.',
  },
  negocio: {
    idade: '15+ anos',
    niveis: 'Secundário, ensino profissional e formação de adultos',
    referencial: ['Planeamento e gestão do orçamento', 'Crédito', 'Direitos e deveres', 'Ética'],
    temas: ['Investimento inicial e empréstimo', 'Preço, procura e capacidade', 'Salários, TSU e subsídios', 'IVA e IRC', 'Lucro contra caixa', 'Fundo de maneio', 'Burlas com faturas falsas'],
    objetivos: [
      'Perceber os custos de ter pessoas a trabalhar: salário, TSU e subsídios.',
      'Explicar porque o IVA cobrado não é dinheiro da empresa.',
      'Distinguir lucro de dinheiro em caixa.',
      'Reconhecer burlas com faturas falsas.',
    ],
    antes: 'Se vendes um café a 1€, quanto desse euro achas que fica para quem tem o café?',
    missoes: ['Abrir a empresa e escolher o preço.', 'Pagar salários, IVA e IRC a tempo.', 'Atender clientes no balcão e dar o troco certo.', 'Falar com a contabilista antes de decisões grandes.'],
    conversa: ['Porque é que o dono é o último a receber?', 'Qual é a diferença entre lucro e dinheiro na caixa?', 'Porque é que o IVA cobrado não é da empresa?'],
    atividade: 'Em grupos, a turma inventa um pequeno negócio e faz as contas de um mês: vendas, custos, salários, IVA e o que sobra.',
  },
  reforma: {
    idade: 'Todas as idades',
    niveis: 'Secundário, formação de adultos e universidades seniores',
    referencial: ['Poupança', 'Sistema e produtos financeiros básicos', 'Planeamento e gestão do orçamento', 'Direitos e deveres', 'Ética'],
    temas: ['Juro composto ao longo de décadas', 'Começar cedo', 'Pensão e taxa de substituição', 'Regra dos 4%', 'Inflação e poder de compra', 'Risco de sequência (quedas no início da reforma)', 'Burlas a seniores', 'Herança e testamento'],
    objetivos: [
      'Perceber o efeito de começar a poupar cedo.',
      'Explicar porque a pensão costuma ser menor do que o último salário.',
      'Planear levantamentos para o dinheiro durar.',
      'Reconhecer burlas dirigidas a pessoas mais velhas.',
    ],
    antes: 'Com que idade achas que se deve começar a poupar para a reforma?',
    missoes: ['Escolher o estilo de vida da reforma.', 'Fazer o dinheiro durar 20 anos, mesmo com crises.', 'Ajudar a D. Graça contra as burlas.', 'Decidir o que deixar à família.'],
    conversa: ['Quanto faria 100€ por mês investidos desde os 20 anos?', 'Porque é que a pensão é menor do que o salário?', 'Porque é bom ter dinheiro seguro quando a bolsa cai?'],
    atividade: 'Conversa entre gerações: cada estudante pergunta a um avô, uma avó ou uma pessoa mais velha como poupava e o que faria diferente.',
  },
}
