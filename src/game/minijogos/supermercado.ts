import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 30
const VEL_CARRINHO = 150
const Y_CARRINHO = 128

interface Produto {
  nome: string
  preco: number
  desenhar(ctx: CanvasRenderingContext2D, x: number, y: number): void
}

const q = (ctx: CanvasRenderingContext2D, x: number, y: number) => (dx: number, dy: number, w: number, h: number, c: string) => r(ctx, x + dx, y + dy, w, h, c)
const K = '#283040'

/** O que está na lista de compras. */
const LISTA: Produto[] = [
  {
    nome: 'LEITE',
    preco: 0.9,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(2, 0, 8, 14, K)
      p(3, 3, 6, 10, '#ffffff')
      p(3, 1, 6, 2, '#4a7ad0')
      p(3, 7, 6, 2, '#4a7ad0')
    },
  },
  {
    nome: 'OVOS',
    preco: 2.2,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(0, 5, 14, 8, K)
      p(1, 6, 12, 6, '#b8a080')
      for (let i = 0; i < 3; i++) circulo(ctx, x + 3 + i * 4, y + 5, 2, '#fff6e6', K)
    },
  },
  {
    nome: 'CARNE',
    preco: 5.5,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(0, 8, 14, 5, K)
      p(1, 9, 12, 3, '#e8eef6')
      p(2, 3, 10, 6, K)
      p(3, 4, 8, 5, '#e05a6a')
      p(4, 5, 3, 2, '#f8d8d8')
    },
  },
  {
    nome: 'PÃO',
    preco: 1.2,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(0, 4, 14, 7, K)
      p(1, 5, 12, 5, '#d08a40')
      p(3, 6, 2, 1, '#f0c080')
      p(6, 6, 2, 1, '#f0c080')
      p(9, 6, 2, 1, '#f0c080')
    },
  },
  {
    nome: 'FRUTA',
    preco: 1.8,
    desenhar(ctx, x, y) {
      circulo(ctx, x + 7, y + 8, 5, '#e04848', K)
      r(ctx, x + 5, y + 6, 2, 2, '#f8a0a0')
      r(ctx, x + 7, y + 1, 1, 3, '#6a4422')
      r(ctx, x + 8, y + 1, 3, 2, '#48b048')
    },
  },
  {
    nome: 'ARROZ',
    preco: 1.1,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(2, 1, 10, 13, K)
      p(3, 2, 8, 11, '#f4f4ee')
      p(3, 6, 8, 4, '#f0c040')
    },
  },
]

/** Compras por impulso: estão sempre a cair, mas não estão na lista. */
const IMPULSOS: Produto[] = [
  {
    nome: 'CHOCOLATE',
    preco: 2.5,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(0, 3, 14, 8, K)
      p(1, 4, 12, 6, '#6a3f26')
      p(1, 4, 5, 6, '#e04848')
    },
  },
  {
    nome: 'BATATAS',
    preco: 2,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(1, 0, 12, 14, K)
      p(2, 1, 10, 12, '#f8d040')
      p(2, 5, 10, 3, '#e04848')
    },
  },
  {
    nome: 'REFRIGERANTE',
    preco: 1.5,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(3, 1, 8, 13, K)
      p(4, 2, 6, 11, '#f8a030')
      p(4, 6, 6, 3, '#4a7ad0')
      p(5, 1, 4, 1, '#c8ccd4')
    },
  },
  {
    nome: 'GOMAS',
    preco: 1.8,
    desenhar(ctx, x, y) {
      const p = q(ctx, x, y)
      p(1, 1, 12, 12, K)
      p(2, 2, 10, 10, '#f58cb4')
      circulo(ctx, x + 5, y + 7, 1, '#48c060')
      circulo(ctx, x + 9, y + 6, 1, '#f8e040')
    },
  },
]

interface Caindo {
  p: Produto
  lista: boolean
  x: number
  y: number
  vel: number
}

/** Compras do mês: apanha com o carrinho o que está na lista e foge às compras por impulso. */
export class Supermercado implements MiniJogo {
  titulo = 'AS COMPRAS DO MÊS'
  instrucoes = ['Setas: mexer o carrinho.', 'Apanha só o que está na LISTA.', 'O resto são compras por impulso: custam dinheiro!']
  terminado = false
  private tempo = 0
  private carrinho = 120
  private proximo = 0.5
  private caindo: Caindo[] = []
  private falta = new Set(LISTA.map((p) => p.nome))
  private impulsos: Produto[] = []
  private avisos: { texto: string; x: number; y: number; t: number; cor: string }[] = []

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (teclas.seguras.has('LEFT')) this.carrinho -= VEL_CARRINHO * s
    if (teclas.seguras.has('RIGHT')) this.carrinho += VEL_CARRINHO * s
    this.carrinho = Math.max(18, Math.min(W - 18, this.carrinho))

