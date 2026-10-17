import { clamp } from '../data'
import type { AvatarConfig } from '../types'
import type { Ativo, AtivoId, EstadoCidade, Movimento, Noticia, Pagamento } from './tipos'

export const SEMANAS = 24
export const MESADA = 10
export const DESPESAS_BASE = 6
export const COMISSAO_STANDARD = 1
/** Neste jogo, as 24 semanas do ano letivo contam como um ano. */
export const JURO_POUPANCA_ANO = 0.03
export const INFLACAO_SEMANA = 0.003
export const SALARIO_TURNO = 15
export const MAX_TURNOS = 2
export const META_VIAGEM = 400
export const META_EMERGENCIA = 100
export const BOLSA_MERITO = 100
const DECAY = 2
const MULTA_ATRASO = 5

export const ATIVOS: Ativo[] = [
  {
    id: 'ot',
    nome: 'Obrigações do Tesouro',
    curto: 'OBRIGAÇÕES',
    tipo: 'Obrigação',
    risco: 1,
    preco0: 10,
    media: 0.0006,
    volatilidade: 0.002,
    descricao: 'Emprestas dinheiro ao Estado e ele devolve-to com juros. Sobe pouco, mas quase nunca desce.',
  },
  {
    id: 'etf',
    nome: 'ETF Mundo',
    curto: 'ETF MUNDO',
    tipo: 'ETF (fundo)',
    risco: 3,
    preco0: 20,
    media: 0.0015,
    volatilidade: 0.015,
    descricao: 'Um cesto com ações de centenas de empresas de todo o mundo. Se uma corre mal, as outras compensam.',
  },
  {
    id: 'pixel',
    nome: 'PixelSoft',
    curto: 'PIXELSOFT',
    tipo: 'Ação (tecnologia)',
    risco: 4,
    preco0: 15,
    media: 0.0025,
    volatilidade: 0.045,
    descricao: 'Ser dono de um bocadinho de uma empresa de videojogos. Pode crescer muito, mas sobe e desce com força.',
  },
  {
    id: 'brisa',
    nome: 'Refrescos Brisa',
    curto: 'BRISA',
    tipo: 'Ação (bebidas)',
    risco: 3,
    preco0: 12,
    media: 0.0015,
    volatilidade: 0.03,
    descricao: 'Ação de uma fábrica de refrigerantes. Empresa conhecida e estável... enquanto nada correr mal.',
  },
  {
    id: 'lua',
    nome: 'LuaCoin',
    curto: 'LUACOIN',
    tipo: 'Criptomoeda',
    risco: 5,
    preco0: 5,
    media: 0.002,
    volatilidade: 0.12,
    descricao: 'Uma moeda digital. Não é uma empresa nem dá lucros: o preço depende só de quanto os outros pagam por ela.',
  },
]

export const ATIVO = Object.fromEntries(ATIVOS.map((a) => [a.id, a])) as Record<AtivoId, Ativo>
const IDS = ATIVOS.map((a) => a.id)
const ACOES: AtivoId[] = ['etf', 'pixel', 'brisa']

type Choque = Partial<Record<AtivoId, number>>
interface NoticiaDef {
  titulo: string
  texto: string
  choque: Choque
}

/** Notícias fixas: contam a história do ano (euforia e queda da cripto, crise e recuperação, escândalo numa só empresa). */
const NOTICIAS_FIXAS: Record<number, NoticiaDef> = {
  2: { titulo: 'Refrescos Brisa abre fábrica nova', texto: 'A empresa espera vender mais no verão.', choque: { brisa: 0.04 } },
  3: { titulo: 'LuaCoin sobe 25%', texto: 'Toda a gente fala dela nas redes sociais.', choque: { lua: 0.25 } },
  5: { titulo: 'LuaCoin dispara 60%!', texto: '"Vai à Lua!", dizem os influencers. Muita gente compra com medo de ficar de fora.', choque: { lua: 0.6 } },
  7: { titulo: 'LuaCoin afunda 70%', texto: 'Os grandes investidores venderam tudo de uma vez. Quem comprou no pico perdeu muito.', choque: { lua: -0.7 } },
  9: {
    titulo: 'CRISE! As bolsas caem a pique',
    texto: 'A economia abranda e quase todas as ações descem. As obrigações aguentam-se.',
    choque: { etf: -0.1, pixel: -0.16, brisa: -0.11, lua: -0.2, ot: 0.01 },
  },
  10: { titulo: 'Bolsas continuam nervosas', texto: 'Há quem venda tudo em pânico.', choque: { etf: -0.03, pixel: -0.05, brisa: -0.03 } },
  12: { titulo: 'Primeiros sinais de recuperação', texto: 'As empresas voltam a vender mais.', choque: { etf: 0.05, pixel: 0.07, brisa: 0.04 } },
  14: { titulo: 'PixelSoft lança jogo de enorme sucesso', texto: 'Milhões de downloads na primeira semana.', choque: { pixel: 0.18, etf: 0.01 } },
  15: { titulo: 'Empresas voltam a contratar', texto: 'O desemprego desce e as famílias gastam mais.', choque: { etf: 0.04, brisa: 0.04, pixel: 0.03 } },
  17: {
    titulo: 'ESCÂNDALO na Refrescos Brisa',
    texto: 'A empresa escondia problemas graves na fábrica. As outras empresas quase nem sentem.',
    choque: { brisa: -0.35, etf: -0.01 },
  },
  19: { titulo: 'Bolsas recuperam da crise', texto: 'Quem não vendeu na crise já recuperou quase tudo.', choque: { etf: 0.04, pixel: 0.05 } },
  21: { titulo: 'Banco central sobe os juros', texto: 'Para travar a inflação. As obrigações sobem, a tecnologia desce um pouco.', choque: { ot: 0.01, pixel: -0.04, etf: -0.01 } },
  23: { titulo: 'Bom ano para as empresas', texto: 'Os lucros de todo o mundo surpreendem pela positiva.', choque: { etf: 0.03, pixel: 0.03, brisa: 0.02 } },
}

