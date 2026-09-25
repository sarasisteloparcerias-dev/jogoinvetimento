import { circulo } from '../pixel/cenario'
import { r, tom } from '../pixel/draw'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 25
const MAX_BOLAS = 10
const TOPO_CONE = 124
const ALTURA_BOLA = 10
const VEL_CONE = 140

const SABORES = [
  { nome: 'MORANGO', cor: '#f58cb4' },
  { nome: 'CHOCOLATE', cor: '#8d5a3b' },
  { nome: 'BAUNILHA', cor: '#fff0c0' },
  { nome: 'MENTA', cor: '#8ee0b8' },
]

interface Bola {
  sabor: number
  x: number
  y: number
}

interface Aviso {
  texto: string
  x: number
  y: number
  t: number
}

/** Faz o teu gelado: a máquina deixa cair bolas, apanha-as com o cone e segue o pedido. */
export class Gelado implements MiniJogo {
  titulo = 'FAZ O TEU GELADO'
  instrucoes = ['Setas: mexer o cone.', 'Apanha as bolas que caem da máquina.', 'Segue o pedido para ganhar mais!']
  terminado = false
  private tempo = 0
  private cone = 120
  private maquina = 40
  private sentidoMaquina = 1
  private proxima = 0.6
  private caindo: Bola[] = []
  private pilha: { sabor: number; dx: number }[] = []
  private pedido = this.novoPedido()
  private passo = 0
  private pedidos = 0
  private pontos = 0
  private splats: { x: number; t: number; cor: string }[] = []
  private avisos: Aviso[] = []

  private novoPedido() {
    return Array.from({ length: 3 }, () => Math.floor(Math.random() * SABORES.length))
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (teclas.seguras.has('LEFT')) this.cone -= VEL_CONE * s
    if (teclas.seguras.has('RIGHT')) this.cone += VEL_CONE * s
    this.cone = Math.max(16, Math.min(W - 16, this.cone))

    this.maquina += this.sentidoMaquina * (60 + this.tempo * 2) * s
    if (this.maquina > W - 24 || this.maquina < 24) {
      this.sentidoMaquina *= -1
      this.maquina = Math.max(24, Math.min(W - 24, this.maquina))
    }

    this.proxima -= s
    if (this.proxima <= 0 && this.tempo < DURACAO - 1) {
      this.proxima = Math.max(0.75, 1.15 - this.tempo * 0.015)
      const sabor = Math.random() < 0.5 ? this.pedido[this.passo] : Math.floor(Math.random() * SABORES.length)
      this.caindo.push({ sabor, x: Math.round(this.maquina), y: 30 })
    }

    const vel = 55 + this.tempo * 1.6
    const topo = TOPO_CONE - 4 - this.pilha.length * ALTURA_BOLA
    for (const b of this.caindo) {
      const antes = b.y
      b.y += vel * s
      if (antes < topo - 2 && b.y >= topo - 2 && Math.abs(b.x - this.cone) <= 12) {
        this.apanhar(b)
        b.y = 999
      } else if (b.y > H - 12 && b.y < 900) {
        this.splats.push({ x: b.x, t: 0.7, cor: SABORES[b.sabor].cor })
        b.y = 999
      }
    }
    this.caindo = this.caindo.filter((b) => b.y < 900)
    for (const sp of this.splats) sp.t -= s
    this.splats = this.splats.filter((sp) => sp.t > 0)
    for (const a of this.avisos) {
      a.t -= s
      a.y -= 20 * s
    }
    this.avisos = this.avisos.filter((a) => a.t > 0)

    if (this.tempo >= DURACAO || this.pilha.length >= MAX_BOLAS) this.terminado = true
  }

  private apanhar(b: Bola) {
    this.pilha.push({ sabor: b.sabor, dx: Math.max(-3, Math.min(3, Math.round(b.x - this.cone))) })
    const y = TOPO_CONE - this.pilha.length * ALTURA_BOLA
    if (b.sabor === this.pedido[this.passo]) {
      this.pontos += 2
      this.passo++
      if (this.passo >= this.pedido.length) {
        this.pontos += 3
        this.pedidos++
        this.pedido = this.novoPedido()
        this.passo = 0
        this.avisos.push({ texto: 'PEDIDO!', x: this.cone, y: y - 12, t: 1 })
      } else this.avisos.push({ texto: '+2', x: this.cone, y: y - 10, t: 0.7 })
    } else {
      this.pontos += 1
      this.avisos.push({ texto: '+1', x: this.cone, y: y - 10, t: 0.7 })
    }
  }

