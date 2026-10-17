import { clamp } from '../data'
import type { CtxJogo } from '../modo'
import type { Interacao } from '../world/motor'
import { CONQUISTAS_MERCADO, objetivoMercado } from './conquistas'
import {
  ACOES_M,
  ATIVO_M,
  ativosNaCarteiraM,
  avancarMes,
  carteiraM,
  CASAS,
  COMISSAO,
  despesasFixas,
  dividaPrestacoes,
  emLayoff,
  euros,
  IMPOSTO_CAPITAL,
  JURO_CARTAO_MES,
  MAX_TURNOS,
  MESES,
  META_CASA,
  nomeMes,
  PAGAMENTO_TURNO,
  patrimonioM,
  round2,
  salarioLiquido,
  taxaDeposito,
  totalFixas,
  valorAtivoM,
} from './economia'
import { escolherEventoMercado } from './eventos'
import { LISTA_PROFISSOES, PROFISSOES, type Profissao } from './profissoes'
import type { AtivoM, Casa, EstadoMercado, Noticia, StatsAdulto } from './tipos'

export type CtxMercado = CtxJogo<EstadoMercado>
type Ctx = CtxMercado

const MESTRE = 'Mestre Moedas'

function mudar(ctx: Ctx, f: (s: EstadoMercado) => EstadoMercado) {
  ctx.definir(f(ctx.estado()))
}

function stats(ctx: Ctx, m: Partial<StatsAdulto>) {
  mudar(ctx, (s) => {
    const n = { ...s.stats }
    for (const [k, v] of Object.entries(m) as [keyof StatsAdulto, number][]) n[k] = clamp(n[k] + v)
    return { ...s, stats: n }
  })
}

function tem(ctx: Ctx, flag: string) {
  return ctx.estado().flags.includes(flag)
}

function comFlag(ctx: Ctx, flag: string): boolean {
  if (tem(ctx, flag)) return true
  mudar(ctx, (s) => ({ ...s, flags: [...s.flags, flag] }))
  return false
}

function pct(n: number) {
  const v = Math.round(n * 1000) / 10
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-PT')}%`
}

/** Meses de entrega do IRS (abril a junho) de cada ano. */
function janelaIrs(mes: number) {
  const m = ((mes - 1) % 12) + 1
  return m >= 4 && m <= 6
}

function anoDe(mes: number) {
  return mes > 12 ? 2 : 1
}

export async function verificarConquistasM(ctx: Ctx) {
  const s = ctx.estado()
  if (s.poupanca >= 3 * totalFixas(s)) await ctx.cracha('emergencia')
  if (ativosNaCarteiraM(s).length >= 3) await ctx.cracha('diversificada')
  if (s.mesesInvestidos.length >= 6) await ctx.cracha('regular')
  if (patrimonioM(ctx.estado()) >= META_CASA) await ctx.cracha('casa')
}

// ---------------------------------------------------------------------------

async function escolherProfissao(ctx: Ctx, opcoes: Profissao[], pergunta: string, cancelavel = false): Promise<Profissao | null> {
  for (;;) {
    const extra = cancelavel ? ['COMPARAR', 'VOLTAR'] : ['COMPARAR']
    const r = await ctx.ask(pergunta, [...opcoes.map((p) => PROFISSOES[p].nome.toUpperCase()), ...extra], undefined, cancelavel ? opcoes.length + 1 : undefined)
    if (r < opcoes.length) return opcoes[r]
    if (r > opcoes.length) return null
    await ctx.say(opcoes.flatMap((p) => PROFISSOES[p].descricao))
  }
}

function aplicarProfissao(ctx: Ctx, p: Profissao, mudanca: boolean) {
  const d = PROFISSOES[p]
  mudar(ctx, (x) => ({
    ...x,
    profissao: p,
    salarioBruto: d.salario,
    stats: { ...x.stats, carreira: mudanca ? Math.max(30, x.stats.carreira - 10) : d.carreira },
  }))
}

export async function tutorialMercado(ctx: Ctx) {
  const s = ctx.estado()
  const mae = 'Mãe (telefone)'
  await ctx.say(
    [`${s.name}, sou eu, a Mãe! Acabaste os estudos e já tens três propostas de emprego. Que orgulho!`, 'Pensa bem: o salário não é tudo. Conta também o horário, o cansaço e o futuro.'],
    mae,
  )
  const p = (await escolherProfissao(ctx, LISTA_PROFISSOES, 'Qual aceitas?'))!
  aplicarProfissao(ctx, p, false)
  const d = PROFISSOES[p]
  await ctx.say(
    [
      `${d.empresa}, boa escolha! Vais ganhar ${euros(d.salario)} brutos por mês${d.gorjetas ? ', mais gorjetas' : ''}. Mas atenção: ao bruto tiram a Segurança Social e o IRS. O que chega à conta é o LÍQUIDO.`,
      `Uma vez por mês podes ter um dia de trabalho intenso ${d.local}: fala com ${d.chefe}. Conta para a Carreira!`,
      `Tens ${euros(s.conta)} na conta e um quarto partilhado aqui na cidade. Renda, supermercado e passe saem todos os meses.`,
      'Em abril não te esqueças de entregar o IRS nas Finanças!',
      `O objetivo: em 2 anos, juntar ${euros(META_CASA)} para a entrada de uma casa. Os teus pais estão aqui perto, ao lado do parque.`,
      'O teu painel (START) mostra as contas, os investimentos e o orçamento. No computador do quarto podes procurar outro emprego. Cada noite na cama passa um mês.',
    ],
    mae,
  )
  comFlag(ctx, 'tutorial')
}

