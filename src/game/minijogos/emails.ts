import { r } from '../pixel/draw'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 35
const K = '#283040'

const TRABALHO = ['Reunião às 10h', 'Relatório mensal', 'Fatura do cliente', 'Prazo do projeto', 'Férias: pedido', 'Orçamento 2025', 'Ata da reunião', 'Novo cliente', 'Contrato revisto', 'Apresentação']
const LIXO = ['GANHOU UM IPHONE!', 'Clique já: prémio', 'Conta bloqueada!!', 'Herança de 1 milhão', 'Fique rico já', 'Confirme o PIN', 'Promoção -90%', 'Cripto garantida']

interface Email {
  assunto: string
  spam: boolean
  y: number
}

/** Caixa de entrada: separa os e-mails de trabalho (direita) do lixo e das burlas (esquerda). */
export class Emails implements MiniJogo {
  titulo = 'CAIXA DE ENTRADA'
  instrucoes = ['Esquerda: LIXO (spam e burlas).', 'Direita: TRABALHO.', 'Despacha os e-mails antes que acumulem!']
  terminado = false
  private tempo = 0
  private fila: Email[] = []
  private proximo = 0
  private certos = 0
  private erros = 0
  private anim: { x: number; y: number; t: number; certo: boolean } | null = null

  private novo(): Email {
    const spam = Math.random() < 0.45
    const lista = spam ? LIXO : TRABALHO
    return { assunto: lista[Math.floor(Math.random() * lista.length)], spam, y: -20 }
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.proximo -= s
    if (this.proximo <= 0 && this.fila.length < 5) {
      this.fila.push(this.novo())
      this.proximo = Math.max(0.7, 1.6 - this.tempo * 0.03)
    }
    this.fila.forEach((e, i) => {
      const alvo = 108 - i * 22
      e.y += (alvo - e.y) * Math.min(1, s * 8)
    })
    const primeiro = this.fila[0]
    const dir = teclas.premidas.has('LEFT') ? 'lixo' : teclas.premidas.has('RIGHT') ? 'trabalho' : null
    if (primeiro && dir && primeiro.y > 90) {
      const certo = (dir === 'lixo') === primeiro.spam
      if (certo) this.certos++
      else this.erros++
      this.anim = { x: dir === 'lixo' ? -1 : 1, y: primeiro.y, t: 0.4, certo }
      this.fila.shift()
    }
    if (this.fila.length >= 5 && this.proximo <= 0) {
      this.erros++
      this.fila.shift()
    }
    if (this.anim) {
      this.anim.t -= s
      if (this.anim.t <= 0) this.anim = null
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  private carta(ctx: CanvasRenderingContext2D, e: { assunto: string }, x: number, y: number) {
    r(ctx, x - 70, y, 140, 18, K)
    r(ctx, x - 69, y + 1, 138, 16, '#ffffff')
    r(ctx, x - 66, y + 4, 12, 9, '#9fd6f6')
    r(ctx, x - 66, y + 4, 12, 1, '#4a7ad0')
    ctx.font = "6px 'Press Start 2P'"
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = K
    ctx.fillText(e.assunto, x - 50, y + 6)
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#e8ebf0')
    // monitor
    r(ctx, 40, 4, 160, 132, K)
    r(ctx, 44, 8, 152, 124, '#f4f6fb')
    r(ctx, 44, 8, 152, 10, '#4a7ad0')
    textoContorno(ctx, 'CAIXA DE ENTRADA', 120, 9, '#ffffff', 'center', 6)
    r(ctx, 108, 136, 24, 10, K)
    r(ctx, 96, 146, 48, 4, K)
    // caixotes
    r(ctx, 2, 100, 34, 40, K)
    r(ctx, 3, 101, 32, 38, '#e05050')
    textoContorno(ctx, 'LIXO', 19, 116, '#ffffff', 'center', 6)
    r(ctx, 204, 100, 34, 40, K)
    r(ctx, 205, 101, 32, 38, '#48b048')
    textoContorno(ctx, 'TRAB.', 221, 116, '#ffffff', 'center', 6)
    textoContorno(ctx, '<', 19, 88, '#283040', 'center')
    textoContorno(ctx, '>', 221, 88, '#283040', 'center')

    this.fila.forEach((e) => this.carta(ctx, e, 120, Math.round(e.y)))
    if (this.anim) {
      const p = 1 - this.anim.t / 0.4
      this.carta(ctx, { assunto: this.anim.certo ? 'OK!' : 'OOPS!' }, 120 + this.anim.x * p * 100, Math.round(this.anim.y))
    }
    textoContorno(ctx, `${this.certos} certos`, 4, 4, '#ffffff', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 4, '#ffffff', 'right', 6)
  }

  resultado() {
    return { pontos: this.certos, texto: `${this.certos} e-mails bem arrumados · ${this.erros} ${this.erros === 1 ? 'erro' : 'erros'}` }
  }
}
