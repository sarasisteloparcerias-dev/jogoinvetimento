import { round2 } from '../cidade/economia'
import { clamp } from '../data'
import type { AvatarConfig } from '../types'
import { PROFISSOES } from './profissoes'
import type { AtivoM, Casa, EstadoMercado, Noticia, StatsAdulto } from './tipos'

export { euros, round2 } from '../cidade/economia'

export const MESES = 24
export const META_CASA = 8000
export const SALARIO_INICIAL = 1300
/** Valores simplificados: na vida real a retenção de IRS depende do salário e da família. */
export const TAXA_SS = 0.11
export const TAXA_IRS = 0.11
export const IMPOSTO_CAPITAL = 0.28
export const COMISSAO = 1
export const JURO_CARTAO_MES = 0.016
export const PAGAMENTO_TURNO = 40
export const MAX_TURNOS = 2
const INFLACAO_MES = 0.0025
const MULTA_DESCOBERTO = 20

export const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function nomeMes(mes: number) {
  const m = Math.min(mes, MESES)
  return `${NOMES_MES[(m - 1) % 12]} · ano ${m > 12 ? 2 : 1}`
}

export const CASAS: Record<Casa, { nome: string; renda: number; contas: number; descricao: string }> = {
  pais: { nome: 'Casa dos pais', renda: 150, contas: 0, descricao: 'Ajudas em casa com 150€. Poupas muito, mas tens menos independência.' },
  quarto: { nome: 'Quarto partilhado', renda: 380, contas: 0, descricao: 'Um quarto num apartamento com mais duas pessoas. Contas incluídas.' },
  t1: { nome: 'T1 sozinho', renda: 620, contas: 70, descricao: 'Um apartamento só para ti. Mais espaço e sossego, mais caro.' },
}

export interface AtivoMercado {
  id: AtivoM
  nome: string
  curto: string
  tipo: string
  risco: number
  preco0: number
  media: number
  volatilidade: number
  descricao: string
}

export const ATIVOS_M: AtivoMercado[] = [
  { id: 'obrig', nome: 'ETF Obrigações Europa', curto: 'OBRIGAÇÕES', tipo: 'ETF de obrigações', risco: 1, preco0: 50, media: 0.003, volatilidade: 0.01, descricao: 'Empréstimos a governos e empresas europeias. Rende pouco, mexe pouco.' },
  { id: 'etf', nome: 'ETF Mundo', curto: 'ETF MUNDO', tipo: 'ETF de ações', risco: 3, preco0: 80, media: 0.007, volatilidade: 0.04, descricao: 'Milhares de empresas de todo o mundo num só produto, com custos baixos.' },
  { id: 'pixel', nome: 'PixelSoft', curto: 'PIXELSOFT', tipo: 'Ação (tecnologia)', risco: 4, preco0: 40, media: 0.01, volatilidade: 0.09, descricao: 'Empresa de videojogos. Cresce depressa, mas oscila muito.' },
  { id: 'brisa', nome: 'Refrescos Brisa', curto: 'BRISA', tipo: 'Ação (bebidas)', risco: 3, preco0: 30, media: 0.006, volatilidade: 0.06, descricao: 'Fábrica de refrigerantes. Estável... enquanto nada correr mal.' },
  { id: 'eco', nome: 'EcoVolt', curto: 'ECOVOLT', tipo: 'Ação (energia)', risco: 4, preco0: 25, media: 0.008, volatilidade: 0.08, descricao: 'Energia solar e eólica. Depende muito de apoios e de modas.' },
  { id: 'lua', nome: 'LuaCoin', curto: 'LUACOIN', tipo: 'Criptomoeda', risco: 5, preco0: 10, media: 0.01, volatilidade: 0.2, descricao: 'Moeda digital sem empresa por trás. O preço é só procura e especulação.' },
]

export const ATIVO_M = Object.fromEntries(ATIVOS_M.map((a) => [a.id, a])) as Record<AtivoM, AtivoMercado>
const IDS = ATIVOS_M.map((a) => a.id)
export const ACOES_M: AtivoM[] = ['etf', 'pixel', 'brisa', 'eco']