/** Dia de trabalho intenso (uma vez por mês): mini-jogo da profissão, conta para a Carreira. */
async function diaDeTrabalho(ctx: Ctx) {
  const s = ctx.estado()
  const d = PROFISSOES[s.profissao]
  const quem = d.chefe
  await ctx.say(`Olá, ${s.name}. A tua Carreira está em ${Math.round(s.stats.carreira)}/100. A avaliação anual é em dezembro.`, quem)
  if (tem(ctx, `dia_${s.mes}`)) return ctx.say('Este mês já deste tudo! Vai descansar.', quem)
  const r = await ctx.ask('Hoje há muito trabalho. Dás o teu melhor num dia intenso?', ['SIM', 'NÃO'], quem, 1)
  if (r !== 0) return ctx.say('Sem problema. O equilíbrio também é importante.', quem)
  comFlag(ctx, `dia_${s.mes}`)
  const jogo = await ctx.jogar(d.minijogo)
  const bom = s.profissao === 'escritorio' ? jogo.pontos >= 14 : s.profissao === 'restaurante' ? jogo.pontos >= 8 : jogo.pontos >= 10
  const carreira = bom ? 7 : 3
  let extra = 0
  if (s.profissao === 'restaurante') extra = round2((jogo.valor ?? 0) * 3)
  if (s.profissao === 'estafeta') extra = round2(jogo.pontos * 2)
  mudar(ctx, (x) => ({ ...x, conta: round2(x.conta + extra) }))
  stats(ctx, { carreira, saude: -3 })
  await ctx.say(
    [`${jogo.texto}.`, `${bom ? 'Excelente trabalho!' : 'Bom esforço!'} Carreira +${carreira} · Saúde -3${extra ? ` · +${euros(extra)} ${s.profissao === 'restaurante' ? 'de gorjetas' : 'de bónus por entregas'}` : ''}.`],
    quem,
  )
  await verificarConquistasM(ctx)
}

const TOPICOS_MESTRE: { titulo: string; linhas: (s: EstadoMercado) => string[] }[] = [
  {
    titulo: 'POR ONDE COMEÇO?',
    linhas: (s) => [
      `Primeiro, um FUNDO DE EMERGÊNCIA: 3 a 6 meses de despesas num depósito. Para ti, uns ${euros(3 * totalFixas(s))}.`,
      'Depois, livra-te de dívidas caras, como o cartão de crédito. Só depois investes, e com dinheiro de que não precisas nos próximos anos.',
    ],
  },
  {
    titulo: 'ETFs E CUSTOS',
    linhas: () => [
      'Um ETF de ações do mundo inteiro é a forma mais simples de diversificar: milhares de empresas num só produto.',
      `Cada ordem de compra ou venda custa ${COMISSAO}€ de comissão aqui. Com valores pequenos, as comissões pesam: compra menos vezes e em montantes maiores.`,
    ],
  },
  {
    titulo: 'IMPOSTOS',
    linhas: () => [
      `Em Portugal, os lucros com investimentos e os juros dos depósitos pagam ${Math.round(IMPOSTO_CAPITAL * 100)}% de imposto.`,
      'Neste jogo o imposto sai logo quando vendes com lucro. Na vida real declara-se no IRS. Se vendes com prejuízo, não pagas.',
    ],
  },
  {
    titulo: 'PPR',
    linhas: () => [
      'O PPR (Plano Poupança Reforma) é para a reforma: não deves mexer nele durante muitos anos.',
      'Em troca, 20% do que pões lá desconta no IRS (até 400€ por ano, na tua idade). Entra no painel, em BANCO.',
    ],
  },
  {
    titulo: 'INVESTIR TODOS OS MESES',
    linhas: () => [
      'Investir um valor fixo todos os meses, aconteça o que acontecer, chama-se custo médio.',
      'Quando os preços caem, compras mais barato. No painel, em INVESTIR, podes ligar o PLANO MENSAL no ETF Mundo.',
    ],
  },
  {
    titulo: 'CARTÃO DE CRÉDITO',
    linhas: () => [
      `Se não pagares o cartão todo no fim do mês, pagas cerca de ${pct(JURO_CARTAO_MES)} de juros por mês: mais de 20% ao ano!`,
      'Nenhum investimento rende isso de forma segura. Por isso, pagar dívidas caras é o melhor "investimento" que há.',
    ],
  },
  {
    titulo: 'RISCO E TEMPO',
    linhas: () => [
      'As ações podem cair 20% ou 30% numa crise. Ao longo de muitos anos, historicamente, têm recuperado, mas não há garantias.',
      'Por isso: dinheiro para daqui a meses fica no depósito; dinheiro para daqui a anos pode ser investido.',
    ],
  },
]

