import { construirCamada, desenharCarroH, desenharCarroV, TILE } from '../pixel/cenario'
import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import type { Dir, FaixaDef, MapaDef, NpcDef, PlacaDef, PropDef } from './tipos'

export const ECRA_W = 240
export const ECRA_H = 160
const MS_PASSO = 230
const MS_PASSO_NPC = 340
const MS_VIRAR = 90

const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const OPOSTO: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const SOLIDOS = new Set(['T', 'w', '=', 'W', ' '])
const VEL_CARRO = 38
const CORES_CARRO = ['#e04848', '#4a7ad0', '#f0c040', '#3aa870', '#9468cc', '#ececf0', '#283040']

interface Carro {
  faixa: FaixaDef
  /** Posição ao longo da faixa, em píxeis (x da traseira/frente para h, y para v). */
  pos: number
  vel: number
  cor: string
}

/** Retângulo ocupado por um carro, em píxeis do mapa. */
function retCarro(c: Carro) {
  const f = c.faixa
  if (f.eixo === 'h') return { x: c.pos, y: f.linha * TILE, w: 30, h: 16 }
  return { x: f.linha * TILE + 1, y: c.pos, w: 14, h: 26 }
}

function sobrepoe(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

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
  /** O jogador estava perto (para acenar só quando chega). */
  perto?: boolean
  /** Milissegundos de aceno que faltam. */
  acenar?: number
}

/** Tempo (estação e chuva) do mapa exterior. */
export interface Ambiente {
  /** 0 primavera, 1 verão, 2 outono, 3 inverno (null: sem estações). */
  estacao: number | null
  chuva: boolean
}

interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  cor: string
  w: number
  h: number
}

/** Um dia dura 5 minutos de jogo: dia, pôr do sol, noite e amanhecer. */
const CICLO_DIA = 300000

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
function ligacoesPortas(mapas: Record<string, MapaDef>) {
  const entrada: Record<string, Destino> = {}
  const retorno: Record<string, Destino> = {}
  for (const mapa of Object.values(mapas)) {
    for (const e of mapa.edificios ?? []) {
      if (!e.interior) continue
      const interior = mapas[e.interior]
      const portaX = e.x + e.porta
      const portaY = e.y + e.h - 1
      entrada[e.interior] = { mapa: e.interior, x: interior.saida!.x, y: interior.saida!.y - 1, dir: 'up' }
      retorno[e.interior] = { mapa: mapa.id, x: portaX, y: portaY + 1, dir: 'down' }
    }
  }
  return { entrada, retorno }
}