    this.proximo -= s
    if (this.proximo <= 0) {
      this.proximo = Math.max(0.45, 0.85 - this.tempo * 0.012)
      const precisa = [...this.falta]
      const daLista = precisa.length > 0 && Math.random() < 0.45
      const nome = precisa[Math.floor(Math.random() * precisa.length)]
      const p = daLista ? LISTA.find((x) => x.nome === nome)! : Math.random() < 0.25 ? LISTA[Math.floor(Math.random() * LISTA.length)] : IMPULSOS[Math.floor(Math.random() * IMPULSOS.length)]
      this.caindo.push({ p, lista: LISTA.includes(p), x: 14 + Math.random() * (W - 42), y: 24, vel: 50 + Math.random() * 25 + this.tempo * 1.5 })
    }

    for (const c of this.caindo) {
      const antes = c.y
      c.y += c.vel * s
      if (antes < Y_CARRINHO - 12 && c.y >= Y_CARRINHO - 12 && Math.abs(c.x + 7 - this.carrinho) <= 18) {
        this.apanhar(c)
        c.y = 999
      }
    }
    this.caindo = this.caindo.filter((c) => c.y < H)
    for (const a of this.avisos) {
      a.t -= s
      a.y -= 20 * s
    }
    this.avisos = this.avisos.filter((a) => a.t > 0)

    if (this.tempo >= DURACAO || (this.falta.size === 0 && this.tempo > 2)) this.terminado = true
  }

  private apanhar(c: Caindo) {
    const y = Y_CARRINHO - 18
    if (c.lista && this.falta.has(c.p.nome)) {
      this.falta.delete(c.p.nome)
      this.avisos.push({ texto: c.p.nome, x: this.carrinho, y, t: 0.9, cor: '#80f080' })
    } else if (c.lista) {
      this.avisos.push({ texto: 'JÁ TENS', x: this.carrinho, y, t: 0.7, cor: '#ffffff' })
    } else {
      this.impulsos.push(c.p)
      this.avisos.push({ texto: `-${c.p.preco.toFixed(2).replace('.', ',')}€`, x: this.carrinho, y, t: 0.9, cor: '#ff8080' })
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    // corredor com prateleiras
    r(ctx, 0, 0, W, H, '#eef4ec')
    for (let i = 0; i < 3; i++) {
      const y = 20 + i * 24
      r(ctx, 0, y + 14, W, 3, '#b8ae9c')
      for (let x = 4; x < W; x += 12) r(ctx, x, y + 4, 8, 10, ['#e25b5b', '#4a7ad0', '#f0c040', '#3aa870', '#f58cb4'][(x / 12 + i) % 5 | 0])
    }
    r(ctx, 0, 92, W, H - 92, '#f4f6fa')
    for (let x = 0; x < W; x += 16) r(ctx, x, 92, 1, H - 92, '#dde2ea')
    for (let y = 100; y < H; y += 16) r(ctx, 0, y, W, 1, '#dde2ea')

    for (const c of this.caindo) c.p.desenhar(ctx, Math.round(c.x), Math.round(c.y))

    // carrinho
    const cx = Math.round(this.carrinho)
    r(ctx, cx - 18, Y_CARRINHO - 12, 36, 16, K)
    r(ctx, cx - 17, Y_CARRINHO - 11, 34, 14, '#c8ccd4')
    for (let x = cx - 14; x < cx + 16; x += 5) r(ctx, x, Y_CARRINHO - 11, 1, 14, '#8e96a4')
    r(ctx, cx + 17, Y_CARRINHO - 18, 2, 8, K)
    r(ctx, cx + 17, Y_CARRINHO - 18, 6, 2, K)
    circulo(ctx, cx - 11, Y_CARRINHO + 7, 3, '#3a3a44', K)
    circulo(ctx, cx + 11, Y_CARRINHO + 7, 3, '#3a3a44', K)

    // lista
    r(ctx, 2, 2, 154, 17, K)
    r(ctx, 3, 3, 152, 15, '#fffbea')
    textoContorno(ctx, 'LISTA', 6, 7, '#ffffff', 'left', 6)
    LISTA.forEach((p, i) => {
      const x = 42 + i * 18
      p.desenhar(ctx, x, 3)
      if (!this.falta.has(p.nome)) {
        r(ctx, x - 1, 10, 4, 2, '#20a040')
        r(ctx, x + 2, 12, 2, 2, '#20a040')
        r(ctx, x + 4, 5, 2, 7, '#20a040')
      }
    })
    const gasto = this.impulsos.reduce((t, p) => t + p.preco, 0)
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 4, '#ffffff', 'right')
    if (gasto > 0) textoContorno(ctx, `impulso -${gasto.toFixed(2).replace('.', ',')}€`, W - 4, 20, '#ff8080', 'right', 6)

    for (const a of this.avisos) textoContorno(ctx, a.texto, Math.round(a.x), Math.round(a.y), a.cor, 'center', 6)
  }

  resultado() {
    const n = LISTA.length - this.falta.size
    const gasto = Math.round(this.impulsos.reduce((t, p) => t + p.preco, 0) * 100) / 100
    const imp = this.impulsos.length
    return {
      pontos: n,
      valor: gasto,
      texto: `Lista ${n}/${LISTA.length} · ${imp} ${imp === 1 ? 'compra' : 'compras'} por impulso (${gasto.toFixed(2).replace('.', ',')}€)`,
    }
  }
}