const ACOES_NPC: Record<string, (ctx: Ctx) => Promise<void>> = {
  async mae(ctx) {
    const s = ctx.estado()
    if (comFlag(ctx, `almoco_${s.mes}`)) return ctx.say('Já almoçaste cá este mês! Volta quando quiseres.', 'Mãe')
    stats(ctx, { relacoes: 6 })
    await ctx.say([`Que bom ver-te, ${s.name}! Fica para o almoço.`, 'Almoço de domingo com a família. Relações +6, e de graça!'], 'Mãe')
    if (s.casa !== 'pais') await ctx.say('Se precisares de poupar, o teu quarto aqui está sempre à tua espera. Muitos jovens fazem isso para juntar a entrada da casa.', 'Mãe')
  },

  async pai(ctx) {
    await ctx.say(
      [
        'Quando comprámos esta casa, pedimos um crédito à habitação a 30 anos.',
        'O banco emprestou 90% e nós tivemos de juntar os outros 10% mais impostos e escritura. Foi isso que nos custou mais.',
        'E repara: a prestação depende da Euribor. Quando os juros sobem, a prestação sobe. Ter folga no orçamento é essencial.',
      ],
      'Pai',
    )
  },

  async chefe(ctx) {
    if (ctx.estado().profissao === 'escritorio') return diaDeTrabalho(ctx)
    await ctx.say('Não trabalhas cá, mas se um dia quiseres mudar, temos vagas. Procura no computador do teu quarto.', 'Eng.ª Sofia')
  },

  async marco(ctx) {
    if (ctx.estado().profissao === 'estafeta') return diaDeTrabalho(ctx)
    await ctx.say('Precisamos sempre de estafetas! Se quiseres mudar, candidata-te no computador do teu quarto.', 'Marco')
  },

  async tiago(ctx) {
    const s = ctx.estado()
    if (s.mes < 5) return ctx.say('Pedi um crédito para comprar mais LuaCoin. Vou ser rico antes dos 30!', 'Tiago')
    if (s.mes < 12) return ctx.say('Perdi quase tudo na LuaCoin... e ainda estou a pagar o crédito. Agora só invisto o que posso perder.', 'Tiago')
    await ctx.say('Comecei um plano mensal num ETF. É aborrecido... mas durmo descansado.', 'Tiago')
  },

  async vasco(ctx) {
    const quem = 'Sr. Vasco'
    const s = ctx.estado()
    const ano = anoDe(s.mes)
    if (janelaIrs(s.mes) && !tem(ctx, `irs_${ano}`)) {
      const r = await ctx.ask('Bom dia! Vem entregar a declaração de IRS?', ['SIM', 'O QUE É O IRS?'], quem, 1)
      if (r === 1) await explicarIrs(ctx, quem)
      const deducaoPpr = round2(Math.min(400, s.pprAno * 0.2))
      const reembolso = round2(150 + deducaoPpr)
      mudar(ctx, (x) => ({ ...x, conta: round2(x.conta + reembolso), flags: [...x.flags, `irs_${ano}`] }))
      await ctx.say(
        [
          'Declaração entregue! Ao longo do ano descontaram-lhe um pouco mais do que o imposto que devia.',
          `Reembolso: ${euros(150)}${deducaoPpr > 0 ? ` + ${euros(deducaoPpr)} de dedução do PPR` : ''} = ${euros(reembolso)}, já na sua conta.`,
        ],
        quem,
      )
      return ctx.cracha('irs')
    }
    if (tem(ctx, `irs_${ano}`)) return ctx.say('O seu IRS deste ano já está entregue. Até para o ano!', quem)
    const r = await ctx.ask('O IRS entrega-se entre abril e junho. Quer saber como funciona?', ['SIM', 'NÃO'], quem, 1)
    if (r === 0) await explicarIrs(ctx, quem)
  },

  async carla(ctx) {
    const quem = 'Carla'
    const s = ctx.estado()
    const liquido = salarioLiquido(s).liquido
    await ctx.say(
      [`Olá! Neste momento vives em: ${CASAS[s.casa].nome}.`, `Uma regra prática: a casa não deve levar mais de um terço do salário líquido. Para ti, uns ${euros(liquido / 3)}.`],
      quem,
    )
    const opcoes: { casa: Casa; texto: string }[] = (Object.keys(CASAS) as Casa[]).filter((c) => c !== s.casa).map((c) => ({ casa: c, texto: `${CASAS[c].nome.toUpperCase()} (${euros(CASAS[c].renda)})` }))
    const r = await ctx.ask('Queres mudar de casa?', [...opcoes.map((o) => o.texto), 'FICAR ONDE ESTOU'], quem, opcoes.length)
    if (r === opcoes.length) return ctx.say('Quando quiseres, estou cá.', quem)
    const nova = opcoes[r].casa
    const caucao = nova === 'pais' ? 0 : CASAS[nova].renda * 2
    await ctx.say(CASAS[nova].descricao, quem)
    if (caucao > 0) {
      const ok = await ctx.ask(`Para arrendar pede-se uma caução de 2 rendas: ${euros(caucao)} (devolvida no fim, se tudo estiver bem). Avançar?`, ['SIM', 'NÃO'], quem, 1)
      if (ok !== 0) return ctx.say('Pensa com calma. Mudar de casa é uma decisão grande.', quem)
      if (ctx.estado().conta < caucao) return ctx.say(`Precisas de ${euros(caucao)} na conta para a caução. Junta primeiro!`, quem)
    }
    mudar(ctx, (x) => ({ ...x, casa: nova, conta: round2(x.conta - caucao), flags: [...x.flags, `caucao_${nova}`] }))
    if (nova === 't1') stats(ctx, { saude: 3, relacoes: 2 })
    await ctx.say(`Feito! A partir do próximo mês, a renda é ${euros(CASAS[nova].renda)}${CASAS[nova].contas ? ` mais ${euros(CASAS[nova].contas)} de contas` : ''}.`, quem)
  },

  async lurdes(ctx) {
    const quem = 'D. Lurdes'
    const s = ctx.estado()
    if (s.casa === 'pais') return ctx.say('Os teus pais fazem as compras da casa, não é? Que sorte!', quem)
    const r = await ctx.ask(
      `Gastas uns ${euros(despesasFixas(s).find((d) => d.texto === 'Supermercado')?.valor ?? 0)} por mês aqui. ${s.marcaBranca ? 'Já compras marca branca.' : 'Sabias que a marca branca é uns 20% mais barata?'}`,
      ['FAZER AS COMPRAS DO MÊS', s.marcaBranca ? 'VOLTAR ÀS MARCAS' : 'PASSAR A MARCA BRANCA', 'ADEUS'],
      quem,
      2,
    )
    if (r === 0) return compras(ctx)
    if (r !== 1) return ctx.say('Dica: vem com lista e sem fome. Gasta-se muito menos!', quem)
    mudar(ctx, (x) => ({ ...x, marcaBranca: !x.marcaBranca }))
    await ctx.say(ctx.estado().marcaBranca ? 'Muitas vezes é feita na mesma fábrica! Poupas uns 44€ por mês, 528€ por ano.' : 'Voltaste às marcas. Às vezes vale a pena, às vezes paga-se só o nome.', quem)
  },

  async cliente_super(ctx) {
    await ctx.say('Vim buscar pão e levo o carrinho cheio. Promoções "leve 3, pague 2" de coisas de que nem preciso...', 'Cliente')
  },

  async nuno(ctx) {
    const quem = 'Nuno'
    const s = ctx.estado()
    if (!s.ginasio) {
      const r = await ctx.ask('Inscrição no ginásio: 30€ por mês. Inscreves-te?', ['SIM', 'NÃO'], quem, 1)
      if (r !== 0) return ctx.say('Correr no parque também é grátis!', quem)
      mudar(ctx, (x) => ({ ...x, ginasio: true }))
      return ctx.say('Boas-vindas! Atenção: pagar o ginásio não chega, é preciso vir treinar (os bancos de treino estão ali).', quem)
    }
    const r = await ctx.ask('Já tens inscrição. Queres cancelar a mensalidade?', ['CANCELAR', 'CONTINUAR'], quem, 1)
    if (r === 0) {
      mudar(ctx, (x) => ({ ...x, ginasio: false }))
      return ctx.say('Cancelado. Muita gente paga o ginásio o ano inteiro e só vem em janeiro!', quem)
    }
  },

  async clara(ctx) {
    const quem = 'D. Clara'
    const s = ctx.estado()
    if (s.profissao === 'restaurante') return diaDeTrabalho(ctx)
    if (!comFlag(ctx, 'clara')) await ctx.say(['Olá! Lembro-me de ti, trabalhaste cá quando eras adolescente!', 'Ao fim de semana precisamos de reforço.'], quem)
    if (s.turnos >= MAX_TURNOS) return ctx.say(`Já fizeste ${MAX_TURNOS} turnos este mês. O fim de semana também é para descansar!`, quem)
    const r = await ctx.ask(`Um turno de fim de semana paga ${euros(PAGAMENTO_TURNO)} + gorjetas. Vamos? (${s.turnos}/${MAX_TURNOS} este mês)`, ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Fica para a próxima.', quem)
    const jogo = await ctx.jogar('cafe')
    const gorjetas = round2((jogo.valor ?? 0) * 3)
    const total = round2(PAGAMENTO_TURNO + gorjetas)
    mudar(ctx, (x) => ({ ...x, conta: round2(x.conta + total), turnos: x.turnos + 1 }))
    stats(ctx, { saude: -3, relacoes: -1 })
    await ctx.say([`${jogo.texto}.`, `Ganhaste ${euros(PAGAMENTO_TURNO)} + ${euros(gorjetas)} de gorjetas = ${euros(total)}. Rendimento extra, mas o fim de semana foi-se. Saúde -3 · Relações -1.`], quem)
    await verificarConquistasM(ctx)
  },

  async medica(ctx) {
    await ctx.say('Descansa. E da próxima vez, passadeira!', 'Dra. Ana')
  },

  async cliente_cafe(ctx) {
    await ctx.say('Um café por dia a 1€ são 365€ por ano. Não é muito... mas é a soma das pequenas coisas que pesa.', 'Cliente')
  },

  async rita(ctx) {
    const quem = 'Rita'
    const s = ctx.estado()
    const opcoes = [s.cartaoCredito ? 'CANCELAR CARTÃO DE CRÉDITO' : 'PEDIR CARTÃO DE CRÉDITO', 'CRÉDITO PESSOAL?', 'DEPÓSITO A PRAZO?', 'ADEUS']
    const r = await ctx.ask(`Olá, ${s.name}! Em que posso ajudar?`, opcoes, quem, 3)
    if (r === 0) {
      if (s.cartaoCredito) {
        if (s.divida > 0) return ctx.say(`Primeiro tens de pagar a dívida do cartão: ${euros(s.divida)}.`, quem)
        mudar(ctx, (x) => ({ ...x, cartaoCredito: false }))
        return ctx.say('Cartão cancelado. Menos tentações!', quem)
      }
      await ctx.say(
        [
          'Com o cartão de crédito, o banco paga por ti e tu pagas no mês seguinte.',
          `Se pagares tudo, não há juros. Se não, a dívida paga ${pct(JURO_CARTAO_MES)} por mês. E se a conta não chegar, o cartão cobre a diferença... em dívida.`,
        ],
        quem,
      )
      const ok = await ctx.ask('Queres o cartão?', ['SIM', 'NÃO'], quem, 1)
      if (ok === 0) {
        mudar(ctx, (x) => ({ ...x, cartaoCredito: true }))
        await ctx.say('Aqui está. Usa com cabeça!', quem)
      }
      return
    }
    if (r === 1) {
      return ctx.say(
        [
          'Um crédito pessoal é um empréstimo que pagas em prestações, com juros.',
          'Compara sempre a TAEG: diz-te quanto pagas por ano, com juros e comissões incluídos. Uma TAEG de 12% num crédito de 2.000€ a 2 anos custa uns 260€.',
        ],
        quem,
      )
    }
    if (r === 2) {
      return ctx.say(
        [
          `O nosso depósito rende ${pct(taxaDeposito(s))} ao ano, menos 28% de imposto sobre os juros.`,
          'É seguro e o dinheiro está sempre disponível: ideal para o fundo de emergência. Usa o painel (BANCO) para pôr lá dinheiro.',
        ],
        quem,
      )
    }
  },

  async mestre(ctx) {
    const s = ctx.estado()
    if (!comFlag(ctx, 'investir')) {
      await ctx.say(
        [
          `${s.name}! Que orgulho ver-te com o primeiro emprego. Agora sou planeador financeiro aqui no banco.`,
          'Abri-te a corretora no painel (START, INVESTIR). Os ativos são inventados, mas os custos e impostos são como os verdadeiros.',
          'Antes de investires, pergunta-me por onde começar.',
        ],
        MESTRE,
      )
    } else {
      await ctx.say(`Olá, ${s.name}! Património líquido: ${euros(patrimonioM(s))}. Em que posso ajudar?`, MESTRE)
    }
    const titulos = TOPICOS_MESTRE.map((t) => t.titulo)
    for (;;) {
      const r = await ctx.ask('Escolhe um tema:', [...titulos, 'ADEUS'], MESTRE, titulos.length)
      if (r === titulos.length) return ctx.say('Lembra-te: gasta menos do que ganhas, e o tempo faz o resto.', MESTRE)
      await ctx.say(TOPICOS_MESTRE[r].linhas(ctx.estado()), MESTRE)
    }
  },

  async amigos(ctx) {
    const quem = 'Rui e Inês'
    const s = ctx.estado()
    const jantar = round2(25 * s.indicePrecos)
    const bowling = round2(12 * s.indicePrecos)
    const r = await ctx.ask(
      `Bicicleta e jantar (${euros(jantar)}), bowling (${euros(bowling)}) ou só um passeio (grátis)?`,
      ['BICICLETA E JANTAR', 'BOWLING', 'SÓ O PASSEIO', 'NÃO'],
      quem,
      3,
    )
    if (r === 3) return ctx.say('Combinado, fica para a próxima!', quem)
    const preco = r === 0 ? jantar : r === 1 ? bowling : 0
    if (preco > 0) {
      if (s.conta < preco) return ctx.say(`Não tens ${euros(preco)} na conta. Vamos só passear!`, quem)
      mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - preco) }))
    }
    const jogo = await ctx.jogar(r === 1 ? 'bowling' : 'bicicleta')
    const ganho = comFlag(ctx, `amigos_${s.mes}`) ? 0 : r === 2 ? 3 : 6
    if (ganho) stats(ctx, r === 1 ? { relacoes: ganho } : { relacoes: ganho, saude: 2 })
    await ctx.say(
      [`${r === 1 ? 'Que noite!' : 'Que passeio!'} (${jogo.texto})`, ganho ? `Relações +${ganho}${r === 1 ? '' : ' · Saúde +2'}${preco ? ` · -${euros(preco)}` : ''}.` : 'Já tinham estado juntos este mês, mas soube bem na mesma.'],
      quem,
    )
  },

  async duarte(ctx) {
    const quem = 'Duarte'
    const r = await ctx.ask('Futebol de 5 com o pessoal? O campo é público.', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Quando quiseres!', quem)
    const jogo = await ctx.jogar('futebol')
    const s = ctx.estado()
    const ganho = comFlag(ctx, `futebol_${s.mes}`) ? 0 : 5
    if (ganho) stats(ctx, { saude: ganho, relacoes: 2 })
    await ctx.say([`${jogo.texto}!`, ganho ? 'Exercício grátis! Saúde +5 · Relações +2.' : 'Já jogaste este mês, mas foi divertido!'], quem)
  },

  async finfluencer(ctx) {
    const quem = 'Kiko'
    await ctx.say(['Lembras-te de mim? Agora vendo um CURSO DE TRADING!', 'Fica rico em 30 dias: só 497€! Eu ganho 10.000€ por mês a fazer trading!'], quem)
    const r = await ctx.ask('O que fazes?', ['COMPRAR O CURSO', 'MOSTRA OS RESULTADOS', 'IGNORAR'], undefined, 2)
    if (r === 0) {
      const s = ctx.estado()
      if (s.conta < 497) return ctx.say('Não tens 497€ na conta. Ainda bem.')
      mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - 497), flags: [...x.flags, 'curso_trading'] }))
      return ctx.say(['Compraste o curso: vídeos genéricos e um grupo onde te mandam comprar LuaCoin.', 'Quem ganha dinheiro com o curso é quem o vende. -497€.'])
    }
    if (r === 1) {
      await ctx.say('Hã... os resultados são privados. Mas olha o meu carro!', quem)
      await ctx.say('Estudos com investidores reais mostram que a grande maioria de quem faz trading diário perde dinheiro. Desconfia de quem vende fórmulas.')
    }
  },

  async amelia(ctx) {
    const s = ctx.estado()
    await ctx.say(`Desde que te mudaste, os preços já subiram ${pct(s.indicePrecos - 1)}. Se o teu salário não sobe, na prática estás a ganhar menos.`, 'D. Amélia')
  },
}

