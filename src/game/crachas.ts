import type { PlayerState } from './types'

export interface Cracha {
  id: string
  nome: string
  /** O que a criança tem de fazer para o ganhar (aparece no menu OBJETIVO). */
  objetivo: string
  /** O que o Mestre Moedas explica quando o crachá é ganho. */
  licao: string[]
}

export const CRACHAS: Cracha[] = [
  {
    id: 'poupanca',
    nome: 'Crachá Poupança',
    objetivo: 'Guarda 10 moedas no mealheiro do teu quarto.',
    licao: [
      'Poupar é guardar uma parte do dinheiro para depois, em vez de gastar tudo logo.',
      'Não precisa de ser muito: um bocadinho todas as semanas faz uma grande diferença!',
    ],
  },
  {
    id: 'juro',
    nome: 'Crachá Juro',
    objetivo: 'Deixa moedas no mealheiro e vai dormir. Vê o que acontece de manhã!',
    licao: [
      'O dinheiro guardado cresceu sozinho enquanto dormias. Chama-se JURO!',
      'E depois até o juro ganha juro. Por isso, quanto mais cedo começares a poupar, mais cresce.',
    ],
  },
  {
    id: 'investidor',
    nome: 'Crachá Investidor',
    objetivo: 'Vai ao Banco e fala com a Sofia para investires 10 moedas.',
    licao: [
      'Investir é pôr o dinheiro a trabalhar, como plantar uma semente para ter uma árvore.',
      'Pode crescer mais do que no mealheiro... mas não é garantido. Há sempre algum risco.',
    ],
  },
  {
    id: 'risco',
    nome: 'Crachá Risco',
    objetivo: 'Mantém um investimento até ele descer numa semana. Aguenta firme!',
    licao: [
      'Os investimentos sobem e descem, como uma montanha-russa.',
      'Quem vende assustado na descida perde. Quem espera com calma costuma recuperar.',
      'Por isso, nunca invistas o dinheiro de que vais precisar em breve!',
    ],
  },
  {
    id: 'reserva',
    nome: 'Crachá Reserva',
    objetivo: 'Tem moedas no mealheiro para quando acontecer um imprevisto.',
    licao: [
      'Os imprevistos não avisam! Ainda bem que tinhas dinheiro guardado.',
      'A isto chama-se RESERVA DE EMERGÊNCIA: dinheiro guardado só para surpresas.',
    ],
  },
  {
    id: 'objetivo',
    nome: 'Crachá Objetivo',
    objetivo: 'Junta 60 moedas no mealheiro, como a Marta fez para a bicicleta.',
    licao: [
      'Conseguiste! Com um objetivo claro, é mais fácil dizer "agora não" às tentações.',
      'Poupar para um sonho é a melhor maneira de o tornar real.',
    ],
  },
]

export const META_OBJETIVO = 60

export function objetivoAtual(s: PlayerState): Cracha | null {
  return CRACHAS.find((c) => !s.crachas.includes(c.id)) ?? null
}
