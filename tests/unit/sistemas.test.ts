import { describe, expect, it } from 'vitest'
import { capitulosVistos, contarHistoria, escolheu, temNovidade } from '../../src/game/historias'
import { HISTORIA_TOMAS } from '../../src/game/historiasFases'
import { novoJogador } from '../../src/game/data'
import type { CtxJogo } from '../../src/game/modo'
import type { PlayerState } from '../../src/game/types'
import { deslocar } from '../../src/game/variacao'
import { Orcamento } from '../../src/game/minijogos/orcamento'
import { Regatear } from '../../src/game/minijogos/regatear'
import { Bolsa } from '../../src/game/minijogos/bolsa'
import type { TeclaJogo } from '../../src/game/minijogos/tipos'

const AV = { pele: '#f1c27d', cabelo: '#2d1b0e', roupa: '#e8743a' }

/** Um contexto de jogo falso: responde sempre à primeira opção e guarda as falas. */
function ctxFalso(s0: PlayerState, resposta = 0) {
  let s = s0
  const falas: string[] = []
  const ctx = {
    say: async (t: string | string[]) => void falas.push(...(Array.isArray(t) ? t : [t])),
    ask: async () => resposta,
    estado: () => s,
    definir: (n: PlayerState) => void (s = n),
  } as unknown as CtxJogo<PlayerState>
  return { ctx, falas, estado: () => s }
}

describe('Histórias', () => {
  it('os capítulos abrem com o tempo e lembram-se das escolhas', async () => {
    const f = ctxFalso({ ...novoJogador('Ana', AV), week: 1 })
    await contarHistoria(f.ctx, HISTORIA_TOMAS)
    expect(capitulosVistos(f.estado(), 'tomas')).toBe(1)
    expect(escolheu(f.estado(), 'tomas', 0)).toBe(0)
    // o capítulo 2 só abre na semana 5
    expect(temNovidade(f.estado(), HISTORIA_TOMAS)).toBe(false)
    await contarHistoria(f.ctx, HISTORIA_TOMAS)
    expect(capitulosVistos(f.estado(), 'tomas')).toBe(1)
    const g = ctxFalso({ ...f.estado(), week: 5 })
    expect(temNovidade(g.estado(), HISTORIA_TOMAS)).toBe(true)
    await contarHistoria(g.ctx, HISTORIA_TOMAS)
    expect(g.falas.join(' ')).toContain('55 moedas')
  })
})

describe('Acontecimentos que mudam de jogo para jogo', () => {
  it('sem semente fica na altura original; com semente muda dentro dos limites', () => {
    const s = novoJogador('Ana', AV)
    expect(deslocar(s, 'festa', 5, 0, 3)).toBe(5)
    const alturas = new Set<number>()
    for (let i = 1; i < 60; i++) {
      const v = deslocar({ ...s, flags: [`semente_${i}`] }, 'festa', 5, 0, 3)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(8)
      alturas.add(v)
    }
    expect(alturas.size).toBeGreaterThan(1)
  })
})

/** Carrega numa tecla durante um frame. */
function tecla(jogo: { update(dt: number, t: { seguras: Set<TeclaJogo>; premidas: Set<TeclaJogo> }): void }, t?: TeclaJogo, dt = 16) {
  jogo.update(dt, { seguras: new Set(t ? [t] : []), premidas: new Set(t ? [t] : []) })
}

describe('Mini-jogos novos', () => {
  it('orçamento: pôr tudo no orçamento não deixa poupar', () => {
    const j = new Orcamento()
    for (let i = 0; i < 400 && !j.terminado; i++) tecla(j, i % 2 ? undefined : 'A', 200)
    expect(j.terminado).toBe(true)
    expect(j.resultado().texto).toContain('0 de 3')
  })

  it('regatear: aceitar sempre o preço não poupa nada', () => {
    const j = new Regatear()
    for (let i = 0; i < 200 && !j.terminado; i++) tecla(j, i % 2 ? undefined : 'B', 400)
    expect(j.terminado).toBe(true)
    expect(j.resultado().pontos).toBe(0)
  })

  it('bolsa: acaba ao fim do tempo e compara com comprar e esperar', () => {
    const j = new Bolsa()
    tecla(j, 'A')
    for (let i = 0; i < 2000 && !j.terminado; i++) tecla(j, undefined, 50)
    expect(j.terminado).toBe(true)
    expect(j.resultado().texto).toContain('Só comprar e esperar')
  })
})