async function explicarIrs(ctx: Ctx, quem: string) {
  await ctx.say(
    [
      'O IRS é o imposto sobre o rendimento. Todos os meses, a empresa retém uma parte do salário por conta do imposto do ano.',
      'Em abril, a declaração compara o que foi retido com o imposto que realmente deves. Se retiveram a mais, recebes a diferença; se a menos, pagas.',
      'O imposto é por escalões: quem ganha mais paga uma percentagem maior sobre a parte que ganha a mais.',
    ],
    quem,
  )
}

/** Compras do mês com o mini-jogo: seguir a lista baixa a conta do supermercado do mês seguinte. */
async function compras(ctx: Ctx) {
  const s = ctx.estado()
  if (s.casa === 'pais') return ctx.say('Em casa dos pais, as compras são com eles.')
  if (comFlag(ctx, `compras_${s.mes}`)) return ctx.say('Já fizeste as compras deste mês.')
  const jogo = await ctx.jogar('supermercado')
  const impulso = round2(jogo.valor ?? 0)
  mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - impulso), flags: jogo.pontos >= 5 ? [...x.flags, `lista_${x.mes + 1}`] : x.flags }))
  await ctx.say([
    `${jogo.texto}.`,
    jogo.pontos >= 5
      ? 'Seguiste a lista: no próximo mês o supermercado fica 10% mais barato.'
      : 'Faltaram coisas da lista: vais ter de voltar ao supermercado e acabas por gastar mais.',
    impulso > 0 ? `As compras por impulso custaram ${euros(impulso)}. Pequenas compras somam-se!` : 'Nenhuma compra por impulso. Muito bem!',
  ])
}

