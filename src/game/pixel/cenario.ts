import type { CorEdificio, EdificioDef, MapaDef, PropDef } from '../world/tipos'
import { criarCanvas, grelha, hash, larguraTextoMini, r, textoMini, tom } from './draw'

export const TILE = 16
const K = '#283040'

const C = {
  relva: '#88d06a',
  relvaEsc: '#5fae47',
  relvaCla: '#b6ea98',
  terra: '#e8cf94',
  terraEsc: '#c9a66a',
  terraCla: '#f7e9c4',
  agua: '#58a6f4',
  aguaEsc: '#3a7ed2',
  aguaCla: '#c4e6ff',
  areia: '#f1dfae',
  campo: '#9ee07c',
  campoEsc: '#8ed06c',
  linha: '#f6fcea',
}

// ---------- sobreposições desenhadas como grelhas ----------

const ARVORE = [
  '.....OOOOOO.....',
  '...OOtttuuttOO..',
  '..OtttttuuuttTO.',
  '.OttttttttuttTTO',
  '.OtuutttttttTTTO',
  'OttuuttttttTTTTO',
  'OtttttttttTTTTTO',
  'OTtttttttTTTTTTO',
  'OTTttttTTTTTTTTO',
  '.OTTTTTTTTTTTTO.',
  '..OOTTTTTTTTOO..',
  '....OOOKkOOO....',
  '......OKkO......',
  '......OKkO......',
  '.....OOKkOO.....',
  '......OOOO......',
]

const FLORES = [
  '................',
  '................',
  '..LRL...........',
  '..RYR...........',
  '..LRL...........',
  '...g............',
  '................',
  '................',
  '................',
  '..........LRL...',
  '..........RYR...',
  '..........LRL...',
  '...........g....',
  '................',
  '................',
  '................',
]

const PLACA = [
  '................',
  '................',
  '..OOOOOOOOOOOO..',
  '..OFFFFFFFFFFO..',
  '..OFffffffffFO..',
  '..OFFFFFFFFFFO..',
  '..OFffffffFFFO..',
  '..OFFFFFFFFFFO..',
  '..OOOOOOOOOOOO..',
  '......OKKO......',
  '......OKkO......',
  '......OKkO......',
  '......OKkO......',
  '.....OOKkOO.....',
  '................',
  '................',
]

const CERCA = [
  '................',
  '................',
  '................',
  '................',
  '..OOO......OOO..',
  '..OFO......OFO..',
  'OOOFOOOOOOOOFOOO',
  'FFFFFFFFFFFFFFFF',
  'ffffffffffffffff',
  'OOOFOOOOOOOOFOOO',
  '..OFO......OFO..',
  '..OFO......OFO..',
  '..OfO......OfO..',
  '..OfO......OfO..',
  '..OOO......OOO..',
  '................',
]

let _img: Record<string, HTMLCanvasElement> | null = null
function img() {
  if (_img) return _img
  _img = {
    arvore: grelha(ARVORE, { O: '#1e4a26', t: '#58b848', u: '#8ad86e', T: '#3a8a3a', K: '#8a5a2a', k: '#5e3c1a' }),
    floresV: grelha(FLORES, { L: '#ff9a9a', R: '#e84848', Y: '#f8e040', g: C.relvaEsc }),
    floresA: grelha(FLORES, { L: '#ffffff', R: '#f4f0ff', Y: '#f0b020', g: C.relvaEsc }),
    placa: grelha(PLACA, { O: K, F: '#dca462', f: '#9a6834', K: '#8a5a2a', k: '#5e3c1a' }),
    cerca: grelha(CERCA, { O: '#6a4a2a', F: '#f4e2c0', f: '#c8a878' }),
  }
  return _img
}

// ---------- chão ----------

function relva(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number) {
  r(ctx, px, py, 16, 16, C.relva)
  for (let i = 0; i < 3; i++) {
    if (hash(gx, gy, i) > 0.7) continue
    const tx = px + 1 + Math.floor(hash(gx, gy, i + 10) * 12)
    const ty = py + 2 + Math.floor(hash(gx, gy, i + 20) * 11)
    r(ctx, tx, ty, 1, 1, C.relvaEsc)
    r(ctx, tx + 2, ty, 1, 1, C.relvaEsc)
    r(ctx, tx + 1, ty + 1, 1, 1, C.relvaEsc)
    r(ctx, tx + 1, ty - 1, 1, 1, C.relvaCla)
  }
}

type Vizinho = (dx: number, dy: number) => boolean

function terra(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number, igual: Vizinho) {
  r(ctx, px, py, 16, 16, C.terra)
  for (let i = 0; i < 6; i++) {
    const x = px + Math.floor(hash(gx, gy, i + 30) * 15)
    const y = py + Math.floor(hash(gx, gy, i + 40) * 15)
    r(ctx, x, y, i % 3 === 0 ? 2 : 1, 1, i % 2 ? C.terraEsc : C.terraCla)
  }
  if (!igual(0, -1)) r(ctx, px, py, 16, 1, C.terraEsc)
  if (!igual(0, 1)) r(ctx, px, py + 15, 16, 1, C.terraEsc)
  if (!igual(-1, 0)) r(ctx, px, py, 1, 16, C.terraEsc)
  if (!igual(1, 0)) r(ctx, px + 15, py, 1, 16, C.terraEsc)
}

function agua(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number, frame: number, igual: Vizinho) {
  r(ctx, px, py, 16, 16, C.agua)
  for (let i = 0; i < 2; i++) {
    const wx = px + 2 + ((Math.floor(hash(gx, gy, i + 50) * 9) + frame * 2) % 9)
    const wy = py + 3 + i * 7 + Math.floor(hash(gx, gy, i + 60) * 3)
    r(ctx, wx, wy, 4, 1, C.aguaCla)
    r(ctx, wx + 1, wy + 1, 3, 1, C.aguaEsc)
  }
  if (!igual(0, -1)) {
    r(ctx, px, py, 16, 2, C.areia)
    r(ctx, px, py + 2, 16, 1, C.aguaEsc)
  }
  if (!igual(0, 1)) {
    r(ctx, px, py + 14, 16, 2, C.areia)
    r(ctx, px, py + 13, 16, 1, C.aguaCla)
  }
  if (!igual(-1, 0)) {
    r(ctx, px, py, 2, 16, C.areia)
    r(ctx, px + 2, py, 1, 16, C.aguaEsc)
  }
  if (!igual(1, 0)) {
    r(ctx, px + 14, py, 2, 16, C.areia)
    r(ctx, px + 13, py, 1, 16, C.aguaEsc)
  }
}

