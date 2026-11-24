import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 40
/** Quanto tempo o peixe fica preso ao anzol (cada vez menos). */
const JANELA = 0.75

type Fase = 'esperar' | 'picou' | 'apanhou' | 'fugiu'

/** Pesca no lago: espera com calma e puxa (A) quando o peixe morde. Puxar antes do tempo espanta-o. */
export class Pesca implements MiniJogo {
  titulo = 'PESCA NO LAGO'
  instrucoes = ['Espera com calma...', 'Quando a boia afundar e aparecer "!", carrega em A.', 'Se puxares antes, o peixe foge!']
  terminado = false
  private tempo = 0
  private fase: Fase = 'esperar'
  private t = 0
  private espera = 2 + Math.random() * 3
  private peixes = 0
  private grandes = 0
  private pressa = 0
  private ultimo = ''

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.t += s
    const a = teclas.premidas.has('A')
    if (this.fase === 'esperar') {
      if (a) {
        this.pressa++
        this.fase = 'fugiu'
        this.ultimo = 'CALMA! ESPANTASTE-O'
        this.t = 0
        sfx('erro')
      } else if (this.t >= this.espera) {
        this.fase = 'picou'
        this.t = 0
        sfx('tic')
      }
    } else if (this.fase === 'picou') {
      if (a) {
        const grande = Math.random() < 0.25
        this.peixes++
        if (grande) this.grandes++
        this.ultimo = grande ? 'UM PEIXE ENORME!' : 'APANHASTE UM PEIXE!'
        this.fase = 'apanhou'
        this.t = 0
        sfx(grande ? 'golo' : 'ponto')
      } else if (this.t > Math.max(0.4, JANELA - this.tempo * 0.006)) {
        this.fase = 'fugiu'
        this.ultimo = 'FUGIU...'
        this.t = 0
      }
    } else if (this.t > 1.2) {
      this.fase = 'esperar'
      this.t = 0
      this.espera = 1.8 + Math.random() * 3.5
    }
    if (this.tempo >= DURACAO && this.fase !== 'picou') this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    // céu, árvores e lago
    r(ctx, 0, 0, W, 60, '#bfe4f6')
    for (let x = 0; x < W; x += 22) r(ctx, x, 40 - ((x * 7) % 9), 20, 24, '#4a9a50')
    r(ctx, 0, 60, W, 100, '#4a90d0')
    for (let i = 0; i < 9; i++) r(ctx, (i * 31 + Math.floor(this.tempo * 8)) % W, 70 + ((i * 17) % 70), 10, 1, '#7ab8e8')
    // margem e pescador
    r(ctx, 0, 128, 70, 32, '#8a6a40')
    r(ctx, 0, 126, 70, 3, '#5a8a40')
    r(ctx, 26, 98, 12, 18, '#e8743a')
    r(ctx, 28, 90, 8, 8, '#f1c27d')
    r(ctx, 27, 88, 10, 3, '#d8d8d8')
    r(ctx, 26, 116, 12, 12, '#3a4a7a')
    // cana e linha
    ctx.strokeStyle = '#5a3a1a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(36, 104)
    ctx.lineTo(110, 52)
    ctx.stroke()
    const afunda = this.fase === 'picou' ? 6 : this.fase === 'esperar' ? Math.round(Math.sin(this.tempo * 3)) : 0
    const bx = 150
    const by = 92 + afunda
    ctx.strokeStyle = '#f4f6fb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(110, 52)
    ctx.lineTo(bx, by)
    ctx.stroke()
    r(ctx, bx - 3, by - 4, 6, 4, '#e04848')
    r(ctx, bx - 3, by, 6, 3, '#ffffff')
    if (this.fase === 'picou') {
      textoContorno(ctx, '!', bx, by - 22, '#f8e040', 'center', 12)
      r(ctx, bx - 10, by + 4, 20, 1, '#ffffff')
    }
    if (this.fase === 'apanhou' || this.fase === 'fugiu') textoContorno(ctx, this.ultimo, W / 2, 20, this.fase === 'apanhou' ? '#f8e040' : '#ffffff', 'center', 7)
    textoContorno(ctx, `${this.peixes} peixes`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#283040', 'right', 6)
    textoContorno(ctx, 'A: PUXAR', W - 40, H - 12, '#ffffff', 'center', 6)
  }

  resultado() {
    return { pontos: this.peixes, texto: `${this.peixes} ${this.peixes === 1 ? 'peixe' : 'peixes'}${this.grandes ? ` (${this.grandes} ${this.grandes === 1 ? 'enorme' : 'enormes'})` : ''}${this.pressa ? ` · ${this.pressa} com pressa a mais` : ''}` }
  }
}