/** Mudar de emprego: candidatura, entrevista e novo salário a partir do mês seguinte. */
async function procurarEmprego(ctx: Ctx) {
  const s = ctx.estado()
  const ultima = s.flags.filter((f) => f.startsWith('mudou_')).map((f) => Number(f.slice(6)))
  if (ultima.some((m) => s.mes - m < 6)) return ctx.say('Mudaste de emprego há pouco tempo. Espera uns meses antes de voltar a mudar.')
  const outras = LISTA_PROFISSOES.filter((p) => p !== s.profissao)
  await ctx.say(`Agora trabalhas como ${PROFISSOES[s.profissao].nome} (${euros(s.salarioBruto)} brutos). Há estas vagas:`)
  const escolha = await escolherProfissao(ctx, outras, 'Candidatas-te a qual?', true)
  if (!escolha) return
  const d = PROFISSOES[escolha]
  const quem = d.chefe
  const n = await ctx.ask('Candidatar mesmo? Se te aceitarem, começas lá no próximo mês.', ['SIM', 'NÃO'], undefined, 1)
  if (n !== 0) return
  await ctx.say('Entrevista de emprego...', quem)
  const r1 = await ctx.ask('Porque queres trabalhar connosco?', ['QUERO APRENDER E CRESCER', 'SÓ PELO DINHEIRO', 'NÃO SEI BEM'], quem)
  const r2 = await ctx.ask('Qual é o teu maior defeito?', ['SOU PERFECCIONISTA', 'ÀS VEZES DESORGANIZO-ME, MAS ESTOU A MELHORAR', 'NÃO TENHO DEFEITOS'], quem)
  const pontos = (r1 === 0 ? 2 : r1 === 1 ? 1 : 0) + (r2 === 1 ? 2 : r2 === 0 ? 1 : 0) + (s.stats.carreira >= 50 ? 1 : 0)
  if (pontos < 2) {
    return ctx.say(['Agradecemos a candidatura, mas escolhemos outra pessoa.', 'Numa entrevista, mostra vontade de aprender e fala com honestidade sobre os teus defeitos.'], quem)
  }
  aplicarProfissao(ctx, escolha, true)
  mudar(ctx, (x) => ({ ...x, flags: [...x.flags, `mudou_${x.mes}`] }))
  await ctx.say(
    [`Ficas com o lugar! Começas como ${d.nome}: ${euros(d.salario)} brutos${d.gorjetas ? ' mais gorjetas' : ''}.`, 'Mudar de área tem um custo: a tua Carreira desce um pouco enquanto aprendes. -10 Carreira.'],
    quem,
  )
}

