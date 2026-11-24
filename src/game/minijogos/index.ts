import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { Arrumar } from './arrumar'
import { Babysitting } from './babysitting'
import { Canos } from './canos'
import { Comparar } from './comparar'
import { CONFIG_ANUNCIOS, CONFIG_CONTRATO, Decidir } from './decidir'
import { Memoria } from './memoria'
import { Pesca } from './pesca'
import { Troco } from './troco'
import { Bicicleta } from './bicicleta'
import { Bowling } from './bowling'
import { Cafe } from './cafe'
import { Emails } from './emails'
import { Entregas } from './entregas'
import { Conducao } from './conducao'
import { EXAME_CODIGO, Explicacoes } from './explicacoes'
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
    case 'codigo':
      return new Explicacoes(EXAME_CODIGO)
    case 'conducao':
      return new Conducao()
    case 'gelado':
      return new Gelado()
    case 'troco':
      return new Troco()
    case 'troco_euros':
      return new Troco(true)
    case 'comparar':
      return new Comparar()
    case 'comparar_adulto':
      return new Comparar(true)
    case 'memoria':
      return new Memoria()
    case 'arrumar':
      return new Arrumar()
    case 'anuncios':
      return new Decidir(CONFIG_ANUNCIOS)
    case 'contrato':
      return new Decidir(CONFIG_CONTRATO)
    case 'canos':
      return new Canos()
    case 'pesca':
      return new Pesca()
  }
}
