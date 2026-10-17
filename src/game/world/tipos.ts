import type { Dir } from '../pixel/sprites'
import type { AvatarConfig } from '../types'

export type { Dir }

export type PropTipo =
  | 'cama'
  | 'mealheiro'
  | 'mesa'
  | 'tv'
  | 'planta'
  | 'estante'
  | 'balcao'
  | 'prateleira'
  | 'cofre'
  | 'quadro'
  | 'carteira'
  | 'tapete'
  | 'bola'
  | 'banco_jardim'
  | 'candeeiro'
  | 'correio'
  | 'maquina_cafe'
  | 'mesa_cafe'
  | 'montra'
  | 'computador'
  | 'cotacoes'
  | 'sofa'
  | 'carro'
  | 'semaforo'
  | 'fonte'
  | 'caixa_multibanco'

export interface PropDef {
  tipo: PropTipo
  x: number
  y: number
  w?: number
  h?: number
  /** Id do script a correr quando o jogador carrega A virado para este objeto. */
  script?: string
  /** Cor (ex. de um carro). */
  cor?: string
}

export type CorEdificio = 'laranja' | 'vermelho' | 'azul' | 'verde' | 'lilas' | 'castanho' | 'rosa' | 'cinza' | 'amarelo'

export interface EdificioDef {
  x: number
  y: number
  w: number
  h: number
  cor: CorEdificio
  /** Coluna da porta, relativa ao edifício (a porta fica sempre na fila de baixo). */
  porta: number
  janelas: number[]
  letreiro?: string
  chamine?: boolean
  /** 'casa' (telhado de telha, padrão) ou 'predio' (vários andares e terraço). */
  estilo?: 'casa' | 'predio'
  /** Cor do toldo por cima da montra (lojas em prédios). */
  toldo?: string
  /** Id do mapa interior para onde a porta leva. */
  interior?: string
  /** Mensagem quando a porta está fechada. */
  trancado?: string
}

export interface NpcDef {
  id: string
  nome: string
  avatar: AvatarConfig
  x: number
  y: number
  dir: Dir
  script: string
  vaguear?: { x0: number; y0: number; x1: number; y1: number }
}

export interface PlacaDef {
  x: number
  y: number
  texto: string
}

export interface MapaDef {
  id: string
  nome: string
  tipo: 'exterior' | 'interior'
  grelha: string[]
  edificios?: EdificioDef[]
  props?: PropDef[]
  npcs?: NpcDef[]
  placas?: PlacaDef[]
  chao?: 'madeira' | 'azulejo'
  parede?: string
  /** Tile do tapete de saída (interiores). */
  saida?: { x: number; y: number }
}
