import { clamp } from '../data'
import type { EstadoBase } from '../modo'
import type { EstadoMercado } from '../mercado/tipos'
import { carteiraM, round2 } from '../mercado/economia'
import { valorLiquidoEmpresa } from '../negocio/economia'
import type { AvatarConfig, HistoryPoint } from '../types'

export { euros, round2 } from '../mercado/economia'

/**
 * "A Reforma": a fase final. Passaram 35 anos; tens 65 e voltas à Vila Moeda.
 * Cada noite passa um ano, até aos 85: pensão, despesas, levantamentos das poupanças,
 * inflação e uma queda da bolsa logo no início. Valores simplificados.
 */

export const ANOS_REFORMA = 20
export const IDADE_REFORMA = 65
export const ANOS_ATE_REFORMA = 35
export const RENDA_ANUAL = 6600
export const APOIO_ANUAL = 4800
export const TAXA_DEPOSITO = 0.015
export const TAXA_PPR = 0.03
export const RETORNO_MEDIO = 0.06
/** Quanto se pode levantar por ano sem esgotar as poupanças (a "regra dos 4%", com folga). */
export const LEVANTAMENTO_SEGURO = 0.045

export const ESTILOS = [
  { nome: 'SIMPLES', anual: 16000, texto: 'Casa, comida, contas e pouco mais.' },
  { nome: 'CONFORTÁVEL', anual: 21000, texto: 'Sem apertos, com jantares fora e prendas para os netos.' },
  { nome: 'COM VIAGENS', anual: 27000, texto: 'Viajar todos os anos e não dizer que não a nada.' },
] as const

export interface Projecao {
  /** Idade e dinheiro com que se chegou ao fim das outras fases. */
  idade: number
  inicial: number
  deposito: number
  investido: number
  ppr: number
  empresa: number
  plano: number
  /** O mesmo dinheiro, mas tudo parado no depósito. */
  soDeposito: number
  /** 100€ por mês num ETF, a começar aos 20 ou aos 30. */
  cedo: number
  tarde: number
}

export interface RelatorioAno {
  idade: number
  pensao: number
  despesas: number
  levantado: number
  /** O que ficou por pagar (quando as poupanças acabaram). */
  faltou: number
  retornoInvestido: number
  inflacao: number
  vendeuInvestimentos: boolean
  extras: { texto: string; valor: number }[]
}

export interface EstadoReforma extends EstadoBase {
  /** Ano da reforma (1 = 65 anos). */
  ano: number
  conta: number
  deposito: number
  investido: number
  ppr: number
  /** Pensão líquida por mês (recebe-se 14 vezes por ano). */
  pensaoMes: number
  estilo: 0 | 1 | 2
  casaPropria: boolean
  valorCasa: number
  /** Quanto custam as coisas comparado com o primeiro ano. */
  indice: number
  stats: { saude: number; relacoes: number }
  extrasAno: { texto: string; valor: number }[]
  apoio: boolean
  anosSustentaveis: number
  semDinheiro: boolean
  ginastica: number
  projecao: Projecao
  ultimo: RelatorioAno | null
  history: HistoryPoint[]
}

export const idadeDe = (s: EstadoReforma) => IDADE_REFORMA + s.ano - 1

export function poupancas(s: EstadoReforma) {
  return round2(s.conta + s.deposito + s.ppr + s.investido)
}

export function patrimonioR(s: EstadoReforma) {
  return round2(poupancas(s) + (s.casaPropria ? s.valorCasa : 0))
}

/** O que a pensão não cobre num ano normal (sem imprevistos). */
export function despesasAno(s: EstadoReforma) {
  const idade = idadeDe(s)
  return round2(
    (ESTILOS[s.estilo].anual + (s.casaPropria ? 0 : RENDA_ANUAL) + (s.apoio ? APOIO_ANUAL : 0) + (idade >= 78 ? 1200 : 0)) * s.indice,
  )
}

