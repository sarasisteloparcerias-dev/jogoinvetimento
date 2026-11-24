import type { EstadoBase } from './modo'

/**
 * Cada jogo tem uma "semente" (guardada nas flags) que muda a altura dos acontecimentos.
 * Assim, repetir uma fase não é igual: a burla pode chegar mais cedo, a festa mais tarde...
 */

export function semente(s: EstadoBase) {
  const f = s.flags.find((x) => x.startsWith('semente_'))
  return f ? Number(f.slice(8)) : 0
}

export function novaSemente() {
  return `semente_${1 + Math.floor(Math.random() * 999999)}`
}

function hash(texto: string) {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** A "vez" (semana, mês, ano) de um acontecimento neste jogo: a base, mais ou menos até `de`/`ate`. */
export function deslocar(s: EstadoBase, id: string, base: number, de: number, ate: number) {
  const sd = semente(s)
  if (!sd) return base
  return base + de + (hash(`${sd}:${id}`) % (ate - de + 1))
}
