import { beforeEach, describe, expect, it } from 'vitest'
import { baralhar, lerDesafio, limparDesafio, melhoria, PERGUNTAS, registarDesafio } from '../../src/game/desafio'
import { FICHAS, TEMAS_REFERENCIAL } from '../../src/game/escola'

/** localStorage em memória (os testes correm em Node). */
function armazenamento() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size
    },
  }
}

describe('fichas para escolas', () => {
  it('há uma ficha para cada fase, com temas do Referencial', () => {
    for (const modo of ['reino', 'cidade', 'mercado', 'casa', 'negocio', 'reforma'] as const) {
      const f = FICHAS[modo]
      expect(f.referencial.length).toBeGreaterThan(0)
      for (const t of f.referencial) expect(TEMAS_REFERENCIAL).toContain(t)
      expect(f.objetivos.length).toBeGreaterThan(2)
      expect(f.conversa.length).toBe(3)
    }
  })

  it('todos os temas do Referencial aparecem em pelo menos uma fase', () => {
    const cobertos = new Set(Object.values(FICHAS).flatMap((f) => f.referencial))
    expect([...cobertos].sort()).toEqual([...TEMAS_REFERENCIAL].sort())
  })
})

describe('desafio do dinheiro', () => {
  beforeEach(() => {
    ;(globalThis as { localStorage?: unknown }).localStorage = armazenamento()
  })

  it('10 perguntas por nível, cada uma com 3 opções diferentes e uma certa', () => {
    for (const lista of Object.values(PERGUNTAS)) {
      expect(lista).toHaveLength(10)
      for (const p of lista) {
        expect(new Set(p.opcoes).size).toBe(3)
        expect([0, 1, 2]).toContain(p.certa)
        expect(TEMAS_REFERENCIAL).toContain(p.tema)
        expect(p.explicacao.length).toBeGreaterThan(20)
      }
    }
  })

  it('a primeira vez conta como antes e as seguintes como depois', () => {
    expect(registarDesafio('jovem', { acertos: 4, total: 10, data: '2026-11-01' })).toBe('antes')
    expect(registarDesafio('jovem', { acertos: 7, total: 10, data: '2026-11-08' })).toBe('depois')
    expect(registarDesafio('jovem', { acertos: 9, total: 10, data: '2026-11-15' })).toBe('depois')
    const r = lerDesafio().jovem
    expect(r?.antes?.acertos).toBe(4)
    expect(r?.depois?.acertos).toBe(9)
    expect(melhoria(r)).toBe(50)
    expect(lerDesafio().maior).toBeUndefined()
    limparDesafio()
    expect(lerDesafio()).toEqual({})
  })

  it('baralhar mantém os mesmos elementos', () => {
    const l = [1, 2, 3, 4, 5]
    expect(baralhar(l).sort()).toEqual(l)
    expect(melhoria(undefined)).toBeNull()
  })
})
