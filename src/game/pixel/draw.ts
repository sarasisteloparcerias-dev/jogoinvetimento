export type Paleta = Record<string, string>

export function criarCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  return { c, ctx }
}

/** Converte uma grelha de caracteres (1 caractere = 1 píxel) numa imagem. '.' e caracteres sem cor ficam transparentes. */
export function grelha(linhas: string[], paleta: Paleta): HTMLCanvasElement {
  const h = linhas.length
  const w = linhas[0].length
  const { c, ctx } = criarCanvas(w, h)
  desenharGrelha(ctx, linhas, paleta, 0, 0)
  return c
}

export function desenharGrelha(ctx: CanvasRenderingContext2D, linhas: string[], paleta: Paleta, ox: number, oy: number) {
  for (let y = 0; y < linhas.length; y++) {
    const linha = linhas[y]
    for (let x = 0; x < linha.length; x++) {
      const cor = paleta[linha[x]]
      if (!cor) continue
      ctx.fillStyle = cor
      ctx.fillRect(ox + x, oy + y, 1, 1)
    }
  }
}

export function espelhar(src: HTMLCanvasElement): HTMLCanvasElement {
  const { c, ctx } = criarCanvas(src.width, src.height)
  ctx.translate(src.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(src, 0, 0)
  return c
}

export function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string) {
  ctx.fillStyle = cor
  ctx.fillRect(x, y, w, h)
}

/** Clareia (f > 0) ou escurece (f < 0) uma cor hexadecimal. */
export function tom(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const canais = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)),
  )
  return '#' + canais.map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function misturar(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canais = [16, 8, 0].map((s) => Math.round(((na >> s) & 255) * (1 - t) + ((nb >> s) & 255) * t))
  return '#' + canais.map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Número pseudo-aleatório determinístico a partir de coordenadas (para variar relva/terra sem mudar a cada frame). */
export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Letras de 3x5 píxeis (o N precisa de 4 de largura para não parecer um M). */
const FONTE_3x5: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  E: ['111', '100', '110', '100', '111'],
  J: ['001', '001', '001', '101', '010'],
  L: ['100', '100', '100', '100', '111'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['010', '101', '101', '101', '010'],
  S: ['011', '100', '010', '001', '110'],
}

/** Texto minúsculo 3x5 (para letreiros dos edifícios, como o "MART" dos jogos de GBA). */
export function textoMini(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, cor: string) {
  ctx.fillStyle = cor
  let cx = x
  for (const letra of texto) {
    const g = FONTE_3x5[letra]
    if (!g) continue
    for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < g[gy].length; gx++) if (g[gy][gx] === '1') ctx.fillRect(cx + gx, y + gy, 1, 1)
    cx += g[0].length + 1
  }
}

export function larguraTextoMini(texto: string) {
  return [...texto].reduce((w, l) => w + (FONTE_3x5[l]?.[0].length ?? 0) + 1, 0) - 1
}
