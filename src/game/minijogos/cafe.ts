import { CORES_CABELO, CORES_PELE, CORES_ROUPA } from '../data'
import { circulo } from '../pixel/cenario'
import { r } from '../pixel/draw'
import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 40
const ITENS = ['CAFÉ', 'GALÃO', 'SUMO', 'BOLO'] as const
const SLOT_X = [30, 90, 150, 210]
const GORJETA = 0.3
const GORJETA_RAPIDA = 0.2

interface Cliente {
  frames: FramesPersonagem
  pedido: number[]
  servidos: number[]
  paciencia: number
  duracao: number
  /** Depois de servido ou de desistir, fica um bocadinho a mostrar a reação. */
  saida: { texto: string; t: number } | null
}

function aoAcaso<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)]
}

/** Desenha um artigo do café em escala (1 = 12x12 píxeis). */
function artigo(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, e: number) {
  const q = (dx: number, dy: number, w: number, h: number, c: string) => r(ctx, x + dx * e, y + dy * e, w * e, h * e, c)
  if (i === 0) {
    q(2, 9, 9, 2, '#d8d0c8')
    q(3, 4, 6, 5, '#ffffff')
    q(3, 4, 6, 1, '#6a3f26')
    q(9, 5, 2, 2, '#ffffff')
    q(2, 3, 1, 6, '#283040')
    q(9, 3, 1, 6, '#283040')
  } else if (i === 1) {
    q(3, 0, 6, 12, '#283040')
    q(4, 1, 4, 3, '#fff8ee')
    q(4, 4, 4, 4, '#d8b088')
    q(4, 8, 4, 3, '#8a5a3a')
  } else if (i === 2) {
    q(3, 2, 6, 10, '#283040')
    q(4, 3, 4, 8, '#f8a030')
    q(4, 3, 4, 1, '#ffd080')
    q(7, 0, 1, 4, '#e84848')
  } else {
    q(1, 9, 10, 2, '#d8d0c8')
    q(2, 4, 8, 5, '#f8e0b0')
    q(2, 4, 8, 2, '#f58cb4')
    q(5, 2, 2, 2, '#e02040')
  }
}

/** Turno no Café: servir o que cada cliente pediu antes que perca a paciência. */
export class Cafe implements MiniJogo {
  titulo = 'TURNO NO CAFÉ'
  instrucoes = ['Setas: escolher o artigo.', 'A: servir ao cliente.', 'Serve depressa para ganhar gorjetas!']
  terminado = false
  private tempo = 0
  private cursor = 0
  private atendidos = 0
  private perdidos = 0
  private gorjetas = 0
  private cliente: Cliente
  private aviso: { texto: string; t: number } | null = null
  private sprites: (a: AvatarConfig) => FramesPersonagem

  constructor(sprites: (a: AvatarConfig) => FramesPersonagem) {
    this.sprites = sprites
    this.cliente = this.novoCliente()
  }

  private novoCliente(): Cliente {
    const avatar = { pele: aoAcaso(CORES_PELE), cabelo: aoAcaso(CORES_CABELO), roupa: aoAcaso(CORES_ROUPA), cabeloComprido: Math.random() < 0.5 }
    const dois = this.atendidos >= 4 && Math.random() < 0.6
    const pedido = [Math.floor(Math.random() * 4)]
    if (dois) pedido.push(Math.floor(Math.random() * 4))
    const duracao = Math.max(5, 9 - this.atendidos * 0.35) + (dois ? 2 : 0)
    return { frames: this.sprites(avatar), pedido, servidos: [], paciencia: 1, duracao, saida: null }
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }
    if (teclas.premidas.has('LEFT')) this.cursor = (this.cursor + 3) % 4
    if (teclas.premidas.has('RIGHT')) this.cursor = (this.cursor + 1) % 4

