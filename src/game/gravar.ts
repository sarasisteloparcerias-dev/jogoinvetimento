/** Guarda o jogo no próprio browser, para continuar noutro dia. */

export type Modo = 'reino' | 'cidade' | 'mercado'

export interface Gravacao {
  v: 1
  modo: Modo
  estado: unknown
  /** O nível foi acabado (fica pronto para passar ao seguinte). */
  fim: boolean
}

const CHAVE = 'vila-moeda:jogo'

export function gravar(g: Omit<Gravacao, 'v'>) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ v: 1, ...g }))
  } catch {
    // sem armazenamento (modo privado, etc.): o jogo continua, só não fica guardado
  }
}

export function lerGravacao(): Gravacao | null {
  try {
    const t = localStorage.getItem(CHAVE)
    if (!t) return null
    const g = JSON.parse(t) as Gravacao
    return g?.v === 1 && g.estado ? g : null
  } catch {
    return null
  }
}

export function apagarGravacao() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a fazer
  }
}