type Choque = Partial<Record<AtivoM, number>>
interface NoticiaDef {
  titulo: string
  texto: string
  choque: Choque
}

const NOTICIAS_FIXAS: Record<number, NoticiaDef> = {
  2: { titulo: 'EcoVolt ganha grande contrato', texto: 'Vai construir três parques eólicos.', choque: { eco: 0.08 } },
  3: { titulo: 'LuaCoin sobe 40%', texto: 'Nas redes só se fala dela.', choque: { lua: 0.4 } },
  4: { titulo: 'Euforia: LuaCoin +50%', texto: 'Há quem peça empréstimos para comprar. Mau sinal.', choque: { lua: 0.5 } },
  5: { titulo: 'LuaCoin afunda 65%', texto: 'A bolha rebentou. Quem comprou no topo perdeu quase tudo.', choque: { lua: -0.65 } },
  7: {
    titulo: 'RECESSÃO: as bolsas caem',
    texto: 'A economia encolhe. Quase todas as ações descem; as obrigações seguram.',
    choque: { etf: -0.12, pixel: -0.18, brisa: -0.1, eco: -0.15, lua: -0.25, obrig: 0.02 },
  },
  8: { titulo: 'Empresas cortam custos', texto: 'Há lay-offs em vários setores.', choque: { etf: -0.04, pixel: -0.06, brisa: -0.03, eco: -0.05 } },
  9: { titulo: 'Banco central baixa os juros', texto: 'Para ajudar a economia. Os depósitos passam a render menos.', choque: { obrig: 0.03, etf: 0.02 } },
  11: { titulo: 'A economia volta a crescer', texto: 'As bolsas recuperam.', choque: { etf: 0.06, pixel: 0.09, brisa: 0.05, eco: 0.06 } },
  13: { titulo: 'PixelSoft bate recordes', texto: 'O novo jogo vendeu 20 milhões.', choque: { pixel: 0.15, etf: 0.01 } },
  14: { titulo: 'ESCÂNDALO na Refrescos Brisa', texto: 'Contas falsificadas. A ação afunda; o resto do mercado nem sente.', choque: { brisa: -0.4, etf: -0.01 } },
  16: { titulo: 'Novos apoios às renováveis', texto: 'Toda a gente quer comprar EcoVolt.', choque: { eco: 0.2 } },
  18: { titulo: 'Apoios às renováveis cortados', texto: 'A EcoVolt cai. Comprar por moda raramente corre bem.', choque: { eco: -0.25 } },
  20: { titulo: 'Bolsas em máximos', texto: 'Quem não vendeu na recessão está a ganhar.', choque: { etf: 0.05, pixel: 0.05 } },
  22: { titulo: 'A inflação volta, os juros sobem', texto: 'As obrigações descem um pouco.', choque: { obrig: -0.03, pixel: -0.04 } },
}

const NOTICIAS_SOLTAS: NoticiaDef[] = [
  { titulo: 'Mês calmo nos mercados', texto: 'Sem grandes surpresas.', choque: {} },
  { titulo: 'PixelSoft contrata em Lisboa', texto: 'Abre um escritório com 300 pessoas.', choque: { pixel: 0.04 } },
  { titulo: 'Verão quente', texto: 'Vendem-se mais refrescos.', choque: { brisa: 0.05 } },
  { titulo: 'Regras novas para cripto', texto: 'A LuaCoin treme.', choque: { lua: -0.15 } },
  { titulo: 'Bons resultados em todo o mundo', texto: 'As empresas lucram mais do que se esperava.', choque: { etf: 0.02, pixel: 0.02, brisa: 0.02, eco: 0.02 } },
  { titulo: 'Preço da energia sobe', texto: 'Boas notícias para quem a produz.', choque: { eco: 0.05 } },
  { titulo: 'Atraso na consola da PixelSoft', texto: 'Os investidores não gostaram.', choque: { pixel: -0.06 } },
  { titulo: 'Nova moda cripto', texto: 'A LuaCoin aproveita.', choque: { lua: 0.15 } },
]

