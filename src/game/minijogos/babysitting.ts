import { circulo } from '../pixel/cenario'
import { r, tom } from '../pixel/draw'
import { H, W, textoContorno, type MiniJogo, type TeclaJogo, type Teclas } from './tipos'

const K = '#283040'
const DURACAO = 60
const SETAS: TeclaJogo[] = ['UP', 'RIGHT', 'DOWN', 'LEFT']
const BRINQUEDOS = [
  { nome: 'BOLA', cor: '#e04848', x: 120, y: 34 },
  { nome: 'CARRO', cor: '#4a7ad0', x: 176, y: 78 },
  { nome: 'PATO', cor: '#f0c040', x: 120, y: 122 },
  { nome: 'URSO', cor: '#a86a3c', x: 64, y: 78 },
]

/** Babysitting: o bebé quer brincar! Repete a sequência de brinquedos que ele mostra. */
export class Babysitting implements MiniJogo {
  titulo = 'BABYSITTING'
  instrucoes = ['O bebé mostra uma sequência de brinquedos.', 'Repete-a com as setas.', 'Cada ronda tem mais um brinquedo!']
  terminado = false
  private tempo = 0
  private sequencia: number[] = [this.aoAcaso(), this.aoAcaso()]
  private fase: 'mostrar' | 'repetir' | 'pausa' = 'pausa'
  private t = 1
  private mostrado = 0
  private aceso = -1
  private posicao = 0
  private rondas = 0
  private erros = 0
  private aviso: { texto: string; cor: string; t: number } | null = null

  private aoAcaso() {
    return Math.floor(Math.random() * 4)
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.t -= s
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }

    if (this.fase === 'pausa' && this.t <= 0) {
      this.fase = 'mostrar'
      this.mostrado = 0
      this.t = 0.7
      this.aceso = this.sequencia[0]
    } else if (this.fase === 'mostrar' && this.t <= 0) {
      if (this.aceso >= 0) {
        this.aceso = -1
        this.t = 0.2
        this.mostrado++
      } else if (this.mostrado < this.sequencia.length) {
        this.aceso = this.sequencia[this.mostrado]
        this.t = Math.max(0.35, 0.7 - this.rondas * 0.04)
      } else {
        this.fase = 'repetir'
        this.posicao = 0
      }
    } else if (this.fase === 'repetir') {
      if (this.t <= 0) this.aceso = -1
      const i = SETAS.findIndex((k) => teclas.premidas.has(k))
      if (i >= 0) {
        this.aceso = i
        this.t = 0.2
        if (i === this.sequencia[this.posicao]) {
          this.posicao++
          if (this.posicao >= this.sequencia.length) {
            this.rondas++
            this.sequencia.push(this.aoAcaso())
            this.aviso = { texto: 'O BEBÉ RIU-SE!', cor: '#80f080', t: 1 }
            this.fase = 'pausa'
            this.t = 1.1
          }
        } else {
          this.erros++
          this.aviso = { texto: 'BUÁÁÁ!', cor: '#ff8080', t: 1 }
          this.fase = 'pausa'
          this.t = 1.2
          if (this.sequencia.length > 2) this.sequencia.pop()
        }
      }
    }
    if (this.tempo >= DURACAO || this.erros >= 3) this.terminado = true
  }

  private brinquedo(ctx: CanvasRenderingContext2D, i: number, aceso: boolean) {
    const b = BRINQUEDOS[i]
    const cor = aceso ? tom(b.cor, 0.35) : b.cor
    circulo(ctx, b.x, b.y, aceso ? 17 : 15, aceso ? '#fff8c0' : '#f4ece0', K)
    if (i === 0) {
      circulo(ctx, b.x, b.y, 9, cor, K)
      r(ctx, b.x - 9, b.y - 1, 18, 2, '#ffffff')
    } else if (i === 1) {
      r(ctx, b.x - 11, b.y - 4, 22, 9, K)
      r(ctx, b.x - 10, b.y - 3, 20, 7, cor)
      r(ctx, b.x - 5, b.y - 8, 10, 5, K)
      r(ctx, b.x - 4, b.y - 7, 8, 4, '#9fd6f6')
      circulo(ctx, b.x - 6, b.y + 6, 3, '#3a3a44', K)
      circulo(ctx, b.x + 6, b.y + 6, 3, '#3a3a44', K)
    } else if (i === 2) {
      circulo(ctx, b.x - 1, b.y + 3, 8, cor, K)
      circulo(ctx, b.x + 4, b.y - 5, 5, cor, K)
      r(ctx, b.x + 8, b.y - 5, 5, 3, '#f08a3a')
      r(ctx, b.x + 4, b.y - 7, 2, 2, K)
    } else {
      circulo(ctx, b.x - 7, b.y - 8, 4, cor, K)
      circulo(ctx, b.x + 7, b.y - 8, 4, cor, K)
      circulo(ctx, b.x, b.y, 10, cor, K)
      r(ctx, b.x - 4, b.y - 3, 2, 2, K)
      r(ctx, b.x + 3, b.y - 3, 2, 2, K)
      circulo(ctx, b.x, b.y + 3, 3, tom(cor, 0.3))
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#fdeef4')
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < W; x += 32) r(ctx, x, y, 16, 16, '#fbe2ec')

    // bebé ao centro
    const bx = 120
    const by = 80
    const chora = this.aviso?.texto === 'BUÁÁÁ!'
    circulo(ctx, bx, by + 8, 11, '#f4f0ff', K)
    circulo(ctx, bx, by - 6, 10, '#ffe0bd', K)
    r(ctx, bx - 4, by - 8, 2, 2, K)
    r(ctx, bx + 3, by - 8, 2, 2, K)
    if (chora) {
      r(ctx, bx - 3, by - 2, 7, 3, K)
      r(ctx, bx - 5, by - 6, 1, 4, '#58a6f4')
      r(ctx, bx + 5, by - 6, 1, 4, '#58a6f4')
    } else {
      r(ctx, bx - 3, by - 2, 7, 1, K)
      r(ctx, bx - 2, by - 1, 5, 1, K)
    }
    r(ctx, bx - 1, by - 17, 3, 3, '#d4a017')

    BRINQUEDOS.forEach((_, i) => this.brinquedo(ctx, i, this.aceso === i))
    const marcas = ['^', '>', 'v', '<']
    BRINQUEDOS.forEach((b, i) => textoContorno(ctx, marcas[i], b.x + (i === 1 ? 24 : i === 3 ? -24 : 0), b.y + (i === 0 ? -26 : i === 2 ? 20 : -4), '#ffffff', 'center', 8))

    const msg = this.fase === 'repetir' ? `A TUA VEZ! ${this.posicao}/${this.sequencia.length}` : this.fase === 'mostrar' ? 'OLHA COM ATENÇÃO...' : ''
    textoContorno(ctx, msg, W / 2, H - 12, '#ffffff', 'center', 6)
    textoContorno(ctx, `${this.rondas} rondas`, 4, 4, '#ffffff', 'left')
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 4, '#ffffff', 'right')
    for (let i = 0; i < 3; i++) circulo(ctx, 210 + i * 10, 22, 3, i < 3 - this.erros ? '#f58cb4' : '#6a6a78', K)
    if (this.aviso) textoContorno(ctx, this.aviso.texto, bx, by + 26, this.aviso.cor, 'center', 6)
  }

  resultado() {
    return { pontos: this.rondas, texto: `${this.rondas} ${this.rondas === 1 ? 'ronda' : 'rondas'} de brincadeira · ${this.erros} ${this.erros === 1 ? 'birra' : 'birras'}` }
  }
}
