import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const POUPANCA_MINIMA = 0.1

interface Despesa {
  nome: string
  valor: number
  essencial: boolean
}

interface Ronda {
  quem: string
  salario: number
  despesas: Despesa[]
}

const RONDAS: Ronda[] = [
  {
    quem: 'ESTUDANTE COM PART-TIME',
    salario: 650,
    despesas: [
      { nome: 'Quarto', valor: 300, essencial: true },
      { nome: 'Comida', valor: 140, essencial: true },
      { nome: 'Passe', valor: 30, essencial: true },
      { nome: 'Streaming', valor: 12, essencial: false },
      { nome: 'Jantares fora', valor: 80, essencial: false },
      { nome: 'Ténis novos', valor: 90, essencial: false },
      { nome: 'Telemóvel', valor: 15, essencial: true },
    ],
  },
  {
    quem: 'PRIMEIRO EMPREGO',
    salario: 1150,
    despesas: [
      { nome: 'Renda T0', valor: 520, essencial: true },
      { nome: 'Supermercado', valor: 220, essencial: true },
      { nome: 'Luz, água, net', valor: 90, essencial: true },
      { nome: 'Ginásio', valor: 35, essencial: false },
      { nome: 'Fim de semana fora', valor: 180, essencial: false },
      { nome: 'Passe', valor: 40, essencial: true },
      { nome: 'Roupa', valor: 60, essencial: false },
      { nome: 'Consola a prestações', valor: 70, essencial: false },
    ],
  },
  {
    quem: 'FAMÍLIA COM UM FILHO',
    salario: 2300,
    despesas: [
      { nome: 'Prestação da casa', valor: 650, essencial: true },
      { nome: 'Supermercado', valor: 420, essencial: true },
      { nome: 'Creche', valor: 280, essencial: true },
      { nome: 'Carro e gasolina', valor: 220, essencial: true },
      { nome: 'Contas da casa', valor: 150, essencial: true },
      { nome: 'Férias (por mês)', valor: 150, essencial: false },
      { nome: 'Jantares fora', valor: 120, essencial: false },
      { nome: 'Telemóveis novos', valor: 110, essencial: false },
      { nome: 'Seguro de saúde', valor: 60, essencial: false },
    ],
  },
]

/** Fazer o orçamento: cada despesa entra no salário (A) ou fica de fora (B). Tem de sobrar pelo menos 10% para poupar. */
export class Orcamento implements MiniJogo {
  titulo = 'O ORÇAMENTO DO MÊS'
  instrucoes = ['A: PÔR a despesa no orçamento.', 'B: CORTAR a despesa.', 'O essencial entra sempre. Guarda 10% para poupar!']
  terminado = false
  private ronda = 0
  private indice = 0
  private dentro: Despesa[] = []
  private pontos = 0
  private equilibradas = 0
  private aviso: { texto: string; cor: string; t: number } | null = null
  private fimRonda = 0
  private lista: Despesa[] = []

  constructor() {
    this.prepararRonda()
  }

  private prepararRonda() {
    this.dentro = []
    this.indice = 0
    this.lista = [...RONDAS[this.ronda].despesas].sort(() => Math.random() - 0.5)
  }

