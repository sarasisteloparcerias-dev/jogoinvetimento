import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'

interface Artigo {
  nome: string
  pede: number
  cor: string
}

const ARTIGOS: Artigo[] = [
  { nome: 'BICICLETA USADA', pede: 80, cor: '#e04848' },
  { nome: 'CANDEEIRO ANTIGO', pede: 40, cor: '#e0a020' },
  { nome: 'GUITARRA', pede: 120, cor: '#a86a3c' },
  { nome: 'CESTO DE FRUTA', pede: 12, cor: '#48b048' },
  { nome: 'RELÓGIO', pede: 60, cor: '#7a8496' },
  { nome: 'LIVROS (CAIXA)', pede: 25, cor: '#4a7ad0' },
  { nome: 'CADEIRA DE VIME', pede: 45, cor: '#c88a50' },
]

const ARTIGOS_POR_JOGO = 4

/** Regatear na feira: propor um preço sem ofender o vendedor. Quem oferece pouco demais perde a paciência dele. */
export class Regatear implements MiniJogo {
  titulo = 'REGATEAR NA FEIRA'
  instrucoes = ['Cima/baixo: mudar a tua oferta. A: propor.', 'B: aceitar o preço do vendedor.', 'Oferece pouco... mas sem o ofender!']
  terminado = false
  private artigos: Artigo[]
  private atual = 0
  private pede = 0
  private minimo = 0
  private oferta = 0
  private paciencia = 1
  private fala = ''
  private poupado = 0
  private totalPedido = 0
  private negocios = 0
  private pausa = 0

  constructor() {
    this.artigos = [...ARTIGOS].sort(() => Math.random() - 0.5).slice(0, ARTIGOS_POR_JOGO)
    this.novo()
  }

  private novo() {
    const a = this.artigos[this.atual]
    this.pede = a.pede
    this.minimo = Math.round(a.pede * (0.6 + Math.random() * 0.2))
    this.oferta = Math.round(a.pede * 0.5)
    this.paciencia = 1
    this.fala = `${a.pede}€. É uma pechincha!`
  }

  private fechar(preco: number | null) {
    const a = this.artigos[this.atual]
    this.totalPedido += a.pede
    if (preco !== null) {
      this.poupado += a.pede - preco
      this.negocios++
      this.fala = preco < a.pede ? `Está bem, ${preco}€. Negócio fechado!` : `${preco}€. Obrigado!`
      sfx('moeda')
    } else {
      this.fala = 'Assim não vendo! Passe bem.'
      sfx('erro')
    }
    this.pausa = 2.2
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.pausa > 0) {
      this.pausa -= s
      if (this.pausa <= 0) {
        this.atual++
        if (this.atual >= this.artigos.length) this.terminado = true
        else this.novo()
      }
      return
    }
    const passo = this.pede >= 50 ? 5 : 1
    if (teclas.premidas.has('UP')) {
      this.oferta = Math.min(this.pede, this.oferta + passo)
      sfx('cursor')
    }
    if (teclas.premidas.has('DOWN')) {
      this.oferta = Math.max(1, this.oferta - passo)
      sfx('cursor')
    }
    if (teclas.premidas.has('B')) return this.fechar(this.pede)
    if (teclas.premidas.has('A')) {
      if (this.oferta >= this.pede) return this.fechar(this.pede)
      if (this.oferta >= this.minimo) return this.fechar(this.oferta)
      // oferta baixa: perde paciência (mais, quanto mais baixa) e baixa um pouco o preço
      const distancia = (this.minimo - this.oferta) / this.minimo
      this.paciencia -= distancia > 0.35 ? 0.5 : 0.22
      this.pede = Math.max(this.minimo, Math.round(this.pede - (this.pede - this.oferta) * 0.25))
      sfx('tic')
      if (this.paciencia <= 0) return this.fechar(null)
      this.fala = distancia > 0.35 ? `${this.oferta}€?! Isso é uma ofensa! Faço ${this.pede}€.` : `Hmm... ${this.oferta}€ é pouco. Faço-lhe ${this.pede}€.`
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#f6e8c8')
    // toldo e banca
    for (let x = 0; x < W; x += 20) r(ctx, x, 0, 10, 14, '#e04848')
    for (let x = 10; x < W; x += 20) r(ctx, x, 0, 10, 14, '#ffffff')
    r(ctx, 0, 70, W, 8, '#a86a3c')
    r(ctx, 0, 78, W, 82, '#c88a50')
    const a = this.artigos[Math.min(this.atual, this.artigos.length - 1)]
    // vendedor
    r(ctx, 180, 30, 20, 26, '#2a9a5a')
    r(ctx, 184, 18, 12, 12, '#e0ac69')
    r(ctx, 183, 16, 14, 4, '#5a3a1a')
    // artigo
    r(ctx, 30, 44, 50, 26, K)
    r(ctx, 31, 45, 48, 24, a.cor)
    textoContorno(ctx, a.nome, 55, 80, '#283040', 'center', 6)
    // balão do vendedor
    r(ctx, 92, 20, 84, 40, K)
    r(ctx, 93, 21, 82, 38, '#ffffff')
    textoQuebrado(ctx, this.fala, 96, 24, 78, '#283040', 6, 9)
    // paciência
    textoContorno(ctx, 'PACIÊNCIA', 190, 64, '#283040', 'center', 5)
    r(ctx, 166, 72, 48, 5, K)
    r(ctx, 167, 73, Math.round(46 * Math.max(0, this.paciencia)), 3, this.paciencia > 0.5 ? '#48b048' : '#e04848')
    // a tua oferta
    textoContorno(ctx, 'A TUA OFERTA', W / 2, 92, '#ffffff', 'center', 6)
    textoContorno(ctx, `${this.oferta}€`, W / 2, 104, '#f8e040', 'center', 12)
    textoContorno(ctx, `ELE PEDE ${this.pede}€`, W / 2, 124, '#ffffff', 'center', 6)
    textoContorno(ctx, 'A: PROPOR · B: ACEITAR', W / 2, 140, '#283040', 'center', 6)
    textoContorno(ctx, `POUPADO ${this.poupado}€`, 4, 148, '#283040', 'left', 5)
    textoContorno(ctx, `${Math.min(this.atual + 1, this.artigos.length)}/${this.artigos.length}`, W - 4, 148, '#283040', 'right', 6)
  }

  resultado() {
    const pct = this.totalPedido ? Math.round((this.poupado / this.totalPedido) * 100) : 0
    return { pontos: pct, texto: `${this.negocios} negócios · poupaste ${this.poupado}€ (${pct}% do preço pedido)` }
  }
}