const ACOES_OBJETO: Record<string, (ctx: Ctx) => Promise<void>> = {
  async cama(ctx) {
    const r = await ctx.ask('Queres ir dormir? Vai passar um mês.', ['SIM', 'NÃO'], undefined, 1)
    if (r === 0) await dormir(ctx)
  },

  async pc(ctx) {
    const r = await ctx.ask('O teu computador. O que queres fazer?', ['VER O ORÇAMENTO', 'PROCURAR EMPREGO', 'NADA'], undefined, 2)
    if (r === 1) return procurarEmprego(ctx)
    if (r !== 0) return
    const s = ctx.estado()
    const sal = salarioLiquido(s)
    const fixas = totalFixas(s)
    const sobra = round2(sal.liquido - fixas - s.planoMensal)
    await ctx.say([
      `RECIBO DE VENCIMENTO: bruto ${euros(sal.bruto)} - Segurança Social ${euros(sal.ss)} - retenção de IRS ${euros(sal.irs)} = líquido ${euros(sal.liquido)}.`,
      `DESPESAS FIXAS: ${euros(fixas)}.${s.planoMensal ? ` PLANO DE INVESTIMENTO: ${euros(s.planoMensal)}.` : ''}`,
      `SOBRA POR MÊS: ${euros(sobra)} (${pct(sobra / sal.liquido)} do líquido). Muitos especialistas sugerem poupar pelo menos 10% a 20%.`,
    ])
  },

  async tv(ctx) {
    await ctx.say(['Anúncio: "Crédito rápido! 5.000€ em 24 horas, sem papeladas!"', 'Crédito rápido costuma ter TAEG altíssima. Compara sempre a TAEG antes de assinar.'])
  },

  async livros(ctx) {
    await ctx.say('Um livro: "O investidor paciente". Primeiro capítulo: gasta menos do que ganhas.')
  },

  async maquina(ctx) {
    await ctx.say('A máquina de café. Continua igual a quando cá trabalhavas.')
  },

  async cotacoes(ctx) {
    const s = ctx.estado()
    const linhas = Object.values(ATIVO_M).map((a) => {
      const h = s.historicoPrecos[a.id]
      const ant = h.length > 1 ? h[h.length - 2] : h[0]
      return `${a.curto}: ${euros(s.precos[a.id])} (${pct(s.precos[a.id] / ant - 1)})`
    })
    await ctx.say(['Cotações deste mês:', ...linhas])
  },

  async cofre(ctx) {
    await ctx.say('O cofre do banco. Em Portugal, os depósitos estão garantidos até 100.000€ por pessoa e por banco.')
  },

  async multibanco(ctx) {
    const s = ctx.estado()
    await ctx.say(`MULTIBANCO. Conta: ${euros(s.conta)} · Depósito: ${euros(s.poupanca)}${s.divida ? ` · Dívida: ${euros(s.divida)}` : ''}.`)
  },

  async bola(ctx) {
    await ACOES_NPC.duarte(ctx)
  },

  async trabalhar(ctx) {
    await ctx.say('O teu posto de trabalho. Folhas de cálculo, reuniões e café. Para subir na Carreira, fala com a Eng.ª Sofia.')
  },

  async quadro_nexo(ctx) {
    await ctx.say(['No quadro:', 'OBJETIVOS DO ANO: entregar o projeto, formar a equipa, e "ninguém sai depois das 19h".'])
  },

  async cartaz_irs(ctx) {
    await ctx.say('Cartaz: "IRS — entrega de 1 de abril a 30 de junho. Entregar fora do prazo dá multa."')
  },

  async livros_fisco(ctx) {
    await ctx.say('Códigos de impostos, cheios de artigos e alíneas. Ainda bem que há o IRS automático para muita gente.')
  },

  async montra_casas(ctx) {
    await ctx.say('Anúncios: "T2 com varanda: 250.000€". "Entrada mínima: 10%, mais impostos e escritura." Juntar a entrada é o primeiro passo.')
  },

  async prateleira(ctx) {
    const s = ctx.estado()
    await ctx.say(`Prateleiras cheias. Os preços estão ${pct(s.indicePrecos - 1)} acima de quando chegaste.`)
    if (s.casa !== 'pais' && !tem(ctx, `compras_${s.mes}`)) {
      const r = await ctx.ask('Fazer as compras do mês?', ['SIM', 'NÃO'], undefined, 1)
      if (r === 0) await compras(ctx)
    }
  },

  async treinar(ctx) {
    const s = ctx.estado()
    if (!s.ginasio) return ctx.say('Para usar as máquinas tens de te inscrever com o Nuno, ao balcão.')
    const jaTreinou = tem(ctx, `treino_${s.mes}`)
    const jogo = await ctx.jogar('ginasio')
    if (jaTreinou) return ctx.say([`${jogo.texto}.`, 'Já tinhas treinado a sério este mês, mas mexer o corpo nunca faz mal!'])
    comFlag(ctx, `treino_${s.mes}`)
    const ganho = Math.min(12, 4 + Math.floor(jogo.pontos / 2))
    stats(ctx, { saude: ganho })
    await ctx.say([`${jogo.texto}.`, `Um mês de treinos a sério. Saúde +${ganho}!`])
  },
}

