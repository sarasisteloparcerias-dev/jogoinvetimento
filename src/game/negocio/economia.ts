import { clamp } from '../data'
import type { TipoMiniJogo } from '../minijogos/tipos'
import { avancarMes, novoEstadoMercado, round2 } from '../mercado/economia'
import type { EstadoMercado, Noticia } from '../mercado/tipos'
import type { AvatarConfig } from '../types'

export { euros, round2 } from '../mercado/economia'

/**
 * "O Negócio": a última fase. Abre-se uma pequena empresa e gere-se um ano inteiro:
 * vendas, IVA, salários e TSU, subsídios de férias e de Natal, renda, empréstimo e IRC.
 * Valores simplificados, só para o jogo.
 */

export const MESES_NEGOCIO = 12
export const SALARIO_MINIMO = 920
/** Segurança Social paga pela empresa sobre cada salário (TSU). */
export const TSU_EMPRESA = 0.2375
export const CONTABILISTA = 150
/** IRC simplificado para pequenas empresas. */
export const TAXA_IRC = 0.16
export const TAXA_EMPRESTIMO = 0.065
export const PRAZO_EMPRESTIMO = 60
export const FUNDO_MANEIO = 3000
/** A empresa tem uma conta corrente no banco: pode ficar negativa até aqui (com juros). */
export const LIMITE_DESCOBERTO = -5000
export const JURO_DESCOBERTO = 0.012
export const FALENCIA = -12000
/** Quanto o dono serve por mês quando está na loja (fora os turnos extra). */
export const CAPACIDADE_DONO = 550
export const BONUS_TURNO = 160
export const MAX_TURNOS_DONO = 3
export const NOMES_PRECO = ['BAIXO', 'MÉDIO', 'ALTO'] as const
const EFEITO_PRECO = [1.3, 1, 0.66]

export type TipoNegocio = 'cafe' | 'gelados' | 'entregas'

export interface DefNegocio {
  nome: string
  /** O que se vende (para as falas): "cafés e bolos", ... */
  produto: string
  cliente: string
  investimento: number
  renda: number
  /** Água, luz, gás, seguros, software... */
  despesas: number
  /** Preço médio por cliente, com IVA, em cada nível de preço. */
  ticket: [number, number, number]
  procuraBase: number
  /** Custo dos produtos (sem IVA) em percentagem da venda sem IVA. */
  custo: number
  iva: number
  minijogo: TipoMiniJogo
  /** Procura de cada mês (janeiro a dezembro). */
  sazonal: number[]
  descricao: string[]
}

export const NEGOCIOS: Record<TipoNegocio, DefNegocio> = {
  cafe: {
    nome: 'Café',
    produto: 'cafés, torradas e bolos',
    cliente: 'clientes',
    investimento: 18000,
    renda: 1100,
    despesas: 380,
    ticket: [3.3, 4.2, 5.2],
    procuraBase: 3600,
    custo: 0.32,
    iva: 0.13,
    minijogo: 'cafe',
    sazonal: [0.95, 0.95, 1, 1, 1, 1.05, 1.05, 0.85, 1, 1, 1, 1.15],
    descricao: [
      'CAFÉ: 18.000€ de obras e máquinas, renda de 1.100€. Vende o ano inteiro, sem grandes surpresas.',
      'Margem média: cada café custa pouco, mas é preciso muita gente a servir.',
    ],
  },
  gelados: {
    nome: 'Gelataria',
    produto: 'gelados e batidos',
    cliente: 'clientes',
    investimento: 15000,
    renda: 850,
    despesas: 340,
    ticket: [3, 3.8, 4.8],
    procuraBase: 4200,
    custo: 0.28,
    iva: 0.13,
    minijogo: 'gelado',
    sazonal: [0.35, 0.4, 0.6, 0.85, 1.15, 1.6, 2, 2, 1.4, 0.8, 0.45, 0.5],
    descricao: [
      'GELATARIA: 15.000€ de investimento, renda de 850€. No verão há filas à porta; no inverno quase ninguém aparece.',
      'É o negócio mais sazonal: é preciso guardar dinheiro do verão para aguentar o inverno.',
    ],
  },
  entregas: {
    nome: 'Estafetas',
    produto: 'entregas de bicicleta',
    cliente: 'entregas',
    investimento: 12000,
    renda: 600,
    despesas: 450,
    ticket: [3, 3.8, 4.8],
    procuraBase: 2900,
    custo: 0.22,
    iva: 0.23,
    minijogo: 'entregas',
    sazonal: [1, 0.95, 1, 1, 1, 0.95, 0.9, 0.85, 1, 1.05, 1.15, 1.4],
    descricao: [
      'ESTAFETAS: 12.000€ em bicicletas, app e armazém, renda de 600€. Pouco custo por entrega, mas tudo depende da equipa.',
      'Os serviços pagam IVA de 23% (a restauração paga 13%).',
    ],
  },
}

