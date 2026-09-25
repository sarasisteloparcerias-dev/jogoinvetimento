import { circulo } from '../pixel/cenario'
import { hash, r } from '../pixel/draw'
import { framesPersonagem, type FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { AVATARES } from '../world/mapas'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const REMATES = 5
const POSTE_ESQ = 61
const POSTE_DIR = 179
const TRAVE = 25
const LINHA_BALIZA = 80
const MIRA_Y = 46
const MARCA = { x: 120, y: 110 }

type Fase = 'mirar' | 'remate' | 'resultado'

/** Penáltis: a mira anda pela baliza, A remata. O guarda-redes atira-se para um sítio ao acaso. */
export class Futebol implements MiniJogo {
  titulo = 'PENÁLTIS'
  instrucoes = ['A mira anda de um lado para o outro.', 'Carrega em A para rematar!', 'Nos cantos é mais difícil defender.']
  terminado = false
  private fase: Fase = 'mirar'
  private t = 0
  private mira = 120
  private sentido = 1
  private alvo = 120
  private mergulho = 120
  private defendeu = false
  private golos: boolean[] = []
  private jogador: FramesPersonagem
  private guardaRedes: FramesPersonagem

  constructor(avatar: AvatarConfig) {
    this.jogador = framesPersonagem(avatar)
    this.guardaRedes = framesPersonagem({ ...AVATARES.treinador, roupa: '#f0c020' })
  }

  private get velocidadeMira() {
    return 95 + this.golos.length * 22
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.t += s
    if (this.fase === 'mirar') {
      this.mira += this.sentido * this.velocidadeMira * s
      if (this.mira > POSTE_DIR - 5) {
        this.mira = POSTE_DIR - 5
        this.sentido = -1
      }
      if (this.mira < POSTE_ESQ + 5) {
        this.mira = POSTE_ESQ + 5
        this.sentido = 1
      }
      if (teclas.premidas.has('A')) this.rematar()
    } else if (this.fase === 'remate' && this.t >= 0.5) {
      this.golos.push(!this.defendeu)
      this.fase = 'resultado'
      this.t = 0
    } else if (this.fase === 'resultado' && this.t >= 1.3) {
      if (this.golos.length >= REMATES) this.terminado = true
      else {
        this.fase = 'mirar'
        this.t = 0
      }
    }
  }

  private rematar() {
    this.alvo = Math.round(this.mira)
    this.mergulho = 72 + Math.random() * 96
    const canto = this.alvo < 76 || this.alvo > 164
    this.defendeu = Math.abs(this.alvo - this.mergulho) < (canto ? 13 : 22)
    if (this.defendeu) this.mergulho = this.alvo
    this.fase = 'remate'
    this.t = 0
  }

  render(ctx: CanvasRenderingContext2D) {
    // bancada, publicidade e relva
    r(ctx, 0, 0, W, 16, '#5a6088')
    for (let x = 0; x < W; x += 3)
      for (let y = 2; y < 14; y += 4) r(ctx, x + (y % 8 ? 1 : 0), y, 2, 2, ['#f06060', '#f0c040', '#60a8f0', '#f0f0f0', '#e080c0'][Math.floor(hash(x, y) * 5)])
    for (let x = 0; x < W; x += 30) r(ctx, x, 16, 30, 6, (x / 30) % 2 ? '#e8743a' : '#4a7ad0')
    for (let y = 22; y < H; y += 12) r(ctx, 0, y, W, 12, (y / 12) % 2 ? '#7cc860' : '#70bc56')

    // baliza e rede
    r(ctx, POSTE_ESQ, TRAVE, POSTE_DIR - POSTE_ESQ, LINHA_BALIZA - TRAVE, '#5e9e4e')
    for (let x = POSTE_ESQ; x < POSTE_DIR; x += 6) r(ctx, x, TRAVE, 1, LINHA_BALIZA - TRAVE, '#cfe0cf')
    for (let y = TRAVE; y < LINHA_BALIZA; y += 6) r(ctx, POSTE_ESQ, y, POSTE_DIR - POSTE_ESQ, 1, '#cfe0cf')
    r(ctx, 20, LINHA_BALIZA, 200, 2, '#f6fcea')
    r(ctx, MARCA.x - 1, MARCA.y + 5, 3, 2, '#f6fcea')

    // guarda-redes
    const p = this.fase === 'mirar' ? 0 : Math.min(1, this.t / 0.3)
    const gx = 120 + (this.mergulho - 120) * p
    const lado = Math.abs(this.mergulho - 120) > 14 && p > 0.5 ? Math.sign(this.mergulho - 120) : 0
    ctx.save()
    ctx.translate(Math.round(gx), LINHA_BALIZA - 24)
    ctx.rotate((lado * Math.PI) / 2)
    ctx.drawImage(this.guardaRedes.down[0], -16, -24, 32, 48)
    ctx.restore()

    // postes por cima do guarda-redes
    r(ctx, POSTE_ESQ - 3, TRAVE - 3, 3, LINHA_BALIZA - TRAVE + 3, '#ffffff')
    r(ctx, POSTE_DIR, TRAVE - 3, 3, LINHA_BALIZA - TRAVE + 3, '#ffffff')
    r(ctx, POSTE_ESQ - 3, TRAVE - 3, POSTE_DIR - POSTE_ESQ + 6, 3, '#ffffff')
    r(ctx, POSTE_DIR + 2, TRAVE - 3, 1, LINHA_BALIZA - TRAVE + 3, '#b8c0c8')

    // bola
    let bx = MARCA.x
    let by = MARCA.y
    let raio = 4
    if (this.fase !== 'mirar') {
      const q = Math.min(1, this.t / 0.45)
      const k = this.fase === 'resultado' ? 1 : q
      bx = MARCA.x + (this.alvo - MARCA.x) * k
      by = MARCA.y + (MIRA_Y - MARCA.y) * k - Math.sin(k * Math.PI) * 10
      raio = 4 - Math.round(k)
    }
    circulo(ctx, Math.round(bx), Math.round(by), raio, '#ffffff', '#283040')
    r(ctx, Math.round(bx) - 1, Math.round(by) - 1, 2, 2, '#283040')

    // rematador (de costas)
    const pe = this.fase === 'remate' && this.t < 0.15 ? 1 : 0
    ctx.drawImage(this.jogador.up[pe], 64, 104, 48, 72)

    // mira
    if (this.fase === 'mirar') {
      const mx = Math.round(this.mira)
      circulo(ctx, mx, MIRA_Y, 6, 'rgba(0,0,0,0)', '#e83838')
      r(ctx, mx - 9, MIRA_Y, 5, 1, '#e83838')
      r(ctx, mx + 5, MIRA_Y, 5, 1, '#e83838')
      r(ctx, mx, MIRA_Y - 9, 1, 5, '#e83838')
      r(ctx, mx, MIRA_Y + 5, 1, 5, '#e83838')
    }

    // marcador
    for (let i = 0; i < REMATES; i++) {
      const g = this.golos[i]
      circulo(ctx, 170 + i * 14, 148, 5, g === undefined ? '#d8dce2' : g ? '#48c060' : '#e04848', '#283040')
    }
    textoContorno(ctx, 'REMATE', 6, 30, '#ffffff', 'left')
    textoContorno(ctx, `${Math.min(this.golos.length + 1, REMATES)}/${REMATES}`, 6, 41, '#ffffff', 'left')

    if (this.fase === 'resultado') {
      const golo = this.golos[this.golos.length - 1]
      textoContorno(ctx, golo ? 'GOLO!' : 'DEFENDEU!', 120, 88, golo ? '#f8e040' : '#ffffff', 'center', 16)
    }
  }

  resultado() {
    const golos = this.golos.filter(Boolean).length
    return { pontos: golos, texto: `${golos} ${golos === 1 ? 'golo' : 'golos'} em ${REMATES}` }
  }
}
