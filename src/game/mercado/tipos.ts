import type { Movimento, Noticia, Pagamento } from '../cidade/tipos'
import type { EstadoBase } from '../modo'
import type { HistoryPoint } from '../types'
import type { Hipoteca } from './habitacao'
import type { Profissao } from './profissoes'

export type { Movimento, Noticia, Pagamento }

export type AtivoM = 'obrig' | 'etf' | 'pixel' | 'brisa' | 'eco' | 'lua'

export type Casa = 'pais' | 'quarto' | 't1' | 'propria'

export interface StatsAdulto {
  relacoes: number
  saude: number
  carreira: number
}

export interface EstadoMercado extends EstadoBase {
  mes: number
  /** Conta à ordem. */
  conta: number
  /** Depósito a prazo (juro com 28% de imposto). */
  poupanca: number
  /** Plano Poupança Reforma: rende pouco, não se mexe até à reforma, mas desconta no IRS. */
  ppr: number
  pprAno: number
  /** Dívida do cartão de crédito (paga juros todos os meses). */
  divida: number
  cartaoCredito: boolean
  salarioBruto: number
  profissao: Profissao
  /** Carta de condução: inscrição, código feito, carta tirada. (Opcional: jogos guardados antes desta versão não têm.) */
  carta?: 'inscrito' | 'codigo' | 'carta'
  carro?: boolean
  /** Nível "A Casa" (continuação d'O Mercado). */
  nivel?: 'casa'
  casaEscolhida?: string
  hipoteca?: Hipoteca
  casa: Casa
  marcaBranca: boolean
  ginasio: boolean
  pagamentos: Pagamento[]
  unidades: Record<AtivoM, number>
  custo: Record<AtivoM, number>
  precos: Record<AtivoM, number>
  historicoPrecos: Record<AtivoM, number[]>
  /** Investimento automático mensal no ETF Mundo. */
  planoMensal: number
  /** Meses em que se investiu (para a conquista Investidor Regular). */
  mesesInvestidos: number[]
  impostoPago: number
  jurosPagos: number
  /** Turnos extra no restaurante este mês. */
  turnos: number
  stats: StatsAdulto
  indicePrecos: number
  noticias: Noticia[]
  movimentos: Movimento[]
  history: HistoryPoint[]
}
