import type { ConquistaCidade } from '../cidade/conquistas'

export const CONQUISTAS_MERCADO: ConquistaCidade[] = [
  {
    id: 'emergencia',
    nome: 'Fundo de Emergência',
    objetivo: 'Junta no depósito o equivalente a 3 meses de despesas fixas.',
    licao: [
      'Tens 3 meses de despesas guardados. Se perderes o emprego ou tiveres um imprevisto, aguentas sem dívidas.',
      'É a base de tudo: primeiro o fundo de emergência, depois os investimentos.',
    ],
  },
  {
    id: 'irs',
    nome: 'IRS Entregue',
    objetivo: 'Entrega o IRS nas Finanças entre abril e junho.',
    licao: [
      'Todos os anos acertas contas com o Estado: o que te descontaram no salário compara-se com o imposto que devias pagar.',
      'Se descontaram a mais, recebes um reembolso. Entregar a tempo evita multas.',
    ],
  },
  {
    id: 'regular',
    nome: 'Investidor Regular',
    objetivo: 'Investe em 6 meses diferentes (o plano mensal também conta).',
    licao: [
      'Investir um bocadinho todos os meses chama-se custo médio: compras mais barato quando o preço desce e não precisas de adivinhar o momento certo.',
      'A regularidade vale mais do que tentar acertar no melhor dia.',
    ],
  },
  {
    id: 'diversificada',
    nome: 'Carteira Diversificada',
    objetivo: 'Tem pelo menos 3 investimentos diferentes ao mesmo tempo.',
    licao: ['Repartir o dinheiro por vários investimentos reduz o risco de uma só empresa te arruinar.', 'Um ETF já faz isto por ti: tem milhares de empresas lá dentro.'],
  },
  {
    id: 'mao_firme',
    nome: 'Mão Firme',
    objetivo: 'Tem ações ou ETFs durante a recessão e não vendas em pânico.',
    licao: ['Aguentaste a recessão sem vender. As perdas só se tornam reais quando vendes.', 'Por isso é que só se investe dinheiro de que não se precisa nos próximos anos.'],
  },
  {
    id: 'anti_burla',
    nome: 'Anti-Burla',
    objetivo: 'Não caias numa burla.',
    licao: [
      'Ganhos garantidos e altos, pressa, e pedidos de dados por mensagem: sinais clássicos de burla.',
      'Um banco nunca te pede códigos por SMS ou email. Na dúvida, liga tu para o número oficial.',
    ],
  },
  {
    id: 'aumento',
    nome: 'Aumento',
    objetivo: 'Consegue um aumento de salário (a Carreira conta).',
    licao: ['Investir em ti (formação, empenho) é dos investimentos que mais rende ao longo da vida.', 'Um aumento de 10% hoje soma-se a todos os salários seguintes.'],
  },
  {
    id: 'zero_juros',
    nome: 'Zero Juros',
    objetivo: 'Chega ao fim do primeiro ano sem pagar juros de dívidas.',
    licao: ['Um ano inteiro sem pagar juros! As dívidas caras, como as do cartão de crédito, comem qualquer poupança.', 'Se usares cartão de crédito, paga sempre o valor total no fim do mês.'],
  },
  {
    id: 'carta',
    nome: 'Carta de Condução',
    objetivo: 'Tira a carta na escola de condução (código e exame prático).',
    licao: [
      'Tens carta! Agora a grande pergunta: compensa ter carro?',
      'Um carro custa muito mais do que o preço de compra: seguro, combustível, imposto, manutenção e estacionamento, todos os meses.',
    ],
  },
  {
    id: 'casa',
    nome: 'Entrada da Casa',
    objetivo: 'Chega a 8.000€ de património líquido (o que tens menos o que deves).',
    licao: ['Juntaste o dinheiro para a entrada de uma casa!', 'Para um crédito à habitação, o banco costuma pedir que tenhas uma parte do valor da casa. Foi isso que conseguiste.'],
  },
]

export function objetivoMercado(crachas: string[]) {
  return CONQUISTAS_MERCADO.find((c) => !crachas.includes(c.id)) ?? null
}

/** Conquistas do nível "A Casa". */
export const CONQUISTAS_CASA: ConquistaCidade[] = [
  {
    id: 'chave',
    nome: 'Chave na Mão',
    objetivo: 'Compra a tua casa: escolhe-a na Imobiliária e pede o crédito no Banco Ponte.',
    licao: [
      'A casa é tua (e um bocadinho do banco, durante uns anos)!',
      'Um crédito à habitação dura décadas: a prestação tem de caber no orçamento mesmo quando os juros sobem ou o rendimento desce.',
    ],
  },
  {
    id: 'emergencia',
    nome: 'Fundo de Emergência',
    objetivo: 'Tem no depósito 3 meses de despesas fixas.',
    licao: ['Com casa própria, os imprevistos são maiores: obras, eletrodomésticos, condomínio.', 'O fundo de emergência evita que tenhas de pedir crédito caro quando algo avaria.'],
  },
  {
    id: 'imi',
    nome: 'IMI em Dia',
    objetivo: 'Paga o IMI, o imposto anual sobre a casa (em maio).',
    licao: ['Quem tem casa paga todos os anos o IMI à câmara municipal.', 'É um custo que se esquece facilmente quando se faz contas à compra de uma casa.'],
  },
  {
    id: 'amortizar',
    nome: 'Amortização',
    objetivo: 'Amortiza parte do crédito antes do tempo, no Banco Ponte.',
    licao: ['Amortizar é pagar parte da dívida antes do tempo: pagas menos juros no total.', 'Mas só faz sentido com o fundo de emergência em dia. Dinheiro posto na casa não se tira facilmente.'],
  },
  {
    id: 'anti_burla',
    nome: 'Anti-Burla',
    objetivo: 'Não caias numa burla.',
    licao: ['As Finanças e os bancos nunca pedem pagamentos por links em SMS.', 'Na dúvida, entra tu no site oficial ou liga para o número oficial.'],
  },
  {
    id: 'aumento',
    nome: 'Aumento',
    objetivo: 'Consegue um aumento de salário (a Carreira conta).',
    licao: ['Com um crédito de 30 anos, cada aumento de salário dá mais folga ao orçamento.', 'Investir em ti continua a ser dos melhores investimentos.'],
  },
  {
    id: 'patrimonio',
    nome: 'Património de 30 Mil',
    objetivo: 'Chega a 30.000€ de património líquido (a casa conta, menos o que deves ao banco).',
    licao: ['O teu património líquido passou os 30.000€!', 'Repara: cada prestação paga, a parte de capital, aumenta o teu património. A parte dos juros, não.'],
  },
]

export function objetivoCasa(crachas: string[]) {
  return CONQUISTAS_CASA.find((c) => !crachas.includes(c.id)) ?? null
}
