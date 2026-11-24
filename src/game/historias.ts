import type { CtxJogo, EstadoBase } from './modo'

/**
 * Histórias com capítulos: uma personagem por fase cuja vida avança com o tempo do jogo.
 * Cada capítulo só abre a partir de uma certa semana/mês/ano, e as escolhas ficam registadas
 * (os capítulos seguintes lembram-se do que disseste).
 */

export interface Capitulo<S extends EstadoBase> {
  /** A partir de que "vez" (semana, mês, ano) este capítulo abre. */
  aPartirDe: number
  falas: (s: S) => string[]
  escolha?: {
    pergunta: string
    opcoes: string[]
    /** O que acontece com cada opção (pode mudar o estado); devolve a resposta da personagem. */
    efeito: (i: number, ctx: CtxJogo<S>) => string[] | Promise<string[]>
  }
}

export interface Historia<S extends EstadoBase> {
  id: string
  /** Id do NPC que conta a história. */
  npc: string
  quem: string
  titulo: string
  tempo: (s: S) => number
  capitulos: Capitulo<S>[]
  /** Enquanto o próximo capítulo não abre. */
  esperar: string[]
  /** Depois do último capítulo. */
  fim: (s: S) => string[]
}

export function capitulosVistos(s: EstadoBase, id: string) {
  let n = 0
  while (s.flags.includes(`hist_${id}_${n + 1}`)) n++
  return n
}

/** A escolha feita num capítulo (ou -1). */
export function escolheu(s: EstadoBase, id: string, capitulo: number) {
  const f = s.flags.find((x) => x.startsWith(`hist_${id}_esc_${capitulo}_`))
  return f ? Number(f.split('_').pop()) : -1
}

/** Há um capítulo novo à espera? (mostra um "!" por cima da personagem) */
export function temNovidade<S extends EstadoBase>(s: S, h: Historia<S>) {
  const n = capitulosVistos(s, h.id)
  const c = h.capitulos[n]
  return !!c && h.tempo(s) >= c.aPartirDe
}

export async function contarHistoria<S extends EstadoBase>(ctx: CtxJogo<S>, h: Historia<S>) {
  const s = ctx.estado()
  const n = capitulosVistos(s, h.id)
  const c = h.capitulos[n]
  if (!c) return ctx.say(h.fim(s), h.quem)
  if (h.tempo(s) < c.aPartirDe) return ctx.say(h.esperar, h.quem)
  await ctx.say(c.falas(s), h.quem)
  const flags = [`hist_${h.id}_${n + 1}`]
  if (c.escolha) {
    const i = await ctx.ask(c.escolha.pergunta, c.escolha.opcoes, h.quem)
    const atual = ctx.estado()
    ctx.definir({ ...atual, flags: [...atual.flags, `hist_${h.id}_esc_${n}_${i}`] })
    const resposta = await c.escolha.efeito(i, ctx)
    if (resposta.length) await ctx.say(resposta, h.quem)
  }
  const depois = ctx.estado()
  ctx.definir({ ...depois, flags: [...depois.flags, ...flags] })
  if (n + 1 === h.capitulos.length) await ctx.say(`Fim da história: ${h.titulo}.`)
}
