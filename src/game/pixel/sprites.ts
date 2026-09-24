import type { AvatarConfig } from '../types'
import { espelhar, grelha, misturar, tom, type Paleta } from './draw'

export type Dir = 'down' | 'up' | 'left' | 'right'

/** [parado, passo A, passo B] para cada direção. Cada frame tem 16x24 píxeis (ocupa 1 tile e sobressai 8px para cima). */
export type FramesPersonagem = Record<Dir, [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement]>

const FRENTE = [
  '................',
  '.....OOOOOO.....',
  '...OOHHHHHHOO...',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '.OHHHHHHHHHHHHO.',
  '.OHHSSHHHHSSHHO.',
  '.OHSSSSSSSSSSHO.',
  '.OHSSESSSSESSHO.',
  '.OHSSESSSSESSHO.',
  '..OSbSSSSSSbSO..',
  '...OSSSSSSSSO...',
  '....OOSSSSOO....',
  '...OCCCOOCCCO...',
  '..OCCCCCCCCCCO..',
  '.OSOCCCCCCCCOSO.',
  '.OSOCCCCCCCCOSO.',
  '..OOccccccccOO..',
]

const COSTAS = [
  '................',
  '.....OOOOOO.....',
  '...OOHHHHHHOO...',
  '..OHHHHHHHHHHO..',
  '..OHHHHHHHHHHO..',
  '.OHHHHHHHHHHHHO.',
  '.OHHHHHHHHHHHHO.',
  '.OHHHHHHHHHHHHO.',
  '.OHHHHHHHHHHHHO.',
  '.OhHHHHHHHHHHhO.',
  '..OhHHHHHHHHhO..',
  '...OhhhhhhhhO...',
  '....OOSSSSOO....',
  '...OCCCCCCCCO...',
  '..OCCCCCCCCCCO..',
  '.OSOCCCCCCCCOSO.',
  '.OSOCCCCCCCCOSO.',
  '..OOccccccccOO..',
]

const LADO = [
  '................',
  '....OOOOOO......',
  '...OHHHHHHOO....',
  '..OHHHHHHHHHO...',
  '.OHHHHHHHHHHHO..',
  '.OHHHHHHHHHHHO..',
  '.OHHHHHHHSSSSO..',
  '.OHHHHHHSSSSSO..',
  '.OHHHHHSSSSESO..',
  '.OhHHHHSSSSESO..',
  '..OhHHHSSSbSSO..',
  '...OhhOSSSSSO...',
  '....OOSSSSOO....',
  '....OCCCCCCO....',
  '...OCCCCCCCCO...',
  '...OCCCSSCCCO...',
  '...OCCCSSCCCO...',
  '...OOccccccOO...',
]

const PERNAS_FRENTE = {
  parado: ['...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OBBO..OBBO...', '...OOOO..OOOO...'],
  a: ['...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OBBO...', '...OBBO..OOOO...', '...OOOO.........'],
  b: ['...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OBBO..OPPO...', '...OOOO..OBBO...', '.........OOOO...'],
}

const PERNAS_LADO = {
  parado: ['....OPPPPPPO....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBBO....', '.....OOOOOOO....'],
  passo: ['....OPPPPPPO....', '...OPPPOOPPPO...', '..OPPO....OPPO..', '.OPPO......OPPO.', '.OBBO......OBBBO', '.OOOO......OOOOO'],
}

function trocar(linha: string, pos: Record<number, string>): string {
  const a = linha.split('')
  for (const [i, c] of Object.entries(pos)) a[Number(i)] = c
  return a.join('')
}

function comCabeloComprido(topo: string[], dir: 'frente' | 'costas' | 'lado'): string[] {
  const t = [...topo]
  if (dir === 'frente') {
    for (let y = 10; y <= 13; y++) t[y] = trocar(t[y], { 1: 'O', 2: 'H', 13: 'H', 14: 'O' })
  } else if (dir === 'costas') {
    t[11] = '..OhHHHHHHHHhO..'
    t[12] = '..OHHHHHHHHHHO..'
    t[13] = '..OhHHHHHHHHhO..'
    t[14] = '..OOhhhhhhhhOO..'
  } else {
    for (let y = 11; y <= 14; y++) t[y] = trocar(t[y], { 1: 'O', 2: 'H', 3: 'h' })
  }
  return t
}

export function paletaPersonagem(a: AvatarConfig): Paleta {
  return {
    O: '#2a2a36',
    H: a.cabelo,
    h: tom(a.cabelo, -0.3),
    S: a.pele,
    b: misturar(a.pele, '#ff6b6b', 0.35),
    E: '#1c1c26',
    C: a.roupa,
    c: tom(a.roupa, -0.28),
    P: '#3b4a86',
    B: '#5a3a22',
  }
}

const cache = new Map<string, FramesPersonagem>()

export function framesPersonagem(a: AvatarConfig): FramesPersonagem {
  const chave = JSON.stringify(a)
  const guardado = cache.get(chave)
  if (guardado) return guardado

  const pal = paletaPersonagem(a)
  const frente = a.cabeloComprido ? comCabeloComprido(FRENTE, 'frente') : FRENTE
  const costas = a.cabeloComprido ? comCabeloComprido(COSTAS, 'costas') : COSTAS
  const lado = a.cabeloComprido ? comCabeloComprido(LADO, 'lado') : LADO

  const f = (topo: string[], pernas: string[]) => grelha([...topo, ...pernas], pal)
  const direita: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement] = [
    f(lado, PERNAS_LADO.parado),
    f(lado, PERNAS_LADO.passo),
    f(lado, PERNAS_LADO.passo),
  ]
  const frames: FramesPersonagem = {
    down: [f(frente, PERNAS_FRENTE.parado), f(frente, PERNAS_FRENTE.a), f(frente, PERNAS_FRENTE.b)],
    up: [f(costas, PERNAS_FRENTE.parado), f(costas, PERNAS_FRENTE.a), f(costas, PERNAS_FRENTE.b)],
    right: direita,
    left: [espelhar(direita[0]), espelhar(direita[1]), espelhar(direita[2])],
  }
  cache.set(chave, frames)
  return frames
}
