import type { Conquista } from '../modo'

export interface ConquistaCidade extends Conquista {
  /** O que fazer para a ganhar (aparece na app OBJETIVO). */
  objetivo: string
}

export const CONQUISTAS_CIDADE: ConquistaCidade[] = [
  {
    id: 'conta',
    nome: 'Primeira Conta',
    objetivo: 'Abre a tua primeira conta no Banco Ponte.',
    licao: [
      'Uma conta bancária guarda o teu dinheiro em segurança e deixa-te receber salários e pagar com cartão.',
      'Antes de escolheres uma conta, lê sempre as letras pequenas: comissões de 1€ por semana parecem pouco, mas ao fim do ano somam muito.',
    ],
  },
  {
    id: 'salario',
    nome: 'Primeiro Salário',
    objetivo: 'Faz um turno no Café Grão Dourado.',
    licao: [
      'O teu primeiro salário! Trocaste o teu tempo e esforço por dinheiro.',
      'Repara: trabalhar dá dinheiro, mas cansa e tira tempo ao estudo. Também é preciso equilíbrio.',
    ],
  },
  {
    id: 'diversificada',
    nome: 'Carteira Diversificada',
    objetivo: 'Tem pelo menos 3 investimentos diferentes ao mesmo tempo.',
    licao: [
      'Não puseste os ovos todos no mesmo cesto. Isto chama-se DIVERSIFICAR.',
      'Se uma empresa correr mal, as outras ajudam a compensar. É a forma mais simples de reduzir o risco.',
    ],
  },
  {
    id: 'mao_firme',
    nome: 'Mão Firme',
    objetivo: 'Tem ações ou ETFs durante a crise e não vendas em pânico.',
    licao: [
      'Os preços caíram e tu não vendeste. A perda só se torna real quando vendes.',
      'Quem investe a pensar no longo prazo aguenta as crises com calma. Por isso só se investe dinheiro de que não se precisa em breve.',
    ],
  },
  {
    id: 'anti_burla',
    nome: 'Anti-Burla',
    objetivo: 'Não caias numa burla.',
    licao: [
      'Prémios que não pediste, pressa e pedidos de pagamento por um link: os três sinais de uma burla.',
      'Na dúvida, não carregues em nada e pergunta a um adulto de confiança. Nunca dês os dados do cartão.',
    ],
  },
  {
    id: 'emergencia',
    nome: 'Fundo de Emergência',
    objetivo: 'Junta 100€ na conta poupança.',
    licao: [
      'Tens um fundo de emergência: dinheiro guardado só para imprevistos.',
      'Com ele, um ecrã partido ou uma doença não te obrigam a pedir emprestado nem a vender investimentos à pressa.',
    ],
  },
  {
    id: 'viagem',
    nome: 'Viagem de Finalistas',
    objetivo: 'Junta 400€ entre poupança e investimentos.',
    licao: [
      'Conseguiste juntar o dinheiro da Viagem de Finalistas!',
      'Um objetivo claro, um pouco todas as semanas e paciência. É assim que se chega a qualquer meta.',
    ],
  },
]

export function objetivoCidade(crachas: string[]) {
  return CONQUISTAS_CIDADE.find((c) => !crachas.includes(c.id)) ?? null
}