function campo(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, igual: Vizinho) {
  r(ctx, px, py, 16, 16, gx % 2 ? C.campo : C.campoEsc)
  if (!igual(0, -1)) r(ctx, px, py + 1, 16, 1, C.linha)
  if (!igual(0, 1)) r(ctx, px, py + 14, 16, 1, C.linha)
  if (!igual(-1, 0)) r(ctx, px + 1, py, 1, 16, C.linha)
  if (!igual(1, 0)) r(ctx, px + 14, py, 1, 16, C.linha)
}

// ---------- cidade ----------

const ESTRADA = ['R', 'Z']

function estrada(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number, estradaEm: Vizinho, asfaltoEm: Vizinho, zebra: boolean) {
  r(ctx, px, py, 16, 16, '#5c6070')
  for (let i = 0; i < 5; i++) {
    const x = px + Math.floor(hash(gx, gy, i + 70) * 15)
    const y = py + Math.floor(hash(gx, gy, i + 80) * 15)
    r(ctx, x, y, 1, 1, i % 2 ? '#686c7c' : '#52566a')
  }
  if (zebra) {
    // as riscas seguem o sentido dos carros: numa estrada horizontal, a passadeira tem riscas horizontais
    const horizontal = asfaltoEm(-1, 0) || asfaltoEm(1, 0)
    for (let i = 0; i < 4; i++) {
      if (horizontal) r(ctx, px + 1, py + 1 + i * 4, 14, 2, '#f4f4ee')
      else r(ctx, px + 1 + i * 4, py + 1, 2, 14, '#f4f4ee')
    }
    return
  }
  // linha do meio (tracejada), só fora dos cruzamentos
  if (estradaEm(0, -1) && !estradaEm(0, -2) && !estradaEm(0, 1)) {
    r(ctx, px + 2, py - 1, 6, 2, '#ece8c8')
    r(ctx, px + 10, py - 1, 4, 2, '#ece8c8')
  }
  if (estradaEm(-1, 0) && !estradaEm(-2, 0) && !estradaEm(1, 0)) {
    r(ctx, px - 1, py + 2, 2, 6, '#ece8c8')
    r(ctx, px - 1, py + 10, 2, 4, '#ece8c8')
  }
}

function passeio(ctx: CanvasRenderingContext2D, px: number, py: number, estradaEm: Vizinho) {
  r(ctx, px, py, 16, 16, '#d6d8de')
  r(ctx, px, py + 7, 16, 1, '#c2c5cc')
  r(ctx, px, py + 15, 16, 1, '#c2c5cc')
  r(ctx, px + 7, py, 1, 7, '#c2c5cc')
  r(ctx, px + 15, py + 8, 1, 7, '#c2c5cc')
  if (estradaEm(0, 1)) r(ctx, px, py + 13, 16, 3, '#9a9ea8')
  if (estradaEm(0, -1)) r(ctx, px, py, 16, 3, '#9a9ea8')
  if (estradaEm(-1, 0)) r(ctx, px, py, 3, 16, '#9a9ea8')
  if (estradaEm(1, 0)) r(ctx, px + 13, py, 3, 16, '#9a9ea8')
}

/** Calçada portuguesa: pedra clara com ondas de pedra escura. */
function calcada(ctx: CanvasRenderingContext2D, px: number, py: number) {
  r(ctx, px, py, 16, 16, '#efe8d8')
  for (let x = 0; x < 16; x++) {
    const onda = Math.round(Math.sin((px + x) / 5) * 2.5)
    for (let y = 0; y < 16; y++) {
      const m = (((py + y + onda) % 12) + 12) % 12
      if (m < 2) r(ctx, px + x, py + y, 1, 1, '#3e4050')
    }
  }
}

function soalho(ctx: CanvasRenderingContext2D, px: number, py: number, gx: number, gy: number) {
  r(ctx, px, py, 16, 16, '#dcaa6e')
  for (let i = 0; i < 4; i++) {
    const yy = py + i * 4
    r(ctx, px, yy + 3, 16, 1, '#c08a52')
    r(ctx, px + ((gx * 7 + gy * 3 + i * 5) % 16), yy, 1, 3, '#c08a52')
  }
}

function azulejo(ctx: CanvasRenderingContext2D, px: number, py: number) {
  r(ctx, px, py, 16, 16, '#e9edf3')
  r(ctx, px + 8, py, 8, 8, '#d3dae5')
  r(ctx, px, py + 8, 8, 8, '#d3dae5')
  r(ctx, px, py + 15, 16, 1, '#c3cad6')
  r(ctx, px + 15, py, 1, 16, '#c3cad6')
}

function parede(ctx: CanvasRenderingContext2D, px: number, py: number, gy: number, cor: string) {
  r(ctx, px, py, 16, 16, cor)
  r(ctx, px + 4, py, 1, 16, tom(cor, -0.07))
  r(ctx, px + 12, py, 1, 16, tom(cor, -0.07))
  if (gy === 0) r(ctx, px, py, 16, 3, tom(cor, -0.4))
  if (gy === 1) {
    r(ctx, px, py + 11, 16, 5, '#8a5a32')
    r(ctx, px, py + 11, 16, 1, '#b27a48')
  }
}

// ---------- edifícios ----------

const CORES_EDIFICIO: Record<CorEdificio, { telhado: string; parede: string }> = {
  laranja: { telhado: '#e8743a', parede: '#fbf1dc' },
  vermelho: { telhado: '#dc4646', parede: '#fff3de' },
  azul: { telhado: '#4a7ad0', parede: '#e6edf7' },
  verde: { telhado: '#2aa58c', parede: '#effaf4' },
  lilas: { telhado: '#9468cc', parede: '#f6f0ff' },
  castanho: { telhado: '#a86a3c', parede: '#fbf0dc' },
  rosa: { telhado: '#e0709a', parede: '#fff0f5' },
  cinza: { telhado: '#6a7486', parede: '#e2e5ea' },
  amarelo: { telhado: '#c88a20', parede: '#fbefc4' },
}

