import { r } from '../pixel/draw'
import type { FramesPersonagem } from '../pixel/sprites'
import type { AvatarConfig } from '../types'
import { H, W, textoContorno, type MiniJogo, type Teclas } from './tipos'

const DURACAO = 30
const EXERCICIOS = ['SUPINO', 'AGACHAMENTO', 'PESO MORTO', 'REMO']
const K = '#283040'

/** Treino no ginásio: carrega em A quando o ponteiro está na zona verde para fazer uma repetição. */
export class Ginasio implements MiniJogo {
  titulo = 'TREINO NO GINÁSIO'
  instrucoes = ['A: levantar quando o ponteiro', 'estiver na zona VERDE.', 'Cada 4 repetições muda o exercício.']
  terminado = false
  private tempo = 0
  private ponteiro = 0
  private sentido = 1
  private reps = 0
  private falhas = 0
  private sequencia = 0
  private melhor = 0
  private levantar = 0
  /** Depois de falhar, os braços precisam de um instante: carregar sem parar não resulta. */
  private bloqueio = 0
  private aviso: { texto: string; t: number; cor: string } | null = null
  private frames: FramesPersonagem

  constructor(avatar: AvatarConfig, sprites: (a: AvatarConfig) => FramesPersonagem) {
    this.frames = sprites(avatar)
  }

  /** A zona verde vai ficando mais estreita e o ponteiro mais rápido. */
  private get zona() {
    const larg = Math.max(0.12, 0.3 - this.reps * 0.012)
    return { ini: 0.5 - larg / 2, fim: 0.5 + larg / 2 }
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    this.tempo += s
    const vel = 0.9 + this.reps * 0.05
    this.ponteiro += this.sentido * vel * s
    if (this.ponteiro > 1 || this.ponteiro < 0) {
      this.sentido *= -1
      this.ponteiro = Math.max(0, Math.min(1, this.ponteiro))
    }
    if (this.levantar > 0) this.levantar -= s
    if (this.bloqueio > 0) this.bloqueio -= s
    if (this.aviso) {
      this.aviso.t -= s
      if (this.aviso.t <= 0) this.aviso = null
    }
    if (teclas.premidas.has('A') && this.levantar <= 0.2 && this.bloqueio <= 0) {
      const z = this.zona
      if (this.ponteiro >= z.ini && this.ponteiro <= z.fim) {
        this.reps++
        this.sequencia++
        this.melhor = Math.max(this.melhor, this.sequencia)
        this.levantar = 0.45
        const perfeito = Math.abs(this.ponteiro - 0.5) < 0.03
        this.aviso = { texto: perfeito ? 'PERFEITO!' : this.reps % 4 === 0 ? 'EXERCÍCIO NOVO!' : 'BOA!', t: 0.6, cor: perfeito ? '#f8e040' : '#80f080' }
      } else {
        this.falhas++
        this.sequencia = 0
        this.bloqueio = 0.7
        this.aviso = { texto: 'FALHOU!', t: 0.6, cor: '#ff8080' }
      }
    }
    if (this.tempo >= DURACAO) this.terminado = true
  }

  render(ctx: CanvasRenderingContext2D) {
    // sala do ginásio
    r(ctx, 0, 0, W, H, '#efe8fa')
    for (let x = 0; x < W; x += 20) r(ctx, x, 0, 1, 100, '#e2d8f2')
    r(ctx, 0, 100, W, H - 100, '#4a4e5e')
    for (let x = 0; x < W; x += 24) r(ctx, x, 100, 1, H - 100, '#3a3e4e')
    r(ctx, 160, 18, 70, 46, K)
    r(ctx, 162, 20, 66, 42, '#bfe6fa')
    r(ctx, 194, 20, 2, 42, K)

    // personagem com a barra
    const img = this.frames.down[0]
    const alt = 64
    const larg = Math.round((alt * img.width) / img.height)
    const x = 80 - larg / 2
    const y = 104 - alt
    ctx.drawImage(img, x, y, larg, alt)
    const sobe = this.levantar > 0 ? Math.sin((this.levantar / 0.45) * Math.PI) : 0
    const by = Math.round(y + 26 - sobe * 22)
    r(ctx, 40, by, 80, 3, K)
    for (const px of [40, 112]) {
      r(ctx, px, by - 6, 8, 15, K)
      r(ctx, px + 1, by - 5, 6, 13, '#e04848')
    }

    // barra de força
    if (this.bloqueio > 0) textoContorno(ctx, 'RESPIRA...', 180, 100, '#ffffff', 'center', 6)
    const bx = 130
    const bw = 100
    const bY = 116
    const z = this.zona
    r(ctx, bx - 1, bY - 1, bw + 2, 14, K)
    r(ctx, bx, bY, bw, 12, '#d8dce6')
    r(ctx, bx + Math.round(z.ini * bw), bY, Math.round((z.fim - z.ini) * bw), 12, '#48c060')
    r(ctx, bx + Math.round(0.47 * bw), bY, Math.round(0.06 * bw), 12, '#f8e040')
    const px = bx + Math.round(this.ponteiro * bw)
    r(ctx, px - 1, bY - 4, 3, 20, K)
    r(ctx, px, bY - 3, 1, 18, '#ffffff')

    textoContorno(ctx, EXERCICIOS[Math.floor(this.reps / 4) % EXERCICIOS.length], bx + bw / 2, bY + 18, '#ffffff', 'center', 6)
    textoContorno(ctx, `${this.reps} reps`, 4, 4, '#ffffff', 'left')
    textoContorno(ctx, `${Math.max(0, Math.ceil(DURACAO - this.tempo))}s`, W - 4, 4, '#ffffff', 'right')
    if (this.aviso) textoContorno(ctx, this.aviso.texto, 80, 20, this.aviso.cor, 'center')
  }

  resultado() {
    return {
      pontos: this.reps,
      texto: `${this.reps} repetições · melhor série ${this.melhor} · ${this.falhas} ${this.falhas === 1 ? 'falha' : 'falhas'}`,
    }
  }
}
