import type { AvatarConfig } from '../types'
import { espelhar, grelha, misturar, tom, type Paleta } from './draw'

export type Dir = 'down' | 'up' | 'left' | 'right'

/** [parado, passo A, passo B] para cada direção. Os frames têm 16 de largura e 24 (crianças) ou 32 (adolescentes) de altura: ocupam 1 tile e sobressaem para cima. */
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

// ---------- adolescentes (A Cidade): 16x32, dois tiles de altura ----------

const TEEN_FRENTE = [
  '................',
  '................',
  '.....OOOOOO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHSSSSHHO...',
  '...OHSSSSSSHO...',
  '...OSSESSESSO...',
  '...OSSESSESSO...',
  '...OSSSSSSSSO...',
  '....OSSSSSSO....',
  '.....OOSSOO.....',
  '......OSSO......',
  '....OOCCCCOO....',
  '...OCCCCCCCCO...',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OSOCCCCCCOSO..',
  '..OSOCCCCCCOSO..',
  '..OSOCCCCCCOSO..',
  '..OSOccccccOSO..',
  '..OSSOOOOOOSSO..',
]

const TEEN_COSTAS = [
  '................',
  '................',
  '.....OOOOOO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OhHHHHHHhO...',
  '...OhhHHHHhhO...',
  '....OhhhhhhO....',
  '.....OSSSSO.....',
  '......OSSO......',
  '....OOCCCCOO....',
  '...OCCCCCCCCO...',
  '..OCCCCCCCCCCO..',
  '..OCCCCCCCCCCO..',
  '..OSOCCCCCCOSO..',
  '..OSOCCCCCCOSO..',
  '..OSOCCCCCCOSO..',
  '..OSOccccccOSO..',
  '..OSSOOOOOOSSO..',
]

const TEEN_LADO = [
  '................',
  '................',
  '.....OOOOOO.....',
  '....OHHHHHHO....',
  '...OHHHHHHHHO...',
  '...OHHHHHHHHO...',
  '...OHHHHHSSSO...',
  '...OHHHHSSSSO...',
  '...OHHHSSSESO...',
  '...OhHHSSSESO...',
  '...OhHHSSSSSO...',
  '....OhOSSSSO....',
  '.....OOSSSO.....',
  '......OSSO......',
  '.....OCCCCO.....',
  '....OCCCCCCO....',
  '....OCCCCCCO....',
  '....OCCCCCCO....',
  '....OCCSSCCO....',
  '....OCCSSCCO....',
  '....OCCSSCCO....',
  '....OccSSccO....',
  '....OOOSSOOO....',
]

const TEEN_PERNAS_FRENTE = {
  parado: ['...OPPPPPPPPO...', '...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OBBO..OBBO...', '...OOOO..OOOO...'],
  a: ['...OPPPPPPPPO...', '...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OBBO..OPPO...', '...OOOO..OBBO...', '.........OOOO...'],
  b: ['...OPPPPPPPPO...', '...OPPPPPPPPO...', '...OPPPOOPPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OPPO...', '...OPPO..OBBO...', '...OBBO..OOOO...', '...OOOO.........'],
}

const TEEN_PERNAS_LADO = {
  parado: ['....OPPPPPPO....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBBO....', '.....OOOOOOO....'],
  passo: ['....OPPPPPPO....', '....OPPPPPPO....', '...OPPPOOPPPO...', '...OPPO..OPPO...', '..OPPO....OPPO..', '..OPPO....OPPO..', '.OPPO......OPPO.', '.OBBO......OBBBO', '.OOOO......OOOOO'],
}

function cabeloCompridoTeen(topo: string[], dir: 'frente' | 'costas' | 'lado'): string[] {
  const t = [...topo]
  if (dir === 'frente') {
    for (let y = 7; y <= 14; y++) t[y] = trocar(t[y], { 2: 'O', 3: 'H', 12: 'H', 13: 'O' })
  } else if (dir === 'costas') {
    t[11] = '...OhHHHHHHhO...'
    t[12] = '...OHHHHHHHHO...'
    t[13] = '...OhHHHHHHhO...'
    t[14] = '...OhhhhhhhhO...'
    t[15] = '...OOhhhhhhOO...'
  } else {
    for (let y = 9; y <= 15; y++) t[y] = trocar(t[y], { 2: 'O', 3: 'H', 4: 'h' })
  }
  return t
}

function paletaAdolescente(a: AvatarConfig): Paleta {
  return { ...paletaPersonagem(a), P: '#34406a', B: '#eceef4' }
}

const cacheTeen = new Map<string, FramesPersonagem>()

/** Sprites de adolescente: proporções mais próximas das reais (cabeça mais pequena, corpo mais alto). */
export function framesAdolescente(a: AvatarConfig): FramesPersonagem {
  const chave = JSON.stringify(a)
  const guardado = cacheTeen.get(chave)
  if (guardado) return guardado

  const pal = paletaAdolescente(a)
  const frente = a.cabeloComprido ? cabeloCompridoTeen(TEEN_FRENTE, 'frente') : TEEN_FRENTE
  const costas = a.cabeloComprido ? cabeloCompridoTeen(TEEN_COSTAS, 'costas') : TEEN_COSTAS
  const lado = a.cabeloComprido ? cabeloCompridoTeen(TEEN_LADO, 'lado') : TEEN_LADO

  const f = (topo: string[], pernas: string[]) => grelha([...topo, ...pernas], pal)
  const direita: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement] = [
    f(lado, TEEN_PERNAS_LADO.parado),
    f(lado, TEEN_PERNAS_LADO.passo),
    f(lado, TEEN_PERNAS_LADO.passo),
  ]
  const frames: FramesPersonagem = {
    down: [f(frente, TEEN_PERNAS_FRENTE.parado), f(frente, TEEN_PERNAS_FRENTE.a), f(frente, TEEN_PERNAS_FRENTE.b)],
    up: [f(costas, TEEN_PERNAS_FRENTE.parado), f(costas, TEEN_PERNAS_FRENTE.a), f(costas, TEEN_PERNAS_FRENTE.b)],
    right: direita,
    left: [espelhar(direita[0]), espelhar(direita[1]), espelhar(direita[2])],
  }
  cacheTeen.set(chave, frames)
  return frames
}
