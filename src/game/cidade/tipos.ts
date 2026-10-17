import type { EstadoBase } from '../modo'
import type { HistoryPoint, Stats } from '../types'
import type { TrabalhoCidade } from './trabalhos'

export type AtivoId = 'ot' | 'etf' | 'pixel' | 'brisa' | 'lua'

export interface Ativo {
  id: AtivoId
  nome: string
  /** Nome curto para listas do telemóvel. */
  curto: string
  tipo: string
  /** 1 (muito seguro) a 5 (muito arriscado). */
  risco: number
  preco0: number
  /** Subida média por semana (ex. 0.0015 = 0,15%). */
  media: number
  /** Quanto o preço costuma variar numa semana. */
  volatilidade: number
  descricao: string
}

export interface Pagamento {
  id: string
  nome: string
  valor: number
  /** Quantas semanas faltam pagar; null = até cancelares. */
  restam: number | null
  cancelavel: boolean
}

export interface Noticia {
  semana: number
  titulo: string
  texto: string
}

export interface Movimento {
  texto: string
  valor: number
}

export interface EstadoCidade extends EstadoBase {
  semana: number
  /** Conta à ordem (antes de abrir conta, é o dinheiro que tens na carteira). */
  dinheiro: number
  conta: 'jovem' | 'standard' | null
  poupanca: number
  unidades: Record<AtivoId, number>
  /** Quanto pagaste, no total, pelas unidades que ainda tens (para saber se estás a ganhar ou a perder). */
  custo: Record<AtivoId, number>
  precos: Record<AtivoId, number>
  historicoPrecos: Record<AtivoId, number[]>
  emprego: TrabalhoCidade | null
  turnos: number
  stats: Stats
  /** Quanto custam as coisas comparado com o início do ano (1 = igual, 1,05 = 5% mais caro). */
  indicePrecos: number
  pagamentos: Pagamento[]
  noticias: Noticia[]
  /** O que entrou e saiu da conta na última noite (a manhã explica). */
  movimentos: Movimento[]
  /** Compras da MegaStore e semana em que se decidiu "pensar". */
  compras: string[]
  pensar: Record<string, number>
  salarioTotal: number
  history: HistoryPoint[]
}
