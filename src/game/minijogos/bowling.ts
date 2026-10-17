import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const JOGADAS = 5
const PINOS: [number, number][] = [
  [120, 22],
  [112, 30],
  [128, 30],
  [104, 38],
  [120, 38],
  [136, 38],
  [96, 46],
  [112, 46],
  [128, 46],
  [144, 46],
]

/** Bowling com os amigos: A para fixar a direção, A outra vez para a força. */
export class Bowling implements MiniJogo {
  titulo = 'BOWLING'
  instrucoes = ['A: fixar a direção da bola.', 'A outra vez: escolher a força.', `${JOGADAS} bolas. Derruba o máximo de pinos!`]
  terminado = false
  private fase: 'mira' | 'forca' | 'rolar' | 'resultado' = 'mira'
  private mira = 0
  private sentido = 1
  private forca = 0
  private bolaX = 120
  private bolaY = 140
  private alvo = 120
  private de = 120
  private t = 0
  private jogada = 0
  private total = 0
  private strikes = 0
  private derrubados = new Set<number>()
  private mensagem = ''

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.fase === 'mira' || this.fase === 'forca') {
      const ref = this.fase === 'mira' ? 'mira' : 'forca'
      const vel = this.fase === 'mira' ? 1.6 : 2.2
      let v = this[ref] + this.sentido * vel * s
      if (v > 1 || v < (ref === 'mira' ? -1 : 0)) {
        this.sentido *= -1
        v = Math.max(ref === 'mira' ? -1 : 0, Math.min(1, v))
      }
      this[ref] = v
      if (teclas.premidas.has('A')) {
        if (this.fase === 'mira') {
          this.fase = 'forca'
          this.forca = 0
          this.sentido = 1
        } else {
          this.fase = 'rolar'
          this.t = 0
          this.de = 120
          this.alvo = 120 + this.mira * 46
        }
      }
    } else if (this.fase === 'rolar') {
      this.t += s * (0.8 + this.forca * 0.9)
      const p = Math.min(1, this.t)
      this.bolaX = this.de + (this.alvo - this.de) * p
      this.bolaY = 140 - p * 120
      for (let i = 0; i < PINOS.length; i++) {
        const [px, py] = PINOS[i]
        const alcance = 7 + this.forca * 9
        if (Math.abs(this.bolaY - py) < 5 && Math.abs(this.bolaX - px) < alcance) this.derrubados.add(i)
      }
      // pinos derrubados derrubam os de trás, com mais força
      if (p >= 1) {
        for (const i of [...this.derrubados]) {
          const [px, py] = PINOS[i]
          PINOS.forEach(([qx, qy], j) => {
            if (qy > py && Math.abs(qx - px) <= 8 && Math.random() < 0.35 + this.forca * 0.5) this.derrubados.add(j)
          })
        }
        const n = this.derrubados.size
        this.total += n
        if (n === 10) this.strikes++
        this.mensagem = n === 10 ? 'STRIKE!' : n === 0 ? 'NA CALEIRA!' : `${n} PINOS`
        this.fase = 'resultado'
        this.t = 1.2
      }
    } else {
      this.t -= s
      if (this.t <= 0) {
        this.jogada++
        if (this.jogada >= JOGADAS) this.terminado = true
        this.derrubados.clear()
        this.fase = 'mira'
        this.mira = 0
        this.sentido = 1
        this.bolaX = 120
        this.bolaY = 140
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#2a2440')
    r(ctx, 78, 0, 84, H, K)
    r(ctx, 82, 0, 76, H, '#e8c890')
    for (let x = 86; x < 158; x += 6) r(ctx, x, 0, 1, H, '#d8b880')
    for (const x of [100, 120, 140]) r(ctx, x - 1, 96, 3, 3, '#a87a40')

    PINOS.forEach(([x, y], i) => {
      if (this.derrubados.has(i) && this.fase === 'resultado') {
        r(ctx, x - 4, y - 1, 8, 3, '#c8c8d0')
        return
      }
      if (this.derrubados.has(i)) return
      circulo(ctx, x, y, 3, '#ffffff', K)
      r(ctx, x - 2, y - 1, 5, 1, '#e04848')
    })
    if (this.fase !== 'resultado') circulo(ctx, Math.round(this.bolaX), Math.round(this.bolaY), 5, '#4a7ad0', K)

    if (this.fase === 'mira') {
      const ax = 120 + this.mira * 46
      for (let i = 0; i < 6; i++) r(ctx, Math.round(120 + (ax - 120) * (i / 6)) - 1, 130 - i * 14, 3, 3, '#f8e040')
    }
    if (this.fase === 'forca' || this.fase === 'mira') {
      r(ctx, 180, 40, 14, 82, K)
      r(ctx, 181, 41, 12, 80, '#d8dce6')
      const h = Math.round((this.fase === 'forca' ? this.forca : 0) * 80)
      r(ctx, 181, 121 - h, 12, h, this.forca > 0.7 ? '#e04848' : '#48c060')
      textoContorno(ctx, 'FORÇA', 187, 126, '#ffffff', 'center', 6)
    }
    textoContorno(ctx, `BOLA ${Math.min(this.jogada + 1, JOGADAS)}/${JOGADAS}`, 4, 4, '#ffffff', 'left', 6)
    textoContorno(ctx, `${this.total} pinos`, W - 4, 4, '#f8e040', 'right', 6)
    textoContorno(ctx, this.fase === 'mira' ? 'A: DIREÇÃO' : this.fase === 'forca' ? 'A: FORÇA' : '', 40, H - 14, '#ffffff', 'center', 6)
    if (this.fase === 'resultado') textoContorno(ctx, this.mensagem, 120, 70, '#f8e040', 'center')
  }

  resultado() {
    return { pontos: this.total, texto: `${this.total} pinos em ${JOGADAS} bolas${this.strikes ? ` · ${this.strikes} strike${this.strikes > 1 ? 's' : ''}` : ''}` }
  }
}