function porAtivo<T>(f: (id: AtivoM) => T): Record<AtivoM, T> {
  return Object.fromEntries(IDS.map((id) => [id, f(id)])) as Record<AtivoM, T>
}

export function salarioLiquido(s: EstadoMercado) {
  const bruto = s.salarioBruto * (emLayoff(s) ? 2 / 3 : 1)
  const ss = round2(bruto * TAXA_SS)
  const irs = round2(bruto * TAXA_IRS)
  return { bruto: round2(bruto), ss, irs, liquido: round2(bruto - ss - irs) }
}

export function emLayoff(s: EstadoMercado) {
  return s.flags.includes('layoff') && (s.mes === 9 || s.mes === 10)
}

export function custoCasa(s: EstadoMercado) {
  const c = CASAS[s.casa]
  const subida = s.casa !== 'pais' && s.flags.includes('renda_sobe') ? 1.05 : 1
  return round2(c.renda * subida + c.contas * s.indicePrecos)
}

export function custoSupermercado(s: EstadoMercado) {
  if (s.casa === 'pais') return 0
  const lista = s.flags.includes(`lista_${s.mes}`) ? 0.9 : 1
  return round2(220 * s.indicePrecos * (s.marcaBranca ? 0.8 : 1) * lista)
}

export function custoTransportes(s: EstadoMercado) {
  return round2(65 * s.indicePrecos)
}

/** As despesas fixas de um mês (sem investimentos nem extras). */
export function despesasFixas(s: EstadoMercado): { texto: string; valor: number }[] {
  const l = [
    { texto: CASAS[s.casa].nome, valor: custoCasa(s) },
    { texto: 'Supermercado', valor: custoSupermercado(s) },
    { texto: 'Passe e telemóvel', valor: custoTransportes(s) },
  ]
  if (s.ginasio) l.push({ texto: 'Ginásio', valor: 30 })
  for (const p of s.pagamentos) l.push({ texto: p.nome, valor: p.valor })
  return l.filter((x) => x.valor > 0)
}

export function totalFixas(s: EstadoMercado) {
  return round2(despesasFixas(s).reduce((t, x) => t + x.valor, 0))
}

export function taxaDeposito(s: EstadoMercado) {
  return s.mes >= 9 ? 0.015 : 0.025
}

export function valorAtivoM(s: EstadoMercado, id: AtivoM) {
  return s.unidades[id] * s.precos[id]
}

export function carteiraM(s: EstadoMercado) {
  return IDS.reduce((t, id) => t + valorAtivoM(s, id), 0)
}

export function ativosNaCarteiraM(s: EstadoMercado) {
  return IDS.filter((id) => valorAtivoM(s, id) >= 5)
}

/** O que ainda falta pagar em prestações (créditos e compras a prestações). */
export function dividaPrestacoes(s: EstadoMercado) {
  return s.pagamentos.reduce((t, p) => t + (p.restam === null ? 0 : p.valor * p.restam), 0)
}

/** Património líquido: tudo o que tens menos o que deves (cartão e prestações). */
export function patrimonioM(s: EstadoMercado) {
  return s.conta + s.poupanca + s.ppr + carteiraM(s) - s.divida - dividaPrestacoes(s)
}