  private get gasto() {
    return this.dentro.reduce((t, d) => t + d.valor, 0)
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }
    if (this.fimRonda > 0) {
      this.fimRonda -= s
      if (this.fimRonda <= 0 || (this.fimRonda < 2 && teclas.premidas.has('A'))) {
        this.fimRonda = 0
        this.ronda++
        if (this.ronda >= RONDAS.length) this.terminado = true
        else this.prepararRonda()
      }
      return
    }
    const d = this.lista[this.indice]
    if (!d) return
    if (teclas.premidas.has('A')) {
      this.dentro.push(d)
      this.indice++
      sfx('tic')
    } else if (teclas.premidas.has('B')) {
      if (d.essencial) {
        this.aviso = { texto: 'ISSO É ESSENCIAL!', cor: '#ff8080', t: 1 }
        this.pontos = Math.max(0, this.pontos - 1)
        sfx('erro')
        return
      }
      this.indice++
      sfx('cancelar')
    }
    if (this.indice >= this.lista.length) {
      const sal = RONDAS[this.ronda].salario
      const sobra = sal - this.gasto
      if (sobra >= sal * POUPANCA_MINIMA) {
        const extras = this.dentro.filter((x) => !x.essencial).length
        this.pontos += 3 + extras
        this.equilibradas++
        this.aviso = { texto: `POUPAS ${sobra}€ (${Math.round((sobra / sal) * 100)}%)`, cor: '#80f080', t: 3 }
        sfx('ponto')
      } else {
        this.aviso = { texto: sobra < 0 ? `FALTAM ${-sobra}€!` : `SÓ SOBRAM ${sobra}€`, cor: '#ff8080', t: 3 }
        sfx('erro')
      }
      this.fimRonda = 3
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#eef2f8')
    const ronda = RONDAS[Math.min(this.ronda, RONDAS.length - 1)]
    textoContorno(ctx, ronda.quem, W / 2, 4, '#4a7ad0', 'center', 6)
    textoContorno(ctx, `SALÁRIO: ${ronda.salario}€`, W / 2, 14, '#283040', 'center', 7)
    // barra do salário
    const bx = 12
    const bw = 216
    r(ctx, bx - 1, 27, bw + 2, 18, K)
    r(ctx, bx, 28, bw, 16, '#ffffff')
    let x = bx
    const cores = ['#e8743a', '#4a7ad0', '#2a9a5a', '#9468cc', '#e0a020', '#3aa0a0', '#d04880', '#7a8496', '#a86a3c']
    this.dentro.forEach((d, i) => {
      const w = Math.round((d.valor / ronda.salario) * bw)
      r(ctx, Math.min(x, bx + bw), 28, Math.max(0, Math.min(w, bx + bw - x)), 16, d.essencial ? cores[i % 3] : cores[3 + (i % 6)])
      x += w
    })
    const linha = bx + Math.round(bw * (1 - POUPANCA_MINIMA))
    r(ctx, linha, 24, 2, 24, '#e04848')
    textoContorno(ctx, 'POUPAR', linha + 1, 48, '#e04848', 'center', 5)
    const sobra = ronda.salario - this.gasto
    textoContorno(ctx, `GASTO ${this.gasto}€ · SOBRA ${sobra}€`, W / 2, 58, sobra < ronda.salario * POUPANCA_MINIMA ? '#e04848' : '#2a8a5a', 'center', 6)
    // a despesa que chega
    const d = this.lista[this.indice]
    if (d && this.fimRonda <= 0) {
      r(ctx, 50, 74, 140, 46, K)
      r(ctx, 51, 75, 138, 44, d.essencial ? '#fff4e0' : '#ffffff')
      textoContorno(ctx, d.essencial ? 'ESSENCIAL' : 'OPCIONAL', W / 2, 79, d.essencial ? '#e8743a' : '#9468cc', 'center', 5)
      textoContorno(ctx, d.nome, W / 2, 91, '#283040', 'center', 7)
      textoContorno(ctx, `${d.valor}€ / mês`, W / 2, 105, '#283040', 'center', 7)
      textoContorno(ctx, 'A: PÔR', 32, 128, '#2a8a5a', 'center', 6)
      textoContorno(ctx, 'B: CORTAR', 208, 128, '#e04848', 'center', 6)
    } else if (this.fimRonda > 0) {
      textoQuebrado(ctx, sobra >= ronda.salario * POUPANCA_MINIMA ? 'Orçamento equilibrado! Primeiro o essencial, depois guardar, e só então os extras.' : 'Não sobrou o suficiente: corta nos extras para poder poupar.', 14, 84, 212, '#283040', 6, 10)
    }
    textoContorno(ctx, `${this.ronda + 1 > RONDAS.length ? RONDAS.length : this.ronda + 1}/${RONDAS.length}`, W - 4, 148, '#283040', 'right', 6)
    textoContorno(ctx, `${this.pontos} pontos`, 4, 148, '#283040', 'left', 6)
    if (this.aviso) textoContorno(ctx, this.aviso.texto, W / 2, 134, this.aviso.cor, 'center', 7)
  }

  resultado() {
    return { pontos: this.pontos, texto: `${this.equilibradas} de ${RONDAS.length} orçamentos equilibrados · ${this.pontos} pontos` }
  }
}
