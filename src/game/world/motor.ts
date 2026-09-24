import { construirCamada, TILE } from '../pixel/cenario'
import { framesPersonagem, type FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { MAPAS } from './mapas'
import type { Dir, MapaDef, NpcDef, PlacaDef, PropDef } from './tipos'

export const ECRA_W = 240
export const ECRA_H = 160
const MS_PASSO = 230
const MS_PASSO_NPC = 340
const MS_VIRAR = 90

const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const OPOSTO: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const SOLIDOS = new Set(['T', 'w', '=', 'W', ' '])

interface Ator {
  x: number
  y: number
  ox: number
  oy: number
  t: number
  movendo: boolean
  dir: Dir
  passo: number
  frames: FramesPersonagem
  ms: number
  npc?: NpcDef
  espera: number
}

export type Interacao =
  | { tipo: 'npc'; npc: NpcDef }
  | { tipo: 'prop'; prop: PropDef }
  | { tipo: 'placa'; placa: PlacaDef }
  | { tipo: 'trancado'; texto: string }

interface Destino {
  mapa: string
  x: number
  y: number
  dir: Dir
}

interface MapaVivo {
  def: MapaDef
  w: number
  h: number
  camadas: HTMLCanvasElement[]
  solido: boolean[]
  props: Map<string, PropDef>
  placas: Map<string, PlacaDef>
  warps: Map<string, Destino>
  trancados: Map<string, string>
}

const k = (x: number, y: number) => `${x},${y}`

/** Para cada interior, onde se aparece ao entrar e onde se volta ao sair. */
function ligacoesPortas() {
  const entrada: Record<string, Destino> = {}
  const retorno: Record<string, Destino> = {}
  for (const mapa of Object.values(MAPAS)) {
    for (const e of mapa.edificios ?? []) {
      if (!e.interior) continue
      const interior = MAPAS[e.interior]
      const portaX = e.x + e.porta
      const portaY = e.y + e.h - 1
      entrada[e.interior] = { mapa: e.interior, x: interior.saida!.x, y: interior.saida!.y - 1, dir: 'up' }
      retorno[e.interior] = { mapa: mapa.id, x: portaX, y: portaY + 1, dir: 'down' }
    }
  }
  return { entrada, retorno }
}

function construirMapa(def: MapaDef): MapaVivo {
  const w = def.grelha[0].length
  const h = def.grelha.length
  const solido = def.grelha.flatMap((linha) => linha.split('').map((c) => SOLIDOS.has(c)))
  const props = new Map<string, PropDef>()
  const placas = new Map<string, PlacaDef>()
  const warps = new Map<string, Destino>()
  const trancados = new Map<string, string>()
  const { entrada, retorno } = ligacoesPortas()

  for (const e of def.edificios ?? []) {
    for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) solido[y * w + x] = true
    const px = e.x + e.porta
    const py = e.y + e.h - 1
    if (e.interior) {
      solido[py * w + px] = false
      warps.set(k(px, py), entrada[e.interior])
    } else if (e.trancado) {
      trancados.set(k(px, py), e.trancado)
    }
  }
  for (const p of def.props ?? []) {
    for (let y = p.y; y < p.y + (p.h ?? 1); y++)
      for (let x = p.x; x < p.x + (p.w ?? 1); x++) {
        if (p.tipo === 'tapete') continue
        solido[y * w + x] = true
        props.set(k(x, y), p)
      }
  }
  for (const pl of def.placas ?? []) {
    solido[pl.y * w + pl.x] = true
    placas.set(k(pl.x, pl.y), pl)
  }
  if (def.saida && retorno[def.id]) warps.set(k(def.saida.x, def.saida.y), retorno[def.id])

  return { def, w, h, camadas: [construirCamada(def, 0), construirCamada(def, 1)], solido, props, placas, warps, trancados }
}

function criarAtor(avatar: AvatarConfig, x: number, y: number, dir: Dir, ms: number, npc?: NpcDef): Ator {
  return { x, y, ox: x, oy: y, t: 0, movendo: false, dir, passo: 0, frames: framesPersonagem(avatar), ms, npc, espera: 800 + Math.random() * 2000 }
}