function letreiro(ctx: CanvasRenderingContext2D, texto: string, cx: number, sy: number, cor: string) {
  const sw = larguraTextoMini(texto) + 6
  const sx = cx - Math.floor(sw / 2)
  r(ctx, sx - 1, sy - 1, sw + 2, 11, K)
  r(ctx, sx, sy, sw, 9, '#fffbea')
  textoMini(ctx, texto, sx + 3, sy + 2, cor)
}

function janela(ctx: CanvasRenderingContext2D, jx: number, jy: number) {
  r(ctx, jx - 1, jy - 1, 12, 11, K)
  r(ctx, jx, jy, 10, 9, '#9fd6f6')
  r(ctx, jx, jy + 4, 10, 1, '#f4f8fc')
  r(ctx, jx + 4, jy, 1, 9, '#f4f8fc')
  r(ctx, jx + 1, jy + 1, 2, 1, '#ffffff')
  r(ctx, jx + 1, jy + 2, 1, 1, '#ffffff')
  r(ctx, jx + 6, jy + 6, 2, 1, '#d6f0ff')
}

/** Prédio de cidade: terraço plano, vários andares de janelas e, se for loja, montra com toldo. */
function desenharPredio(ctx: CanvasRenderingContext2D, e: EdificioDef) {
  const bx = e.x * TILE
  const by = e.y * TILE
  const bw = e.w * TILE
  const bh = e.h * TILE
  const { telhado: tel, parede: par } = CORES_EDIFICIO[e.cor]
  const telEsc = tom(tel, -0.28)

  // terraço com ar condicionado e antena
  r(ctx, bx + 5, by - 4, 10, 6, K)
  r(ctx, bx + 6, by - 3, 8, 4, '#c8ccd4')
  r(ctx, bx + 7, by - 2, 3, 2, '#8e96a4')
  r(ctx, bx + bw - 10, by - 9, 1, 10, K)
  r(ctx, bx + bw - 13, by - 7, 7, 1, K)
  r(ctx, bx - 1, by, bw + 2, 7, K)
  r(ctx, bx, by + 1, bw, 5, tom(tel, -0.1))
  r(ctx, bx, by + 1, bw, 1, tom(tel, 0.3))

  // fachada
  r(ctx, bx - 1, by + 7, 1, bh - 7, K)
  r(ctx, bx + bw, by + 7, 1, bh - 7, K)
  r(ctx, bx, by + 7, bw, bh - 7, par)
  for (let xx = bx + 8; xx < bx + bw; xx += 16) r(ctx, xx, by + 7, 1, bh - 23, tom(par, -0.05))
  r(ctx, bx, by + 7, bw, 2, tom(par, -0.2))

  const chao = by + bh - 16
  const andares = Math.floor((bh - 7) / 16)
  for (let k = 1; k < andares; k++) {
    const fy = chao - 16 * k
    r(ctx, bx, fy + 15, bw, 1, tom(par, -0.22))
    for (const c of e.janelas) {
      if (e.letreiro && c === e.porta && k === 1) continue
      const jx = bx + c * TILE + 3
      janela(ctx, jx, fy + 3)
      if (k % 2 === 0) {
        r(ctx, jx - 2, fy + 10, 14, 1, K)
        for (let i = 0; i < 14; i += 3) r(ctx, jx - 2 + i, fy + 11, 1, 3, K)
        r(ctx, jx - 2, fy + 14, 14, 1, K)
      } else r(ctx, jx - 2, fy + 12, 14, 2, tom(par, -0.3))
    }
  }

  // rés-do-chão
  r(ctx, bx, chao, bw, 16, tom(par, -0.08))
  if (e.toldo) {
    for (const c of e.janelas) {
      if (c === e.porta) continue
      const mx = bx + c * TILE + 1
      r(ctx, mx - 1, chao + 3, 16, 11, K)
      r(ctx, mx, chao + 4, 14, 9, '#bfe6fa')
      r(ctx, mx + 1, chao + 5, 3, 1, '#ffffff')
      for (let i = 0; i < 3; i++) {
        const cor = ['#e25b5b', '#f0c040', '#4a7ad0', '#3aa870', '#9468cc'][Math.floor(hash(e.x + c, e.y, i) * 5)]
        r(ctx, mx + 2 + i * 4, chao + 9, 3, 3, cor)
      }
    }
    const toldo = e.toldo
    for (let xx = bx; xx < bx + bw; xx += 4) {
      const cor = (xx - bx) % 8 ? '#ffffff' : toldo
      r(ctx, xx, chao - 2, 4, 5, cor)
      r(ctx, xx + 1, chao + 3, 2, 1, cor)
    }
    r(ctx, bx - 1, chao - 3, bw + 2, 1, K)
  } else {
    for (const c of e.janelas) if (c !== e.porta) janela(ctx, bx + c * TILE + 3, chao + 3)
  }

  // porta
  const dx = bx + e.porta * TILE + 2
  const dy = chao + 2
  r(ctx, dx - 1, dy - 1, 14, 15, K)
  if (e.letreiro) {
    r(ctx, dx, dy, 12, 14, '#7cc4ec')
    r(ctx, dx + 5, dy, 2, 14, '#3a6a9a')
    r(ctx, dx + 1, dy + 1, 1, 5, '#dff4ff')
    r(ctx, dx + 8, dy + 1, 1, 5, '#dff4ff')
  } else {
    r(ctx, dx, dy, 12, 14, '#6a7488')
    r(ctx, dx + 1, dy + 1, 10, 5, '#9fd6f6')
    r(ctx, dx + 9, dy + 8, 1, 2, '#f8d040')
    r(ctx, dx + 13, dy + 3, 2, 4, '#3a4050')
  }
  r(ctx, bx, by + bh - 2, bw, 2, '#a8a294')
  r(ctx, dx - 2, by + bh - 2, 16, 2, '#dcd4c4')

  if (e.letreiro) letreiro(ctx, e.letreiro, bx + e.porta * TILE + 8, chao - 15, telEsc)
}

