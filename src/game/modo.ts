import type { ResultadoMiniJogo, TipoMiniJogo } from './minijogos/tipos'
import type { Dir } from './pixel/sprites'
import type { AvatarConfig } from './types'

/** O que todos os modos guardam, seja qual for a idade. */
export interface EstadoBase {
  name: string
  avatar: AvatarConfig
  crachas: string[]
  flags: string[]
  gameOver: boolean
}

/** Tudo o que um guião (conversa, objeto, manhã) pode fazer no jogo. */
export interface CtxJogo<S extends EstadoBase> {
  say(texto: string | string[], quem?: string): Promise<void>
  ask(texto: string, opcoes: string[], quem?: string, cancelar?: number): Promise<number>
  estado(): S
  definir(s: S): void
  cracha(id: string): Promise<void>
  jogar(tipo: TipoMiniJogo): Promise<ResultadoMiniJogo>
  fade(alvo: number, ms: number): Promise<void>
  levar(mapa: string, x: number, y: number, dir: Dir): void
  /** Acaba a aventura e passa ao ecrã final. */
  terminar(): void
}

export interface Conquista {
  id: string
  nome: string
  licao: string[]
}