export class Motor {
  private mapas = new Map<string, MapaVivo>()
  mapa!: MapaVivo
  jogador: Ator
  npcs: Ator[] = []
  /** Posto a true enquanto há diálogo, menu ou script a correr. */
  bloqueado = false
  private transicao = false
  private dirs: Dir[] = []
  private viradoEm = 0
  private agora = 0
  private fade = 0
  private fadeDe = 0
  private fadeAte = 0
  private fadeT = 0
  private fadeDur = 0
  private fadeResolver?: () => void
  private esperaTrancado = 0
  onInteragir: (i: Interacao) => void = () => {}
  onEntrarMapa: (m: MapaDef) => void = () => {}

  constructor(avatar: AvatarConfig, mapa: string, x: number, y: number, dir: Dir) {
    this.jogador = criarAtor(avatar, x, y, dir, MS_PASSO)
    this.carregar(mapa, x, y, dir)
  }

  private obterMapa(id: string) {
    let m = this.mapas.get(id)
    if (!m) {
      m = construirMapa(MAPAS[id])
      this.mapas.set(id, m)
    }
    return m
  }

  carregar(id: string, x: number, y: number, dir: Dir) {
    this.mapa = this.obterMapa(id)
    Object.assign(this.jogador, { x, y, ox: x, oy: y, t: 0, movendo: false, dir })
    this.npcs = (this.mapa.def.npcs ?? []).map((n) => criarAtor(n.avatar, n.x, n.y, n.dir, MS_PASSO_NPC, n))
    this.onEntrarMapa(this.mapa.def)
  }

  get mapaId() {
    return this.mapa.def.id
  }

  premir(d: Dir) {
    this.dirs = this.dirs.filter((x) => x !== d)
    this.dirs.push(d)
  }

  soltar(d: Dir) {
    this.dirs = this.dirs.filter((x) => x !== d)
  }

  limparTeclas() {
    this.dirs = []
  }

  private get ativo() {
    return !this.bloqueado && !this.transicao
  }