export function desenharEdificio(ctx: CanvasRenderingContext2D, e: EdificioDef) {
  if (e.estilo === 'predio') return desenharPredio(ctx, e)
  const bx = e.x * TILE
  const by = e.y * TILE
  const bw = e.w * TILE
  const bh = e.h * TILE
  const telhadoH = bh - 32
  const { telhado: tel, parede: par } = CORES_EDIFICIO[e.cor]
  const telEsc = tom(tel, -0.28)
  const telCla = tom(tel, 0.3)

  if (e.chamine) {
    const cx = bx + bw - 18
    r(ctx, cx - 1, by - 5, 8, 12, K)
    r(ctx, cx, by - 4, 6, 11, '#b85a3a')
    r(ctx, cx, by - 4, 6, 2, '#d8805a')
  }

  // telhado
  r(ctx, bx + 1, by, bw - 2, 1, K)
  r(ctx, bx, by + 1, 1, 1, K)
  r(ctx, bx + bw - 1, by + 1, 1, 1, K)
  r(ctx, bx + 1, by + 1, bw - 2, 1, telCla)
  r(ctx, bx - 1, by + 2, 1, telhadoH - 3, K)
  r(ctx, bx + bw, by + 2, 1, telhadoH - 3, K)
  r(ctx, bx, by + 2, bw, telhadoH - 3, tel)
  for (let yy = by + 5, fila = 0; yy < by + telhadoH - 2; yy += 4, fila++) {
    r(ctx, bx, yy, bw, 1, telEsc)
    for (let xx = bx + (fila % 2 ? 4 : 0); xx < bx + bw; xx += 8) r(ctx, xx, yy - 3, 1, 3, tom(tel, -0.12))
  }
  r(ctx, bx - 1, by + telhadoH - 1, bw + 2, 1, K)

  // paredes
  const wy = by + telhadoH
  r(ctx, bx, wy, bw, 32, par)
  for (let yy = wy + 5; yy < by + bh - 5; yy += 4) r(ctx, bx + 1, yy, bw - 2, 1, tom(par, -0.06))
  r(ctx, bx + 1, wy, bw - 2, 2, tom(par, -0.22))
  if (e.cor === 'azul') {
    for (const colX of [bx + 2, bx + bw - 7]) {
      r(ctx, colX, wy + 2, 5, 26, '#fbfdff')
      r(ctx, colX + 4, wy + 2, 1, 26, tom(par, -0.2))
    }
  }
  r(ctx, bx, wy, 1, 32, K)
  r(ctx, bx + bw - 1, wy, 1, 32, K)
  r(ctx, bx + 1, by + bh - 4, bw - 2, 3, '#b8b0a4')
  r(ctx, bx + 1, by + bh - 4, bw - 2, 1, '#d8d0c4')
  r(ctx, bx, by + bh - 1, bw, 1, K)

  // janelas
  for (const c of e.janelas) {
    const jx = bx + c * TILE + 3
    const jy = wy + 7
    r(ctx, jx - 1, jy - 1, 12, 11, K)
    r(ctx, jx, jy, 10, 9, '#9fd6f6')
    r(ctx, jx, jy + 4, 10, 1, '#f4f8fc')
    r(ctx, jx + 4, jy, 1, 9, '#f4f8fc')
    r(ctx, jx + 1, jy + 1, 2, 1, '#ffffff')
    r(ctx, jx + 1, jy + 2, 1, 1, '#ffffff')
    r(ctx, jx + 6, jy + 6, 2, 1, '#d6f0ff')
    r(ctx, jx - 2, jy + 9, 14, 2, '#c9b79c')
    if (!e.letreiro) {
      r(ctx, jx - 1, jy + 11, 12, 2, '#7a4a24')
      for (let i = 0; i < 4; i++) r(ctx, jx + i * 3, jy + 10, 2, 1, i % 2 ? '#f8e040' : '#e84868')
    }
  }

  // porta
  const dx = bx + e.porta * TILE + 2
  const dy = by + bh - 20
  r(ctx, dx - 1, dy - 1, 14, 17, K)
  if (e.letreiro) {
    r(ctx, dx, dy, 12, 16, '#7cc4ec')
    r(ctx, dx + 5, dy, 2, 16, '#3a6a9a')
    r(ctx, dx + 1, dy + 1, 1, 6, '#dff4ff')
    r(ctx, dx + 8, dy + 1, 1, 6, '#dff4ff')
  } else {
    r(ctx, dx, dy, 12, 16, '#9a6236')
    r(ctx, dx + 2, dy + 2, 8, 5, '#b8783f')
    r(ctx, dx + 2, dy + 9, 8, 5, '#b8783f')
    r(ctx, dx + 9, dy + 8, 1, 1, '#f8d040')
  }
  r(ctx, dx - 2, by + bh - 4, 16, 3, '#dcd4c4')

  if (e.letreiro) letreiro(ctx, e.letreiro, bx + e.porta * TILE + 8, wy - 11, telEsc)
}

// ---------- mobília e objetos ----------

export function circulo(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number, cor: string, contorno?: string) {
  for (let dy = -raio; dy <= raio; dy++)
    for (let dx = -raio; dx <= raio; dx++) {
      const d = dx * dx + dy * dy
      if (d > raio * raio + raio) continue
      const borda = contorno && d > (raio - 1) * (raio - 1) + (raio - 1)
      r(ctx, cx + dx, cy + dy, 1, 1, borda ? contorno : cor)
    }
}