export function pensaoAno(s: EstadoReforma) {
  return round2(s.pensaoMes * 14)
}

export function faltaPorAno(s: EstadoReforma) {
  return round2(Math.max(0, despesasAno(s) - pensaoAno(s)))
}

/** Taxa de levantamento: quanto das poupanças se gasta por ano. */
export function taxaLevantamento(s: EstadoReforma) {
  const p = poupancas(s)
  return p > 0 ? faltaPorAno(s) / p : 1
}

function gauss() {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** A bolsa conta uma história: cai logo no 3.º ano e recupera depois. */
function retornoDoAno(ano: number) {
  if (ano === 3) return -0.28
  if (ano === 4) return 0.16
  if (ano === 5) return 0.12
  return Math.max(-0.2, Math.min(0.3, RETORNO_MEDIO + 0.12 * gauss()))
}

/** Um ano de reforma. */
export function avancarAno(antes: EstadoReforma): { estado: EstadoReforma; relatorio: RelatorioAno } {
  const s: EstadoReforma = { ...antes, stats: { ...antes.stats } }
  const idade = idadeDe(s)
  const pensao = pensaoAno(s)
  const extras = s.extrasAno
  const despesas = round2(despesasAno(s) + extras.reduce((t, e) => t + e.valor, 0))
  const poupancaInicio = poupancas(s) - s.conta
  s.conta = round2(s.conta + pensao - despesas)

  // o que faltar sai das poupanças: primeiro o depósito, depois o PPR e só no fim os investimentos
  let levantado = 0
  let vendeuInvestimentos = false
  for (const onde of ['deposito', 'ppr', 'investido'] as const) {
    if (s.conta >= 0) break
    const tira = Math.min(s[onde], -s.conta)
    if (tira <= 0) continue
    s[onde] = round2(s[onde] - tira)
    s.conta = round2(s.conta + tira)
    levantado += tira
    if (onde === 'investido') vendeuInvestimentos = true
  }
  let faltou = 0
  if (s.conta < 0) {
    faltou = -s.conta
    s.conta = 0
    s.semDinheiro = true
    s.stats.saude = clamp(s.stats.saude - 8)
    s.stats.relacoes = clamp(s.stats.relacoes - 4)
  }
  if (poupancaInicio > 0 && levantado <= poupancaInicio * LEVANTAMENTO_SEGURO) s.anosSustentaveis += 1

  const retorno = retornoDoAno(s.ano)
  const inflacao = s.ano === 2 ? 0.06 : 0.025
  s.deposito = round2(s.deposito * (1 + TAXA_DEPOSITO))
  s.ppr = round2(s.ppr * (1 + TAXA_PPR))
  s.investido = round2(s.investido * (1 + retorno))
  s.valorCasa = round2(s.valorCasa * 1.02)
  s.indice = s.indice * (1 + inflacao)
  // a pensão é atualizada, mas um pouco abaixo da inflação
  s.pensaoMes = round2(s.pensaoMes * (1 + (s.ano === 2 ? 0.03 : inflacao - 0.005)))
  s.stats.saude = clamp(s.stats.saude - (idade >= 75 ? 3 : 2))
  s.stats.relacoes = clamp(s.stats.relacoes - 2)
  s.extrasAno = []
  s.ano += 1
  s.history = [...s.history, { week: idade + 1, saldo: s.conta, poupanca: round2(s.deposito + s.ppr), investimento: s.investido }]
  s.gameOver = s.ano > ANOS_REFORMA
  const relatorio: RelatorioAno = { idade, pensao, despesas, levantado: round2(levantado), faltou: round2(faltou), retornoInvestido: retorno, inflacao, vendeuInvestimentos, extras }
  return { estado: { ...s, ultimo: relatorio }, relatorio }
}

const fv = (v: number, taxa: number, anos: number) => v * Math.pow(1 + taxa, anos)
const fvAnuidade = (anual: number, taxa: number, anos: number) => (taxa === 0 ? anual * anos : (anual * (Math.pow(1 + taxa, anos) - 1)) / taxa)
/** Poupança base que se assume ao longo dos 35 anos (100€ por mês para o depósito). */
const POUPANCA_BASE_ANUAL = 1200

/** O que acontece em 35 anos ao dinheiro com que se acabou a vida ativa no jogo. */
export function projetar(deposito0: number, investido0: number, ppr0: number, empresa: number, plano: number, idade = 30): Projecao {
  const n = ANOS_ATE_REFORMA
  const deposito = fv(deposito0, TAXA_DEPOSITO, n) + fvAnuidade(POUPANCA_BASE_ANUAL, TAXA_DEPOSITO, n)
  const investido = fv(investido0, RETORNO_MEDIO, n) + fvAnuidade(plano * 12, RETORNO_MEDIO, n) + fv(empresa, RETORNO_MEDIO, 5)
  const ppr = fv(ppr0, TAXA_PPR, n)
  const soDeposito = fv(deposito0 + investido0 + ppr0 + empresa, TAXA_DEPOSITO, n) + fvAnuidade(POUPANCA_BASE_ANUAL + plano * 12, TAXA_DEPOSITO, n)
  return {
    idade,
    inicial: round2(deposito0 + investido0 + ppr0),
    deposito: round2(deposito),
    investido: round2(investido),
    ppr: round2(ppr),
    empresa: round2(empresa),
    plano,
    soDeposito: round2(soDeposito),
    cedo: round2(fvAnuidade(1200, RETORNO_MEDIO, 45)),
    tarde: round2(fvAnuidade(1200, RETORNO_MEDIO, 35)),
  }
}

function base(name: string, avatar: AvatarConfig, p: Projecao, pensaoMes: number, casaPropria: boolean, valorCasa: number): EstadoReforma {
  const conta = 2000
  return {
    name,
    avatar,
    crachas: [],
    flags: [],
    gameOver: false,
    ano: 1,
    conta,
    deposito: p.deposito,
    investido: p.investido,
    ppr: p.ppr,
    pensaoMes: round2(pensaoMes),
    estilo: 1,
    casaPropria,
    valorCasa: round2(valorCasa),
    indice: 1,
    stats: { saude: 70, relacoes: 60 },
    extrasAno: [],
    apoio: false,
    anosSustentaveis: 0,
    semDinheiro: false,
    ginastica: 0,
    projecao: p,
    ultimo: null,
    history: [{ week: IDADE_REFORMA, saldo: conta, poupanca: round2(p.deposito + p.ppr), investimento: p.investido }],
  }
}

/** Começar diretamente na Reforma (para quem já passou as outras fases e quer repetir). */
export function novoEstadoReforma(name: string, avatar: AvatarConfig): EstadoReforma {
  return base(name, { ...avatar, cabelo: '#d8d8d8' }, projetar(6000, 3000, 1000, 15000, 100), 1050, true, 210000)
}

/** Da vida ativa (fim d'O Negócio) para a reforma, 35 anos depois. */
export function daVidaAtivaParaReforma(s: EstadoMercado): EstadoReforma {
  const n = s.negocio
  let empresa = 0
  if (n?.aberto) empresa = Math.max(0, valorLiquidoEmpresa(n)) + Math.max(0, n.lucroAno) * 4
  const p = projetar(Math.max(0, s.conta + s.poupanca - s.divida), carteiraM(s), s.ppr, empresa, s.planoMensal)
  const salario = n ? n.salarioGerente : s.salarioBruto
  const pensao = Math.max(650, Math.min(1600, 520 + salario * 0.45 + (n && n.lucroAno > 0 ? 120 : 0)))
  const casa = s.hipoteca ? fv(s.hipoteca.valorCasa, 0.02, ANOS_ATE_REFORMA) : 0
  return base(s.name, { ...s.avatar, cabelo: '#d8d8d8' }, p, pensao, !!s.hipoteca, casa)
}
