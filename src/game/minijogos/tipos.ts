export type TipoMiniJogo = 'futebol' | 'bicicleta' | 'gelado'

export type TeclaJogo = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B'

export interface Teclas {
  /** Teclas a ser carregadas neste momento. */
  seguras: Set<TeclaJogo>
  /** Teclas que foram carregadas desde o último frame (cada toque conta uma vez). */
  premidas: Set<TeclaJogo>
}

export interface ResultadoMiniJogo {
  pontos: number
  /** Frase curta para o ecrã final, ex. "3 golos em 5". */
  texto: string
}

export interface MiniJogo {
  titulo: string
  instrucoes: string[]
  terminado: boolean
  update(dt: number, t: Teclas): void
  render(ctx: CanvasRenderingContext2D): void
  resultado(): ResultadoMiniJogo
}

export const W = 240
export const H = 160

/** Texto com contorno (legível por cima de qualquer fundo), alinhado ao centro. */
export function textoContorno(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  cor: string,
  alinhar: CanvasTextAlign = 'center',
  tamanho = 8,
) {
  ctx.font = `${tamanho}px 'Press Start 2P'`
  ctx.textAlign = alinhar
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#283040'
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(texto, x + dx, y + dy)
  ctx.fillStyle = cor
  ctx.fillText(texto, x, y)
}