export function desenharProp(ctx: CanvasRenderingContext2D, p: PropDef) {
  const px = p.x * TILE
  const py = p.y * TILE
  const W = (p.w ?? 1) * TILE
  const H = (p.h ?? 1) * TILE
  switch (p.tipo) {
    case 'cama':
      r(ctx, px + 1, py + 1, 14, 30, K)
      r(ctx, px + 2, py + 2, 12, 5, '#b0703c')
      r(ctx, px + 2, py + 7, 12, 22, '#ffffff')
      r(ctx, px + 3, py + 8, 10, 5, '#dce8ff')
      r(ctx, px + 3, py + 12, 10, 1, '#b8c8e8')
      r(ctx, px + 2, py + 15, 12, 14, '#e25b5b')
      r(ctx, px + 2, py + 15, 12, 2, '#f08a8a')
      for (let yy = py + 20; yy < py + 29; yy += 4) r(ctx, px + 2, yy, 12, 1, '#c84444')
      r(ctx, px + 2, py + 29, 12, 2, '#b0703c')
      break
    case 'mealheiro':
      r(ctx, px + 1, py + 9, 14, 3, K)
      r(ctx, px + 2, py + 9, 12, 2, '#c98a4c')
      r(ctx, px + 3, py + 12, 2, 4, '#7a4a24')
      r(ctx, px + 11, py + 12, 2, 4, '#7a4a24')
      r(ctx, px + 4, py + 2, 8, 1, K)
      r(ctx, px + 3, py + 3, 1, 5, K)
      r(ctx, px + 12, py + 3, 1, 1, K)
      r(ctx, px + 4, py + 8, 8, 1, K)
      r(ctx, px + 4, py + 3, 8, 5, '#f59ab8')
      r(ctx, px + 12, py + 4, 2, 3, '#ec7aa2')
      r(ctx, px + 14, py + 4, 1, 3, K)
      r(ctx, px + 13, py + 5, 1, 1, K)
      r(ctx, px + 10, py + 1, 2, 2, '#ec7aa2')
      r(ctx, px + 11, py + 4, 1, 1, K)
      r(ctx, px + 6, py + 3, 3, 1, '#7a2848')
      r(ctx, px + 5, py + 4, 2, 1, '#ffd0e0')
      r(ctx, px + 2, py + 4, 1, 1, '#ec7aa2')
      r(ctx, px + 5, py + 8, 2, 1, '#c85a80')
      r(ctx, px + 9, py + 8, 2, 1, '#c85a80')
      r(ctx, px + 7, py, 2, 2, '#f8d040')
      break
    case 'mesa':
      r(ctx, px + 1, py + 3, W - 2, 8, K)
      r(ctx, px + 2, py + 4, W - 4, 6, '#c98a4c')
      r(ctx, px + 2, py + 4, W - 4, 1, '#e2a868')
      r(ctx, px + 2, py + 11, 2, 4, '#7a4a24')
      r(ctx, px + W - 4, py + 11, 2, 4, '#7a4a24')
      if (W >= 32) {
        r(ctx, px + W / 2 - 2, py, 4, 5, '#6aa8e8')
        r(ctx, px + W / 2 - 1, py - 2, 2, 2, '#f06060')
      }
      break
    case 'tv':
      r(ctx, px + 2, py + 11, 12, 4, '#7a4a24')
      r(ctx, px + 1, py + 1, 14, 11, K)
      r(ctx, px + 2, py + 2, 12, 9, '#4a5262')
      r(ctx, px + 3, py + 3, 10, 7, '#7cc8f0')
      r(ctx, px + 4, py + 4, 3, 1, '#e0f6ff')
      r(ctx, px + 4, py + 5, 1, 2, '#e0f6ff')
      break
    case 'planta':
      r(ctx, px + 4, py + 10, 8, 5, K)
      r(ctx, px + 5, py + 10, 6, 4, '#c8643a')
      r(ctx, px + 5, py + 10, 6, 1, '#e0845a')
      r(ctx, px + 4, py + 2, 8, 8, '#3f9a45')
      r(ctx, px + 3, py + 4, 10, 4, '#3f9a45')
      r(ctx, px + 5, py + 3, 2, 2, '#6cc860')
      r(ctx, px + 9, py + 5, 2, 2, '#6cc860')
      r(ctx, px + 4, py + 9, 8, 1, '#2a7a34')
      break
    case 'estante':
    case 'prateleira': {
      const corpo = p.tipo === 'estante' ? '#9a6a3a' : '#efe6d6'
      r(ctx, px + 1, py + 1, 14, 30, K)
      r(ctx, px + 2, py + 2, 12, 28, corpo)
      const cores = ['#e25b5b', '#4a7ad0', '#f0c040', '#3aa870', '#9468cc', '#f08a3a']
      for (let s = 0; s < 3; s++) {
        const sy = py + 3 + s * 9
        r(ctx, px + 2, sy + 7, 12, 1, p.tipo === 'estante' ? '#6a4422' : '#b8ae9c')
        for (let i = 0; i < 5; i++) {
          const cor = cores[(i + s * 2) % cores.length]
          if (p.tipo === 'estante') r(ctx, px + 3 + i * 2, sy + 1 + ((i + s) % 2), 2, 6 - ((i + s) % 2), cor)
          else if (i < 3) circulo(ctx, px + 4 + i * 4, sy + 4, 1, cor)
        }
      }
      break
    }
    case 'balcao':
      r(ctx, px, py + 2, W, 13, K)
      r(ctx, px, py + 3, W, 4, '#f2e4cc')
      r(ctx, px, py + 3, W, 1, '#fff6e6')
      r(ctx, px, py + 7, W, 7, '#b27a48')
      for (let xx = px + 7; xx < px + W; xx += 16) r(ctx, xx, py + 8, 2, 5, '#8e5c34')
      break
    case 'cofre':
      r(ctx, px + 1, py + 2, 30, 29, K)
      r(ctx, px + 2, py + 3, 28, 27, '#8f9aab')
      r(ctx, px + 2, py + 3, 28, 2, '#b7c1cf')
      circulo(ctx, px + 16, py + 17, 8, '#aeb8c6', K)
      r(ctx, px + 15, py + 11, 2, 12, '#6a7484')
      r(ctx, px + 10, py + 16, 12, 2, '#6a7484')
      r(ctx, px + 15, py + 16, 2, 2, '#f0c040')
      break
    case 'quadro':
      r(ctx, px + 1, py + 4, W - 2, 22, '#8a5a2a')
      r(ctx, px + 3, py + 6, W - 6, 18, '#2f5e46')
      r(ctx, px + 6, py + 9, 14, 1, '#e8f0e8')
      r(ctx, px + 6, py + 13, 20, 1, '#e8f0e8')
      r(ctx, px + 6, py + 17, 10, 1, '#e8f0e8')
      circulo(ctx, px + W - 12, py + 14, 4, '#2f5e46', '#f0e060')
      r(ctx, px + 2, py + 26, W - 4, 2, '#6a4422')
      break
    case 'carteira':
      r(ctx, px + 1, py + 3, 14, 7, K)
      r(ctx, px + 2, py + 4, 12, 5, '#d49a5a')
      r(ctx, px + 2, py + 4, 12, 1, '#eab87a')
      r(ctx, px + 2, py + 10, 2, 4, '#6a4a2a')
      r(ctx, px + 12, py + 10, 2, 4, '#6a4a2a')
      r(ctx, px + 5, py + 5, 5, 3, '#4a7ad0')
      break
    case 'tapete':
      r(ctx, px + 1, py + 1, W - 2, H - 2, '#c8504a')
      r(ctx, px + 3, py + 3, W - 6, H - 6, '#e07a5a')
      for (let xx = px + 4; xx < px + W - 4; xx += 4) {
        r(ctx, xx, py + 2, 1, 1, '#f8d8a0')
        r(ctx, xx, py + H - 3, 1, 1, '#f8d8a0')
      }
      break
    case 'bola':
      circulo(ctx, px + 8, py + 10, 5, '#ffffff', K)
      r(ctx, px + 7, py + 9, 3, 2, K)
      r(ctx, px + 5, py + 12, 1, 1, K)
      r(ctx, px + 11, py + 12, 1, 1, K)
      break
    case 'banco_jardim':
      r(ctx, px + 3, py + 9, 2, 6, K)
      r(ctx, px + W - 5, py + 9, 2, 6, K)
      r(ctx, px + 1, py + 1, W - 2, 11, K)
      r(ctx, px + 2, py + 2, W - 4, 2, '#c88a4a')
      r(ctx, px + 2, py + 5, W - 4, 2, '#c88a4a')
      r(ctx, px + 2, py + 8, W - 4, 3, '#a0662f')
      break
    case 'candeeiro':
      r(ctx, px + 5, py + 12, 6, 3, '#3a4050')
      r(ctx, px + 7, py - 12, 2, 25, '#3a4050')
      r(ctx, px + 4, py - 17, 8, 6, '#3a4050')
      r(ctx, px + 5, py - 16, 6, 4, '#fff0a0')
      break
    case 'maquina_cafe':
      r(ctx, px + 1, py + 1, 14, 14, K)
      r(ctx, px + 2, py + 2, 12, 12, '#c8ccd4')
      r(ctx, px + 2, py + 2, 12, 3, '#e8eaee')
      r(ctx, px + 4, py + 6, 8, 3, '#3a4050')
      r(ctx, px + 5, py + 9, 1, 2, '#3a4050')
      r(ctx, px + 10, py + 9, 1, 2, '#3a4050')
      r(ctx, px + 4, py + 11, 3, 3, '#ffffff')
      r(ctx, px + 12, py + 3, 1, 1, '#e04848')
      r(ctx, px + 10, py + 3, 1, 1, '#48c060')
      break
    case 'mesa_cafe':
      r(ctx, px + 7, py + 9, 2, 6, '#3a4050')
      r(ctx, px + 4, py + 14, 8, 1, '#3a4050')
      circulo(ctx, px + 8, py + 6, 6, '#f4ece0', K)
      r(ctx, px + 6, py + 3, 3, 3, '#ffffff')
      r(ctx, px + 6, py + 3, 3, 1, '#6a3f26')
      break
    case 'montra': {
      r(ctx, px + 1, py + 1, W - 2, H - 2, K)
      r(ctx, px + 2, py + 2, W - 4, H - 4, '#f6f2ff')
      r(ctx, px + 3, py + 3, 2, H - 8, '#ffffff')
      const cores = ['#e25b5b', '#4a7ad0', '#f0c040', '#3aa870', '#9468cc', '#283040']
      for (let s = 0; s < 3; s++) {
        const sy = py + 3 + s * 9
        r(ctx, px + 2, sy + 7, W - 4, 1, '#b8ae9c')
        for (let i = 0; i < W / 8 - 1; i++) {
          const cor = cores[(i + s * 2 + p.x) % cores.length]
          r(ctx, px + 4 + i * 7, sy + 4, 5, 3, cor)
          r(ctx, px + 4 + i * 7, sy + 6, 5, 1, '#ffffff')
        }
      }
      break
    }
    case 'computador':
      r(ctx, px + 1, py + 8, 14, 7, K)
      r(ctx, px + 2, py + 9, 12, 2, '#c98a4c')
      r(ctx, px + 2, py + 11, 2, 4, '#7a4a24')
      r(ctx, px + 12, py + 11, 2, 4, '#7a4a24')
      r(ctx, px + 3, py, 10, 8, K)
      r(ctx, px + 4, py + 1, 8, 5, '#7cc8f0')
      r(ctx, px + 5, py + 4, 2, 1, '#48c060')
      r(ctx, px + 7, py + 3, 2, 1, '#48c060')
      r(ctx, px + 9, py + 2, 2, 1, '#48c060')
      r(ctx, px + 7, py + 6, 2, 2, K)
      break
    case 'cotacoes': {
      r(ctx, px + 1, py + 3, W - 2, H - 6, K)
      r(ctx, px + 2, py + 4, W - 4, H - 8, '#1c2230')
      for (let i = 0; i < 5; i++) {
        const yy = py + 6 + i * 4
        const sobe = hash(p.x, i, 3) > 0.4
        r(ctx, px + 4, yy, 10, 2, '#e8f0e8')
        r(ctx, px + 16, yy, 8, 2, sobe ? '#48d060' : '#f05050')
        r(ctx, px + 26, yy + (sobe ? 0 : 1), 3, 1, sobe ? '#48d060' : '#f05050')
        r(ctx, px + 27, yy + (sobe ? 1 : 0), 1, 1, sobe ? '#48d060' : '#f05050')
      }
      for (let x = 0; x < W - 40; x++) {
        const yy = py + 12 + Math.round(Math.sin(x / 4) * 3 - x / 10)
        r(ctx, px + 34 + x, yy, 1, 1, '#f0c040')
      }
      break
    }
    case 'sofa':
      r(ctx, px + 1, py + 2, W - 2, 13, K)
      r(ctx, px + 2, py + 3, W - 4, 5, '#4a7ad0')
      r(ctx, px + 2, py + 8, W - 4, 5, '#6a9ae8')
      r(ctx, px + 2, py + 3, 3, 10, '#3a68b8')
      r(ctx, px + W - 5, py + 3, 3, 10, '#3a68b8')
      break
    case 'carro': {
      const cor = p.cor ?? '#e04848'
      r(ctx, px + 1, py + 3, W - 2, 10, K)
      r(ctx, px + 2, py + 4, W - 4, 8, cor)
      r(ctx, px + 8, py, W - 16, 5, K)
      r(ctx, px + 9, py + 1, W - 18, 4, '#9fd6f6')
      r(ctx, px + W / 2, py + 1, 1, 4, K)
      r(ctx, px + 2, py + 6, W - 4, 1, tom(cor, 0.3))
      r(ctx, px + 2, py + 5, 2, 2, '#fff0a0')
      r(ctx, px + W - 4, py + 5, 2, 2, '#e04848')
      circulo(ctx, px + 7, py + 13, 2, '#3a3a44', K)
      circulo(ctx, px + W - 8, py + 13, 2, '#3a3a44', K)
      break
    }
    case 'semaforo':
      r(ctx, px + 7, py + 2, 2, 13, '#3a4050')
      r(ctx, px + 5, py - 10, 6, 14, K)
      r(ctx, px + 6, py - 9, 4, 3, '#f05050')
      r(ctx, px + 6, py - 5, 4, 3, '#5a4a20')
      r(ctx, px + 6, py - 1, 4, 3, '#2a5a30')
      break
    case 'fonte':
      circulo(ctx, px + 16, py + 17, 13, '#b8c0cc', K)
      circulo(ctx, px + 16, py + 17, 10, '#58a6f4')
      r(ctx, px + 9, py + 14, 4, 1, '#c4e6ff')
      r(ctx, px + 19, py + 20, 4, 1, '#c4e6ff')
      r(ctx, px + 14, py + 8, 4, 10, K)
      r(ctx, px + 15, py + 9, 2, 9, '#d8dce4')
      r(ctx, px + 15, py + 3, 2, 5, '#c4e6ff')
      r(ctx, px + 12, py + 5, 1, 3, '#c4e6ff')
      r(ctx, px + 19, py + 5, 1, 3, '#c4e6ff')
      break
    case 'caixa_multibanco':
      r(ctx, px + 2, py, 12, 15, K)
      r(ctx, px + 3, py + 1, 10, 13, '#8f9aab')
      r(ctx, px + 4, py + 2, 8, 5, '#48c0a0')
      for (let i = 0; i < 3; i++) r(ctx, px + 4 + i * 3, py + 9, 2, 1, '#e8eaee')
      r(ctx, px + 4, py + 11, 8, 1, K)
      break
    case 'correio':
      r(ctx, px + 7, py + 8, 2, 7, '#6a4a2a')
      r(ctx, px + 3, py + 2, 10, 7, K)
      r(ctx, px + 4, py + 3, 8, 5, '#e04848')
      r(ctx, px + 4, py + 3, 8, 1, '#f47a7a')
      r(ctx, px + 12, py, 1, 5, '#f0c040')
      break
  }
}