function construirMapa(def: MapaDef, mapas: Record<string, MapaDef>): MapaVivo {
  const w = def.grelha[0].length
  const h = def.grelha.length
  const solido = def.grelha.flatMap((linha) => linha.split('').map((c) => SOLIDOS.has(c)))
  const props = new Map<string, PropDef>()
  const placas = new Map<string, PlacaDef>()
  const warps = new Map<string, Destino>()
  const trancados = new Map<string, string>()
  const { entrada, retorno } = ligacoesPortas(mapas)

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
    if (p.passavel) continue
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

function criarAtor(frames: FramesPersonagem, x: number, y: number, dir: Dir, ms: number, npc?: NpcDef): Ator {
  return { x, y, ox: x, oy: y, t: 0, movendo: false, dir, passo: 0, frames, ms, npc, espera: 800 + Math.random() * 2000 }
}

export type FabricaSprites = (a: AvatarConfig) => FramesPersonagem

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
  /** O jogador foi atropelado. */
  onAtropelado: () => void = () => {}
  /** O jogador entrou na estrada fora da passadeira. */
  onForaPassadeira: () => void = () => {}
  carros: Carro[] = []
  private atropelado = false
  ambiente: Ambiente = { estacao: null, chuva: false }
  /** Personagens com uma história nova para contar (mostram "!"). */
  novidades = new Set<string>()
  private particulas: Particula[] = []
  /** A porta por onde se acabou de entrar (abre-se durante a transição). */
  private porta: { mapa: string; x: number; y: number } | null = null
  /** Para onde aponta a seta de destino (tile no mapa atual), ou nada. */
  destino: { x: number; y: number; texto: string } | null = null

  private defs: Record<string, MapaDef>
  private sprites: FabricaSprites

  constructor(defs: Record<string, MapaDef>, sprites: FabricaSprites, avatar: AvatarConfig, mapa: string, x: number, y: number, dir: Dir) {
    this.defs = defs
    this.sprites = sprites
    this.jogador = criarAtor(sprites(avatar), x, y, dir, MS_PASSO)
    this.carregar(mapa, x, y, dir)
  }

  private obterMapa(id: string) {
    let m = this.mapas.get(id)
    if (!m) {
      m = construirMapa(this.defs[id], this.defs)
      this.mapas.set(id, m)
    }
    return m
  }

  carregar(id: string, x: number, y: number, dir: Dir) {
    this.mapa = this.obterMapa(id)
    Object.assign(this.jogador, { x, y, ox: x, oy: y, t: 0, movendo: false, dir })
    this.npcs = (this.mapa.def.npcs ?? []).map((n) => criarAtor(this.sprites(n.avatar), n.x, n.y, n.dir, MS_PASSO_NPC, n))
    this.carros = (this.mapa.def.transito ?? []).flatMap((f) => {
      const comp = (f.ate - f.de + 1) * TILE
      return Array.from({ length: f.carros }, (_, i) => ({
        faixa: f,
        pos: f.de * TILE + ((i + 0.3 + Math.random() * 0.4) * comp) / f.carros,
        vel: VEL_CARRO,
        cor: CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)],
      }))
    })
    this.atropelado = false
    this.onEntrarMapa(this.mapa.def)
  }

  private tile(x: number, y: number) {
    const g = this.mapa.def.grelha
    return y < 0 || y >= g.length || x < 0 || x >= g[0].length ? '' : g[y][x]
  }

  /** O jogador (ou o tile para onde está a ir) está dentro de um retângulo? */
  private jogadorEm(ret: { x: number; y: number; w: number; h: number }) {
    const j = this.jogador
    const tiles = [
      [j.x, j.y],
      [j.ox, j.oy],
    ]
    return tiles.some(([x, y]) => sobrepoe(ret, { x: x * TILE + 3, y: y * TILE + 3, w: 10, h: 10 }))
  }

  private carroEm(x: number, y: number) {
    return this.carros.some((c) => sobrepoe(retCarro(c), { x: x * TILE + 2, y: y * TILE + 2, w: 12, h: 12 }))
  }

  /** Carros: andam pela faixa, param atrás de outros carros, nos cruzamentos ocupados e quando há alguém na passadeira. */
  private atualizarCarros(dt: number) {
    const s = dt / 1000
    for (const c of this.carros) {
      const f = c.faixa
      const len = f.eixo === 'h' ? 30 : 26
      const frente = f.sentido === 1 ? c.pos + len : c.pos
      const olhar = (d: number) => {
        // retângulo à frente do carro, até d píxeis
        const r0 = retCarro(c)
        if (f.eixo === 'h') return { x: f.sentido === 1 ? frente : frente - d, y: r0.y, w: d, h: r0.h }
        return { x: r0.x, y: f.sentido === 1 ? frente : frente - d, w: r0.w, h: d }
      }
      let parar = false
      // outro carro na mesma faixa
      for (const o of this.carros) if (o !== c && o.faixa === f && sobrepoe(olhar(10), retCarro(o))) parar = true
      // passadeira com alguém em cima (pelo tile da passadeira à frente)
      const zona = olhar(18)
      const j = this.jogador
      for (const [tx, ty] of [
        [j.x, j.y],
        [j.ox, j.oy],
      ]) {
        if (this.tile(tx, ty) !== 'Z') continue
        const faixaPassadeira = f.eixo === 'h' ? { x: tx * TILE, y: (f.linha - 1) * TILE, w: TILE, h: TILE * 3 } : { x: (f.linha - 1) * TILE, y: ty * TILE, w: TILE * 3, h: TILE }
        if (sobrepoe(zona, faixaPassadeira)) parar = true
      }
      // cruzamento ocupado por um carro de outra direção
      const cruz = olhar(6)
      for (const o of this.carros) {
        if (o === c || o.faixa.eixo === f.eixo) continue
        const ro = retCarro(o)
        if (sobrepoe(cruz, ro) || sobrepoe(retCarro(c), ro)) {
          // quem já está dentro passa primeiro
          const dentroC = sobrepoe(retCarro(c), ro)
          if (!dentroC || f.eixo === 'v') parar = true
        }
      }
      c.vel = parar ? 0 : Math.min(VEL_CARRO, c.vel + 60 * s)
      c.pos += f.sentido * c.vel * s
      const ini = f.de * TILE - len
      const fim = (f.ate + 1) * TILE
      if (f.sentido === 1 && c.pos > fim) c.pos = ini
      if (f.sentido === -1 && c.pos < ini) c.pos = fim
      // atropelamento: o carro não pára para quem está na estrada fora da passadeira
      if (!this.atropelado && !this.bloqueado && this.jogadorEm(retCarro(c)) && this.tile(j.x, j.y) === 'R') {
        this.atropelado = true
        this.dirs = []
        this.onAtropelado()
      }
    }
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
    if (this.mapa.def.tipo === 'exterior') this.porta = { mapa: this.mapa.def.id, x: this.jogador.x, y: this.jogador.y }
    await this.fadeTo(1, 180)
    this.carregar(d.mapa, d.x, d.y, d.dir)
    this.porta = null
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
    if (this.carroEm(x, y)) return true
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

    if (!this.transicao) this.atualizarCarros(dt)

    const j = this.jogador
    if (j.movendo) {
      j.t += dt / j.ms
      if (j.t >= 1) {
        j.t = 0
        j.movendo = false
        const vinha = this.tile(j.ox, j.oy)
        j.ox = j.x
        j.oy = j.y
        if (this.tile(j.x, j.y) === 'R' && vinha !== 'R' && vinha !== 'Z') this.onForaPassadeira()
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

    this.atualizarAmbiente(dt)

    for (const a of this.npcs) {
      // acenar quando o jogador se aproxima
      const perto = Math.abs(a.x - j.x) + Math.abs(a.y - j.y) <= 2
      if (perto && !a.perto && !this.bloqueado) a.acenar = 1400
      a.perto = perto
      if (a.acenar && a.acenar > 0) a.acenar -= dt
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

    // porta aberta enquanto se entra
    if (this.porta && this.porta.mapa === this.mapa.def.id) {
      const px = this.porta.x * TILE - cx
      const py = this.porta.y * TILE - cy
      ctx.fillStyle = '#1a1410'
      ctx.fillRect(px + 3, py + 1, 10, 15)
      ctx.fillStyle = '#a86a3c'
      ctx.fillRect(px + 1, py + 1, 2, 15)
    }

    for (const c of this.carros) {
      const rc = retCarro(c)
      if (c.faixa.eixo === 'h') desenharCarroH(ctx, Math.round(rc.x - cx), Math.round(rc.y - cy), c.cor, c.faixa.sentido)
      else desenharCarroV(ctx, Math.round(rc.x - cx), Math.round(rc.y - cy), c.cor, c.faixa.sentido)
    }

    const atores = [...this.npcs, j].map((a) => ({ a, p: pos(a) })).sort((u, v) => u.p.y - v.p.y)
    for (const { a, p } of atores) {
      const frame = a.movendo && a.t >= 0.25 && a.t < 0.75 ? 1 + a.passo : 0
      const img = a.frames[a.dir][frame]
      const x = p.x - cx
      const y = p.y - cy - (img.height - TILE)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(x + 3, y + img.height - 2, 10, 2)
      ctx.drawImage(img, x, y)
      if (a.npc && this.novidades.has(a.npc.id) && !this.bloqueado) {
        // balão com "!" a saltitar
        const by = y - 11 + Math.round(Math.sin(this.agora / 200))
        ctx.fillStyle = '#283040'
        ctx.fillRect(x + 4, by, 9, 10)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x + 5, by + 1, 7, 8)
        ctx.fillStyle = '#e04848'
        ctx.fillRect(x + 8, by + 2, 1, 4)
        ctx.fillRect(x + 8, by + 7, 1, 1)
      }
      if (a.npc && a.acenar && a.acenar > 0) {
        // mão no ar a acenar
        const lado = Math.floor(this.agora / 180) % 2
        const mx = x + 13 + lado
        const my = y + 3
        ctx.fillStyle = '#2a2a36'
        ctx.fillRect(mx - 1, my - 1, 5, 5)
        ctx.fillRect(mx + 1, my + 3, 1, 4)
        ctx.fillStyle = a.npc.avatar.pele
        ctx.fillRect(mx, my, 3, 3)
      }
    }

    if (this.mapa.def.tipo === 'exterior') this.desenharAmbiente(ctx, cx, cy)

    if (this.destino && !this.bloqueado) this.desenharSeta(ctx, this.destino, cx, cy)

    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`
      ctx.fillRect(0, 0, ECRA_W, ECRA_H)
    }
  }

  /** 0 de dia, 1 de noite (com pôr do sol e amanhecer pelo meio). */
  noite() {
    const t = this.agora % CICLO_DIA
    const f = t / CICLO_DIA
    if (f < 0.66) return 0
    if (f < 0.76) return (f - 0.66) / 0.1
    if (f < 0.92) return 1
    return 1 - (f - 0.92) / 0.08
  }

  private atualizarAmbiente(dt: number) {
    const a = this.ambiente
    const exterior = this.mapa.def.tipo === 'exterior'
    const p = this.particulas
    if (exterior) {
      const gerar = (n: number, f: () => Particula) => {
        let quantos = n * dt
        while (quantos > 0 && p.length < 320) {
          if (quantos < 1 && Math.random() > quantos) break
          p.push(f())
          quantos -= 1
        }
      }
      const rx = () => Math.random() * (ECRA_W + 40) - 20
      if (a.chuva && a.estacao !== 3) gerar(0.22, () => ({ x: rx() + 30, y: -6, vx: -0.06, vy: 0.32, cor: 'rgba(170,200,240,0.7)', w: 1, h: 4 }))
      if (a.estacao === 3) gerar(a.chuva ? 0.06 : 0.02, () => ({ x: rx(), y: -4, vx: 0, vy: 0.025 + Math.random() * 0.02, cor: '#ffffff', w: 2, h: 2 }))
      if (a.estacao === 2) gerar(0.006, () => ({ x: rx(), y: -4, vx: 0.012, vy: 0.02, cor: ['#e8743a', '#c8502a', '#e0a020'][Math.floor(Math.random() * 3)], w: 2, h: 2 }))
      if (a.estacao === 0) gerar(0.003, () => ({ x: rx(), y: -4, vx: 0.01, vy: 0.015, cor: '#f8c0d8', w: 2, h: 1 }))
    }
    for (const q of p) {
      q.x += q.vx * dt + (q.w === 2 ? Math.sin((this.agora + q.y * 40) / 500) * 0.15 : 0)
      q.y += q.vy * dt
    }
    this.particulas = exterior ? p.filter((q) => q.y < ECRA_H + 6 && q.x > -30 && q.x < ECRA_W + 30) : []
  }

  private desenharAmbiente(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const a = this.ambiente
    for (const q of this.particulas) {
      ctx.fillStyle = q.cor
      ctx.fillRect(Math.round(q.x), Math.round(q.y), q.w, q.h)
    }
    const tons = ['rgba(255,240,250,0.04)', 'rgba(255,210,90,0.07)', 'rgba(210,120,40,0.1)', 'rgba(210,225,255,0.16)']
    if (a.estacao !== null) {
      ctx.fillStyle = tons[a.estacao]
      ctx.fillRect(0, 0, ECRA_W, ECRA_H)
    }
    if (a.chuva) {
      ctx.fillStyle = 'rgba(40,50,80,0.16)'
      ctx.fillRect(0, 0, ECRA_W, ECRA_H)
    }
    const n = this.noite()
    if (n > 0) {
      ctx.fillStyle = `rgba(18,24,70,${0.42 * n})`
      ctx.fillRect(0, 0, ECRA_W, ECRA_H)
      // os candeeiros acendem-se
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const p of this.mapa.def.props ?? []) {
        if (p.tipo !== 'candeeiro') continue
        const x = p.x * TILE + 8 - cx
        const y = p.y * TILE - 2 - cy
        if (x < -30 || x > ECRA_W + 30 || y < -30 || y > ECRA_H + 30) continue
        const g = ctx.createRadialGradient(x, y, 1, x, y, 26)
        g.addColorStop(0, `rgba(255,220,130,${0.55 * n})`)
        g.addColorStop(1, 'rgba(255,220,130,0)')
        ctx.fillStyle = g
        ctx.fillRect(x - 26, y - 26, 52, 52)
      }
      ctx.restore()
    }
  }

  /** Seta a saltitar por cima do destino, ou na borda do ecrã a apontar para ele. */
  private desenharSeta(ctx: CanvasRenderingContext2D, d: { x: number; y: number; texto: string }, cx: number, cy: number) {
    const tx = d.x * TILE + 8 - cx
    const ty = d.y * TILE - cy
    const salto = Math.round(Math.sin(this.agora / 160) * 2)
    const dentro = tx > 8 && tx < ECRA_W - 8 && ty > 14 && ty < ECRA_H - 4
    ctx.save()
    if (dentro) {
      ctx.translate(Math.round(tx), Math.round(ty) - 10 + salto)
      ctx.rotate(Math.PI / 2)
    } else {
      const px = ECRA_W / 2
      const py = ECRA_H / 2
      const ang = Math.atan2(ty - py, tx - px)
      const m = 12
      const k = Math.min((ECRA_W / 2 - m) / Math.max(0.001, Math.abs(Math.cos(ang))), (ECRA_H / 2 - m) / Math.max(0.001, Math.abs(Math.sin(ang))))
      ctx.translate(Math.round(px + Math.cos(ang) * (k - Math.abs(salto))), Math.round(py + Math.sin(ang) * (k - Math.abs(salto))))
      ctx.rotate(ang)
    }
    // triângulo com contorno
    ctx.fillStyle = '#283040'
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(-6, -7)
    ctx.lineTo(-6, 7)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f8e040'
    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(-4, -4.5)
    ctx.lineTo(-4, 4.5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
