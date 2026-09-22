import type { PlayerState } from './types'

export const MESADA_BASE = 20
export const TAXA_POUPANCA = 0.04
export const CUSTO_ESTUDAR = 8
export const CUSTO_EXERCICIO = 5
export const CUSTO_SOCIALIZAR = 6
export const GANHO_INVESTIR_MIN = { baixo: -0.03, medio: -0.1, alto: -0.25 }
export const GANHO_INVESTIR_MAX = { baixo: 0.06, medio: 0.16, alto: 0.35 }
export const DECAY_POR_SEMANA = 3
export const TOTAL_SEMANAS = 20

export function novoJogador(name: string, avatarUrl: string): PlayerState {
  return {
    name,
    avatarUrl,
    week: 1,
    saldo: 15,
    poupanca: 0,
    investimento: { risk: 'baixo', amount: 0 },
    stats: { relacoes: 60, saude: 70, educacao: 55 },
    streakPoupanca: 0,
    poupouEstaSemana: false,
    history: [{ week: 0, saldo: 15, poupanca: 0, investimento: 0 }],
    log: [],
    gameOver: false,
  }
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}