// ---------- carros em movimento ----------

/** Carro de lado (estrada horizontal): 30x16, virado para a direita (sentido 1) ou esquerda. */
export function desenharCarroH(ctx: CanvasRenderingContext2D, x: number, y: number, cor: string, sentido: 1 | -1) {
  r(ctx, x, y + 3, 30, 10, K)
  r(ctx, x + 1, y + 4, 28, 8, cor)
  r(ctx, x + 7, y, 16, 5, K)
  r(ctx, x + 8, y + 1, 14, 4, '#9fd6f6')
  r(ctx, x + 15, y + 1, 1, 4, K)
  r(ctx, x + 1, y + 6, 28, 1, tom(cor, 0.3))
  const frente = sentido === 1 ? x + 27 : x + 1
  const tras = sentido === 1 ? x + 1 : x + 27
  r(ctx, frente, y + 5, 2, 2, '#fff0a0')
  r(ctx, tras, y + 5, 2, 2, '#e04848')
  circulo(ctx, x + 7, y + 13, 2, '#3a3a44', K)
  circulo(ctx, x + 23, y + 13, 2, '#3a3a44', K)
}

/** Carro de frente/de trás (estrada vertical): 14x26. */
export function desenharCarroV(ctx: CanvasRenderingContext2D, x: number, y: number, cor: string, sentido: 1 | -1) {
  r(ctx, x, y, 14, 26, K)
  r(ctx, x + 1, y + 1, 12, 24, cor)
  const vidro = sentido === 1 ? y + 16 : y + 3
  r(ctx, x + 2, vidro, 10, 6, '#9fd6f6')
  r(ctx, x + 2, sentido === 1 ? y + 4 : y + 18, 10, 4, tom(cor, -0.2))
  const luz = sentido === 1 ? y + 23 : y + 1
  r(ctx, x + 1, luz, 3, 2, '#fff0a0')
  r(ctx, x + 10, luz, 3, 2, '#fff0a0')
  r(ctx, x - 1, y + 4, 1, 5, K)
  r(ctx, x + 14, y + 4, 1, 5, K)
  r(ctx, x - 1, y + 17, 1, 5, K)
  r(ctx, x + 14, y + 17, 1, 5, K)
}

