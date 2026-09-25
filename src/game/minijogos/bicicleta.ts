import { grelha, r } from '../pixel/draw'
import { framesPersonagem, type FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { AVATARES } from '../world/mapas'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 30
const VIDAS = 3
const FAIXAS = [80, 120, 160]
const ESTRADA_ESQ = 60
const ESTRADA_DIR = 180
const TOPO_JOGADOR = 100
const LINHA_CHOQUE = 146
const DURACAO_SALTO = 0.6

const ESTRELA = [
  '.....O.....',
  '....OYO....',
  '....OYO....',
  'OOOOYYYOOOO',
  'OYYYYWYYYYO',
  '.OYYYYYYYO.',
  '..OYYYYYO..',
  '..OYYOYYO..',
  '.OYYO.OYYO.',
  '.OYO...OYO.',
  '.OO.....OO.',
]

const CONE = [
  '.....OO.....',
  '.....oo.....',
  '....OooO....',
  '....OooO....',
  '...OWWWWO...',
  '...OWWWWO...',
  '..OooooooO..',
  '..OooooooO..',
  '.OWWWWWWWWO.',
  '.OooooooooO.',
  'OooooooooooO',
  'OOOOOOOOOOOO',
  'OddddddddddO',
  'OOOOOOOOOOOO',
]

const CORACAO = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']

interface Obstaculo {
  tipo: 'cone' | 'poca' | 'estrela'
  faixa: number
  y: number
}

let _img: Record<string, HTMLCanvasElement> | null = null
function img() {
  _img ??= {
    estrela: grelha(ESTRELA, { O: '#8a5a10', Y: '#f8d030', W: '#fff8c0' }),
    cone: grelha(CONE, { O: '#283040', o: '#f07a28', W: '#ffffff', d: '#8a4a1a' }),
    coracao: grelha(CORACAO, { R: '#e84860' }),
    coracaoVazio: grelha(CORACAO, { R: '#5a6078' }),
  }
  return _img
}

/** Corrida de bicicleta tipo "Subway Surfers": 3 faixas, desviar ou saltar obstáculos, apanhar estrelas. */
export class Bicicleta implements MiniJogo {
  titulo = 'PASSEIO DE BICICLETA'
  instrucoes = ['Setas: mudar de faixa.', 'A: saltar por cima de cones e poças.', 'Apanha as estrelas!']
  terminado = false
  private tempo = 0
  private distancia = 0
  private faixa = 1
  private x = FAIXAS[1]
  private salto = -1
  private vidas = VIDAS
  private invencivel = 0
  private estrelas = 0
  private proximo = 1
  private obstaculos: Obstaculo[] = []
  private jogador: FramesPersonagem
  private leo = framesPersonagem(AVATARES.leo)
  private bia = framesPersonagem(AVATARES.bia)
  private decor = Array.from({ length: 10 }, (_, i) => ({ x: i % 2 ? 8 + (i * 7) % 20 : 206 + (i * 5) % 22, y: i * 20 }))

  constructor(avatar: AvatarConfig) {
    this.jogador = framesPersonagem(avatar)
  }

  private get velocidade() {
    return 80 + this.tempo * 3.2
  }

  private get altura() {
    return this.salto < 0 ? 0 : Math.sin((this.salto / DURACAO_SALTO) * Math.PI) * 18
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    const v = this.velocidade
    this.distancia += v * s

    if (teclas.premidas.has('LEFT')) this.faixa = Math.max(0, this.faixa - 1)
    if (teclas.premidas.has('RIGHT')) this.faixa = Math.min(2, this.faixa + 1)
    if ((teclas.premidas.has('A') || teclas.premidas.has('UP')) && this.salto < 0) this.salto = 0
    const alvo = FAIXAS[this.faixa]
    this.x += Math.sign(alvo - this.x) * Math.min(Math.abs(alvo - this.x), 260 * s)
    if (this.salto >= 0) {
      this.salto += s
      if (this.salto >= DURACAO_SALTO) this.salto = -1
    }
    if (this.invencivel > 0) this.invencivel -= s

    this.proximo -= s
    if (this.proximo <= 0 && this.tempo < DURACAO - 1.5) {
      this.proximo = Math.max(0.55, 1.05 - this.tempo * 0.015)
      this.gerarFila()
    }

    const faixaAtual = Math.abs(this.x - alvo) < 14 ? this.faixa : -1
    for (const o of this.obstaculos) {
      o.y += v * s
      if (faixaAtual !== o.faixa || Math.abs(o.y - LINHA_CHOQUE) > 8) continue
      if (o.tipo === 'estrela') {
        if (this.altura < 14) {
          this.estrelas++
          o.y = 999
        }
      } else if (this.altura < 7 && this.invencivel <= 0) {
        this.vidas--
        this.invencivel = 1.2
        o.y = 999
      }
    }
    this.obstaculos = this.obstaculos.filter((o) => o.y < H + 20)
    for (const d of this.decor) {
      d.y += v * s
      if (d.y > H + 10) d.y -= H + 40
    }

    if (this.tempo >= DURACAO || this.vidas <= 0) this.terminado = true
  }

  private gerarFila() {
    const livres = [0, 1, 2].sort(() => Math.random() - 0.5)
    const nObstaculos = this.tempo > 10 && Math.random() < 0.45 ? 2 : 1
    for (let i = 0; i < nObstaculos; i++) this.obstaculos.push({ tipo: Math.random() < 0.6 ? 'cone' : 'poca', faixa: livres[i], y: -16 })
    if (Math.random() < 0.6) this.obstaculos.push({ tipo: 'estrela', faixa: livres[2], y: -16 })
  }

  render(ctx: CanvasRenderingContext2D) {
    const im = img()
    // relva e arbustos
    r(ctx, 0, 0, W, H, '#7cc860')
    for (const d of this.decor) {
      r(ctx, d.x, Math.round(d.y), 14, 10, '#3f9a45')
      r(ctx, d.x + 2, Math.round(d.y) - 3, 10, 3, '#3f9a45')
      r(ctx, d.x + 3, Math.round(d.y) - 1, 3, 2, '#6cc860')
    }
    // estrada
    r(ctx, ESTRADA_ESQ, 0, ESTRADA_DIR - ESTRADA_ESQ, H, '#7a7f8c')
    r(ctx, ESTRADA_ESQ - 3, 0, 3, H, '#f4f4f4')
    r(ctx, ESTRADA_DIR, 0, 3, H, '#f4f4f4')
    const off = Math.floor(this.distancia) % 24
    for (let y = -24 + off; y < H; y += 24) {
      r(ctx, 99, y, 2, 12, '#f0f0f0')
      r(ctx, 139, y, 2, 12, '#f0f0f0')
    }

    for (const o of this.obstaculos) {
      const cx = FAIXAS[o.faixa]
      const y = Math.round(o.y)
      if (o.tipo === 'cone') ctx.drawImage(im.cone, cx - 6, y - 12)
      else if (o.tipo === 'estrela') ctx.drawImage(im.estrela, cx - 5, y - 10)
      else
        for (let dy = -4; dy <= 4; dy++)
          for (let dx = -13; dx <= 13; dx++)
            if ((dx / 13) ** 2 + (dy / 4.5) ** 2 <= 1) r(ctx, cx + dx, y + dy, 1, 1, dy < -1 && Math.abs(dx) < 8 ? '#a8d8ff' : '#4a90e0')
    }

    // amigos a pedalar ao lado
    const pedal = Math.floor(this.tempo * 7) % 2
    this.ciclista(ctx, this.leo, 22, TOPO_JOGADOR + 6 + Math.round(Math.sin(this.tempo * 5) * 2), pedal, 0)
    this.ciclista(ctx, this.bia, 186, TOPO_JOGADOR + 6 + Math.round(Math.cos(this.tempo * 5) * 2), 1 - pedal, 0)

    // jogador
    const pisca = this.invencivel > 0 && Math.floor(this.invencivel * 10) % 2 === 0
    if (!pisca) this.ciclista(ctx, this.jogador, Math.round(this.x) - 16, TOPO_JOGADOR, pedal, Math.round(this.altura))

    // interface
    for (let i = 0; i < VIDAS; i++) ctx.drawImage(i < this.vidas ? im.coracao : im.coracaoVazio, 5 + i * 9, 5)
    ctx.drawImage(im.estrela, 196, 3)
    textoContorno(ctx, `${this.estrelas}`, 210, 5, '#ffffff', 'left')
    const resto = Math.max(0, 1 - this.tempo / DURACAO)
    r(ctx, 70, 6, 100, 5, '#283040')
    r(ctx, 71, 7, Math.round(98 * resto), 3, '#f8d030')
  }

  private ciclista(ctx: CanvasRenderingContext2D, f: FramesPersonagem, x: number, y: number, pedal: number, altura: number) {
    const chao = y + 50
    r(ctx, x + 8, chao, 16, 3, 'rgba(0,0,0,0.25)')
    const yy = y - altura
    r(ctx, x + 14, yy + 34, 4, 18, '#283040')
    r(ctx, x + 15, yy + 36, 2, 14, '#5a6078')
    r(ctx, x + 3, yy + 26, 26, 2, '#9aa0b0')
    r(ctx, x + 1, yy + 25, 4, 4, '#283040')
    r(ctx, x + 27, yy + 25, 4, 4, '#283040')
    ctx.drawImage(f.up[1 + pedal], x, yy, 32, 48)
  }

  resultado() {
    const estrelas = `${this.estrelas} ${this.estrelas === 1 ? 'estrela' : 'estrelas'}`
    return { pontos: this.estrelas, texto: this.vidas <= 0 ? `${estrelas} (bateste 3 vezes)` : estrelas }
  }
}
