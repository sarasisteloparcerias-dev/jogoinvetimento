import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const DURACAO = 45

interface Variante {
  /** Valores das moedas/notas disponíveis (em cêntimos no modo euros, em moedas na Vila). */
  valores: number[]
  euros: boolean
  produtos: string[]
}

const VILA: Variante = { valores: [1, 2, 5, 10], euros: false, produtos: ['GOMAS', 'CHUPA', 'BOLACHAS', 'SUMO', 'PIÃO', 'CROMOS'] }
const EUROS: Variante = { valores: [5, 10, 20, 50, 100, 200, 500], euros: true, produtos: ['CAFÉ', 'TORRADA', 'BOLO', 'SUMO', 'SANDES', 'GALÃO'] }

/** Caixa registadora: dar o troco certo, escolhendo moedas (Vila) ou moedas e notas (euros). */
export class Troco implements MiniJogo {
  titulo = 'O TROCO CERTO'
  instrucoes: string[]
  terminado = false
  private v: Variante
  private tempo = 0
  private cursor = 0
  private bandeja: number[] = []
  private preco = 0
  private pago = 0
  private produto = ''
  private certos = 0
  private erros = 0
  private aviso: { texto: string; cor: string; t: number } | null = null

  constructor(euros = false) {
    this.v = euros ? EUROS : VILA
    this.instrucoes = ['Setas: escolher moeda. A: dar. B: tirar.', 'Dá ao cliente o troco certo!', `${DURACAO} segundos. Quantos clientes atendes?`]
    this.novoCliente()
  }

  private fmt(n: number) {
    return this.v.euros ? `${(n / 100).toFixed(2).replace('.', ',')}€` : `${n}`
  }

  private novoCliente() {
    this.produto = this.v.produtos[Math.floor(Math.random() * this.v.produtos.length)]
    if (this.v.euros) {
      this.preco = (Math.floor(Math.random() * 30) + 3) * 10 // 0,30€ a 3,20€
      this.pago = this.preco <= 100 ? 200 : this.preco <= 300 ? 500 : 1000
      if (Math.random() < 0.3 && this.preco < 450) this.pago = 500
    } else {
      this.preco = Math.floor(Math.random() * 14) + 2
      this.pago = this.preco < 10 ? 10 : 20
      if (this.pago === this.preco) this.pago = 20
    }
    this.bandeja = []
  }

  private get dado() {
    return this.bandeja.reduce((t, x) => t + x, 0)
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }
    const n = this.v.valores.length
    if (teclas.premidas.has('LEFT')) {
      this.cursor = (this.cursor + n - 1) % n
      sfx('cursor')
    }
    if (teclas.premidas.has('RIGHT')) {
      this.cursor = (this.cursor + 1) % n
      sfx('cursor')
    }
    if (teclas.premidas.has('B') && this.bandeja.length) {
      this.bandeja.pop()
      sfx('cancelar')
    }
    if (teclas.premidas.has('A')) {
      this.bandeja.push(this.v.valores[this.cursor])
      sfx('tic')
      const troco = this.pago - this.preco
      if (this.dado === troco) {
        this.certos++
        sfx('moeda')
        this.aviso = { texto: 'CERTO! OBRIGADO!', cor: '#80f080', t: 0.9 }
        this.novoCliente()
      } else if (this.dado > troco) {
        this.erros++
        sfx('erro')
        this.aviso = { texto: 'TROCO A MAIS!', cor: '#ff8080', t: 0.9 }
        this.bandeja = []
      }
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  private moeda(ctx: CanvasRenderingContext2D, valor: number, x: number, y: number, grande = false) {
    if (this.v.euros && valor >= 500) {
      r(ctx, x - 13, y - 7, 26, 14, K)
      r(ctx, x - 12, y - 6, 24, 12, valor >= 1000 ? '#e07070' : '#a8b4c8')
      textoContorno(ctx, `${valor / 100}€`, x, y - 3, '#ffffff', 'center', 6)
      return
    }
    const raio = grande ? 9 : 8
    const cor = this.v.euros ? (valor >= 100 ? '#e8d070' : valor >= 10 ? '#e8c040' : '#c87a40') : valor >= 10 ? '#f0d050' : valor >= 5 ? '#e8b040' : '#c88a50'
    circulo(ctx, x, y, raio, cor, K)
    const texto = this.v.euros ? (valor >= 100 ? `${valor / 100}€` : `${valor}c`) : `${valor}`
    textoContorno(ctx, texto, x, y - 3, '#ffffff', 'center', 6)
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#f6ead6')
    r(ctx, 0, 96, W, 64, '#a86a3c')
    r(ctx, 0, 96, W, 3, K)
    // cliente e talão
    r(ctx, 14, 14, 108, 64, K)
    r(ctx, 15, 15, 106, 62, '#ffffff')
    textoContorno(ctx, this.produto, 68, 20, '#e8743a', 'center', 8)
    textoContorno(ctx, `CUSTA ${this.fmt(this.preco)}`, 68, 36, '#283040', 'center', 6)
    textoContorno(ctx, `PAGOU ${this.fmt(this.pago)}`, 68, 48, '#283040', 'center', 6)
    textoContorno(ctx, 'TROCO?', 68, 62, '#4a7ad0', 'center', 6)
    // bandeja
    r(ctx, 132, 14, 96, 64, K)
    r(ctx, 133, 15, 94, 62, '#e8f0e0')
    textoContorno(ctx, `DADO: ${this.fmt(this.dado)}`, 180, 20, '#283040', 'center', 6)
    this.bandeja.slice(-8).forEach((m, i) => this.moeda(ctx, m, 146 + (i % 4) * 22, 44 + Math.floor(i / 4) * 20))
    // gaveta
    const n = this.v.valores.length
    const passo = Math.min(32, 220 / n)
    const x0 = W / 2 - ((n - 1) * passo) / 2
    this.v.valores.forEach((v, i) => {
      const x = Math.round(x0 + i * passo)
      if (i === this.cursor) r(ctx, x - 14, 108, 28, 30, '#f8e040')
      this.moeda(ctx, v, x, 123, i === this.cursor)
    })
    textoContorno(ctx, 'A: DAR · B: TIRAR', W / 2, 146, '#ffffff', 'center', 6)
    textoContorno(ctx, `${this.certos} clientes`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#283040', 'right', 6)
    if (this.aviso) textoContorno(ctx, this.aviso.texto, W / 2, 84, this.aviso.cor, 'center', 8)
  }

  resultado() {
    return { pontos: this.certos, texto: `${this.certos} ${this.certos === 1 ? 'cliente atendido' : 'clientes atendidos'} · ${this.erros} ${this.erros === 1 ? 'erro' : 'erros'}` }
  }
}