  private bola(ctx: CanvasRenderingContext2D, x: number, y: number, sabor: number, raio = 7) {
    const cor = SABORES[sabor].cor
    circulo(ctx, x, y, raio, cor, '#283040')
    r(ctx, x - raio + 2, y + raio - 3, raio * 2 - 3, 2, tom(cor, -0.2))
    r(ctx, x - 3, y - 4, 2, 2, tom(cor, 0.5))
    if (sabor === 3) {
      r(ctx, x + 1, y - 1, 1, 1, '#4a2a18')
      r(ctx, x - 2, y + 2, 1, 1, '#4a2a18')
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    // loja
    r(ctx, 0, 0, W, H, '#fde6d6')
    for (let x = 8; x < W; x += 16) r(ctx, x, 16, 4, H, '#f8d8c6')
    r(ctx, 0, H - 14, W, 14, '#b27a48')
    r(ctx, 0, H - 14, W, 2, '#d8a070')

    // calha e máquina
    r(ctx, 8, 22, W - 16, 3, '#9aa0b0')
    const mx = Math.round(this.maquina)
    r(ctx, mx - 11, 18, 22, 12, '#283040')
    r(ctx, mx - 10, 19, 20, 10, '#e8743a')
    r(ctx, mx - 6, 21, 12, 5, '#fff6e6')
    r(ctx, mx - 2, 29, 4, 3, '#283040')

    for (const sp of this.splats) {
      r(ctx, sp.x - 8, H - 17, 16, 3, sp.cor)
      r(ctx, sp.x - 11, H - 15, 4, 1, sp.cor)
      r(ctx, sp.x + 8, H - 15, 4, 1, sp.cor)
    }
    for (const b of this.caindo) this.bola(ctx, b.x, Math.round(b.y), b.sabor)

    // cone e gelado empilhado
    const cx = Math.round(this.cone)
    const balanco = Math.sin(this.tempo * 3)
    this.pilha.forEach((p, i) => {
      const x = cx + Math.round(p.dx + balanco * i * 0.4)
      this.bola(ctx, x, TOPO_CONE - 4 - i * ALTURA_BOLA, p.sabor, 8)
    })
    for (let i = 0; i < 20; i++) {
      const larg = Math.round(18 - i * 0.85)
      r(ctx, cx - Math.floor(larg / 2), TOPO_CONE + i, larg, 1, i % 4 === 0 ? '#c88a3a' : '#e8b060')
    }
    r(ctx, cx - 10, TOPO_CONE - 1, 20, 3, '#c88a3a')

    // pedido e tempo
    r(ctx, 2, 2, 118, 15, '#283040')
    r(ctx, 3, 3, 116, 13, '#ffffff')
    ctx.font = "8px 'Press Start 2P'"
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#3a4262'
    ctx.fillText('PEDIDO', 7, 6)
    this.pedido.forEach((sabor, i) => {
      this.bola(ctx, 66 + i * 17, 9, sabor, 5)
      if (i < this.passo) {
        r(ctx, 62 + i * 17, 9, 3, 2, '#20a040')
        r(ctx, 64 + i * 17, 11, 2, 1, '#20a040')
        r(ctx, 66 + i * 17, 5, 2, 6, '#20a040')
      }
    })
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 6, 6, '#ffffff', 'right')
    textoContorno(ctx, `${this.pontos} pts`, W - 50, 6, '#f8e040', 'right')

    for (const a of this.avisos) textoContorno(ctx, a.texto, Math.round(a.x), Math.round(a.y), '#f8e040')
  }

  resultado() {
    const bolas = this.pilha.length
    return {
      pontos: this.pedidos,
      texto: `${bolas} ${bolas === 1 ? 'bola' : 'bolas'} · ${this.pedidos} ${this.pedidos === 1 ? 'pedido certo' : 'pedidos certos'}`,
    }
  }
}