export const LISTA_NEGOCIOS: TipoNegocio[] = ['cafe', 'gelados', 'entregas']

export interface Funcionario {
  id: string
  nome: string
  /** Salário bruto mensal. */
  salario: number
  /** Quantos clientes consegue servir por mês. */
  produtividade: number
  perfil: string
  /** Contrato a termo: último mês de trabalho (sem termo: null). */
  ate: number | null
}

export interface EmprestimoNegocio {
  divida: number
  prestacao: number
  meses: number
}

export interface RelatorioNegocio {
  mes: number
  procura: number
  capacidade: number
  clientes: number
  /** Vendas com IVA (o que entra na caixa). */
  vendas: number
  /** IVA cobrado aos clientes (é do Estado). */
  ivaVendas: number
  /** Receita sem IVA. */
  receita: number
  produtos: number
  ivaCompras: number
  salarios: number
  tsu: number
  /** O teu ordenado bruto (0 se a caixa não chegou). */
  gerente: number
  renda: number
  despesas: number
  marketing: number
  juros: number
  capital: number
  extras: { texto: string; valor: number }[]
  /** IVA entregue ao Estado este mês (fim de trimestre). */
  ivaEntregue: number
  irc: number
  lucro: number
  caixa: number
  subsidio: boolean
}

export interface EstadoNegocio {
  tipo: TipoNegocio
  caixa: number
  /** Dinheiro teu posto na empresa (capital social e suprimentos). */
  capitalProprio: number
  /** Valor do equipamento e das obras: perde valor ao longo de 5 anos. */
  equipamento: number
  emprestimo: EmprestimoNegocio | null
  preco: 0 | 1 | 2
  marketing: number
  funcionarios: Funcionario[]
  candidatos: Funcionario[]
  /** O teu ordenado bruto como gerente. */
  salarioGerente: number
  reputacao: number
  custo: number
  ivaPorEntregar: number
  /** Lucro do ano (antes do IRC). */
  lucroAno: number
  turnos: number
  /** Efeitos temporários: procura extra (ou a menos) até um certo mês. */
  efeitos: { id: string; procura: number; capacidade: number; ate: number }[]
  extrasMes: { texto: string; valor: number }[]
  historico: RelatorioNegocio[]
  mesesEmAtraso: number
  despedimentos: number
  aberto: boolean
}

const NOMES = ['Joana', 'Rui', 'Marta', 'Diogo', 'Sara', 'André', 'Beatriz', 'Tiago', 'Inês', 'Carlos', 'Leonor', 'Hugo', 'Rita', 'Bruno', 'Catarina', 'Pedro', 'Mariana', 'Nuno']

