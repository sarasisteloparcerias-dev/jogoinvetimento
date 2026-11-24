import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 50
const INICIAL = 1000
const COMISSAO = 2

interface Noticia {
  texto: string
  efeito: number
}

const NOTICIAS: Noticia[] = [
  { texto: 'PixelSoft lança jogo de sucesso!', efeito: 0.12 },
  { texto: 'Lucros acima do esperado', efeito: 0.08 },
  { texto: 'Rumor: a empresa vai ser comprada', efeito: 0 },
  { texto: 'Escândalo: contas mal feitas', efeito: -0.15 },
  { texto: 'Diretor-geral demite-se', efeito: -0.07 },
  { texto: 'Influencer diz que vai subir 1000%', efeito: 0 },
  { texto: 'Economia cresce mais do que o previsto', efeito: 0.05 },
  { texto: 'Juros sobem', efeito: -0.05 },
  { texto: 'Novo contrato com grande cliente', efeito: 0.07 },
]

/** Um minuto na bolsa: notícias a aparecer, comprar (A) e vender (B). No fim, compara com quem só comprou e esperou. */
export class Bolsa implements MiniJogo {
  titulo = 'SIMULADOR DE BOLSA'
  instrucoes = ['A: COMPRAR com todo o dinheiro. B: VENDER tudo.', `Cada operação custa ${COMISSAO}€ de comissão.`, 'Lê as notícias... mas cuidado com os rumores!']
  terminado = false
  private tempo = 0
  private preco = 50
  private historico: number[] = [50]
  private dinheiro = INICIAL
  private acoes = 0
  private operacoes = 0
  private proxNoticia = 4
  private noticia: { n: Noticia; t: number; aplicada: boolean } | null = null
  private passo = 0
  private impulso = 0

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    this.passo += s
    if (this.passo >= 0.25) {
      this.passo = 0
      // tendência ligeiramente a subir, ruído e o efeito das notícias (que chega aos poucos)
      const ruido = (Math.random() - 0.5) * 0.03
      const varia = 0.0015 + ruido + this.impulso * 0.25
      this.impulso *= 0.75
      this.preco = Math.max(5, this.preco * (1 + varia))
      this.historico.push(this.preco)
      if (this.historico.length > 120) this.historico.shift()
    }
    this.proxNoticia -= s
    if (this.proxNoticia <= 0) {
      this.noticia = { n: NOTICIAS[Math.floor(Math.random() * NOTICIAS.length)], t: 0, aplicada: false }
      this.proxNoticia = 5 + Math.random() * 3
      sfx('tic')
    }
    if (this.noticia) {
      this.noticia.t += s
      // o mercado reage quase logo: quem lê a notícia já chega tarde
      if (!this.noticia.aplicada && this.noticia.t > 0.4) {
        this.impulso += this.noticia.n.efeito
        this.noticia.aplicada = true
      }
      if (this.noticia.t > 4) this.noticia = null
    }
    if (teclas.premidas.has('A') && this.dinheiro > COMISSAO + 1) {
      this.acoes += (this.dinheiro - COMISSAO) / this.preco
      this.dinheiro = 0
      this.operacoes++
      sfx('confirmar')
    }
    if (teclas.premidas.has('B') && this.acoes > 0) {
      this.dinheiro += this.acoes * this.preco - COMISSAO
      this.acoes = 0
      this.operacoes++
      sfx('moeda')
    }
    if (this.tempo >= DURACAO) {
      this.dinheiro += this.acoes * this.preco - (this.acoes > 0 ? COMISSAO : 0)
      this.acoes = 0
      this.terminado = true
    }
  }

  private get valor() {
    return this.dinheiro + this.acoes * this.preco
  }

  /** Quem comprou no primeiro segundo e nunca mais mexeu. */
  private get esperar() {
    return ((INICIAL - COMISSAO) / 50) * this.preco - COMISSAO
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#101828')
    r(ctx, 8, 20, 224, 80, '#18233a')
    for (let y = 30; y < 100; y += 14) r(ctx, 8, y, 224, 1, '#22304c')
    const h = this.historico
    const min = Math.min(...h) * 0.98
    const max = Math.max(...h) * 1.02
    ctx.strokeStyle = h[h.length - 1] >= h[0] ? '#48d070' : '#f05050'
    ctx.lineWidth = 1
    ctx.beginPath()
    h.forEach((p, i) => {
      const x = 8 + (i / 119) * 224
      const y = 98 - ((p - min) / (max - min || 1)) * 76
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    textoContorno(ctx, `PIXELSOFT ${this.preco.toFixed(2).replace('.', ',')}€`, 8, 6, '#ffffff', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 6, 6, '#ffffff', 'right', 6)
    // notícia
    if (this.noticia) {
      r(ctx, 8, 104, 224, 22, '#f8e040')
      textoQuebrado(ctx, `NOTÍCIA: ${this.noticia.n.texto}`, 12, 107, 216, '#283040', 5, 8)
    }
    const posicao = this.acoes > 0 ? 'TENS AÇÕES' : 'TENS DINHEIRO'
    textoContorno(ctx, `${posicao} · VALOR ${Math.round(this.valor)}€`, W / 2, 132, this.valor >= INICIAL ? '#48d070' : '#f05050', 'center', 6)
    textoContorno(ctx, 'A: COMPRAR · B: VENDER', W / 2, 146, '#8890a8', 'center', 6)
  }

  resultado() {
    const ganho = Math.round(this.valor - INICIAL)
    const esperar = Math.round(this.esperar - INICIAL)
    return {
      pontos: Math.max(0, Math.round(ganho / 10)),
      texto: `${ganho >= 0 ? 'Ganhaste' : 'Perdeste'} ${Math.abs(ganho)}€ em ${this.operacoes} operações. Só comprar e esperar: ${esperar >= 0 ? '+' : ''}${esperar}€`,
    }
  }
}
