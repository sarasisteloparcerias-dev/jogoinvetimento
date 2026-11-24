import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const RONDAS = 8
const TEMPO_RONDA = 9

interface Oferta {
  linhas: string[]
  /** Quanto custa "a sério" (por unidade, por ano, no total...): ganha a mais barata. */
  custo: number
}

interface Ronda {
  pergunta: string
  a: Oferta
  b: Oferta
  explicacao: string
}

const aleatorio = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
const eur = (n: number) => `${n.toLocaleString('pt-PT', { maximumFractionDigits: 2 })}€`

/** Vila Moeda: preço por unidade (o pacote grande nem sempre compensa). */
function rondaVila(): Ronda {
  const produtos = ['bolachas', 'rebuçados', 'cromos', 'berlindes', 'lápis', 'gomas']
  const p = produtos[aleatorio(0, produtos.length - 1)]
  for (;;) {
    const ua = aleatorio(2, 6)
    const ub = aleatorio(3, 10)
    const pa = aleatorio(ua, ua * 3)
    const pb = aleatorio(ub, ub * 3)
    const ca = pa / ua
    const cb = pb / ub
    if (ua === ub || Math.abs(ca - cb) / Math.min(ca, cb) < 0.15) continue
    return {
      pergunta: `Qual compensa mais? (${p})`,
      a: { linhas: [`${ua} ${p}`, `${pa} moedas`], custo: ca },
      b: { linhas: [`${ub} ${p}`, `${pb} moedas`], custo: cb },
      explicacao: `Cada um: ${Math.round(ca * 10) / 10} contra ${Math.round(cb * 10) / 10} moedas.`,
    }
  }
}

/** Adultos: TAEG, custo total de um crédito e seguros mensais contra anuais. */
function rondaAdulto(): Ronda {
  const tipo = aleatorio(0, 2)
  if (tipo === 0) {
    const ta = aleatorio(6, 18)
    let tb = aleatorio(6, 18)
    while (Math.abs(ta - tb) < 2) tb = aleatorio(6, 18)
    const ja = aleatorio(4, 9)
    return {
      pergunta: 'Crédito de 3.000€. Qual é mais barato?',
      a: { linhas: [`Juro ${ja}%`, `TAEG ${ta}%`], custo: ta },
      b: { linhas: [`Juro ${Math.max(3, ja - 2)}%`, `TAEG ${tb}%`], custo: tb },
      explicacao: 'Compara sempre a TAEG: inclui juros, comissões e seguros.',
    }
  }
  if (tipo === 1) {
    const ma = aleatorio(18, 36)
    const pa = aleatorio(80, 150)
    let mb = aleatorio(12, 48)
    let pb = aleatorio(60, 160)
    while (Math.abs(ma * pa - mb * pb) < 150) {
      mb = aleatorio(12, 48)
      pb = aleatorio(60, 160)
    }
    return {
      pergunta: 'Compra a prestações. Qual custa menos no total?',
      a: { linhas: [`${pa}€/mês`, `x ${ma} meses`], custo: ma * pa },
      b: { linhas: [`${pb}€/mês`, `x ${mb} meses`], custo: mb * pb },
      explicacao: `No total: ${eur(ma * pa)} contra ${eur(mb * pb)}. Prestação baixa não quer dizer barato!`,
    }
  }
  const mensal = aleatorio(9, 25)
  let anual = aleatorio(90, 300)
  while (Math.abs(mensal * 12 - anual) < 20) anual = aleatorio(90, 300)
  const aMensal = Math.random() < 0.5
  const m: Oferta = { linhas: ['Seguro', `${mensal}€/mês`], custo: mensal * 12 }
  const y: Oferta = { linhas: ['Seguro', `${anual}€/ano`], custo: anual }
  return {
    pergunta: 'O mesmo seguro. Qual é mais barato?',
    a: aMensal ? m : y,
    b: aMensal ? y : m,
    explicacao: `Por ano: ${eur(mensal * 12)} contra ${eur(anual)}. Compara sempre no mesmo período.`,
  }
}

