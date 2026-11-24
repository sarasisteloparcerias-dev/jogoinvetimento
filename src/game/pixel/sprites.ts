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

// ---------- adultos e seniores: a mesma base, mais alta e com outros pormenores ----------

/** Adulto: um pixel mais alto, ombros mais largos e camisa com gola. */
function topoAdulto(topo: string[], dir: 'frente' | 'costas' | 'lado'): string[] {
  const t = topo.slice(1)
  if (dir !== 'lado') {
    t[13] = dir === 'frente' ? '....OOWCCWOO....' : '....OOCCCCOO....'
    t[14] = '..OCCCCCCCCCCO..'
  }
  // mais uma fila de tronco (fica mais alto)
  t.splice(17, 0, t[16])
  return t
}

/** Sénior: óculos e uma bengala. */
function topoSenior(topo: string[], dir: 'frente' | 'costas' | 'lado'): string[] {
  const t = topoAdulto(topo, dir)
  if (dir === 'frente') {
    t[7] = trocar(t[7], { 5: 'G', 7: 'G', 8: 'G', 10: 'G' })
  } else if (dir === 'lado') {
    t[7] = trocar(t[7], { 9: 'G', 11: 'G' })
  }
  return t
}

function comBengala(linhas: string[], col: number, de: number): string[] {
  return linhas.map((l, y) => (y >= de && l[col] === '.' ? trocar(l, { [col]: 'K' }) : l))
}

function gerarFrames(
  a: AvatarConfig,
  pal: Paleta,
  topo: (t: string[], dir: 'frente' | 'costas' | 'lado') => string[],
  bengala: boolean,
): FramesPersonagem {
  const cabelo = (t: string[], d: 'frente' | 'costas' | 'lado') => (a.cabeloComprido ? cabeloCompridoTeen(t, d) : t)
  const frente = topo(cabelo(TEEN_FRENTE, 'frente'), 'frente')
  const costas = topo(cabelo(TEEN_COSTAS, 'costas'), 'costas')
  const lado = topo(cabelo(TEEN_LADO, 'lado'), 'lado')
  const f = (t: string[], pernas: string[], col = -1) => grelha(col >= 0 ? comBengala([...t, ...pernas], col, 18) : [...t, ...pernas], pal)
  const cf = bengala ? 14 : -1
  const cl = bengala ? 12 : -1
  const direita: [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement] = [
    f(lado, TEEN_PERNAS_LADO.parado, cl),
    f(lado, TEEN_PERNAS_LADO.passo, cl),
    f(lado, TEEN_PERNAS_LADO.passo, cl),
  ]
  return {
    down: [f(frente, TEEN_PERNAS_FRENTE.parado, cf), f(frente, TEEN_PERNAS_FRENTE.a, cf), f(frente, TEEN_PERNAS_FRENTE.b, cf)],
    up: [f(costas, TEEN_PERNAS_FRENTE.parado, bengala ? 1 : -1), f(costas, TEEN_PERNAS_FRENTE.a, bengala ? 1 : -1), f(costas, TEEN_PERNAS_FRENTE.b, bengala ? 1 : -1)],
    right: direita,
    left: [espelhar(direita[0]), espelhar(direita[1]), espelhar(direita[2])],
  }
}

const cacheAdulto = new Map<string, FramesPersonagem>()
const cacheSenior = new Map<string, FramesPersonagem>()

/** Sprites de adulto (O Mercado, A Casa, O Negócio). */
export function framesAdulto(a: AvatarConfig): FramesPersonagem {
  const chave = JSON.stringify(a)
  let fr = cacheAdulto.get(chave)
  if (!fr) {
    fr = gerarFrames(a, { ...paletaPersonagem(a), P: '#2a3250', B: '#3a2a1a', W: '#f4f6fb' }, topoAdulto, false)
    cacheAdulto.set(chave, fr)
  }
  return fr
}

/** Sprites de sénior (A Reforma): óculos, bengala e calças claras. */
export function framesSenior(a: AvatarConfig): FramesPersonagem {
  const chave = JSON.stringify(a)
  let fr = cacheSenior.get(chave)
  if (!fr) {
    fr = gerarFrames(a, { ...paletaPersonagem(a), P: '#8a7a5a', B: '#5a3a22', W: '#f4f6fb', G: '#4a4a5a', K: '#7a4a1e' }, topoSenior, true)
    cacheSenior.set(chave, fr)
  }
  return fr
}

/** N'A Reforma, quem tem cabelo branco é sénior; os mais novos (a neta, os alunos) são adultos jovens. */
export function framesReforma(a: AvatarConfig): FramesPersonagem {
  return a.cabelo === '#d8d8d8' || a.cabelo === '#ffffff' || a.cabelo === '#e8e0d5' ? framesSenior(a) : framesAdulto(a)
}
