export type AvatarId = 'raposa' | 'coruja' | 'urso' | 'coelho' | 'gato'

export interface Avatar {
  id: AvatarId
  label: string
  emoji: string
  color: string
}

export type StatKey = 'relacoes' | 'saude' | 'educacao'

export interface Stats {
  relacoes: number
  saude: number
  educacao: number
}

export type RiskLevel = 'baixo' | 'medio' | 'alto'

export interface Investment {
  risk: RiskLevel
  amount: number
}

export interface HistoryPoint {
  week: number
  saldo: number
  poupanca: number
  investimento: number
}

export interface PlayerState {
  name: string
  avatar: AvatarId
  week: number
  saldo: number
  poupanca: number
  investimento: Investment
  stats: Stats
  streakPoupanca: number
  poupouEstaSemana: boolean
  history: HistoryPoint[]
  log: LogEntry[]
  gameOver: boolean
}

export interface LogEntry {
  week: number
  text: string
  tone: 'boa' | 'neutra' | 'ma'
}

export type ActionId =
  | 'poupar'
  | 'gastar'
  | 'investir_baixo'
  | 'investir_alto'
  | 'estudar'
  | 'exercicio'
  | 'socializar'

export interface GameEventChoice {
  id: string
  label: string
  apply: (state: PlayerState) => PlayerState
  resultText: (state: PlayerState) => string
}

export type EventArea = 'dinheiro' | 'relacoes' | 'saude' | 'educacao'

export interface GameEvent {
  id: string
  area: EventArea
  title: string
  description: (state: PlayerState) => string
  weight: (state: PlayerState) => number
  choices: GameEventChoice[]
}
