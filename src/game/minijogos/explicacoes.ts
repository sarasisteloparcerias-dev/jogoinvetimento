import { r } from '../pixel/draw'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const POR_PERGUNTA = 12
const N_PERGUNTAS = 6

/** [pergunta, resposta certa, erradas...] */
const PERGUNTAS: string[][] = [
  ['Quanto é 10% de 50€?', '5€', '10€', '0,50€', '15€'],
  ['Um jogo de 40€ tem 25% de desconto. Quanto pagas?', '30€', '35€', '10€', '15€'],
  ['Poupas 5€ por semana. Quanto juntas em 8 semanas?', '40€', '13€', '35€', '45€'],
  ['100€ a render 10% ao ano. Quanto tens ao fim de 1 ano?', '110€', '101€', '100€', '120€'],
  ['Quanto é 3/4 de 20?', '15', '12', '16', '5'],
  ['O que é a inflação?', 'Os preços sobem', 'Os preços descem', 'Um imposto', 'Um banco'],
  ['Quanto é 7 x 8?', '56', '54', '63', '48'],
  ['Um ETF é...', 'Um cesto de ações', 'Uma moeda', 'Um empréstimo', 'Um banco'],
  ['Mais barato por kg? A: 2kg por 3€. B: 1kg por 2€.', 'A', 'B', 'São iguais', 'Não dá para saber'],
  ['Quanto é metade de 3/4?', '3/8', '1/4', '3/2', '1/2'],
  ['Diversificar é...', 'Repartir o risco', 'Gastar tudo', 'Pedir emprestado', 'Comprar cripto'],
  ['Quanto é 15% de 200€?', '30€', '15€', '20€', '45€'],
  ['O juro composto é...', 'Juro sobre juro', 'Um juro fixo', 'Um desconto', 'Uma comissão'],
  ['Qual é a raiz quadrada de 81?', '9', '8', '18', '27'],
  ['Um produto subiu de 10€ para 12€. Subiu quanto?', '20%', '2%', '12%', '10%'],
]

function baralhar<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

interface Pergunta {
  texto: string
  opcoes: string[]
  certa: number
}

/** Explicações: ajuda um colega mais novo respondendo certo e depressa. */
export class Explicacoes implements MiniJogo {
  titulo = 'EXPLICAÇÕES'
  instrucoes = ['Responde às perguntas do teu aluno.', 'Setas: escolher · A: responder.', `Tens ${POR_PERGUNTA} segundos por pergunta.`]
  terminado = false
  private perguntas: Pergunta[]
  private atual = 0
  private cursor = 0
  private t = POR_PERGUNTA
  private certas = 0
  private feedback: { certo: boolean; t: number } | null = null

  constructor() {
    this.perguntas = baralhar(PERGUNTAS)
      .slice(0, N_PERGUNTAS)
      .map(([texto, certa, ...erradas]) => {
        const opcoes = baralhar([certa, ...erradas])
        return { texto, opcoes, certa: opcoes.indexOf(certa) }
      })
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.feedback) {
      this.feedback.t -= s
      if (this.feedback.t <= 0) {
        this.feedback = null
        this.atual++
        this.cursor = 0
        this.t = POR_PERGUNTA
        if (this.atual >= this.perguntas.length) this.terminado = true
      }
      return
    }
    this.t -= s
    if (teclas.premidas.has('UP')) this.cursor = (this.cursor + 3) % 4
    if (teclas.premidas.has('DOWN')) this.cursor = (this.cursor + 1) % 4
    if (teclas.premidas.has('A') || this.t <= 0) {
      const certo = this.t > 0 && this.cursor === this.perguntas[this.atual].certa
      if (certo) this.certas++
      this.feedback = { certo, t: 1.1 }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#2f5e46')
    r(ctx, 4, 4, W - 8, H - 8, '#3a6e54')
    const p = this.perguntas[Math.min(this.atual, this.perguntas.length - 1)]
    textoContorno(ctx, `PERGUNTA ${Math.min(this.atual + 1, this.perguntas.length)}/${this.perguntas.length}`, 10, 10, '#f8e040', 'left', 6)
    textoContorno(ctx, `${Math.max(0, Math.ceil(this.t))}s`, W - 10, 10, '#ffffff', 'right', 6)
    const fim = textoQuebrado(ctx, p.texto, 10, 26, W - 20, '#ffffff', 8, 12)
    p.opcoes.forEach((o, i) => {
      const y = Math.max(fim + 6, 66) + i * 20
      const sel = i === this.cursor
      let fundo = sel ? '#fff8e0' : '#e8f0e8'
      if (this.feedback && i === p.certa) fundo = '#90e090'
      else if (this.feedback && sel && !this.feedback.certo) fundo = '#f0a0a0'
      r(ctx, 9, y - 1, W - 18, 17, '#283040')
      r(ctx, 10, y, W - 20, 15, fundo)
      ctx.font = "8px 'Press Start 2P'"
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = '#283040'
      ctx.fillText(`${sel ? '>' : ' '} ${o}`, 14, y + 4)
    })
    if (this.feedback) textoContorno(ctx, this.feedback.certo ? 'CERTO!' : 'ERRADO...', W - 14, 26, this.feedback.certo ? '#80f080' : '#ff8080', 'right', 6)
  }

  resultado() {
    return { pontos: this.certas, texto: `${this.certas} de ${this.perguntas.length} respostas certas` }
  }
}
