import type { ConquistaCidade } from '../cidade/conquistas'

export const CONQUISTAS_REFORMA: ConquistaCidade[] = [
  {
    id: 'juro_composto',
    nome: 'Juro Composto',
    objetivo: 'Ouve o Mestre Moedas: o que fizeram 35 anos ao teu dinheiro.',
    licao: ['Em 35 anos, o juro composto multiplicou o que poupaste e investiste.', 'O ingrediente mais poderoso não é o dinheiro: é o TEMPO. Por isso compensa começar cedo.'],
  },
  {
    id: 'neta',
    onde: 'casa',
    nome: 'Ensinar a Neta',
    objetivo: 'Em casa, joga com a tua neta e ensina-lhe a poupar.',
    licao: ['Agora és tu quem conta as histórias, como a Avó Rosa fazia.', 'Ensinar os mais novos a poupar é das heranças mais valiosas que se pode deixar.'],
  },
  {
    id: 'almofada',
    onde: 'banco',
    nome: 'Almofada Segura',
    objetivo: 'Tem no depósito (e na conta) o suficiente para 2 anos do que a pensão não cobre.',
    licao: [
      'Com 2 anos de despesas em dinheiro seguro, não precisas de vender investimentos quando a bolsa cai.',
      'Na reforma, o maior risco é vender na pior altura: a almofada evita isso.',
    ],
  },
  {
    id: 'voluntario',
    onde: 'escola',
    nome: 'Voluntariado',
    objetivo: 'Na Escola da Vila, dá uma aula de dinheiro aos mais novos.',
    licao: ['Partilhar o que aprendeste ao longo da vida também é riqueza.', 'O voluntariado mantém a cabeça ativa e as relações vivas.'],
  },
  {
    id: 'saude_senior',
    nome: 'Saúde Sénior',
    objetivo: 'Faz ginástica sénior com o Professor Zé, no campo, 3 vezes.',
    licao: ['Com saúde, a reforma é muito mais feliz... e mais barata!', 'Exercício regular reduz despesas com médicos e medicamentos.'],
  },
  {
    id: 'mao_firme',
    nome: 'Mão Firme',
    objetivo: 'Quando a bolsa cair, não vendas os investimentos em pânico.',
    licao: ['A bolsa caiu e tu aguentaste. Nos anos seguintes, recuperou.', 'Quem tem uma almofada segura pode esperar pela recuperação.'],
  },
  {
    id: 'anti_burla',
    nome: 'Anti-Burla',
    objetivo: 'Não caias na burla do "mudei de número".',
    licao: ['As burlas por mensagem visam muito as pessoas mais velhas.', 'Regra: liga sempre para o número antigo, que já conheces, antes de transferir dinheiro.'],
  },
  {
    id: 'regra4',
    nome: 'Regra dos 4%',
    objetivo: 'Durante 5 anos, gasta das poupanças no máximo 4,5% por ano.',
    licao: ['Levantar cerca de 4% por ano permite que as poupanças durem décadas.', 'Gastar mais do que isso acelera o fim do dinheiro, sobretudo com a inflação.'],
  },
  {
    id: 'tranquila',
    nome: 'Reforma Tranquila',
    objetivo: 'Chega aos 85 anos sem ficar sem dinheiro.',
    licao: ['Chegaste aos 85 com as contas em dia!', 'Tudo começou com umas moedas num mealheiro, há muitos anos. Poupar, investir com paciência e evitar dívidas caras: é isso que dá liberdade.'],
  },
]

export function objetivoReforma(crachas: string[]) {
  return CONQUISTAS_REFORMA.find((c) => !crachas.includes(c.id)) ?? null
}
