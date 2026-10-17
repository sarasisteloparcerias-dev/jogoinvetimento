import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { Babysitting } from './babysitting'
import { Bicicleta } from './bicicleta'
import { Bowling } from './bowling'
import { Cafe } from './cafe'
import { Emails } from './emails'
import { Entregas } from './entregas'
import { Explicacoes } from './explicacoes'
import { Futebol } from './futebol'
import { Gelado } from './gelado'
import { Ginasio } from './ginasio'
import { Supermercado } from './supermercado'
import type { MiniJogo, TipoMiniJogo } from './tipos'

export function criarMiniJogo(tipo: TipoMiniJogo, avatar: AvatarConfig, sprites: (a: AvatarConfig) => FramesPersonagem): MiniJogo {
  switch (tipo) {
    case 'futebol':
      return new Futebol(avatar, sprites)
    case 'bicicleta':
      return new Bicicleta(avatar, sprites)
    case 'cafe':
      return new Cafe(sprites)
    case 'supermercado':
      return new Supermercado()
    case 'ginasio':
      return new Ginasio(avatar, sprites)
    case 'entregas':
      return new Entregas(avatar)
    case 'babysitting':
      return new Babysitting()
    case 'explicacoes':
      return new Explicacoes()
    case 'emails':
      return new Emails()
    case 'bowling':
      return new Bowling()
    case 'gelado':
      return new Gelado()
  }
}
