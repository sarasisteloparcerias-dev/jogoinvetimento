import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const DURACAO = 40

type Sitio = 'roupa' | 'livros' | 'brinquedos'
const TECLA: Record<Sitio, 'LEFT' | 'UP' | 'RIGHT'> = { roupa: 'LEFT', livros: 'UP', brinquedos: 'RIGHT' }

interface Coisa {
  nome: string
  sitio: Sitio
  desenho: (ctx: CanvasRenderingContext2D, x: number, y: number) => void
}

const COISAS: Coisa[] = [
  { nome: 'T-SHIRT', sitio: 'roupa', desenho: (c, x, y) => (r(c, x - 9, y - 6, 18, 5, '#e04848'), r(c, x - 6, y - 6, 12, 14, '#e04848'), r(c, x - 2, y - 6, 4, 2, K)) },
  { nome: 'MEIA', sitio: 'roupa', desenho: (c, x, y) => (r(c, x - 3, y - 8, 6, 12, '#f8f8f8'), r(c, x - 3, y + 2, 10, 5, '#f8f8f8'), r(c, x - 3, y - 8, 6, 2, '#4a7ad0')) },
  { nome: 'CALÇAS', sitio: 'roupa', desenho: (c, x, y) => (r(c, x - 7, y - 8, 14, 5, '#3a5a9a'), r(c, x - 7, y - 3, 6, 12, '#3a5a9a'), r(c, x + 1, y - 3, 6, 12, '#3a5a9a')) },
  { nome: 'LIVRO', sitio: 'livros', desenho: (c, x, y) => (r(c, x - 8, y - 9, 16, 18, '#2a8a5a'), r(c, x - 6, y - 7, 12, 2, '#ffffff'), r(c, x - 8, y - 9, 2, 18, K)) },
  { nome: 'BANDA DESENHADA', sitio: 'livros', desenho: (c, x, y) => (r(c, x - 8, y - 9, 16, 18, '#f8e040'), r(c, x - 5, y - 6, 10, 8, '#e04848'), r(c, x - 8, y - 9, 16, 2, K)) },
  { nome: 'CADERNO', sitio: 'livros', desenho: (c, x, y) => (r(c, x - 7, y - 9, 14, 18, '#9468cc'), r(c, x - 5, y - 4, 10, 1, '#ffffff'), r(c, x - 5, y, 10, 1, '#ffffff')) },
  { nome: 'BOLA', sitio: 'brinquedos', desenho: (c, x, y) => (circulo(c, x, y, 8, '#ffffff', K), r(c, x - 2, y - 2, 4, 4, K)) },
  { nome: 'PELUCHE', sitio: 'brinquedos', desenho: (c, x, y) => (circulo(c, x, y + 2, 7, '#c88a50', K), circulo(c, x - 6, y - 6, 3, '#c88a50', K), circulo(c, x + 6, y - 6, 3, '#c88a50', K)) },
  { nome: 'CARRINHO', sitio: 'brinquedos', desenho: (c, x, y) => (r(c, x - 10, y - 4, 20, 8, '#e8743a'), r(c, x - 5, y - 8, 10, 5, '#9fd6f6'), circulo(c, x - 6, y + 5, 3, K, K), circulo(c, x + 6, y + 5, 3, K, K)) },
]

/** Arrumar o quarto: cada coisa no seu sítio (roupa à esquerda, livros em cima, brinquedos à direita). */
export class Arrumar implements MiniJogo {
  titulo = 'ARRUMAR O QUARTO'
  instrucoes = ['Esquerda: ROUPA (gaveta). Cima: LIVROS (estante).', 'Direita: BRINQUEDOS (caixa).', 'Arruma depressa, que vem aí mais tralha!']
  terminado = false
  private tempo = 0
  private fila: { coisa: Coisa; y: number }[] = []
  private proximo = 0
  private certos = 0
  private erros = 0
  private voo: { coisa: Coisa; sitio: Sitio; t: number; certo: boolean } | null = null

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.proximo -= s
    if (this.proximo <= 0 && this.fila.length < 4) {
      this.fila.push({ coisa: COISAS[Math.floor(Math.random() * COISAS.length)], y: -10 })
      this.proximo = Math.max(0.6, 1.5 - this.tempo * 0.025)
    }
    this.fila.forEach((f, i) => {
      const alvo = 118 - i * 26
      f.y += (alvo - f.y) * Math.min(1, s * 7)
    })
    const primeiro = this.fila[0]
    const sitio = (Object.keys(TECLA) as Sitio[]).find((k) => teclas.premidas.has(TECLA[k]))
    if (primeiro && sitio && primeiro.y > 100) {
      const certo = primeiro.coisa.sitio === sitio
      if (certo) this.certos++
      else this.erros++
      sfx(certo ? 'apanhar' : 'erro')
      this.voo = { coisa: primeiro.coisa, sitio, t: 0.35, certo }
      this.fila.shift()
    }
    if (this.fila.length >= 4 && this.proximo <= 0) {
      this.erros++
      this.fila.shift()
    }
    if (this.voo) {
      this.voo.t -= s
      if (this.voo.t <= 0) this.voo = null
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#f4e6d0')
    r(ctx, 0, 120, W, 40, '#c8a070')
    // gaveta (esquerda), estante (cima), caixa (direita)
    r(ctx, 4, 96, 44, 44, K)
    r(ctx, 5, 97, 42, 42, '#a86a3c')
    r(ctx, 8, 104, 36, 12, '#c88a50')
    r(ctx, 8, 120, 36, 12, '#c88a50')
    textoContorno(ctx, 'ROUPA', 26, 84, '#ffffff', 'center', 6)
    r(ctx, 90, 6, 60, 26, K)
    r(ctx, 91, 7, 58, 24, '#a86a3c')
    for (let i = 0; i < 7; i++) r(ctx, 94 + i * 8, 10, 6, 18, ['#e04848', '#4a7ad0', '#2a8a5a', '#f8e040', '#9468cc', '#e8743a', '#3aa0a0'][i])
    textoContorno(ctx, 'LIVROS', 120, 36, '#ffffff', 'center', 6)
    r(ctx, 192, 100, 44, 40, K)
    r(ctx, 193, 101, 42, 38, '#e8743a')
    textoContorno(ctx, 'BRINQ.', 214, 84, '#ffffff', 'center', 6)
    this.fila.forEach((f) => {
      r(ctx, 100, Math.round(f.y) - 12, 40, 24, '#ffffff')
      f.coisa.desenho(ctx, 120, Math.round(f.y))
    })
    if (this.fila[0]) textoContorno(ctx, this.fila[0].coisa.nome, 120, 146, '#283040', 'center', 6)
    if (this.voo) {
      const p = 1 - this.voo.t / 0.35
      const destino = { roupa: [26, 118], livros: [120, 20], brinquedos: [214, 118] }[this.voo.sitio]
      this.voo.coisa.desenho(ctx, Math.round(120 + (destino[0] - 120) * p), Math.round(118 + (destino[1] - 118) * p))
      if (!this.voo.certo) textoContorno(ctx, 'NÃO É AÍ!', 120, 60, '#e04848', 'center', 7)
    }
    textoContorno(ctx, `${this.certos} arrumados`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#283040', 'right', 6)
  }

  resultado() {
    return { pontos: this.certos, texto: `${this.certos} coisas arrumadas · ${this.erros} ${this.erros === 1 ? 'erro' : 'erros'}` }
  }
}
