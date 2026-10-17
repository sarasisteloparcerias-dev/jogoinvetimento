import { circulo, desenharCarroV } from '../pixel/cenario'
import { r } from '../pixel/draw'
import { H, textoContorno, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'
const Y_CARRO = 112
const VEL_MAX = 140
/** 100 px/s = 50 km/h. */
const LIMITE = 100
const FAIXAS = [104, 136]
const FIM = 1900
const TEMPO_MAX = 75

type Evento =
  | { tipo: 'passadeira'; d: number; peao: number; feito: boolean }
  | { tipo: 'semaforo'; d: number; verde: boolean; espera: number; feito: boolean }
  | { tipo: 'obstaculo'; d: number; feito: boolean }

/** Exame de condução: acelerar, travar, mudar de faixa, e respeitar passadeiras, semáforos e o limite de velocidade. */
export class Conducao implements MiniJogo {
  titulo = 'EXAME DE CONDUÇÃO'
  instrucoes = ['Cima: acelerar · Baixo: travar.', 'Esquerda/Direita: mudar de faixa.', 'Pára nas passadeiras e nos vermelhos, e não passes dos 50!']
  terminado = false
  private tempo = 0
  private dist = 0
  private vel = 0
  private faixa = 1
  private x = FAIXAS[1]
  private excesso = 0
  private esquerda = 0
  private faltas: string[] = []
  private aviso: { texto: string; t: number } | null = null
  private eventos: Evento[] = [
    { tipo: 'passadeira', d: 420, peao: -1, feito: false },
    { tipo: 'semaforo', d: 860, verde: false, espera: 0, feito: false },
    { tipo: 'obstaculo', d: 1200, feito: false },
    { tipo: 'passadeira', d: 1550, peao: -1, feito: false },
  ]

  private falta(texto: string) {
    this.faltas.push(texto)
    this.aviso = { texto: `FALTA: ${texto}`, t: 1.6 }
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    if (teclas.seguras.has('UP')) this.vel += 70 * s
    else if (teclas.seguras.has('DOWN')) this.vel -= 170 * s
    else this.vel -= 18 * s
    this.vel = Math.max(0, Math.min(VEL_MAX, this.vel))
    if (teclas.premidas.has('LEFT')) this.faixa = 0
    if (teclas.premidas.has('RIGHT')) this.faixa = 1
    this.x += (FAIXAS[this.faixa] - this.x) * Math.min(1, s * 8)
    const antes = this.dist
    this.dist += this.vel * s
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }

    // velocidade
    if (this.vel > LIMITE + 4) this.excesso += s
    else this.excesso = Math.max(0, this.excesso - s)
    if (this.excesso > 1.5) {
      this.falta('EXCESSO DE VELOCIDADE')
      this.excesso = -3
    }

    for (const e of this.eventos) {
      const frente = this.dist + 12
      if (e.tipo === 'passadeira') {
        // o peão começa a atravessar quando o carro se aproxima
        if (e.peao < 0 && e.d - frente < 170) e.peao = 0
        if (e.peao >= 0 && e.peao < 1) e.peao = Math.min(1, e.peao + s / 3.2)
        const peaoNaEstrada = e.peao > 0.08 && e.peao < 0.92
        if (!e.feito && antes + 12 < e.d && frente >= e.d) {
          e.feito = true
          if (peaoNaEstrada) this.falta('NÃO PARASTE NA PASSADEIRA')
        }
        // não deixa passar por cima do peão: trava sozinho (mas conta como falta acima)
      } else if (e.tipo === 'semaforo') {
        if (!e.verde && e.d - frente < 90 && e.d - frente > -5 && this.vel < 6) {
          e.espera += s
          if (e.espera > 1.8) e.verde = true
        }
        if (!e.feito && antes + 12 < e.d && frente >= e.d) {
          e.feito = true
          if (!e.verde) this.falta('PASSASTE NO VERMELHO')
        }
      } else if (!e.feito && this.faixa === 1 && Math.abs(this.x - FAIXAS[1]) < 12 && frente >= e.d && this.dist - 26 < e.d + 30) {
        e.feito = true
        this.falta('BATESTE NO CARRO PARADO')
        this.vel = 0
        this.dist = e.d + 32
      }
    }

    // circular pela esquerda sem razão
    const perto = this.eventos.some((e) => e.tipo === 'obstaculo' && Math.abs(e.d - this.dist) < 150)
    if (this.faixa === 0 && !perto) this.esquerda += s
    else this.esquerda = 0
    if (this.esquerda > 3) {
      this.falta('CIRCULA PELA DIREITA')
      this.esquerda = -4
    }

    if (this.dist >= FIM) this.terminado = true
    if (this.tempo >= TEMPO_MAX && !this.terminado) {
      this.falta('NÃO CHEGASTE AO FIM')
      this.terminado = true
    }
  }

  private ecraY(d: number) {
    return Y_CARRO - (d - this.dist)
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, '#88d06a')
    r(ctx, 76, 0, 4, H, '#d6d8de')
    r(ctx, 164, 0, 4, H, '#d6d8de')
    r(ctx, 80, 0, 84, H, '#5c6070')
    const off = this.dist % 24
    for (let y = -24 + off; y < H; y += 24) r(ctx, 121, y, 2, 12, '#ece8c8')
    for (let y = -40 + (this.dist % 40); y < H; y += 40) {
      r(ctx, 20, y, 40, 30, '#f6e3c8')
      r(ctx, 184, y + 10, 40, 30, '#e2eaf6')
    }

    for (const e of this.eventos) {
      const y = this.ecraY(e.d)
      if (y < -40 || y > H + 40) continue
      if (e.tipo === 'passadeira') {
        for (let i = 0; i < 6; i++) r(ctx, 84 + i * 14, y - 6, 8, 12, '#f4f4ee')
        if (e.peao >= 0) {
          const px = 70 + e.peao * 104
          circulo(ctx, px, y - 8, 3, '#2d1b0e', K)
          r(ctx, px - 3, y - 5, 7, 8, '#e04848')
        }
      } else if (e.tipo === 'semaforo') {
        r(ctx, 80, y - 2, 84, 3, '#f4f4ee')
        r(ctx, 168, y - 30, 3, 30, '#3a4050')
        r(ctx, 164, y - 44, 11, 18, K)
        circulo(ctx, 169, y - 39, 3, e.verde ? '#5a2a2a' : '#f05050')
        circulo(ctx, 169, y - 31, 3, e.verde ? '#48d060' : '#2a5a30')
      } else {
        desenharCarroV(ctx, FAIXAS[1] - 7, y - 26, '#9aa0aa', -1)
        r(ctx, FAIXAS[1] - 9, y - 30, 18, 3, '#f0a030')
      }
    }

    desenharCarroV(ctx, Math.round(this.x) - 7, Y_CARRO, '#4a7ad0', -1)

    // painel
    const kmh = Math.round(this.vel / 2)
    circulo(ctx, 214, 22, 12, '#ffffff', '#e04848')
    textoContorno(ctx, '50', 214, 18, '#283040', 'center', 6)
    textoContorno(ctx, `${kmh} km/h`, 4, 4, kmh > 52 ? '#ff8080' : '#ffffff', 'left')
    textoContorno(ctx, `Faltas: ${this.faltas.length}`, 4, 18, this.faltas.length ? '#ff8080' : '#ffffff', 'left', 6)
    r(ctx, 4, H - 10, 60, 5, K)
    r(ctx, 5, H - 9, Math.round((Math.min(this.dist, FIM) / FIM) * 58), 3, '#f8e040')
    textoContorno(ctx, 'META', 68, H - 12, '#ffffff', 'left', 6)
    if (this.aviso) textoContorno(ctx, this.aviso.texto, W / 2, 60, '#ff8080', 'center', 6)
  }

  resultado() {
    const n = this.faltas.length
    const passou = n <= 1
    return {
      pontos: passou ? 1 : 0,
      valor: n,
      texto: passou ? `APROVADO! ${n === 0 ? 'Sem faltas' : '1 falta leve'}` : `Chumbou: ${n} faltas (${[...new Set(this.faltas)].join(', ').toLowerCase()})`,
    }
  }
}
