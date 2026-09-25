import type { AvatarConfig } from '../types'
import { Bicicleta } from './bicicleta'
import { Futebol } from './futebol'
import { Gelado } from './gelado'
import type { MiniJogo, TipoMiniJogo } from './tipos'

export function criarMiniJogo(tipo: TipoMiniJogo, avatar: AvatarConfig): MiniJogo {
  if (tipo === 'futebol') return new Futebol(avatar)
  if (tipo === 'bicicleta') return new Bicicleta(avatar)
  return new Gelado()
}
