import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const COLS = 4
const LINHAS = 3
const DURACAO = 60

/** As moedas e notas do euro (a Avó ensina a reconhecê-las). */
const PARES = [
  { texto: '1c', cor: '#c87a40', nota: false },
  { texto: '5c', cor: '#c87a40', nota: false },
  { texto: '20c', cor: '#e8c040', nota: false },
  { texto: '50c', cor: '#e8c040', nota: false },
  { texto: '1€', cor: '#d8d0a0', nota: false },
  { texto: '2€', cor: '#e8d070', nota: false },
  { texto: '5€', cor: '#a8b4c8', nota: true },
  { texto: '10€', cor: '#e07070', nota: true },
  { texto: '20€', cor: '#6a9ad8', nota: true },
]

interface Carta {
  par: number
  virada: boolean
  feita: boolean
}

/** Jogo da memória com moedas e notas: encontrar os pares. */
export class Memoria implements MiniJogo {
  titulo = 'JOGO DA MEMÓRIA'
  instrucoes = ['Setas: mover. A: virar a carta.', 'Encontra os pares de moedas e notas!', `${DURACAO} segundos.`]
  terminado = false
  private cartas: Carta[]
  private cursor = 0
  private abertas: number[] = []
  private espera = 0
  private tempo = 0
  private pares = 0
  private jogadas = 0

  constructor() {
    const escolha = [...PARES.keys()].sort(() => Math.random() - 0.5).slice(0, (COLS * LINHAS) / 2)
    this.cartas = [...escolha, ...escolha].sort(() => Math.random() - 0.5).map((par) => ({ par, virada: false, feita: false }))
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (this.espera > 0) {
      this.espera -= s
      if (this.espera <= 0) {
        for (const i of this.abertas) this.cartas[i].virada = false
        this.abertas = []
      }
    }
    const c = this.cursor % COLS
    const l = Math.floor(this.cursor / COLS)
    if (teclas.premidas.has('LEFT')) this.cursor = l * COLS + ((c + COLS - 1) % COLS)
    if (teclas.premidas.has('RIGHT')) this.cursor = l * COLS + ((c + 1) % COLS)
    if (teclas.premidas.has('UP')) this.cursor = ((l + LINHAS - 1) % LINHAS) * COLS + c
    if (teclas.premidas.has('DOWN')) this.cursor = ((l + 1) % LINHAS) * COLS + c
    if (['LEFT', 'RIGHT', 'UP', 'DOWN'].some((k) => teclas.premidas.has(k as 'UP'))) sfx('cursor')
    const carta = this.cartas[this.cursor]
    if (teclas.premidas.has('A') && this.espera <= 0 && !carta.virada && !carta.feita) {
      carta.virada = true
      this.abertas.push(this.cursor)
      sfx('tic')
      if (this.abertas.length === 2) {
        this.jogadas++
        const [a, b] = this.abertas.map((i) => this.cartas[i])
        if (a.par === b.par) {
          a.feita = b.feita = true
          this.pares++
          this.abertas = []
          sfx('ponto')
          if (this.pares === this.cartas.length / 2) this.terminado = true
        } else this.espera = 0.8
      }
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#e6d6b8')
    r(ctx, 16, 14, 208, 138, '#2a8a5a')
    r(ctx, 16, 14, 208, 2, K)
    this.cartas.forEach((carta, i) => {
      const x = 28 + (i % COLS) * 48
      const y = 22 + Math.floor(i / COLS) * 42
      if (i === this.cursor) r(ctx, x - 3, y - 3, 46, 40, '#f8e040')
      r(ctx, x, y, 40, 34, K)
      if (carta.virada || carta.feita) {
        r(ctx, x + 1, y + 1, 38, 32, carta.feita ? '#e8f8e0' : '#ffffff')
        const p = PARES[carta.par]
        if (p.nota) {
          r(ctx, x + 5, y + 8, 30, 18, K)
          r(ctx, x + 6, y + 9, 28, 16, p.cor)
        } else circulo(ctx, x + 20, y + 17, 11, p.cor, K)
        textoContorno(ctx, p.texto, x + 20, y + 14, '#ffffff', 'center', 6)
      } else {
        r(ctx, x + 1, y + 1, 38, 32, '#4a7ad0')
        r(ctx, x + 4, y + 4, 32, 26, '#5a8ae0')
        textoContorno(ctx, '?', x + 20, y + 13, '#ffffff', 'center', 8)
      }
    })
    textoContorno(ctx, `${this.pares} pares`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#283040', 'right', 6)
  }

  resultado() {
    return { pontos: this.pares, texto: `${this.pares} de ${this.cartas.length / 2} pares em ${this.jogadas} jogadas` }
  }
}