export function novoEstadoMercado(name: string, avatar: AvatarConfig): EstadoMercado {
  const precos = porAtivo((id) => ATIVO_M[id].preco0)
  return {
    name,
    avatar,
    crachas: [],
    flags: [],
    gameOver: false,
    mes: 1,
    conta: 800,
    poupanca: 0,
    ppr: 0,
    pprAno: 0,
    divida: 0,
    cartaoCredito: false,
    salarioBruto: SALARIO_INICIAL,
    profissao: 'escritorio',
    casa: 'quarto',
    marcaBranca: false,
    ginasio: false,
    pagamentos: [],
    unidades: porAtivo(() => 0),
    custo: porAtivo(() => 0),
    precos,
    historicoPrecos: porAtivo((id) => [precos[id]]),
    planoMensal: 0,
    mesesInvestidos: [],
    impostoPago: 0,
    jurosPagos: 0,
    turnos: 0,
    stats: { relacoes: 60, saude: 65, carreira: 45 },
    indicePrecos: 1,
    noticias: [{ semana: 1, titulo: 'Começa o ano', texto: 'Os mercados abrem calmos.' }],
    movimentos: [],
    history: [{ week: 0, saldo: 800, poupanca: 0, investimento: 0 }],
  }
}

/** Compra com comissão. Devolve null se não houver dinheiro. */
export function comprarM(s: EstadoMercado, id: AtivoM, valor: number): EstadoMercado | null {
  if (s.conta < valor + COMISSAO) return null
  const mesesInvestidos = s.mesesInvestidos.includes(s.mes) ? s.mesesInvestidos : [...s.mesesInvestidos, s.mes]
  return {
    ...s,
    conta: round2(s.conta - valor - COMISSAO),
    unidades: { ...s.unidades, [id]: s.unidades[id] + valor / s.precos[id] },
    custo: { ...s.custo, [id]: s.custo[id] + valor },
    mesesInvestidos,
  }
}

/** Vende tudo de um ativo: paga comissão e 28% de imposto sobre o lucro (se houver). */
export function venderM(s: EstadoMercado, id: AtivoM): { estado: EstadoMercado; valor: number; imposto: number } {
  const valor = round2(valorAtivoM(s, id))
  const imposto = round2(Math.max(0, valor - s.custo[id]) * IMPOSTO_CAPITAL)
  return {
    valor,
    imposto,
    estado: {
      ...s,
      conta: round2(s.conta + valor - imposto - COMISSAO),
      impostoPago: round2(s.impostoPago + imposto),
      unidades: { ...s.unidades, [id]: 0 },
      custo: { ...s.custo, [id]: 0 },
    },
  }
}

function escolherNoticia(s: EstadoMercado): NoticiaDef {
  const fixa = NOTICIAS_FIXAS[s.mes]
  if (fixa) return fixa
  const usadas = new Set(s.noticias.map((n) => n.titulo))
  const livres = NOTICIAS_SOLTAS.filter((n) => !usadas.has(n.titulo))
  return livres.length ? livres[Math.floor(Math.random() * livres.length)] : NOTICIAS_SOLTAS[0]
}