/** Três candidatos por mês: do primeiro emprego (salário mínimo) a alguém com muita experiência. */
export function gerarCandidatos(mes: number): Funcionario[] {
  const usados = new Set<string>()
  const nome = () => {
    let n = NOMES[Math.floor(Math.random() * NOMES.length)]
    while (usados.has(n)) n = NOMES[Math.floor(Math.random() * NOMES.length)]
    usados.add(n)
    return n
  }
  const id = () => `f${mes}_${Math.random().toString(36).slice(2, 7)}`
  return [
    { id: id(), nome: nome(), salario: SALARIO_MINIMO, produtividade: 760, perfil: 'Primeiro emprego', ate: null },
    { id: id(), nome: nome(), salario: 1050, produtividade: 950, perfil: 'Com experiência', ate: null },
    { id: id(), nome: nome(), salario: 1250, produtividade: 1150, perfil: 'Muito experiente', ate: null },
  ]
}

export function novoNegocio(tipo: TipoNegocio, capitalProprio: number, emprestimo: number): EstadoNegocio {
  const def = NEGOCIOS[tipo]
  const caixa = round2(capitalProprio + emprestimo - def.investimento)
  return {
    tipo,
    caixa,
    capitalProprio,
    equipamento: def.investimento,
    emprestimo: emprestimo > 0 ? { divida: emprestimo, prestacao: prestacaoEmprestimo(emprestimo), meses: PRAZO_EMPRESTIMO } : null,
    preco: 1,
    marketing: 0,
    funcionarios: [],
    candidatos: gerarCandidatos(1),
    salarioGerente: SALARIO_MINIMO,
    reputacao: 50,
    custo: def.custo,
    ivaPorEntregar: 0,
    lucroAno: 0,
    turnos: 0,
    efeitos: [],
    extrasMes: [],
    historico: [],
    mesesEmAtraso: 0,
    despedimentos: 0,
    aberto: true,
  }
}

export function prestacaoEmprestimo(capital: number) {
  const r = TAXA_EMPRESTIMO / 12
  return round2((capital * r) / (1 - Math.pow(1 + r, -PRAZO_EMPRESTIMO)))
}

export function mesDoAno(mes: number) {
  return ((mes - 1) % 12) + 1
}

/** Junho e novembro: subsídios de férias e de Natal (um salário a mais). */
export function mesDeSubsidio(mes: number) {
  const m = mesDoAno(mes)
  return m === 6 || m === 11
}

export function fimDeTrimestre(mes: number) {
  return mesDoAno(mes) % 3 === 0
}

export function custoFuncionario(f: Funcionario) {
  return round2(f.salario * (1 + TSU_EMPRESA))
}

/** Quanto se gasta por mês sem vender nada: salários com TSU, o teu ordenado, renda, despesas, marketing e empréstimo. */
export function custosFixos(n: EstadoNegocio) {
  const def = NEGOCIOS[n.tipo]
  return round2(
    n.funcionarios.reduce((t, f) => t + custoFuncionario(f), 0) +
      n.salarioGerente * (1 + TSU_EMPRESA) +
      def.renda +
      def.despesas +
      CONTABILISTA +
      n.marketing +
      (n.emprestimo?.prestacao ?? 0),
  )
}

export function fatorReputacao(rep: number) {
  return 0.7 + rep / 166
}

export function fatorMarketing(m: number) {
  return 1 + 0.3 * (1 - Math.exp(-m / 400))
}

/** Clientes que querem comprar este mês. */
export function procuraMes(n: EstadoNegocio, mes: number) {
  const def = NEGOCIOS[n.tipo]
  const efeitos = n.efeitos.filter((e) => e.ate >= mes).reduce((t, e) => t * e.procura, 1)
  return Math.round(def.procuraBase * def.sazonal[mesDoAno(mes) - 1] * EFEITO_PRECO[n.preco] * fatorReputacao(n.reputacao) * fatorMarketing(n.marketing) * efeitos)
}