export async function executarInteracaoMercado(i: Interacao, ctx: Ctx) {
  if (i.tipo === 'npc') return ACOES_NPC[i.npc.script]?.(ctx)
  if (i.tipo === 'prop' && i.prop.script) return ACOES_OBJETO[i.prop.script]?.(ctx)
  if (i.tipo === 'placa') return ctx.say(i.placa.texto)
  if (i.tipo === 'trancado') return ctx.say(i.texto)
}

// ---------------------------------------------------------------------------

async function dormir(ctx: Ctx, texto = 'Zzz... Passa um mês...') {
  await ctx.fade(1, 500)
  await ctx.say(texto)
  const antes = ctx.estado()
  const { estado: depois, noticia } = avancarMes(antes)
  ctx.definir(depois)
  ctx.levar('casa', 7, 3, 'down')
  await ctx.fade(0, 500)
  await manhaMercado(ctx, antes, depois, noticia)
  if (ctx.estado().gameOver) {
    await resumoFinalMercado(ctx)
    ctx.terminar()
  }
}

const AGENTE = 'Agente Pereira'

/** Trânsito: multa por atravessar fora da passadeira e hospital (com baixa médica) em caso de atropelamento. */
export const TRANSITO_MERCADO_SCRIPTS = {
  async foraPassadeira(ctx: Ctx) {
    const s = ctx.estado()
    if (!comFlag(ctx, 'aviso_passadeira')) {
      return ctx.say(['Atravessar fora da passadeira é perigoso: os carros só param nas passadeiras.', 'E os peões também podem levar multa! Desta vez é só um aviso.'], AGENTE)
    }
    if (tem(ctx, `multa_peao_${s.mes}`) || Math.random() > 0.35) return
    comFlag(ctx, `multa_peao_${s.mes}`)
    mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - 20) }))
    await ctx.say(['Outra vez fora da passadeira! Multa de 20€.', 'Pagar a tempo evita que fique mais cara. -20€.'], AGENTE)
  },

  async atropelado(ctx: Ctx) {
    await ctx.say('CUIDADO!!!')
    await ctx.fade(1, 400)
    await ctx.say(['Um carro não conseguiu travar...', 'Foste de ambulância para o hospital.'])
    const s = ctx.estado()
    const seguro = s.pagamentos.some((p) => p.id === 'seguro')
    const custo = seguro ? 30 : 250
    stats(ctx, { saude: -25, carreira: -3 })
    mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - custo), flags: [...x.flags, `baixa_${x.mes + 1}`] }))
    ctx.levar('hospital', 4, 4, 'right')
    await ctx.fade(0, 400)
    await ctx.say(
      [
        'Partiste uma perna. Vais ficar bem, mas precisas de um mês de recuperação.',
        'Vais estar de baixa médica: a Segurança Social paga só uma parte do salário (aqui, 70%).',
        seguro
          ? `A fisioterapia ficou em ${euros(custo)}, graças ao teu seguro de saúde.`
          : `A fisioterapia e os medicamentos custaram ${euros(custo)}. Um seguro de saúde teria ajudado.`,
        'Os carros só param nas passadeiras. Atravessa sempre nelas!',
      ],
      'Dra. Ana',
    )
    await dormir(ctx, 'Passas o mês a recuperar...')
  },
}

function valorCom(s: EstadoMercado, precos: Record<AtivoM, number>, id: AtivoM) {
  return s.unidades[id] * precos[id]
}

export async function manhaMercado(ctx: Ctx, antes: EstadoMercado, depois: EstadoMercado, noticia: Noticia) {
  await ctx.say(depois.gameOver ? `Chegaste ao fim dos 2 anos, ${depois.name}!` : `Novo mês: ${nomeMes(depois.mes)}. Mês ${depois.mes} de ${MESES}.`)

  const movs = depois.movimentos.filter((m) => m.valor !== 0).map((m) => `${m.texto} ${m.valor > 0 ? '+' : ''}${euros(m.valor)}`)
  await ctx.say([`Extrato do mês: ${movs.join(' · ')}.`, `Conta: ${euros(depois.conta)} · Depósito: ${euros(depois.poupanca)}${depois.divida > 0 ? ` · DÍVIDA: ${euros(depois.divida)}` : ''}.`], 'BANCO')
  if (depois.flags.includes(`tirou_poupanca_${depois.mes}`)) await ctx.say('O salário não chegou para as despesas: o banco foi buscar o resto ao teu depósito.', 'BANCO')
  if (depois.flags.includes(`divida_${depois.mes}`)) {
    await ctx.say(
      depois.cartaoCredito
        ? `Nem o depósito chegou: o resto foi para o cartão de crédito, que cobra ${pct(JURO_CARTAO_MES)} de juros por mês.`
        : 'Nem o depósito chegou: a conta ficou a descoberto, com multa de 20€ e juros. Revê o orçamento no painel!',
      'BANCO',
    )
  }
  if (depois.flags.includes(`plano_falhou_${depois.mes}`)) await ctx.say('O plano mensal não foi executado: não havia dinheiro na conta.', 'BANCO')
  if (emLayoff(depois)) await ctx.say('Ainda em lay-off: este mês recebeste 2/3 do salário.', 'BANCO')

  if (depois.mes === 9) await ctx.say('O banco baixou a taxa do depósito para 1,5% ao ano, porque o banco central desceu os juros.', 'BANCO')
  if (depois.mes === 4 || depois.mes === 16) await ctx.say('Começou o prazo do IRS! Vai às Finanças até ao fim de junho.', 'Mãe (mensagem)')
  if (depois.mes === 7 || depois.mes === 19) {
    const ano = anoDe(antes.mes)
    if (!depois.flags.includes(`irs_${ano}`)) {
      mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - 50), flags: [...x.flags, `irs_${ano}`, `irs_multa_${ano}`] }))
      await ctx.say('Não entregaste o IRS a tempo: as Finanças aplicaram uma multa de 50€ e fizeram a declaração por ti, sem o reembolso.', 'FINANÇAS')
    }
  }

  await ctx.say(`${noticia.titulo}. ${noticia.texto}`, 'NOTÍCIAS')
  const valorAntes = Object.values(ATIVO_M).reduce((t, a) => t + valorCom(antes, antes.precos, a.id), 0)
  const valorDepois = carteiraM(ctx.estado())
  if (valorAntes >= 5) await ctx.say(`A tua carteira valia ${euros(valorAntes)} e agora vale ${euros(valorDepois)} (${pct(valorDepois / valorAntes - 1)}).`, 'CORRETORA')
  await licoes(ctx, antes, ctx.estado())

  const { relacoes, saude, carreira } = ctx.estado().stats
  const menor = Math.min(relacoes, saude, carreira)
  if (menor < 30) {
    if (menor === saude) await ctx.say('Pareces sem energia. Ginásio, futebol no campo ou simplesmente descansar ajudam.', 'Mãe (mensagem)')
    else if (menor === relacoes) await ctx.say('Há muito que não te vemos! Vem almoçar cá a casa.', 'Mãe (mensagem)')
    else await ctx.say('A tua chefe acha que andas sem motivação. A Carreira está a descer.', 'Tiago')
  }

  if (!depois.gameOver) {
    const atual = ctx.estado()
    const ev = escolherEventoMercado(atual)
    await ctx.say(`Aconteceu uma coisa: ${ev.titulo}`)
    const op = ev.opcoes[await ctx.ask(ev.texto(atual), ev.opcoes.map((o) => o.label))]
    const { estado, texto } = op.aplicar(ctx.estado())
    ctx.definir({ ...estado, flags: [...estado.flags, `ev_${ev.id}`] })
    await ctx.say(texto)
    if (op.conquista) await ctx.cracha(op.conquista)
    if (ev.id === 'avaliacao' && ctx.estado().flags.includes('aumento')) await ctx.cracha('aumento')
  }
  await verificarConquistasM(ctx)
}

