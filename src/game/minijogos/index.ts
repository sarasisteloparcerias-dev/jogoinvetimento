import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { Bicicleta } from './bicicleta'
import { Cafe } from './cafe'
import { Futebol } from './futebol'
import { Gelado } from './gelado'
import type { MiniJogo, TipoMiniJogo } from './tipos'

export function criarMiniJogo(tipo: TipoMiniJogo, avatar: AvatarConfig, sprites: (a: AvatarConfig) => FramesPersonagem): MiniJogo {
  if (tipo === 'futebol') return new Futebol(avatar, sprites)
  if (tipo === 'bicicleta') return new Bicicleta(avatar, sprites)
  if (tipo === 'cafe') return new Cafe(sprites)
  return new Gelado()
}