// ---------- camada estática do mapa ----------

export function construirCamada(mapa: MapaDef, frame: number): HTMLCanvasElement {
  const w = mapa.grelha[0].length
  const h = mapa.grelha.length
  const { c, ctx } = criarCanvas(w * TILE, h * TILE)
  const ch = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? '' : mapa.grelha[y][x])
  const im = img()

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = mapa.grelha[y][x]
      const px = x * TILE
      const py = y * TILE
      const igual = (alvo: string[]) => (dx: number, dy: number) => alvo.includes(ch(x + dx, y + dy))
      switch (t) {
        case '#':
          terra(ctx, px, py, x, y, igual(['#']))
          break
        case 'w':
          agua(ctx, px, py, x, y, frame, igual(['w']))
          break
        case 'F':
          campo(ctx, px, py, x, igual(['F']))
          break
        case 'W':
          parede(ctx, px, py, y, mapa.parede ?? '#f3e7cf')
          break
        case '_':
        case 'X':
          if (mapa.chao === 'azulejo') azulejo(ctx, px, py)
          else soalho(ctx, px, py, x, y)
          break
        case 'R':
        case 'Z':
          estrada(ctx, px, py, x, y, igual(ESTRADA), igual(['R']), t === 'Z')
          break
        case 'p':
          passeio(ctx, px, py, igual(ESTRADA))
          break
        case 'q':
          calcada(ctx, px, py)
          break
        case ' ':
          break
        default:
          relva(ctx, px, py, x, y)
          if (t === 'T') ctx.drawImage(im.arvore, px, py)
          if (t === 'f') ctx.drawImage((x + y) % 2 ? im.floresV : im.floresA, px, py)
          if (t === '=') ctx.drawImage(im.cerca, px, py)
      }
    }
  }

  if (mapa.saida) {
    const px = mapa.saida.x * TILE
    const py = mapa.saida.y * TILE
    r(ctx, px + 1, py + 3, 14, 12, '#4f7a4a')
    for (let yy = py + 5; yy < py + 14; yy += 3) r(ctx, px + 2, yy, 12, 1, '#6e9a62')
  }

  for (const p of [...(mapa.props ?? [])].filter((p) => p.tipo === 'tapete')) desenharProp(ctx, p)
  for (const e of mapa.edificios ?? []) desenharEdificio(ctx, e)
  for (const pl of mapa.placas ?? []) ctx.drawImage(im.placa, pl.x * TILE, pl.y * TILE)
  const props = [...(mapa.props ?? [])].filter((p) => p.tipo !== 'tapete').sort((a, b) => a.y - b.y)
  for (const p of props) desenharProp(ctx, p)

  return c
}