async function licoes(ctx: Ctx, antes: EstadoMercado, depois: EstadoMercado) {
  const mes = depois.mes
  const tinha = (id: AtivoM) => valorCom(antes, antes.precos, id) >= 5
  if (mes === 5) {
    await ctx.say(
      tinha('lua')
        ? [`A LuaCoin afundou e perdeste ${euros(valorCom(antes, antes.precos, 'lua') - valorAtivoM(depois, 'lua'))}.`, 'Bolhas especulativas acabam sempre assim para quem entra no fim.']
        : 'A LuaCoin afundou 65%. Quem comprou com crédito ainda vai pagar as prestações durante muito tempo.',
      MESTRE,
    )
  }
  if (mes === 7) {
    const exposto = ACOES_M.some(tinha)
    await ctx.say(
      [
        'Recessão! As bolsas caíram. Acontece, em média, de tantos em tantos anos.',
        exposto ? 'Os teus investimentos desceram. Se não precisas deste dinheiro nos próximos anos, a melhor decisão costuma ser não fazer nada.' : 'Para quem investe todos os meses, as crises são uma altura de comprar mais barato.',
      ],
      MESTRE,
    )
    if (exposto) comFlag(ctx, 'na_crise')
  }
  if (mes === 11 && tem(ctx, 'na_crise') && !tem(ctx, 'vendeu_crise') && ACOES_M.some((id) => valorAtivoM(depois, id) >= 5)) {
    await ctx.say('A economia volta a crescer e tu não vendeste em pânico. Muito bem!', MESTRE)
    await ctx.cracha('mao_firme')
  }
  if (mes === 13 && depois.jurosPagos === 0 && !depois.flags.includes('credito_pessoal')) {
    await ctx.say('Um ano inteiro sem pagar um cêntimo de juros de dívidas!', MESTRE)
    await ctx.cracha('zero_juros')
  }
  if (mes === 14) {
    const brisa = valorCom(antes, antes.precos, 'brisa')
    if (brisa >= 5) {
      const so = ativosNaCarteiraM(antes).length === 1
      await ctx.say(
        so
          ? `A Brisa afundou 40% e era o teu único investimento: perdeste ${euros(brisa - valorAtivoM(depois, 'brisa'))}. Por isso se diversifica!`
          : `A Brisa afundou, mas era só uma parte da tua carteira. O resto segurou. É para isto que serve diversificar.`,
        MESTRE,
      )
    } else if (tinha('etf')) {
      await ctx.say('O escândalo da Brisa quase não se notou no ETF Mundo: lá dentro, é só uma de milhares de empresas.', MESTRE)
    }
  }
  if (mes === 18 && tinha('eco')) await ctx.say('A EcoVolt subiu com a moda e caiu quando os apoios acabaram. Comprar o que está "na moda" costuma ser comprar caro.', MESTRE)
}

export async function resumoFinalMercado(ctx: Ctx) {
  const s = ctx.estado()
  const total = patrimonioM(s)
  await ctx.say(
    [
      `${s.name}, passaram 2 anos desde o teu primeiro salário.`,
      `Património líquido: ${euros(total)} (conta ${euros(s.conta)}, depósito ${euros(s.poupanca)}, PPR ${euros(s.ppr)}, investimentos ${euros(carteiraM(s))}${s.divida + dividaPrestacoes(s) > 0 ? `, menos ${euros(s.divida + dividaPrestacoes(s))} de dívidas` : ''}).`,
      total >= META_CASA ? 'Tens a entrada da casa! Agora é escolher bem o crédito à habitação.' : `Faltaram ${euros(META_CASA - total)} para a entrada da casa. O mais importante é o hábito, e esse já começou.`,
      `Pagaste ${euros(s.impostoPago)} de impostos sobre investimentos e juros, e ${euros(s.jurosPagos)} de juros de dívidas.`,
      `Conquistas: ${s.crachas.length} de ${CONQUISTAS_MERCADO.length}.`,
      'Lembra-te: isto foi uma simulação com ativos inventados e valores simplificados. Não é aconselhamento financeiro. Na vida real, informa-te bem e compara sempre custos e riscos.',
    ],
    MESTRE,
  )
}

export { objetivoMercado }