/** Notícias pequenas para as outras semanas (cada uma sai no máximo uma vez). */
const NOTICIAS_SOLTAS: NoticiaDef[] = [
  { titulo: 'PixelSoft contrata 200 programadores', texto: 'A empresa quer fazer mais jogos.', choque: { pixel: 0.04 } },
  { titulo: 'Calor faz vender mais refrescos', texto: 'Boas notícias para a Refrescos Brisa.', choque: { brisa: 0.05 } },
  { titulo: 'Semana calma nas bolsas', texto: 'Sem grandes surpresas.', choque: {} },
  { titulo: 'Nova app de cripto atrai jovens', texto: 'A LuaCoin aproveita a moda.', choque: { lua: 0.12 } },
  { titulo: 'País grande ameaça proibir cripto', texto: 'As criptomoedas tremem.', choque: { lua: -0.15 } },
  { titulo: 'PixelSoft atrasa consola nova', texto: 'Os fãs vão ter de esperar.', choque: { pixel: -0.06 } },
  { titulo: 'Refrescos Brisa lança sabor novo', texto: 'Sabor a pêssego. As opiniões dividem-se.', choque: { brisa: 0.02 } },
  { titulo: 'Bons lucros em todo o mundo', texto: 'As empresas ganham mais do que se esperava.', choque: { etf: 0.02, pixel: 0.02, brisa: 0.02 } },
]

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function euros(n: number) {
  return `${round2(n).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`
}

function porAtivo<T>(f: (id: AtivoId) => T): Record<AtivoId, T> {
  return Object.fromEntries(IDS.map((id) => [id, f(id)])) as Record<AtivoId, T>
}

export function valorAtivo(s: EstadoCidade, id: AtivoId) {
  return s.unidades[id] * s.precos[id]
}

export function valorCarteira(s: EstadoCidade) {
  return IDS.reduce((t, id) => t + valorAtivo(s, id), 0)
}

export function patrimonio(s: EstadoCidade) {
  return s.dinheiro + s.poupanca + valorCarteira(s)
}

/** Dinheiro que conta para a viagem: poupança + investimentos. */
export function poupadoViagem(s: EstadoCidade) {
  return s.poupanca + valorCarteira(s)
}

export function ativosNaCarteira(s: EstadoCidade) {
  return IDS.filter((id) => valorAtivo(s, id) >= 1)
}

export function custoDespesas(s: EstadoCidade) {
  return round2(DESPESAS_BASE * s.indicePrecos)
}

export function novoEstadoCidade(name: string, avatar: AvatarConfig): EstadoCidade {
  const precos = porAtivo((id) => ATIVO[id].preco0)
  return {
    name,
    avatar,
    crachas: [],
    flags: [],
    gameOver: false,
    semana: 1,
    dinheiro: 20,
    conta: null,
    poupanca: 0,
    unidades: porAtivo(() => 0),
    custo: porAtivo(() => 0),
    precos,
    historicoPrecos: porAtivo((id) => [precos[id]]),
    emprego: false,
    turnos: 0,
    stats: { relacoes: 60, saude: 70, educacao: 55 },
    indicePrecos: 1,
    pagamentos: [],
    noticias: [{ semana: 1, titulo: 'Começa o ano letivo', texto: 'As bolsas abrem o ano com calma.' }],
    movimentos: [],
    compras: [],
    pensar: {},
    salarioTotal: 0,
    history: [{ week: 0, saldo: 20, poupanca: 0, investimento: 0 }],
  }
}

export function comprar(s: EstadoCidade, id: AtivoId, valor: number): EstadoCidade | null {
  if (s.dinheiro < valor) return null
  return {
    ...s,
    dinheiro: round2(s.dinheiro - valor),
    unidades: { ...s.unidades, [id]: s.unidades[id] + valor / s.precos[id] },
    custo: { ...s.custo, [id]: s.custo[id] + valor },
  }
}