function gauss() {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function mov(s: EstadoMercado, texto: string, valor: number): EstadoMercado {
  return { ...s, movimentos: [...s.movimentos, { texto, valor: round2(valor) }] }
}

/** Paga da conta; o que faltar sai da poupança e, se nem assim chegar, fica em dívida (cartão ou descoberto). */
function pagar(s: EstadoMercado, valor: number, texto: string): EstadoMercado {
  let n = mov(s, texto, -valor)
  n = { ...n, conta: round2(n.conta - valor) }
  if (n.conta >= 0) return n
  const falta = -n.conta
  const daPoupanca = Math.min(n.poupanca, falta)
  n = { ...n, conta: round2(n.conta + daPoupanca), poupanca: round2(n.poupanca - daPoupanca) }
  if (daPoupanca > 0) n = { ...n, flags: [...n.flags, `tirou_poupanca_${n.mes}`] }
  if (n.conta < 0) {
    const resto = -n.conta
    const multa = n.cartaoCredito ? 0 : MULTA_DESCOBERTO
    n = { ...n, conta: 0, divida: round2(n.divida + resto + multa), flags: [...n.flags, `divida_${n.mes}`] }
  }
  return n
}

/** Um mês inteiro: salário, despesas, dívidas, juros, investimento automático, inflação e mercado. */
export function avancarMes(antes: EstadoMercado): { estado: EstadoMercado; noticia: Noticia } {
  let s: EstadoMercado = { ...antes, mes: antes.mes + 1, turnos: 0, movimentos: [] }
  if (s.mes === 13) s.pprAno = 0

  // dívida do mês anterior: juros e pagamento com o que houver na conta
  if (s.divida > 0) {
    const juro = round2(s.divida * JURO_CARTAO_MES)
    s = mov({ ...s, divida: round2(s.divida + juro), jurosPagos: round2(s.jurosPagos + juro) }, 'Juros da dívida', -juro)
  }

  const sal = salarioLiquido(s)
  s = mov({ ...s, conta: round2(s.conta + sal.liquido) }, emLayoff(s) ? 'Salário (lay-off, 2/3)' : 'Salário líquido', sal.liquido)
  const prof = PROFISSOES[s.profissao]
  if (prof.gorjetas > 0) {
    const gorjetas = round2(prof.gorjetas * (0.7 + Math.random() * 0.6) * (emLayoff(s) ? 0.5 : 1))
    s = mov({ ...s, conta: round2(s.conta + gorjetas) }, 'Gorjetas do mês', gorjetas)
  }

  for (const d of despesasFixas(s)) s = pagar(s, d.valor, d.texto)
  s.pagamentos = s.pagamentos.flatMap((p) => (p.restam === null ? [p] : p.restam > 1 ? [{ ...p, restam: p.restam - 1 }] : []))

  if (s.divida > 0 && s.conta > 0) {
    const paga = round2(Math.min(s.divida, s.conta))
    s = mov({ ...s, conta: round2(s.conta - paga), divida: round2(s.divida - paga) }, 'Pagamento da dívida', -paga)
  }

  if (s.poupanca > 0) {
    const bruto = (s.poupanca * taxaDeposito(s)) / 12
    const liquido = round2(bruto * (1 - IMPOSTO_CAPITAL))
    if (liquido > 0) s = mov({ ...s, poupanca: round2(s.poupanca + liquido), impostoPago: round2(s.impostoPago + bruto - liquido) }, 'Juro do depósito (já sem imposto)', liquido)
  }
  if (s.ppr > 0) s.ppr = round2(s.ppr * (1 + 0.003 + 0.008 * gauss()))

  s.indicePrecos = s.indicePrecos * (1 + INFLACAO_MES)

  const def = escolherNoticia(s)
  const recuperacao = s.mes >= 10 && s.mes <= 20
  s.precos = porAtivo((id) => {
    const a = ATIVO_M[id]
    const extra = recuperacao && ACOES_M.includes(id) ? 0.012 : 0
    const variacao = a.media + extra + a.volatilidade * gauss() + (def.choque[id] ?? 0)
    return Math.max(0.1, s.precos[id] * (1 + Math.max(-0.9, variacao)))
  })
  s.historicoPrecos = porAtivo((id) => [...s.historicoPrecos[id], s.precos[id]])

  // investimento automático (depois de pagas as contas)
  if (s.planoMensal > 0) {
    const n = comprarM(s, 'etf', s.planoMensal)
    s = n ? mov(n, 'Plano mensal: ETF Mundo (+1€ comissão)', -(s.planoMensal + COMISSAO)) : { ...s, flags: [...s.flags, `plano_falhou_${s.mes}`] }
  }

  const noticia = { semana: s.mes, titulo: def.titulo, texto: def.texto }
  s.noticias = [...s.noticias, noticia]

  const efeitos: Partial<StatsAdulto> = prof.efeitosMes
  s.stats = {
    relacoes: clamp(s.stats.relacoes - 3 + (efeitos.relacoes ?? 0)),
    saude: clamp(s.stats.saude - 3 + (s.casa === 't1' ? 1 : 0) + (efeitos.saude ?? 0)),
    carreira: clamp(s.stats.carreira - 1 + (efeitos.carreira ?? 0)),
  }
  s.history = [...s.history, { week: antes.mes, saldo: s.conta, poupanca: round2(s.poupanca + s.ppr), investimento: round2(carteiraM(s)) }]
  s.gameOver = s.mes > MESES
  return { estado: s, noticia }
}
