export type TipoMiniJogo =
  | 'futebol'
  | 'bicicleta'
  | 'gelado'
  | 'cafe'
  | 'supermercado'
  | 'ginasio'
  | 'entregas'
  | 'babysitting'
  | 'explicacoes'
  | 'emails'
  | 'bowling'

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
  /** Dinheiro ganho no mini-jogo (só nos trabalhos, ex. gorjetas no Café). */
  valor?: number
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

/** Texto com contorno partido em várias linhas para caber numa largura. Devolve onde acabou (y). */
export function textoQuebrado(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, largura: number, cor: string, tamanho = 8, entrelinha = 11) {
  ctx.font = `${tamanho}px 'Press Start 2P'`
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(' ')) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (atual && ctx.measureText(tentativa).width > largura) {
      linhas.push(atual)
      atual = palavra
    } else atual = tentativa
  }
  if (atual) linhas.push(atual)
  linhas.forEach((l, i) => textoContorno(ctx, l, x, y + i * entrelinha, cor, 'left', tamanho))
  return y + linhas.length * entrelinha
}