/** Vende uma fração (1 = tudo) do que tens de um ativo. Devolve o novo estado e quanto recebeste. */
export function vender(s: EstadoCidade, id: AtivoId, fracao = 1): { estado: EstadoCidade; valor: number } {
  const valor = round2(valorAtivo(s, id) * fracao)
  return {
    valor,
    estado: {
      ...s,
      dinheiro: round2(s.dinheiro + valor),
      unidades: { ...s.unidades, [id]: fracao >= 1 ? 0 : s.unidades[id] * (1 - fracao) },
      custo: { ...s.custo, [id]: fracao >= 1 ? 0 : s.custo[id] * (1 - fracao) },
    },
  }
}

export function moverPoupanca(s: EstadoCidade, valor: number): EstadoCidade | null {
  if (valor > 0 && s.dinheiro < valor) return null
  if (valor < 0 && s.poupanca < -valor) return null
  return { ...s, dinheiro: round2(s.dinheiro - valor), poupanca: round2(s.poupanca + valor) }
}

/** Cobra um valor da conta; se não chegar, vai buscar o resto à poupança. Devolve o que ficou por pagar. */
function cobrar(s: EstadoCidade, valor: number, texto: string): { s: EstadoCidade; falta: number } {
  const daConta = Math.min(s.dinheiro, valor)
  const daPoupanca = Math.min(s.poupanca, valor - daConta)
  const falta = round2(valor - daConta - daPoupanca)
  const movimentos: Movimento[] = [...s.movimentos, { texto, valor: -round2(daConta + daPoupanca) }]
  if (daPoupanca > 0) movimentos.push({ texto: 'Tirado da poupança para pagar', valor: 0 })
  return { s: { ...s, dinheiro: round2(s.dinheiro - daConta), poupanca: round2(s.poupanca - daPoupanca), movimentos }, falta }
}

function gauss() {
  const u = 1 - Math.random()
  const v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function escolherNoticia(s: EstadoCidade): NoticiaDef {
  const fixa = NOTICIAS_FIXAS[s.semana]
  if (fixa) return fixa
  const usadas = new Set(s.noticias.map((n) => n.titulo))
  const livres = NOTICIAS_SOLTAS.filter((n) => !usadas.has(n.titulo))
  return livres.length ? livres[Math.floor(Math.random() * livres.length)] : NOTICIAS_SOLTAS[2]
}

/** Uma noite: mesada, despesas, comissões, prestações, juro, inflação e o mercado da semana. */
export function avancarSemanaCidade(antes: EstadoCidade): { estado: EstadoCidade; noticia: Noticia } {
  let s: EstadoCidade = { ...antes, semana: antes.semana + 1, turnos: 0, movimentos: [{ texto: 'Mesada', valor: MESADA }] }
  s.dinheiro = round2(s.dinheiro + MESADA)

  const despesas = cobrar(s, custoDespesas(s), 'Lanche e passe')
  s = despesas.s
  if (despesas.falta > 0) s = { ...s, stats: { ...s.stats, saude: clamp(s.stats.saude - 4) }, flags: [...s.flags, `sem_lanche_${s.semana}`] }

  if (s.conta === 'standard') s = cobrar(s, COMISSAO_STANDARD, 'Comissão da conta').s

  const pagamentos: Pagamento[] = []
  for (const p of s.pagamentos) {
    const c = cobrar(s, p.valor, p.nome)
    s = c.s
    if (c.falta > 0 && !p.cancelavel) {
      pagamentos.push({ id: `multa_${s.semana}`, nome: 'Multa por atraso', valor: round2(c.falta + MULTA_ATRASO), restam: 1, cancelavel: false })
    }
    const restam = p.restam === null ? null : p.restam - 1
    if (restam === null || restam > 0) pagamentos.push({ ...p, restam })
  }
  s.pagamentos = pagamentos

  if (s.poupanca > 0) {
    const juro = round2((s.poupanca * JURO_POUPANCA_ANO) / SEMANAS)
    if (juro > 0) {
      s.poupanca = round2(s.poupanca + juro)
      s.movimentos = [...s.movimentos, { texto: 'Juro da poupança', valor: juro }]
    }
  }

  s.indicePrecos = s.indicePrecos * (1 + INFLACAO_SEMANA)

  const def = escolherNoticia(s)
  const recuperacao = s.semana >= 11 && s.semana <= 20
  s.precos = porAtivo((id) => {
    const a = ATIVO[id]
    const extra = recuperacao && ACOES.includes(id) ? 0.008 : 0
    const variacao = a.media + extra + a.volatilidade * gauss() + (def.choque[id] ?? 0)
    return Math.max(0.05, s.precos[id] * (1 + Math.max(-0.9, variacao)))
  })
  s.historicoPrecos = porAtivo((id) => [...s.historicoPrecos[id], s.precos[id]])
  const noticia = { semana: s.semana, titulo: def.titulo, texto: def.texto }
  s.noticias = [...s.noticias, noticia]

  s.stats = { relacoes: clamp(s.stats.relacoes - DECAY), saude: clamp(s.stats.saude - DECAY), educacao: clamp(s.stats.educacao - DECAY) }
  s.history = [...s.history, { week: antes.semana, saldo: s.dinheiro, poupanca: s.poupanca, investimento: round2(valorCarteira(s)) }]
  s.gameOver = s.semana > SEMANAS
  return { estado: s, noticia }
}