// ---------- crachás ----------

const SIMBOLOS: Record<string, string[]> = {
  poupanca: ['..XXXXX..', '.X.....X.', 'X..XXX..X', 'X..X....X', 'X..XXX..X', 'X....X..X', 'X..XXX..X', '.X.....X.', '..XXXXX..'],
  juro: ['.........', 'XX.....XX', 'XXX...XXX', '.XXX.XXX.', '..XX.XX..', '....X....', '....X....', '....X....', '..XXXXX..'],
  investidor: ['....X....', '...XXX...', '..XXXXX..', '.XXXXXXX.', '...XXX...', '...XXX...', '...XXX...', '...XXX...', '...XXX...'],
  risco: ['........X', '.......XX', 'X.....XX.', 'XX...XX..', '.XX.XX...', '..XXX....', '...X.....', '.........', 'XXXXXXXXX'],
  reserva: ['XXXXXXXXX', 'X.......X', 'X..XXX..X', 'X..XXX..X', 'X..XXX..X', '.X..X..X.', '..X...X..', '...X.X...', '....X....'],
  objetivo: ['....X....', '....X....', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '..XX.XX..', '.XX...XX.', '.X.....X.'],
  conta: ['.........', 'XXXXXXXXX', 'X.......X', 'XXXXXXXXX', 'X.......X', 'X.XX....X', 'X.......X', 'XXXXXXXXX', '.........'],
  salario: ['...XXXX..', '..X......', '.X.......', 'XXXXX....', '.X.......', 'XXXXX....', '.X.......', '..X......', '...XXXX..'],
  diversificada: ['.........', '.......XX', '.......XX', '....XX.XX', '....XX.XX', '.XX.XX.XX', '.XX.XX.XX', '.XX.XX.XX', 'XXXXXXXXX'],
  mao_firme: ['....X....', '...X.X...', '....X....', '..XXXXX..', '....X....', 'X...X...X', 'XX..X..XX', '.XX.X.XX.', '..XXXXX..'],
  anti_burla: ['..XXXXX..', '.X.....X.', '.X.....X.', 'XXXXXXXXX', 'XXXX.XXXX', 'XXX...XXX', 'XXXX.XXXX', 'XXXX.XXXX', 'XXXXXXXXX'],
  emergencia: ['....X....', '..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', 'X.X.X.X.X', '....X....', '....X....', '..X.X....', '...X.....'],
  zero_juros: ['XX.....X.', 'XX....X..', '.....X...', '....X....', '...X.....', '..X......', '.X....XX.', 'X.....XX.', '.........'],
  regular: ['.X.....X.', 'XXXXXXXXX', 'X.......X', 'X.X.X.X.X', 'X.......X', 'X.X.X.X.X', 'X.......X', 'XXXXXXXXX', '.........'],
  irs: ['XXXXXX...', 'X....XX..', 'X.XX.XXX.', 'X......X.', 'X.XXXX.X.', 'X......X.', 'X.XXXX.X.', 'X......X.', 'XXXXXXXX.'],
  aumento: ['.....XXXX', '.......XX', '......X.X', '.....X...', 'X...X....', 'XX.X.....', 'X.X......', 'X........', 'XXXXXXXXX'],
  casa: ['....X....', '...XXX...', '..XXXXX..', '.XXXXXXX.', 'XXXXXXXXX', '.X.....X.', '.X.XX..X.', '.X.XX..X.', '.XXXXXXX.'],
  carta: ['.........', '..XXXXX..', '.X.X.X.X.', 'XXXXXXXXX', 'XXXXXXXXX', 'X.XXXXX.X', '.X.....X.', '.........', '.........'],
  viagem: ['....X....', '....X....', '...XXX...', '.XXXXXXX.', 'XXXXXXXXX', '....X....', '....X....', '...XXX...', '..XX.XX..'],
}

export const COR_CRACHA: Record<string, string> = {
  poupanca: '#f06090',
  juro: '#48b048',
  investidor: '#4a7ad0',
  risco: '#f09a30',
  reserva: '#8a6ad0',
  objetivo: '#e0b020',
  conta: '#4a7ad0',
  salario: '#e0b020',
  diversificada: '#48b048',
  mao_firme: '#8a6ad0',
  anti_burla: '#e05050',
  emergencia: '#f09a30',
  viagem: '#30a8c8',
  zero_juros: '#d05080',
  regular: '#3aa0a0',
  irs: '#7a8496',
  aumento: '#2a9a5a',
  casa: '#e8743a',
  carta: '#e04848',
}

const cacheCracha = new Map<string, HTMLCanvasElement>()

export function iconeCracha(id: string, obtido: boolean): HTMLCanvasElement {
  const chave = id + obtido
  const guardado = cacheCracha.get(chave)
  if (guardado) return guardado
  const { c, ctx } = criarCanvas(16, 16)
  const cor = obtido ? COR_CRACHA[id] : '#9aa0aa'
  circulo(ctx, 8, 8, 7, cor, K)
  r(ctx, 4, 3, 3, 2, tom(cor, 0.45))
  const s = SIMBOLOS[id]
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (s[y][x] === 'X') r(ctx, 4 + x, 4 + y, 1, 1, obtido ? '#ffffff' : '#d8dce2')
  cacheCracha.set(chave, c)
  return c
}