/** Clientes que a equipa consegue servir este mês. */
export function capacidadeMes(n: EstadoNegocio, mes: number) {
  const efeitos = n.efeitos.filter((e) => e.ate >= mes).reduce((t, e) => t * e.capacidade, 1)
  const equipa = n.funcionarios.reduce((t, f) => t + f.produtividade, 0)
  return Math.round((CAPACIDADE_DONO + equipa) * efeitos + n.turnos * BONUS_TURNO)
}

/** O mês da empresa. Devolve a empresa atualizada e o relatório (a "demonstração de resultados" do mês). */
export function mesDaEmpresa(antes: EstadoNegocio, mes: number): { negocio: EstadoNegocio; relatorio: RelatorioNegocio } {
  const def = NEGOCIOS[antes.tipo]
  let n: EstadoNegocio = { ...antes }
  const procura = procuraMes(n, mes)
  const capacidade = capacidadeMes(n, mes)
  const clientes = Math.min(procura, capacidade)
  const vendas = round2(clientes * def.ticket[n.preco])
  const receita = round2(vendas / (1 + def.iva))
  const ivaVendas = round2(vendas - receita)
  const produtos = round2(receita * n.custo)
  const ivaCompras = round2(produtos * def.iva)
  const subsidio = mesDeSubsidio(mes)
  const mult = subsidio ? 2 : 1
  const salarios = round2(n.funcionarios.reduce((t, f) => t + f.salario, 0) * mult)
  const tsu = round2(salarios * TSU_EMPRESA)
  const despesas = def.despesas + CONTABILISTA
  const extras = n.extrasMes
  const totalExtras = extras.reduce((t, e) => t + e.valor, 0)

  // juros da conta corrente (descoberto) do mês anterior
  const jurosDescoberto = n.caixa < 0 ? round2(-n.caixa * JURO_DESCOBERTO) : 0
  let juros = jurosDescoberto
  let capital = 0
  let emprestimo = n.emprestimo
  if (emprestimo) {
    const j = round2((emprestimo.divida * TAXA_EMPRESTIMO) / 12)
    capital = round2(Math.min(emprestimo.divida, emprestimo.prestacao - j))
    juros = round2(juros + j)
    const divida = round2(emprestimo.divida - capital)
    emprestimo = divida > 0.5 ? { ...emprestimo, divida, meses: emprestimo.meses - 1 } : null
  }

  let caixa = round2(n.caixa + vendas - produtos - ivaCompras - salarios - tsu - def.renda - despesas - n.marketing - juros - capital - totalExtras)
  let ivaPorEntregar = round2(n.ivaPorEntregar + ivaVendas - ivaCompras)
  let ivaEntregue = 0
  if (fimDeTrimestre(mes) && ivaPorEntregar > 0) {
    ivaEntregue = ivaPorEntregar
    caixa = round2(caixa - ivaEntregue)
    ivaPorEntregar = 0
  }

  // o dono é o último a receber: só se paga se a caixa chegar
  const gerenteBruto = round2(n.salarioGerente * mult)
  const custoGerente = round2(gerenteBruto * (1 + TSU_EMPRESA))
  const gerente = caixa - custoGerente >= 0 ? gerenteBruto : 0
  caixa = round2(caixa - (gerente ? custoGerente : 0))

  const lucroAntes = round2(receita - produtos - salarios - tsu - (gerente ? custoGerente : 0) - def.renda - despesas - n.marketing - juros - totalExtras)
  let lucroAno = round2(n.lucroAno + lucroAntes)
  let irc = 0
  if (mesDoAno(mes) === 12 && lucroAno > 0) {
    irc = round2(lucroAno * TAXA_IRC)
    caixa = round2(caixa - irc)
  }
  const lucro = round2(lucroAntes - irc)
  if (mesDoAno(mes) === 12) lucroAno = round2(lucroAno - irc)

  // reputação: filas, preço, presença do dono, salários em atraso
  const servico = procura > 0 ? clientes / procura : 1
  let rep = n.reputacao + (servico < 0.8 ? -6 : servico < 0.95 ? -2 : 2) + [2, 0, -3][n.preco] + n.turnos * 2
  const atraso = caixa < LIMITE_DESCOBERTO
  if (atraso) rep -= 8
  rep = clamp(rep)

  let funcionarios = n.funcionarios
  // contratos a termo que acabam este mês
  funcionarios = funcionarios.filter((f) => f.ate === null || f.ate > mes)

  n = {
    ...n,
    caixa,
    emprestimo,
    equipamento: round2(Math.max(0, n.equipamento - def.investimento / 60)),
    ivaPorEntregar,
    lucroAno,
    reputacao: rep,
    funcionarios,
    turnos: 0,
    extrasMes: [],
    efeitos: n.efeitos.filter((e) => e.ate > mes),
    candidatos: gerarCandidatos(mes + 1),
    mesesEmAtraso: atraso ? n.mesesEmAtraso + 1 : n.mesesEmAtraso,
    aberto: caixa > FALENCIA,
  }
  const relatorio: RelatorioNegocio = {
    mes,
    procura,
    capacidade,
    clientes,
    vendas,
    ivaVendas,
    receita,
    produtos,
    ivaCompras,
    salarios,
    tsu,
    gerente,
    renda: def.renda,
    despesas,
    marketing: n.marketing,
    juros,
    capital,
    extras,
    ivaEntregue,
    irc,
    lucro,
    caixa,
    subsidio,
  }
  n.historico = [...n.historico, relatorio]
  return { negocio: n, relatorio }
}

