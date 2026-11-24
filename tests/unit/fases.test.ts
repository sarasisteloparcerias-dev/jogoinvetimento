import { describe, expect, it } from 'vitest'
import { avancarSemanaCidade, custoDespesas, mesada, MESADA, MESADA_EXTRA, novoEstadoCidade } from '../../src/game/cidade/economia'
import { novoJogador } from '../../src/game/data'
import { avancarSemana } from '../../src/game/engine'
import { avancarMes, custoTransportes, novoEstadoMercado, patrimonioM } from '../../src/game/mercado/economia'
import { mesDaEmpresa, novoNegocio, TSU_EMPRESA, type EstadoNegocio } from '../../src/game/negocio/economia'
import { passarNivel, requisitoNivel } from '../../src/game/niveis'
import { ANOS_REFORMA, avancarAno, novoEstadoReforma, poupancas } from '../../src/game/reforma/economia'
import type { EstadoReforma } from '../../src/game/reforma/economia'
import type { EstadoCidade } from '../../src/game/cidade/tipos'
import type { EstadoMercado } from '../../src/game/mercado/tipos'
import type { PlayerState } from '../../src/game/types'

const AV = { pele: '#f1c27d', cabelo: '#2d1b0e', roupa: '#e8743a' }

describe('Vila Moeda', () => {
  it('uma semana dá mesada e avança o calendário', () => {
    const s = novoJogador('Ana', AV)
    const { estado } = avancarSemana(s)
    expect(estado.week).toBe(s.week + 1)
    expect(estado.saldo).toBeGreaterThan(s.saldo)
  })

  it('o gato come 2 moedas por semana', () => {
    const s = novoJogador('Ana', AV)
    const sem = avancarSemana(s).estado.saldo
    const com = avancarSemana({ ...s, flags: [...s.flags, 'gato'] }).estado.saldo
    expect(sem - com).toBe(2)
  })

  it('só passa para A Cidade com o crachá Objetivo e 5 crachás', () => {
    const s = novoJogador('Ana', AV)
    expect(requisitoNivel('reino', { ...s, crachas: ['poupanca', 'juro', 'investidor', 'risco'] })!.ok).toBe(false)
    expect(requisitoNivel('reino', { ...s, crachas: ['poupanca', 'juro', 'investidor', 'risco', 'objetivo'] })!.ok).toBe(true)
  })
})

describe('A Cidade', () => {
  it('a mesada negociada e a bicicleta mudam as contas', () => {
    const s = novoEstadoCidade('Ana', AV)
    expect(mesada(s)).toBe(MESADA)
    expect(mesada({ ...s, flags: ['mesada_extra'] })).toBe(MESADA + MESADA_EXTRA)
    expect(custoDespesas({ ...s, flags: ['bicicleta'] })).toBeLessThan(custoDespesas(s))
    const depois = avancarSemanaCidade({ ...s, flags: ['mesada_extra'] }).estado
    expect(depois.semana).toBe(2)
  })
})

describe('O Mercado e A Casa', () => {
  it('um mês paga o salário e as despesas', () => {
    const s = novoEstadoMercado('Ana', AV)
    const { estado } = avancarMes(s)
    expect(estado.mes).toBe(2)
    expect(estado.movimentos.some((m) => m.texto.startsWith('Salário'))).toBe(true)
  })

  it('a bicicleta da Cidade baixa os transportes', () => {
    const s = novoEstadoMercado('Ana', AV)
    expect(custoTransportes({ ...s, flags: ['passado_bicicleta'] })).toBeLessThan(custoTransportes(s))
  })
})

describe('O Negócio', () => {
  const base = (): EstadoNegocio => ({
    ...novoNegocio('cafe', 10000, 11000),
    funcionarios: [{ id: 'a', nome: 'Rui', salario: 1000, produtividade: 950, perfil: '', ate: null }],
  })

  it('o IVA entrega-se no fim do trimestre', () => {
    let n = base()
    const ivas: number[] = []
    for (let mes = 1; mes <= 3; mes++) {
      const r = mesDaEmpresa(n, mes)
      ivas.push(r.relatorio.ivaEntregue)
      n = r.negocio
    }
    expect(ivas[0]).toBe(0)
    expect(ivas[1]).toBe(0)
    expect(ivas[2]).toBeGreaterThan(0)
  })

  it('em junho os salários contam a dobrar (subsídio de férias) e pagam TSU', () => {
    const maio = mesDaEmpresa(base(), 5).relatorio
    const junho = mesDaEmpresa(base(), 6).relatorio
    expect(junho.salarios).toBe(maio.salarios * 2)
    expect(junho.tsu).toBeCloseTo(junho.salarios * TSU_EMPRESA, 1)
  })

  it('o património conta a empresa', () => {
    const s = novoEstadoMercado('Ana', AV)
    expect(patrimonioM({ ...s, negocio: base() })).not.toBe(patrimonioM(s))
  })
})

describe('A Reforma', () => {
  it('tira primeiro do depósito e só depois dos investimentos', () => {
    const s: EstadoReforma = { ...novoEstadoReforma('Ana', AV), conta: 0, deposito: 50000, ppr: 0, investido: 100000, estilo: 2 }
    const { estado } = avancarAno(s)
    expect(estado.deposito).toBeLessThan(50000 * 1.02)
    expect(estado.investido).toBeGreaterThan(0)
  })

  it('a bolsa cai no 3.º ano e o jogo acaba aos 85', () => {
    let s = novoEstadoReforma('Ana', AV)
    let quedaAno3 = 0
    while (!s.gameOver) {
      const r = avancarAno(s)
      if (s.ano === 3) quedaAno3 = r.relatorio.retornoInvestido
      s = r.estado
    }
    expect(quedaAno3).toBeLessThan(0)
    expect(s.ano).toBe(ANOS_REFORMA + 1)
    expect(poupancas(s)).toBeGreaterThanOrEqual(0)
  })
})

describe('Passagem de fases', () => {
  it('a mesma personagem vai da Vila Moeda até à Reforma, levando o passado', () => {
    const vila: PlayerState = { ...novoJogador('Ana', AV), crachas: ['objetivo', 'ajudar'], flags: ['gato'] }
    const c = passarNivel('reino', vila)!
    expect(c.modo).toBe('cidade')
    const cidade = c.estado as EstadoCidade
    expect(cidade.flags).toContain('passado_gato')
    expect(cidade.pagamentos.some((p) => p.id === 'bolinhas')).toBe(true)

    const m = passarNivel('cidade', { ...cidade, flags: [...cidade.flags, 'bicicleta', 'mesada_extra'] })!
    const mercado = m.estado as EstadoMercado
    expect(mercado.flags).toEqual(expect.arrayContaining(['passado_gato', 'passado_bicicleta', 'passado_negociou']))
    expect(mercado.salarioBruto).toBeGreaterThan(novoEstadoMercado('x', AV).salarioBruto)

    const casa = passarNivel('mercado', mercado)!.estado as EstadoMercado
    expect(casa.nivel).toBe('casa')
    const neg = passarNivel('casa', casa)!.estado as EstadoMercado
    expect(neg.nivel).toBe('negocio')
    const r = passarNivel('negocio', { ...neg, negocio: novoNegocio('gelados', 5000, 13000) })!
    expect(r.modo).toBe('reforma')
    const reforma = r.estado as EstadoReforma
    expect(reforma.flags).toEqual(expect.arrayContaining(['passado_gato', 'passado_negocio_gelados']))
    expect(reforma.avatar.cabelo).toBe('#d8d8d8')
  })
})
