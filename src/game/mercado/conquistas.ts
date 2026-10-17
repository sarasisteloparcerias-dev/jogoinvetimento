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
    id: 'casa',
    nome: 'Entrada da Casa',
    objetivo: 'Chega a 8.000€ de património líquido (o que tens menos o que deves).',
    licao: ['Juntaste o dinheiro para a entrada de uma casa!', 'Para um crédito à habitação, o banco costuma pedir que tenhas uma parte do valor da casa. Foi isso que conseguiste.'],
  },
]

export function objetivoMercado(crachas: string[]) {
  return CONQUISTAS_MERCADO.find((c) => !crachas.includes(c.id)) ?? null
}
