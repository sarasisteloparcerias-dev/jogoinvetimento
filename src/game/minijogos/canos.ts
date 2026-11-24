import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const DURACAO = 35
const COLS = 4
const LINHAS = 3

/** Canos a pingar: tapar as fugas antes que a casa inunde. */
export class Canos implements MiniJogo {
  titulo = 'FUGAS DE ÁGUA!'
  instrucoes = ['Setas: ir até à fuga. A: apertar.', 'Tapa as fugas antes que a água suba!', 'Se a casa inundar, a obra fica muito mais cara.']
  terminado = false
  private fugas: number[] = Array(COLS * LINHAS).fill(0)
  private cursor = 0
  private tempo = 0
  private agua = 0
  private proximo = 1
  private tapadas = 0
  private brilho: { i: number; t: number } | null = null

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.proximo -= s
    if (this.proximo <= 0) {
      const livres = this.fugas.map((f, i) => (f === 0 ? i : -1)).filter((i) => i >= 0)
      if (livres.length) this.fugas[livres[Math.floor(Math.random() * livres.length)]] = 0.01
      this.proximo = Math.max(0.55, 1.4 - this.tempo * 0.025)
    }
    for (let i = 0; i < this.fugas.length; i++) if (this.fugas[i] > 0) this.fugas[i] = Math.min(1, this.fugas[i] + s / 3)
    this.agua = Math.min(1, this.agua + (this.fugas.reduce((t, f) => t + f, 0) * s) / 22)
    const c = this.cursor % COLS
    const l = Math.floor(this.cursor / COLS)
    if (teclas.premidas.has('LEFT')) this.cursor = l * COLS + ((c + COLS - 1) % COLS)
    if (teclas.premidas.has('RIGHT')) this.cursor = l * COLS + ((c + 1) % COLS)
    if (teclas.premidas.has('UP')) this.cursor = ((l + LINHAS - 1) % LINHAS) * COLS + c
    if (teclas.premidas.has('DOWN')) this.cursor = ((l + 1) % LINHAS) * COLS + c
    if (teclas.premidas.has('A')) {
      if (this.fugas[this.cursor] > 0) {
        this.fugas[this.cursor] = 0
        this.tapadas++
        this.agua = Math.max(0, this.agua - 0.03)
        this.brilho = { i: this.cursor, t: 0.3 }
        sfx('apanhar')
      } else sfx('tic')
    }
    if (this.brilho) {
      this.brilho.t -= s
      if (this.brilho.t <= 0) this.brilho = null
    }
    if (this.tempo >= DURACAO || this.agua >= 1) this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#e8eef4')
    // azulejos
    for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) r(ctx, x, y, 11, 11, '#dde6ee')
    // canos horizontais e verticais
    for (let l = 0; l < LINHAS; l++) r(ctx, 16, 30 + l * 38, 208, 6, '#8890a8')
    for (let c = 0; c < COLS; c++) r(ctx, 34 + c * 52, 20, 6, 110, '#8890a8')
    this.fugas.forEach((f, i) => {
      const x = 37 + (i % COLS) * 52
      const y = 33 + Math.floor(i / COLS) * 38
      r(ctx, x - 6, y - 6, 12, 12, K)
      r(ctx, x - 5, y - 5, 10, 10, this.brilho?.i === i ? '#f8e040' : '#a8b0c4')
      if (f > 0) {
        const n = Math.ceil(f * 4)
        for (let k = 0; k < n; k++) r(ctx, x - 1 + (k % 2 ? 3 : -3), y + 6 + k * 5, 2, 4, '#4a9ae0')
        r(ctx, x - 2, y - 2, 4, 4, '#4a9ae0')
      }
      if (i === this.cursor) {
        r(ctx, x - 9, y - 9, 18, 2, '#e04848')
        r(ctx, x - 9, y + 7, 18, 2, '#e04848')
        r(ctx, x - 9, y - 9, 2, 18, '#e04848')
        r(ctx, x + 7, y - 9, 2, 18, '#e04848')
      }
    })
    // água a subir
    const alt = Math.round(this.agua * 40)
    r(ctx, 0, H - alt, W, alt, 'rgba(74, 154, 224, 0.55)')
    textoContorno(ctx, `${this.tapadas} fugas tapadas`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#283040', 'right', 6)
    textoContorno(ctx, `ÁGUA ${Math.round(this.agua * 100)}%`, W / 2, 146, this.agua > 0.7 ? '#e04848' : '#ffffff', 'center', 6)
  }

  resultado() {
    return {
      pontos: this.agua >= 1 ? Math.min(this.tapadas, 5) : this.tapadas,
      texto: this.agua >= 1 ? `A casa inundou! ${this.tapadas} fugas tapadas` : `${this.tapadas} fugas tapadas, água a ${Math.round(this.agua * 100)}%`,
    }
  }
}
