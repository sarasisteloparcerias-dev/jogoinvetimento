import { circulo } from '../pixel/cenario'
import { r, tom } from '../pixel/draw'
import type { AvatarConfig } from '../types'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 35
const FAIXAS = [84, 120, 156]
const Y_BICI = 124
const K = '#283040'
const CORES_CARRO = ['#e04848', '#4a7ad0', '#f0c040', '#3aa870', '#9468cc', '#ececf0']

interface Coisa {
  tipo: 'carro' | 'caixa'
  faixa: number
  y: number
  cor: string
}

/** Entregas de bicicleta: muda de faixa, apanha as encomendas e não batas nos carros. */
export class Entregas implements MiniJogo {
  titulo = 'ENTREGAS DE BICICLETA'
  instrucoes = ['Setas: mudar de faixa.', 'Apanha as caixas: cada uma é uma entrega.', 'Cuidado com os carros! (3 vidas)']
  terminado = false
  private tempo = 0
  private faixa = 1
  private x = FAIXAS[1]
  private estrada = 0
  private proximo = 0.6
  private coisas: Coisa[] = []
  private entregas = 0
  private vidas = 3
  private invencivel = 0
  private avisos: { texto: string; x: number; y: number; t: number; cor: string }[] = []
  private avatar: AvatarConfig

  constructor(avatar: AvatarConfig) {
    this.avatar = avatar
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (teclas.premidas.has('LEFT')) this.faixa = Math.max(0, this.faixa - 1)
    if (teclas.premidas.has('RIGHT')) this.faixa = Math.min(2, this.faixa + 1)
    this.x += (FAIXAS[this.faixa] - this.x) * Math.min(1, s * 14)
    const vel = 70 + this.tempo * 2.2
    this.estrada = (this.estrada + vel * s) % 16
    if (this.invencivel > 0) this.invencivel -= s

    this.proximo -= s
    if (this.proximo <= 0) {
      this.proximo = Math.max(0.5, 1 - this.tempo * 0.012)
      const ocupadas = new Set(this.coisas.filter((c) => c.y < 30).map((c) => c.faixa))
      const livres = [0, 1, 2].filter((f) => !ocupadas.has(f))
      if (livres.length) {
        const faixa = livres[Math.floor(Math.random() * livres.length)]
        const caixa = Math.random() < 0.42
        this.coisas.push({ tipo: caixa ? 'caixa' : 'carro', faixa, y: -24, cor: CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)] })
      }
    }

    for (const c of this.coisas) {
      c.y += (c.tipo === 'carro' ? vel * 1.25 : vel) * s
      const perto = Math.abs(FAIXAS[c.faixa] - this.x) < 12
      if (c.tipo === 'caixa' && perto && Math.abs(c.y - Y_BICI) < 12) {
        this.entregas++
        this.avisos.push({ texto: '+1', x: this.x, y: Y_BICI - 20, t: 0.7, cor: '#80f080' })
        c.y = 999
      } else if (c.tipo === 'carro' && perto && c.y + 20 > Y_BICI - 8 && c.y < Y_BICI + 8 && this.invencivel <= 0) {
        this.vidas--
        this.invencivel = 1.2
        this.avisos.push({ texto: 'CUIDADO!', x: this.x, y: Y_BICI - 24, t: 0.9, cor: '#ff8080' })
      }
    }
    this.coisas = this.coisas.filter((c) => c.y < H + 30)
    for (const a of this.avisos) {
      a.t -= s
      a.y -= 18 * s
    }
    this.avisos = this.avisos.filter((a) => a.t > 0)
    if (this.tempo >= DURACAO || this.vidas <= 0) this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    // passeios, prédios e estrada
    r(ctx, 0, 0, W, H, '#88d06a')
    r(ctx, 40, 0, 4, H, '#d6d8de')
    r(ctx, 196, 0, 4, H, '#d6d8de')
    for (let y = -16 + this.estrada; y < H; y += 32) {
      r(ctx, 4, y, 30, 26, '#f6e3c8')
      r(ctx, 4, y, 30, 4, '#e8743a')
      r(ctx, 206, y + 8, 30, 26, '#e2eaf6')
      r(ctx, 206, y + 8, 30, 4, '#4a7ad0')
    }
    r(ctx, 44, 0, 152, H, '#5c6070')
    for (let y = -16 + this.estrada; y < H; y += 16) {
      r(ctx, 101, y, 2, 8, '#ece8c8')
      r(ctx, 137, y, 2, 8, '#ece8c8')
    }

    for (const c of this.coisas) {
      const x = FAIXAS[c.faixa]
      const y = Math.round(c.y)
      if (c.tipo === 'caixa') {
        r(ctx, x - 7, y - 6, 14, 12, K)
        r(ctx, x - 6, y - 5, 12, 10, '#c98a4c')
        r(ctx, x - 1, y - 5, 2, 10, '#f4e2c0')
      } else {
        r(ctx, x - 9, y - 2, 18, 24, K)
        r(ctx, x - 8, y - 1, 16, 22, c.cor)
        r(ctx, x - 7, y + 14, 14, 4, '#9fd6f6')
        r(ctx, x - 7, y + 2, 14, 3, '#9fd6f6')
        r(ctx, x - 10, y + 1, 2, 5, K)
        r(ctx, x + 8, y + 1, 2, 5, K)
        r(ctx, x - 10, y + 15, 2, 5, K)
        r(ctx, x + 8, y + 15, 2, 5, K)
      }
    }

    // bicicleta vista de cima
    if (this.invencivel <= 0 || Math.floor(this.invencivel * 10) % 2 === 0) {
      const x = Math.round(this.x)
      r(ctx, x - 1, Y_BICI - 12, 3, 24, K)
      r(ctx, x - 6, Y_BICI - 8, 13, 2, K)
      r(ctx, x - 5, Y_BICI - 4, 11, 9, this.avatar.roupa)
      r(ctx, x - 5, Y_BICI + 3, 11, 2, tom(this.avatar.roupa, -0.3))
      circulo(ctx, x, Y_BICI - 3, 4, this.avatar.cabelo, K)
      r(ctx, x + 5, Y_BICI - 2, 6, 7, '#c98a4c')
      r(ctx, x + 5, Y_BICI - 2, 6, 1, K)
    }

    textoContorno(ctx, `${this.entregas} entregas`, 4, 4, '#ffffff', 'left')
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 4, '#ffffff', 'right')
    for (let i = 0; i < 3; i++) circulo(ctx, 210 + i * 10, 22, 3, i < this.vidas ? '#e04848' : '#6a6a78', K)
    for (const a of this.avisos) textoContorno(ctx, a.texto, Math.round(a.x), Math.round(a.y), a.cor, 'center', 6)
  }

  resultado() {
    const n = this.entregas
    return {
      pontos: n,
      valor: n,
      texto: this.vidas <= 0 ? `${n} entregas (bateste 3 vezes)` : `${n} ${n === 1 ? 'entrega' : 'entregas'} · ${n}€ de bónus`,
    }
  }
}
