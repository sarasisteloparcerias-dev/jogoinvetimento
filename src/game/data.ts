import type { AvatarConfig, PlayerState } from './types'

export const MESADA_BASE = 20
export const TAXA_POUPANCA = 0.04
export const CUSTO_ESTUDAR = 8
export const CUSTO_EXERCICIO = 5
export const CUSTO_SOCIALIZAR = 6
export const GANHO_INVESTIR_MIN = { baixo: -0.03, medio: -0.1, alto: -0.25 }
export const GANHO_INVESTIR_MAX = { baixo: 0.06, medio: 0.16, alto: 0.35 }
export const DECAY_POR_SEMANA = 3
export const TOTAL_SEMANAS = 20

export const CORES_PELE = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524']
export const CORES_CABELO = ['#2d1b0e', '#4a2c14', '#7a4a1e', '#d4a017', '#e8e0d5', '#a83232', '#5b3a8e']
export const CORES_ROUPA = ['#f97316', '#ec4899', '#8b5cf6', '#0ea5e9', '#10b981', '#ef4444', '#64748b']

export const AVATAR_PADRAO: AvatarConfig = {
  pele: CORES_PELE[1],
  cabelo: CORES_CABELO[0],
  roupa: CORES_ROUPA[0],
}

export function novoJogador(name: string, avatar: AvatarConfig): PlayerState {
  return {
    name,
    avatar,
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
    crachas: [],
    flags: [],
  }
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}
