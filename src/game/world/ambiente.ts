import type { Ambiente } from './motor'

/** Um número "aleatório" fixo para cada semana/mês (assim o tempo não muda ao entrar e sair). */
function sorte(n: number) {
  const x = Math.sin(n * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

/** Estação a partir do mês do ano (1 = janeiro). */
export function estacaoDoMes(mes: number): number {
  const m = ((mes - 1) % 12) + 1
  if (m >= 3 && m <= 5) return 0
  if (m >= 6 && m <= 8) return 1
  if (m >= 9 && m <= 11) return 2
  return 3
}

/** Tempo de uma "vez" (semana, mês ou ano): chove mais no outono e no inverno. */
export function ambienteDe(estacao: number, vez: number): Ambiente {
  const prob = [0.25, 0.08, 0.4, 0.45][estacao]
  return { estacao, chuva: vez > 1 && sorte(vez) < prob }
}