    const c = this.cliente
    if (c.saida) {
      c.saida.t -= s
      if (c.saida.t <= 0) this.cliente = this.novoCliente()
    } else {
      c.paciencia -= s / c.duracao
      if (c.paciencia <= 0) {
        this.perdidos++
        c.saida = { texto: 'Demorou muito...', t: 0.9 }
      } else if (teclas.premidas.has('A')) {
        this.servir(c)
      }
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  private servir(c: Cliente) {
    const indice = c.pedido.findIndex((p, i) => p === this.cursor && !c.servidos.includes(i))
    if (indice === -1) {
      c.paciencia = Math.max(0.01, c.paciencia - 0.25)
      this.aviso = { texto: 'Não pedi isso!', t: 0.8 }
      return
    }
    c.servidos.push(indice)
    if (c.servidos.length === c.pedido.length) {
      const rapido = c.paciencia > 0.5
      this.gorjetas += GORJETA * c.pedido.length + (rapido ? GORJETA_RAPIDA : 0)
      this.atendidos++
      c.saida = { texto: rapido ? 'Que rápido! Obrigado!' : 'Obrigado!', t: 0.8 }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    // parede, janela e quadro do menu
    r(ctx, 0, 0, W, 100, '#ead6bf')
    for (let x = 0; x < W; x += 12) r(ctx, x, 0, 1, 100, '#dcc6ad')
    r(ctx, 10, 12, 44, 34, '#283040')
    r(ctx, 12, 14, 40, 30, '#a8dcf8')
    r(ctx, 31, 14, 2, 30, '#283040')
    r(ctx, 12, 28, 40, 2, '#283040')
    r(ctx, 186, 10, 46, 40, '#5a3a22')
    r(ctx, 188, 12, 42, 36, '#2f4a3a')
    for (let i = 0; i < 4; i++) r(ctx, 192, 18 + i * 7, 18 + ((i * 7) % 12), 1, '#e8f0e8')

    // cliente
    const c = this.cliente
    const img = c.frames.down[0]
    const alt = 64
    const larg = Math.round((alt * img.width) / img.height)
    ctx.drawImage(img, 108 - larg / 2, 16, larg, alt)

    // balão do pedido + paciência
    if (!c.saida) {
      const bw = 10 + c.pedido.length * 26
      r(ctx, 134, 14, bw, 34, '#283040')
      r(ctx, 135, 15, bw - 2, 32, '#ffffff')
      r(ctx, 131, 30, 4, 4, '#ffffff')
      c.pedido.forEach((p, i) => {
        artigo(ctx, p, 140 + i * 26, 18, 2)
        if (c.servidos.includes(i)) {
          r(ctx, 140 + i * 26, 28, 24, 3, '#20a040')
          r(ctx, 152 + i * 26, 22, 3, 9, '#20a040')
        }
      })
      r(ctx, 134, 50, bw, 5, '#283040')
      r(ctx, 135, 51, Math.round((bw - 2) * c.paciencia), 3, c.paciencia > 0.5 ? '#48c060' : c.paciencia > 0.25 ? '#f0c040' : '#e04848')
    } else {
      textoContorno(ctx, c.saida.texto, 170, 26, '#ffffff')
    }

    // balcão e artigos
    r(ctx, 0, 80, W, 4, '#d8a070')
    r(ctx, 0, 84, W, 18, '#b27a48')
    for (let x = 20; x < W; x += 40) r(ctx, x, 86, 2, 14, '#8e5c34')
    r(ctx, 0, 102, W, H - 102, '#f4ece0')
    SLOT_X.forEach((sx, i) => {
      const sel = i === this.cursor
      r(ctx, sx - 22, 106, 44, 40, sel ? '#e04848' : '#c8bca8')
      r(ctx, sx - 20, 108, 40, 36, sel ? '#fff4e0' : '#ffffff')
      artigo(ctx, i, sx - 12, 110, 2)
      textoContorno(ctx, ITENS[i], sx, 148, sel ? '#e04848' : '#ffffff')
    })
    if (this.aviso) textoContorno(ctx, this.aviso.texto, 120, 64, '#ffffff')

    // tempo, clientes e gorjetas
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 2, '#ffffff', 'right')
    textoContorno(ctx, `${this.atendidos} servidos`, 4, 2, '#ffffff', 'left')
    circulo(ctx, 4 + 4, 56, 4, '#f0c040', '#283040')
    textoContorno(ctx, `${this.gorjetas.toFixed(2).replace('.', ',')}€`, 16, 53, '#f8e040', 'left')
  }

  resultado() {
    const gorjetas = Math.round(this.gorjetas * 100) / 100
    const n = this.atendidos
    return {
      pontos: n,
      valor: gorjetas,
      texto: `${n} ${n === 1 ? 'cliente servido' : 'clientes servidos'} · ${gorjetas.toFixed(2).replace('.', ',')}€ de gorjetas`,
    }
  }
}