  fadeTo(alvo: number, ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.fadeResolver?.()
      this.fadeDe = this.fade
      this.fadeAte = alvo
      this.fadeT = 0
      this.fadeDur = ms
      this.fadeResolver = resolve
    })
  }

  private async warp(d: Destino) {
    this.transicao = true
    await this.fadeTo(1, 180)
    this.carregar(d.mapa, d.x, d.y, d.dir)
    await this.fadeTo(0, 180)
    this.transicao = false
  }

  botaoA() {
    const j = this.jogador
    if (!this.ativo || j.movendo) return
    const [dx, dy] = DELTA[j.dir]
    const fx = j.x + dx
    const fy = j.y + dy
    const npc = this.npcEm(fx, fy)
    if (npc) return this.falarCom(npc)
    const prop = this.mapa.props.get(k(fx, fy))
    if (prop) {
      if (prop.tipo === 'balcao') {
        const atras = this.npcEm(fx + dx, fy + dy)
        if (atras) this.falarCom(atras)
        return
      }
      if (prop.script) this.onInteragir({ tipo: 'prop', prop })
      return
    }
    const placa = this.mapa.placas.get(k(fx, fy))
    if (placa) return this.onInteragir({ tipo: 'placa', placa })
    const trancado = this.mapa.trancados.get(k(fx, fy))
    if (trancado) this.onInteragir({ tipo: 'trancado', texto: trancado })
  }

  private falarCom(a: Ator) {
    a.dir = OPOSTO[this.jogador.dir]
    this.onInteragir({ tipo: 'npc', npc: a.npc! })
  }

  private npcEm(x: number, y: number) {
    return this.npcs.find((a) => (a.x === x && a.y === y) || (a.movendo && a.ox === x && a.oy === y))
  }

  private bloqueia(x: number, y: number, quem: Ator) {
    const m = this.mapa
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true
    if (m.solido[y * m.w + x]) return true
    const j = this.jogador
    if (quem !== j) {
      if ((j.x === x && j.y === y) || (j.ox === x && j.oy === y)) return true
      if (m.warps.has(k(x, y))) return true
    }
    return this.npcs.some((a) => a !== quem && ((a.x === x && a.y === y) || (a.ox === x && a.oy === y)))
  }

  private tentarMover(d: Dir) {
    const j = this.jogador
    const [dx, dy] = DELTA[d]
    const nx = j.x + dx
    const ny = j.y + dy
    const trancado = this.mapa.trancados.get(k(nx, ny))
    if (trancado) {
      if (this.esperaTrancado <= 0) {
        this.esperaTrancado = 700
        this.dirs = []
        this.onInteragir({ tipo: 'trancado', texto: trancado })
      }
      return
    }
    if (this.bloqueia(nx, ny, j)) return
    j.ox = j.x
    j.oy = j.y
    j.x = nx
    j.y = ny
    j.t = 0
    j.movendo = true
    j.passo = (j.passo + 1) % 2
  }

  update(dt: number) {
    this.agora += dt
    if (this.esperaTrancado > 0) this.esperaTrancado -= dt

    if (this.fadeDur > 0) {
      this.fadeT += dt
      const p = Math.min(1, this.fadeT / this.fadeDur)
      this.fade = this.fadeDe + (this.fadeAte - this.fadeDe) * p
      if (p >= 1) {
        this.fadeDur = 0
        const r = this.fadeResolver
        this.fadeResolver = undefined
        r?.()
      }
    }

    const j = this.jogador
    if (j.movendo) {
      j.t += dt / j.ms
      if (j.t >= 1) {
        j.t = 0
        j.movendo = false
        j.ox = j.x
        j.oy = j.y
        const w = this.mapa.warps.get(k(j.x, j.y))
        if (w) {
          void this.warp(w)
          return
        }
      }
    }
    if (!j.movendo && this.ativo) {
      const d = this.dirs[this.dirs.length - 1]
      if (d) {
        if (j.dir !== d) {
          j.dir = d
          this.viradoEm = this.agora
        } else if (this.agora - this.viradoEm >= MS_VIRAR) {
          this.tentarMover(d)
        }
      }
    }

    for (const a of this.npcs) {
      if (a.movendo) {
        a.t += dt / a.ms
        if (a.t >= 1) {
          a.t = 0
          a.movendo = false
          a.ox = a.x
          a.oy = a.y
        }
        continue
      }
      const v = a.npc?.vaguear
      if (!v || !this.ativo) continue
      a.espera -= dt
      if (a.espera > 0) continue
      a.espera = 1200 + Math.random() * 2400
      const dirs: Dir[] = ['up', 'down', 'left', 'right']
      const d = dirs[Math.floor(Math.random() * 4)]
      a.dir = d
      if (Math.random() < 0.35) continue
      const [dx, dy] = DELTA[d]
      const nx = a.x + dx
      const ny = a.y + dy
      if (nx < v.x0 || nx > v.x1 || ny < v.y0 || ny > v.y1 || this.bloqueia(nx, ny, a)) continue
      a.ox = a.x
      a.oy = a.y
      a.x = nx
      a.y = ny
      a.t = 0
      a.movendo = true
      a.passo = (a.passo + 1) % 2
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const j = this.jogador
    const pos = (a: Ator) => ({
      x: Math.round((a.ox + (a.x - a.ox) * a.t) * TILE),
      y: Math.round((a.oy + (a.y - a.oy) * a.t) * TILE),
    })
    const pj = pos(j)
    const mw = this.mapa.w * TILE
    const mh = this.mapa.h * TILE
    const cx = mw <= ECRA_W ? Math.floor((mw - ECRA_W) / 2) : Math.max(0, Math.min(mw - ECRA_W, pj.x + 8 - ECRA_W / 2))
    const cy = mh <= ECRA_H ? Math.floor((mh - ECRA_H) / 2) : Math.max(0, Math.min(mh - ECRA_H, pj.y + 8 - ECRA_H / 2))

    ctx.fillStyle = '#10121c'
    ctx.fillRect(0, 0, ECRA_W, ECRA_H)
    ctx.drawImage(this.mapa.camadas[Math.floor(this.agora / 650) % 2], -cx, -cy)

    const atores = [...this.npcs, j].map((a) => ({ a, p: pos(a) })).sort((u, v) => u.p.y - v.p.y)
    for (const { a, p } of atores) {
      const frame = a.movendo && a.t >= 0.25 && a.t < 0.75 ? 1 + a.passo : 0
      const x = p.x - cx
      const y = p.y - cy - 8
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(x + 3, y + 22, 10, 2)
      ctx.drawImage(a.frames[a.dir][frame], x, y)
    }

    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`
      ctx.fillRect(0, 0, ECRA_W, ECRA_H)
    }
  }
}
