import {
  CUSTO_ESTUDAR,
  CUSTO_EXERCICIO,
  CUSTO_SOCIALIZAR,
  DECAY_POR_SEMANA,
  GANHO_INVESTIR_MAX,
  GANHO_INVESTIR_MIN,
  MESADA_BASE,
  TAXA_POUPANCA,
  TOTAL_SEMANAS,
  clamp,
} from './data'
import { sortearEvento } from './events'
import type { ActionId, GameEvent, LogEntry, PlayerState, RiskLevel } from './types'

export interface ActionDef {
  id: ActionId
  label: string
  emoji: string
  custo: number
  descricao: string
}

export const ACOES: ActionDef[] = [
  { id: 'poupar', label: 'Poupar 10 moedas', emoji: '🐷', custo: 10, descricao: 'Guarda no mealheiro. Cresce sozinho com o tempo!' },
  { id: 'gastar', label: 'Gastar em diversão', emoji: '🍭', custo: 10, descricao: 'Dá um empurrão nas relações e na saúde, mas o dinheiro não volta.' },
  { id: 'investir_baixo', label: 'Investir (baixo risco)', emoji: '🌱', custo: 10, descricao: 'Cresce devagar, mas quase nunca perde valor.' },
  { id: 'investir_alto', label: 'Investir (alto risco)', emoji: '🎢', custo: 10, descricao: 'Pode crescer muito... ou perder muito.' },
  { id: 'estudar', label: 'Estudar', emoji: '📚', custo: CUSTO_ESTUDAR, descricao: 'Aumenta a tua educação (e o teu rendimento futuro!).' },
  { id: 'exercicio', label: 'Fazer exercício', emoji: '⚽', custo: CUSTO_EXERCICIO, descricao: 'Cuida da tua saúde física.' },
  { id: 'socializar', label: 'Sair com amigos', emoji: '🎈', custo: CUSTO_SOCIALIZAR, descricao: 'Fortalece as tuas relações.' },
]

export function podeExecutar(state: PlayerState, acao: ActionDef): boolean {
  return state.saldo >= acao.custo && !state.gameOver
}

export function executarAcao(state: PlayerState, id: ActionId): PlayerState {
  const acao = ACOES.find((a) => a.id === id)
  if (!acao || !podeExecutar(state, acao)) return state

  const base: PlayerState = { ...state, saldo: state.saldo - acao.custo }

  switch (id) {
    case 'poupar':
      return { ...base, poupanca: base.poupanca + acao.custo, poupouEstaSemana: true }
    case 'gastar':
      return {
        ...base,
        stats: { ...base.stats, relacoes: clamp(base.stats.relacoes + 3), saude: clamp(base.stats.saude + 2) },
      }
    case 'investir_baixo':
      return misturarInvestimento(base, 'baixo', acao.custo)
    case 'investir_alto':
      return misturarInvestimento(base, 'alto', acao.custo)
    case 'estudar':
      return {
        ...base,
        stats: { ...base.stats, educacao: clamp(base.stats.educacao + 6), saude: clamp(base.stats.saude - 2) },
      }
    case 'exercicio':
      return { ...base, stats: { ...base.stats, saude: clamp(base.stats.saude + 6) } }
    case 'socializar':
      return { ...base, stats: { ...base.stats, relacoes: clamp(base.stats.relacoes + 6) } }
    default:
      return base
  }
}

function misturarInvestimento(state: PlayerState, risco: RiskLevel, valor: number): PlayerState {
  const atual = state.investimento
  if (atual.amount <= 0) {
    return { ...state, investimento: { risk: risco, amount: valor } }
  }
  // Se já existe investimento com outro risco, fica com o risco da maior fatia (simplificação para o protótipo).
  const novoTotal = atual.amount + valor
  const novoRisco = valor > atual.amount ? risco : atual.risk
  return { ...state, investimento: { risk: novoRisco, amount: novoTotal } }
}

export interface AvancoSemana {
  estado: PlayerState
  evento: GameEvent
}

export function avancarSemana(stateInicial: PlayerState): AvancoSemana {
  let state = { ...stateInicial }

  const mesada = MESADA_BASE + Math.floor(state.stats.educacao / 25) * 2
  state.saldo += mesada

  if (state.poupanca > 0) {
    state.poupanca = Math.round(state.poupanca * (1 + TAXA_POUPANCA) * 100) / 100
  }

  if (state.investimento.amount > 0) {
    const min = GANHO_INVESTIR_MIN[state.investimento.risk]
    const max = GANHO_INVESTIR_MAX[state.investimento.risk]
    const variacao = min + Math.random() * (max - min)
    state.investimento = {
      ...state.investimento,
      amount: Math.max(0, Math.round(state.investimento.amount * (1 + variacao) * 100) / 100),
    }
  }

  state.stats = {
    relacoes: clamp(state.stats.relacoes - DECAY_POR_SEMANA),
    saude: clamp(state.stats.saude - DECAY_POR_SEMANA),
    educacao: clamp(state.stats.educacao - Math.round(DECAY_POR_SEMANA / 2)),
  }

  state.streakPoupanca = state.poupouEstaSemana ? state.streakPoupanca + 1 : 0
  state.poupouEstaSemana = false

  const evento = sortearEvento(state)

  const semanaConcluida = state.week
  state.week += 1
  state.history = [
    ...state.history,
    { week: semanaConcluida, saldo: state.saldo, poupanca: state.poupanca, investimento: state.investimento.amount },
  ]

  if (state.week > TOTAL_SEMANAS) {
    state.gameOver = true
  }

  return { estado: state, evento }
}

export function registarLog(state: PlayerState, texto: string, tone: LogEntry['tone']): PlayerState {
  return { ...state, log: [{ week: state.week, text: texto, tone }, ...state.log].slice(0, 30) }
}

export { TOTAL_SEMANAS }