/** Duas ofertas lado a lado: escolher a que sai mais barata a sério. */
export class Comparar implements MiniJogo {
  titulo: string
  instrucoes: string[]
  terminado = false
  private rondas: Ronda[]
  private atual = 0
  private t = TEMPO_RONDA
  private certas = 0
  private feedback: { certo: boolean; t: number } | null = null
  private adulto: boolean

  constructor(adulto = false) {
    this.adulto = adulto
    this.titulo = adulto ? 'COMPARA AS OFERTAS' : 'COMPARA OS PREÇOS'
    this.instrucoes = [
      'Esquerda ou direita: escolhe a oferta mais barata.',
      adulto ? 'Atenção à TAEG, ao total e ao período!' : 'Faz as contas: quanto custa cada um?',
      `${RONDAS} rondas, ${TEMPO_RONDA} segundos cada.`,
    ]
    this.rondas = Array.from({ length: RONDAS }, () => (adulto ? rondaAdulto() : rondaVila()))
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.feedback) {
      this.feedback.t -= s
      if (this.feedback.t <= 0) {
        this.feedback = null
        this.atual++
        this.t = TEMPO_RONDA
        if (this.atual >= RONDAS) this.terminado = true
      }
      return
    }
    this.t -= s
    const ronda = this.rondas[this.atual]
    const lado = teclas.premidas.has('LEFT') ? 'a' : teclas.premidas.has('RIGHT') ? 'b' : null
    if (lado || this.t <= 0) {
      const melhor = ronda.a.custo < ronda.b.custo ? 'a' : 'b'
      const certo = lado === melhor
      if (certo) this.certas++
      sfx(certo ? 'ponto' : 'erro')
      this.feedback = { certo, t: 1.8 }
    }
  }

  private cartao(ctx: CanvasRenderingContext2D, o: Oferta, x: number, cor: string, destaque: boolean) {
    r(ctx, x - 50, 44, 100, 62, K)
    r(ctx, x - 49, 45, 98, 60, destaque ? '#fff8c8' : '#ffffff')
    r(ctx, x - 49, 45, 98, 8, cor)
    o.linhas.forEach((l, i) => textoContorno(ctx, l, x, 62 + i * 16, '#283040', 'center', 6))
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, this.adulto ? '#dfe7f2' : '#f8ecd8')
    const ronda = this.rondas[Math.min(this.atual, RONDAS - 1)]
    textoQuebrado(ctx, ronda.pergunta, 8, 12, 224, '#283040', 7, 10)
    const melhor = ronda.a.custo < ronda.b.custo ? 'a' : 'b'
    this.cartao(ctx, ronda.a, 62, '#4a7ad0', !!this.feedback && melhor === 'a')
    this.cartao(ctx, ronda.b, 178, '#e8743a', !!this.feedback && melhor === 'b')
    if (this.feedback) {
      textoContorno(ctx, this.feedback.certo ? 'CERTO!' : 'ESSA SAI MAIS CARA!', W / 2, 110, this.feedback.certo ? '#48b048' : '#e04848', 'center', 7)
      textoQuebrado(ctx, ronda.explicacao, 8, 122, 224, '#ffffff', 6, 9)
    } else {
      textoContorno(ctx, '<', 62, 110, '#283040', 'center')
      textoContorno(ctx, '>', 178, 110, '#283040', 'center')
      r(ctx, 20, 150, 200, 4, K)
      r(ctx, 20, 150, Math.round(200 * Math.max(0, this.t / TEMPO_RONDA)), 4, '#48b048')
    }
    textoContorno(ctx, `${Math.min(this.atual + 1, RONDAS)}/${RONDAS}`, W - 4, 2, '#283040', 'right', 6)
    textoContorno(ctx, `${this.certas} certas`, 4, 2, '#283040', 'left', 6)
  }

  resultado() {
    return { pontos: this.certas, texto: `${this.certas} de ${RONDAS} escolhas certas` }
  }
}