/** Um mês na vida de quem tem uma empresa: primeiro a empresa, depois as contas pessoais (com o ordenado que a empresa conseguiu pagar). */
export function avancarMesNegocio(antes: EstadoMercado): { estado: EstadoMercado; relatorio: RelatorioNegocio; noticia: Noticia } {
  const neg = antes.negocio!
  const { negocio, relatorio } = mesDaEmpresa(neg, antes.mes)
  // o ordenado do mês (já com subsídio, se for o caso) entra nas contas pessoais pelo avancarMes
  const pessoal = avancarMes({ ...antes, salarioBruto: relatorio.gerente })
  const estado: EstadoMercado = {
    ...pessoal.estado,
    salarioBruto: neg.salarioGerente,
    negocio,
    gameOver: pessoal.estado.mes > MESES_NEGOCIO || !negocio.aberto,
  }
  return { estado, relatorio, noticia: pessoal.noticia }
}

/** Valor da empresa para o património: caixa e equipamento, menos o que deve ao banco e ao Estado. */
export function valorLiquidoEmpresa(n: EstadoNegocio) {
  return round2(n.caixa + n.equipamento - (n.emprestimo?.divida ?? 0) - Math.max(0, n.ivaPorEntregar))
}

/** Começar diretamente n'O Negócio (só para quem já passou as outras fases e quer repetir). */
export function novoEstadoNegocio(name: string, avatar: AvatarConfig): EstadoMercado {
  const n = novoEstadoMercado(name, avatar)
  return {
    ...n,
    nivel: 'negocio',
    conta: 3000,
    poupanca: 17000,
    salarioBruto: 0,
    flags: ['investir'],
    history: [{ week: 0, saldo: 3000, poupanca: 17000, investimento: 0 }],
  }
}

/** Uma venda fora do normal (ex.: uma grande encomenda), já com IVA. */
export function receitaExtra(n: EstadoNegocio, comIva: number): EstadoNegocio {
  const def = NEGOCIOS[n.tipo]
  const receita = round2(comIva / (1 + def.iva))
  const custo = round2(receita * n.custo)
  return {
    ...n,
    caixa: round2(n.caixa + comIva - custo * (1 + def.iva)),
    ivaPorEntregar: round2(n.ivaPorEntregar + (comIva - receita) - custo * def.iva),
    lucroAno: round2(n.lucroAno + receita - custo),
  }
}
