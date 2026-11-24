/** Guarda o jogo no próprio browser, para continuar noutro dia. */

export type Modo = 'reino' | 'cidade' | 'mercado' | 'casa' | 'negocio'

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

// ---------------------------------------------------------------------------
// O Negócio só abre a quem passou todas as fases (fica guardado mesmo que se apague o jogo).

const CHAVE_NEGOCIO = 'vila-moeda:negocio'

export function negocioDesbloqueado() {
  try {
    return localStorage.getItem(CHAVE_NEGOCIO) === '1'
  } catch {
    return false
  }
}

export function desbloquearNegocio() {
  try {
    localStorage.setItem(CHAVE_NEGOCIO, '1')
  } catch {
    // nada a fazer
  }
}

// ---------------------------------------------------------------------------
// O percurso da mesma personagem, fase a fase (mostrado no fim do jogo).

export interface EtapaPercurso {
  modo: Modo
  nome: string
  resumo: string
  passou: boolean
}

const CHAVE_PERCURSO = 'vila-moeda:percurso'

export function lerPercurso(): EtapaPercurso[] {
  try {
    const l = JSON.parse(localStorage.getItem(CHAVE_PERCURSO) ?? '[]') as EtapaPercurso[]
    return Array.isArray(l) ? l : []
  } catch {
    return []
  }
}

/** Guarda o resultado de uma fase (se a mesma fase se repetir, fica o último resultado). */
export function registarPercurso(e: EtapaPercurso) {
  try {
    const l = lerPercurso().filter((x) => x.modo !== e.modo || x.nome !== e.nome)
    localStorage.setItem(CHAVE_PERCURSO, JSON.stringify([...l.filter((x) => x.nome === e.nome), e]))
  } catch {
    // nada a fazer
  }
}

export function limparPercurso() {
  try {
    localStorage.removeItem(CHAVE_PERCURSO)
  } catch {
    // nada a fazer
  }
}
