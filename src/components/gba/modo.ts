import type { ComponentType, Ref } from 'react'
import type { Historia } from '../../game/historias'
import type { Conquista, CtxJogo, EstadoBase } from '../../game/modo'
import type { NomeMusica } from '../../game/som'
import type { Dir, FramesPersonagem } from '../../game/pixel/sprites'
import type { AvatarConfig } from '../../game/types'
import type { Ambiente, Interacao } from '../../game/world/motor'
import type { MapaDef } from '../../game/world/tipos'
import type { Tecla } from './dialogo'

export type { Conquista, CtxJogo, EstadoBase }

export interface ControloMenu {
  tecla(t: Tecla): void
}

export interface PropsMenu<S extends EstadoBase> {
  estado: S
  ctx: CtxJogo<S>
  onFechar(): void
  ref: Ref<ControloMenu>
}

export interface ModoJogo<S extends EstadoBase> {
  mapas: Record<string, MapaDef>
  inicio: { mapa: string; x: number; y: number; dir: Dir }
  sprites(a: AvatarConfig): FramesPersonagem
  conquistas: Conquista[]
  iconeConquista(id: string, obtido: boolean): HTMLCanvasElement
  /** Quem explica a lição quando se ganha uma conquista. */
  mentor: string
  tutorial(ctx: CtxJogo<S>): Promise<void>
  interagir(i: Interacao, ctx: CtxJogo<S>): Promise<void>
  Menu: ComponentType<PropsMenu<S>>
  /** Música de fundo nos mapas exteriores (os interiores têm uma música própria). */
  musica: NomeMusica
  /** Para onde aponta a seta de destino (id de um interior). Sem isto, usa-se o sítio da próxima conquista. */
  destino?(s: S): string | null
  /** Histórias com capítulos (a personagem mostra "!" quando há novidades). */
  historias?: Historia<S>[]
  /** Estação do ano e chuva (lá fora). */
  ambiente?(s: S): Ambiente
  /** Dinheiro total (para o som das moedas quando sobe ou desce). */
  dinheiro?(s: S): number
  /** O que acontece no trânsito (só nos modos com estradas). */
  transito?: {
    atropelado(ctx: CtxJogo<S>): Promise<void>
    foraPassadeira(ctx: CtxJogo<S>): Promise<void>
  }
}
