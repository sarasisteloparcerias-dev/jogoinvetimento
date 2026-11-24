import { clamp } from '../data'
import { carteiraM, nomeMes, patrimonioM, salarioLiquido, totalFixas } from '../mercado/economia'
import { executarInteracaoCasa, TRANSITO_MERCADO_SCRIPTS, type CtxMercado } from '../mercado/scripts'
import type { EstadoMercado, StatsAdulto } from '../mercado/tipos'
import type { Interacao } from '../world/motor'
import { CONQUISTAS_NEGOCIO } from './conquistas'
import {
  avancarMesNegocio,
  BONUS_TURNO,
  capacidadeMes,
  CONTABILISTA,
  custoFuncionario,
  custosFixos,
  euros,
  FALENCIA,
  FUNDO_MANEIO,
  LIMITE_DESCOBERTO,
  LISTA_NEGOCIOS,
  MAX_TURNOS_DONO,
  MESES_NEGOCIO,
  mesDeSubsidio,
  NEGOCIOS,
  NOMES_PRECO,
  novoNegocio,
  PRAZO_EMPRESTIMO,
  prestacaoEmprestimo,
  procuraMes,
  receitaExtra,
  round2,
  SALARIO_MINIMO,
  TAXA_EMPRESTIMO,
  TAXA_IRC,
  TSU_EMPRESA,
  valorLiquidoEmpresa,
  type EstadoNegocio,
  type Funcionario,
  type RelatorioNegocio,
  type TipoNegocio,
} from './economia'
import { escolherEventoNegocio } from './eventos'

type Ctx = CtxMercado

const MESTRE = 'Mestre Moedas'
const JOANA = 'Dra. Joana'
const MAX_EQUIPA = 6

function mudar(ctx: Ctx, f: (s: EstadoMercado) => EstadoMercado) {
  ctx.definir(f(ctx.estado()))
}

function mudarN(ctx: Ctx, f: (n: EstadoNegocio) => EstadoNegocio) {
  mudar(ctx, (s) => ({ ...s, negocio: f(s.negocio!) }))
}

function neg(ctx: Ctx) {
  return ctx.estado().negocio!
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

const pctN = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('pt-PT')}%`
const num = (n: number) => Math.round(n).toLocaleString('pt-PT')

// ---------------------------------------------------------------------------
// Abrir a empresa

async function escolherNegocio(ctx: Ctx): Promise<TipoNegocio> {
  for (;;) {
    const r = await ctx.ask(
      'Que negócio queres abrir?',
      [...LISTA_NEGOCIOS.map((t) => `${NEGOCIOS[t].nome.toUpperCase()} (${euros(NEGOCIOS[t].investimento)})`), 'COMPARAR'],
      MESTRE,
    )
    if (r < LISTA_NEGOCIOS.length) return LISTA_NEGOCIOS[r]
    await ctx.say(LISTA_NEGOCIOS.flatMap((t) => NEGOCIOS[t].descricao), MESTRE)
  }
}

/** Tira dinheiro das contas pessoais (primeiro do depósito, depois da conta). */
function tirarPessoal(s: EstadoMercado, valor: number): EstadoMercado {
  const doDeposito = Math.min(s.poupanca, valor)
  return { ...s, poupanca: round2(s.poupanca - doDeposito), conta: round2(s.conta - (valor - doDeposito)) }
}

export async function tutorialNegocio(ctx: Ctx) {
  let s = ctx.estado()
  await ctx.say(
    [
      s.flags.includes('veio_da_casa') ? `${s.name}, chegaste à última fase. Está na hora de criar o teu próprio negócio!` : `${s.name}! Boas-vindas à última fase: o teu próprio negócio!`,
      'Ter uma empresa é muito diferente de ter um salário: ninguém te paga ao fim do mês. Tu é que pagas aos outros!',
      'Vais ter de pagar ordenados (e a Segurança Social da empresa), renda, fornecedores, IVA, IRC e o empréstimo. E só no fim ficas com o que sobra.',
      'Primeiro: que negócio vai ser?',
    ],
    MESTRE,
  )
  const tipo = await escolherNegocio(ctx)
  const def = NEGOCIOS[tipo]
  const total = def.investimento + FUNDO_MANEIO
  s = ctx.estado()
  const disponivel = Math.max(0, round2(s.conta + s.poupanca - 1500))
  await ctx.say(
    [
      `${def.nome}: ${euros(def.investimento)} de obras e equipamento, mais ${euros(FUNDO_MANEIO)} de fundo de maneio (dinheiro na caixa para os primeiros meses). Total: ${euros(total)}.`,
      `Tens ${euros(s.conta + s.poupanca)} entre conta e depósito. Deixa sempre algum para ti: aqui contam ${euros(disponivel)}.`,
      `O resto pede-se ao banco: ${pctN(TAXA_EMPRESTIMO)} ao ano, a ${PRAZO_EMPRESTIMO / 12} anos. Quanto mais pedires, maior a prestação todos os meses.`,
      ...(s.hipoteca
        ? ['Como compraste casa, o banco vai pedir uma garantia pessoal: se a empresa falhar, a dívida pode cair sobre ti. Por isso, não arrisques mais do que podes perder.']
        : []),
      ...(s.flags.includes('passado_bebe') ? ['E com um filho pequeno em casa, convém não pôr todas as poupanças na empresa.'] : []),
    ],
    MESTRE,
  )
  const opcoes = [0.2, 0.5, 1]
    .map((f) => Math.round(total * f))
    .filter((v) => v <= disponivel)
  let proprio: number
  if (!opcoes.length) {
    proprio = Math.floor(disponivel / 100) * 100
    await ctx.say(
      [
        `Não tens os 20% que o banco costuma pedir. Os teus pais ficam como fiadores e o banco aceita: pões ${euros(proprio)} e pedes o resto.`,
        'Começar com muito crédito é arriscado: a prestação tem de se pagar mesmo nos meses maus.',
      ],
      MESTRE,
    )
  } else {
    const r = await ctx.ask(
      'Quanto pões do teu dinheiro?',
      opcoes.map((v) => (v >= total ? `TUDO MEU (${euros(v)})` : `${euros(v)} E O BANCO ${euros(total - v)} (${euros(prestacaoEmprestimo(total - v))}/MÊS)`)),
      MESTRE,
    )
    proprio = opcoes[r]
  }
  const emprestimo = round2(total - proprio)
  mudar(ctx, (x) => ({
    ...tirarPessoal(x, proprio),
    nivel: 'negocio',
    mes: 1,
    profissao: 'escritorio',
    salarioBruto: SALARIO_MINIMO,
    negocio: novoNegocio(tipo, proprio, emprestimo),
    // marcado já aqui: se o jogo for gravado a meio da conversa, a empresa não é criada duas vezes
    flags: [...x.flags, 'tutorial'],
  }))
  await ctx.say(
    [
      emprestimo > 0 ? `Feito! Puseste ${euros(proprio)} e o banco emprestou ${euros(emprestimo)}: ${euros(prestacaoEmprestimo(emprestimo))} por mês durante ${PRAZO_EMPRESTIMO / 12} anos.` : `Feito! Pagaste tudo com o teu dinheiro: não há prestação, mas as tuas poupanças ficaram mais curtas.`,
      `Despediste-te da Nexo. A tua loja é no prédio onde trabalhavas, agora com o letreiro EMPRESA. Lá dentro tens o computador de gestão, o balcão e a Dra. Joana, a contabilista (${euros(CONTABILISTA)}/mês, obrigatória para as empresas).`,
      `O teu ordenado de gerente começa no salário mínimo (${euros(SALARIO_MINIMO)} brutos). Mas atenção: o dono é sempre o último a receber. Se a caixa não chegar, não recebes.`,
      'Primeiras tarefas: contratar a equipa e escolher os preços, no computador da loja. Quando o mês acabar, dorme em casa e a Dra. Joana mostra-te as contas.',
      `Objetivo: chegar ao fim de ${MESES_NEGOCIO} meses com lucro e sem salários em atraso. Valores simplificados, como sempre. Boa sorte, ${ctx.estado().name}!`,
    ],
    MESTRE,
  )
  comFlag(ctx, 'tutorial')
  await ctx.cracha('empresa')
}

// ---------------------------------------------------------------------------
// Gestão (computador da loja)

function previsao(n: EstadoNegocio, mes: number) {
  const procura = procuraMes(n, mes)
  const capacidade = capacidadeMes(n, mes)
  const def = NEGOCIOS[n.tipo]
  let conselho = 'A equipa chega para a procura prevista.'
  if (procura > capacidade * 1.05) conselho = `Vão ficar uns ${num(procura - capacidade)} ${def.cliente} por servir: filas fazem a reputação descer.`
  else if (capacidade > procura * 1.4) conselho = 'A equipa vai estar muitas vezes parada: há gente a mais para a procura.'
  return `Previsão para ${nomeMes(mes).split(' ·')[0]}: uns ${num(procura)} ${def.cliente}; a equipa consegue servir ${num(capacidade)}. ${conselho}`
}

async function resumoEmpresa(ctx: Ctx) {
  const s = ctx.estado()
  const n = s.negocio!
  const def = NEGOCIOS[n.tipo]
  const equipa = n.funcionarios.length
    ? n.funcionarios.map((f) => `${f.nome} (${euros(f.salario)}${f.ate ? `, até ${nomeMes(f.ate).split(' ·')[0]}` : ''})`).join(', ')
    : 'ninguém (só tu)'
  await ctx.say(
    [
      `${def.nome.toUpperCase()}. Caixa: ${euros(n.caixa)}. IVA guardado para o Estado: ${euros(Math.max(0, n.ivaPorEntregar))}.${n.emprestimo ? ` Empréstimo: faltam ${euros(n.emprestimo.divida)}.` : ''}`,
      `Equipa: ${equipa}. Preços: ${NOMES_PRECO[n.preco]}. Marketing: ${euros(n.marketing)}/mês. O teu ordenado: ${euros(n.salarioGerente)} brutos.`,
      `Custos fixos por mês: ${euros(custosFixos(n))} (sem contar os produtos). Reputação: ${n.reputacao}/100.`,
      previsao(n, s.mes),
    ],
    'COMPUTADOR',
  )
}

async function contratar(ctx: Ctx) {
  const n = neg(ctx)
  if (n.funcionarios.length >= MAX_EQUIPA) return ctx.say(`A loja não tem espaço para mais de ${MAX_EQUIPA} pessoas.`, 'COMPUTADOR')
  if (!n.candidatos.length) return ctx.say('Não há mais candidatos este mês. Volta no próximo.', 'COMPUTADOR')
  const r = await ctx.ask(
    'Candidaturas deste mês:',
    [...n.candidatos.map((c) => `${c.nome.toUpperCase()}: ${c.perfil.toUpperCase()}, ${euros(c.salario)}`), 'VOLTAR'],
    'COMPUTADOR',
    n.candidatos.length,
  )
  if (r >= n.candidatos.length) return
  const c = n.candidatos[r]
  await ctx.say(
    [
      `${c.nome}: ${c.perfil}. Serve uns ${num(c.produtividade)} ${NEGOCIOS[n.tipo].cliente} por mês.`,
      `Salário: ${euros(c.salario)} brutos. Com a TSU (${pctN(TSU_EMPRESA)}), custa à empresa ${euros(custoFuncionario(c))} por mês, e o dobro em junho e novembro (subsídios).`,
    ],
    'COMPUTADOR',
  )
  const t = await ctx.ask('Que contrato?', ['SEM TERMO', 'A TERMO (3 MESES)', 'AFINAL NÃO'], 'COMPUTADOR', 2)
  if (t === 2) return
  const mes = ctx.estado().mes
  const novo: Funcionario = { ...c, ate: t === 1 ? mes + 2 : null }
  mudarN(ctx, (x) => ({ ...x, funcionarios: [...x.funcionarios, novo], candidatos: x.candidatos.filter((k) => k.id !== c.id) }))
  await ctx.say(
    t === 1
      ? `${c.nome} começa já, com contrato até ${nomeMes(mes + 2).split(' ·')[0]}. Contratos a termo servem para picos de trabalho, como o verão ou o Natal.`
      : `${c.nome} faz agora parte da equipa! Contrato sem termo: para despedir é preciso pagar compensação.`,
    'COMPUTADOR',
  )
  if (neg(ctx).funcionarios.length >= 2) await ctx.cracha('emprego')
}

async function despedir(ctx: Ctx) {
  const n = neg(ctx)
  if (!n.funcionarios.length) return ctx.say('Não tens ninguém contratado.', 'COMPUTADOR')
  const r = await ctx.ask('Quem sai da equipa?', [...n.funcionarios.map((f) => `${f.nome.toUpperCase()} (${euros(f.salario)})`), 'NINGUÉM'], 'COMPUTADOR', n.funcionarios.length)
  if (r >= n.funcionarios.length) return
  const f = n.funcionarios[r]
  await ctx.say(
    [
      'Despedir não é só deixar de pagar: há aviso prévio, férias por gozar e compensação. Aqui, simplificado: um salário.',
      `Despedir ${f.nome} custa ${euros(f.salario)} agora.`,
    ],
    'COMPUTADOR',
  )
  if ((await ctx.ask('Confirmas?', ['SIM', 'NÃO'], 'COMPUTADOR', 1)) !== 0) return
  mudarN(ctx, (x) => ({
    ...x,
    funcionarios: x.funcionarios.filter((k) => k.id !== f.id),
    extrasMes: [...x.extrasMes, { texto: `Compensação (${f.nome})`, valor: f.salario }],
    despedimentos: x.despedimentos + 1,
    reputacao: clamp(x.reputacao - 2),
  }))
  await ctx.say(`${f.nome} saiu. A equipa ficou um pouco desmotivada (reputação -2).`, 'COMPUTADOR')
}

async function mudarPrecos(ctx: Ctx) {
  const n = neg(ctx)
  const def = NEGOCIOS[n.tipo]
  await ctx.say(
    [
      `Preço médio por cliente (com IVA): BAIXO ${euros(def.ticket[0])}, MÉDIO ${euros(def.ticket[1])}, ALTO ${euros(def.ticket[2])}.`,
      'Preços baixos trazem mais clientes, mas ganhas menos em cada venda e precisas de mais equipa. Preços altos afastam clientes e, se o serviço não for excelente, a reputação desce.',
    ],
    'COMPUTADOR',
  )
  const r = await ctx.ask('Que preços?', [...NOMES_PRECO, 'FICA COMO ESTÁ'], 'COMPUTADOR', 3)
  if (r === 3) return
  mudarN(ctx, (x) => ({ ...x, preco: r as 0 | 1 | 2 }))
  await ctx.say(`Preços: ${NOMES_PRECO[r]}. ${previsao(neg(ctx), ctx.estado().mes)}`, 'COMPUTADOR')
}

async function mudarMarketing(ctx: Ctx) {
  const valores = [0, 100, 200, 400]
  const r = await ctx.ask('Quanto gastar em publicidade por mês?', [...valores.map((v) => `${v}€`), 'FICA COMO ESTÁ'], 'COMPUTADOR', valores.length)
  if (r >= valores.length) return
  mudarN(ctx, (x) => ({ ...x, marketing: valores[r] }))
  await ctx.say(['Publicidade traz clientes novos, mas cada euro a mais traz menos do que o anterior.', previsao(neg(ctx), ctx.estado().mes)], 'COMPUTADOR')
}

async function mudarOrdenado(ctx: Ctx) {
  const valores = [0, SALARIO_MINIMO, 1200, 1600]
  await ctx.say(
    [
      'O teu ordenado de gerente sai da caixa da empresa, com TSU, como o de toda a gente. É com ele que pagas a tua casa e as tuas contas.',
      'Ordenado alto: vives melhor, mas a empresa fica com menos folga. Ordenado zero: a empresa respira, mas as tuas poupanças vão-se.',
    ],
    'COMPUTADOR',
  )
  const r = await ctx.ask('Quanto te pagas (bruto)?', [...valores.map((v) => euros(v)), 'FICA COMO ESTÁ'], 'COMPUTADOR', valores.length)
  if (r >= valores.length) return
  mudarN(ctx, (x) => ({ ...x, salarioGerente: valores[r] }))
  mudar(ctx, (x) => ({ ...x, salarioBruto: valores[r] }))
  const s = ctx.estado()
  await ctx.say(
    valores[r] > 0
      ? `Recebes ${euros(salarioLiquido(s).liquido)} líquidos por mês (se a caixa chegar). As tuas despesas fixas pessoais são ${euros(totalFixas(s))}.`
      : `Sem ordenado, as tuas despesas pessoais (${euros(totalFixas(s))} por mês) saem das tuas poupanças.`,
    'COMPUTADOR',
  )
}

async function porDinheiro(ctx: Ctx) {
  const s = ctx.estado()
  const valores = [1000, 2500, 5000].filter((v) => v <= s.conta + s.poupanca)
  if (!valores.length) return ctx.say('Não tens dinheiro pessoal para pôr na empresa.', 'COMPUTADOR')
  await ctx.say(
    'Podes emprestar dinheiro teu à empresa (chama-se suprimentos). Ajuda nos meses maus, mas arriscas as tuas poupanças: se a empresa falhar, esse dinheiro pode não voltar.',
    'COMPUTADOR',
  )
  const r = await ctx.ask('Quanto pões na empresa?', [...valores.map((v) => euros(v)), 'NADA'], 'COMPUTADOR', valores.length)
  if (r >= valores.length) return
  const v = valores[r]
  mudar(ctx, (x) => ({ ...tirarPessoal(x, v), negocio: { ...x.negocio!, caixa: round2(x.negocio!.caixa + v), capitalProprio: round2(x.negocio!.capitalProprio + v) } }))
  await ctx.say(`Puseste ${euros(v)} na empresa. Caixa: ${euros(neg(ctx).caixa)}.`, 'COMPUTADOR')
  await verificarConquistasNegocio(ctx)
}

async function gestao(ctx: Ctx) {
  for (;;) {
    const r = await ctx.ask(
      'GESTÃO DA EMPRESA',
      ['RESUMO E PREVISÃO', 'CONTRATAR', 'DESPEDIR', 'PREÇOS', 'PUBLICIDADE', 'O TEU ORDENADO', 'PÔR DINHEIRO MEU', 'SAIR'],
      'COMPUTADOR',
      7,
    )
    if (r === 7) return
    await [resumoEmpresa, contratar, despedir, mudarPrecos, mudarMarketing, mudarOrdenado, porDinheiro][r](ctx)
  }
}

async function turno(ctx: Ctx) {
  const n = neg(ctx)
  const def = NEGOCIOS[n.tipo]
  if (n.turnos >= MAX_TURNOS_DONO) return ctx.say(`Já fizeste ${MAX_TURNOS_DONO} turnos extra este mês. Também precisas de descansar (e de gerir)!`)
  const r = await ctx.ask(
    `Fazer um turno extra? Serves mais uns ${BONUS_TURNO} ${def.cliente} este mês. (${n.turnos}/${MAX_TURNOS_DONO})`,
    [n.tipo === 'entregas' ? 'FAZER ENTREGAS' : 'SERVIR AO BALCÃO', 'FICAR NA CAIXA (TROCOS)', 'AGORA NÃO'],
    undefined,
    2,
  )
  if (r === 2) return
  const jogo = await ctx.jogar(r === 0 ? def.minijogo : 'troco_euros')
  mudarN(ctx, (x) => ({ ...x, turnos: x.turnos + 1 }))
  stats(ctx, { saude: -2, relacoes: -1 })
  await ctx.say([`${jogo.texto}.`, 'Turno feito! A equipa e os clientes gostam de ver o dono ao balcão (a reputação sobe no fim do mês). Mas cansa: Saúde -2.'])
}

// ---------------------------------------------------------------------------
// Conversas

const TOPICOS_JOANA: { titulo: string; linhas: (s: EstadoMercado) => string[] }[] = [
  {
    titulo: 'O QUE É O IVA?',
    linhas: (s) => {
      const def = NEGOCIOS[s.negocio!.tipo]
      return [
        `Quando vendes, cobras IVA ao cliente (${pctN(def.iva)} no teu caso). Esse dinheiro não é teu: é do Estado.`,
        'Quando compras aos fornecedores, também pagas IVA. De 3 em 3 meses entregas ao Estado a diferença: IVA cobrado menos IVA pago.',
        'Erro clássico: ver a caixa cheia, gastar... e no fim do trimestre não ter para o IVA.',
      ]
    },
  },
  {
    titulo: 'SALÁRIOS E TSU',
    linhas: () => [
      `Por cada salário, a empresa paga mais ${pctN(TSU_EMPRESA)} à Segurança Social: é a TSU. Um salário de ${euros(1000)} custa ${euros(1000 * (1 + TSU_EMPRESA))}.`,
      'O trabalhador também desconta 11% para a Segurança Social, e retenção de IRS, mas isso sai do salário bruto dele.',
      `O salário mínimo é de ${euros(SALARIO_MINIMO)}. Ninguém pode ganhar menos do que isso a tempo inteiro.`,
    ],
  },
  {
    titulo: 'SUBSÍDIOS',
    linhas: () => [
      'Em Portugal, há 14 salários por ano: 12 meses mais o subsídio de férias (pago em junho) e o de Natal (em novembro).',
      'Nesses meses, a empresa paga o dobro em salários e TSU. Uma boa gestora guarda um bocadinho todos os meses para eles.',
    ],
  },
  {
    titulo: 'IRC',
    linhas: () => [
      `O IRC é o imposto sobre o lucro da empresa. Aqui, simplificado: ${pctN(TAXA_IRC)} do lucro do ano, pago em dezembro.`,
      'Se a empresa tiver prejuízo, não paga IRC. Mas atenção: ter prejuízo para não pagar impostos é uma péssima ideia!',
    ],
  },
  {
    titulo: 'LUCRO OU CAIXA?',
    linhas: () => [
      'Lucro é o que a empresa ganhou: vendas menos custos. Caixa é o dinheiro que está na conta.',
      'Não são a mesma coisa! O IVA entra na caixa mas não é lucro. A parte do empréstimo que pagas sai da caixa mas não é um custo.',
      'Há empresas com lucro que fecham por falta de caixa. Por isso se vigiam as duas.',
    ],
  },
  {
    titulo: 'COMO VAI A EMPRESA?',
    linhas: (s) => {
      const n = s.negocio!
      const ult = n.historico[n.historico.length - 1]
      const fixos = custosFixos(n)
      const meses = fixos > 0 ? n.caixa / fixos : 0
      const l = [
        ult
          ? `No último mês: ${num(ult.clientes)} ${NEGOCIOS[n.tipo].cliente}, ${ult.lucro >= 0 ? 'lucro' : 'prejuízo'} de ${euros(Math.abs(ult.lucro))}. No ano: ${euros(n.lucroAno)}.`
          : 'Ainda não fechámos nenhum mês. Volta depois de dormires.',
        `A caixa (${euros(n.caixa)}) dá para ${meses > 0 ? meses.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : '0'} meses de custos fixos.`,
      ]
      if (ult && ult.procura > ult.capacidade * 1.05) l.push('Ficaram clientes por servir: talvez precises de mais alguém na equipa.')
      else if (ult && ult.capacidade > ult.procura * 1.4) l.push('Tens capacidade a mais para a procura: a equipa custa mais do que rende.')
      if (n.reputacao < 40) l.push('A reputação está baixa. Bom serviço, preços justos e turnos teus ao balcão ajudam.')
      if (mesDeSubsidio(s.mes)) l.push('Este mês há subsídio: os salários contam a dobrar!')
      return l
    },
  },
]

async function contabilista(ctx: Ctx) {
  const titulos = TOPICOS_JOANA.map((t) => t.titulo)
  await ctx.say(`Olá, ${ctx.estado().name}! Sou a tua contabilista certificada: trato das contas e dos impostos da empresa.`, JOANA)
  for (;;) {
    const r = await ctx.ask('Pergunta-me o que quiseres:', [...titulos, 'ADEUS'], JOANA, titulos.length)
    if (r === titulos.length) return ctx.say('Até já! E guarda sempre as faturas.', JOANA)
    await ctx.say(TOPICOS_JOANA[r].linhas(ctx.estado()), JOANA)
  }
}

async function mestreNegocio(ctx: Ctx) {
  const s = ctx.estado()
  const n = s.negocio!
  await ctx.say(
    [
      `${s.name}, a tua empresa vale hoje uns ${euros(valorLiquidoEmpresa(n))}: caixa e equipamento, menos o que deve ao banco e ao Estado.`,
      'Três conselhos de quem já viu muitas empresas: separa sempre o teu dinheiro do da empresa; conhece bem os teus custos fixos; e guarda caixa para os meses maus.',
      'Muitas empresas fecham nos primeiros anos, e quase sempre por falta de caixa, não por falta de clientes.',
    ],
    MESTRE,
  )
}

async function ritaNegocio(ctx: Ctx) {
  const n = neg(ctx)
  const quem = 'Rita'
  if (!n.emprestimo) return ctx.say('A tua empresa não tem empréstimos connosco. Se precisares, a conta corrente da empresa aguenta um descoberto até 5.000€, com juros.', quem)
  await ctx.say(
    [
      `O empréstimo da empresa: faltam ${euros(n.emprestimo.divida)}, ${euros(n.emprestimo.prestacao)} por mês (${pctN(TAXA_EMPRESTIMO)} ao ano).`,
      'Se a empresa tiver caixa a mais, pode amortizar: paga menos juros no total.',
    ],
    quem,
  )
  const valor = Math.min(2000, n.emprestimo.divida)
  if (n.caixa - valor < custosFixos(n)) return ctx.say('Para já, aconselho a guardares a caixa: ainda não tens folga para amortizar.', quem)
  const r = await ctx.ask(`Amortizar ${euros(valor)}?`, ['SIM', 'NÃO'], quem, 1)
  if (r !== 0) return
  mudarN(ctx, (x) => {
    const e = x.emprestimo!
    const divida = round2(e.divida - valor)
    return { ...x, caixa: round2(x.caixa - valor), emprestimo: divida > 0.5 ? { ...e, divida, prestacao: Math.min(e.prestacao, round2(divida)) } : null }
  })
  await ctx.say('Amortizado! Menos dívida, menos juros.', quem)
}

async function vascoNegocio(ctx: Ctx, i: Interacao) {
  const quem = 'Sr. Vasco'
  const r = await ctx.ask('Finanças. Assunto?', ['IVA DA EMPRESA', 'IRC', 'IRS (PESSOAL)', 'ADEUS'], quem, 3)
  if (r === 0) return ctx.say(['As empresas entregam o IVA de 3 em 3 meses. A tua contabilista prepara a declaração; tu só tens de ter o dinheiro na caixa.', 'Atrasos dão juros e coimas.'], quem)
  if (r === 1) return ctx.say([`O IRC é o imposto sobre o lucro das empresas. Aqui: ${pctN(TAXA_IRC)}, pago em dezembro.`, 'O teu ordenado de gerente não paga IRC: paga IRS, como qualquer salário.'], quem)
  if (r === 2) return executarInteracaoCasa(i, ctx)
}

async function caixaEmpresa(ctx: Ctx) {
  const n = neg(ctx)
  await ctx.say(
    [
      `CAIXA DA EMPRESA: ${euros(n.caixa)}.${n.caixa < 0 ? ` A conta está a descoberto (até ${euros(-LIMITE_DESCOBERTO)}), a pagar juros.` : ''}`,
      `Daqui, ${euros(Math.max(0, n.ivaPorEntregar))} são IVA do Estado. Não os gastes!`,
    ],
  )
}

async function quadroEmpresa(ctx: Ctx) {
  await ctx.say([
    'No quadro, escrito à mão:',
    '1. Vigiar a caixa todas as semanas. 2. Guardar para o IVA e para os subsídios. 3. Equipa certa para a procura. 4. O dono recebe por último.',
  ])
}

async function computadorCasa(ctx: Ctx) {
  const s = ctx.estado()
  const sal = salarioLiquido(s)
  await ctx.say([
    `O teu ordenado de gerente: ${euros(sal.bruto)} brutos, ${euros(sal.liquido)} líquidos (se a caixa da empresa chegar).`,
    `Despesas fixas pessoais: ${euros(totalFixas(s))}. Conta: ${euros(s.conta)} · Depósito: ${euros(s.poupanca)}.`,
    'Lembra-te: o dinheiro da empresa não é o teu. Gere as duas contas em separado.',
  ])
}

export async function executarInteracaoNegocio(i: Interacao, ctx: Ctx) {
  if (!ctx.estado().negocio) return
  if (i.tipo === 'npc') {
    if (i.npc.script === 'contabilista') return contabilista(ctx)
    if (i.npc.script === 'mestre') return mestreNegocio(ctx)
    if (i.npc.script === 'rita') return ritaNegocio(ctx)
    if (i.npc.script === 'vasco') return vascoNegocio(ctx, i)
  }
  if (i.tipo === 'prop') {
    const acoes: Record<string, () => Promise<void>> = {
      cama: async () => {
        const r = await ctx.ask('Queres ir dormir? Acaba o mês e a Dra. Joana fecha as contas.', ['SIM', 'NÃO'], undefined, 1)
        if (r === 0) await dormir(ctx)
      },
      pc: () => computadorCasa(ctx),
      gestao: () => gestao(ctx),
      balcao_empresa: () => turno(ctx),
      caixa_empresa: () => caixaEmpresa(ctx),
      quadro_empresa: () => quadroEmpresa(ctx),
      maquina_empresa: () => ctx.say('A máquina nova. Ainda estás a pagá-la ao banco.'),
    }
    const f = i.prop.script && acoes[i.prop.script]
    if (f) return f()
  }
  return executarInteracaoCasa(i, ctx)
}

// ---------------------------------------------------------------------------
// O mês

async function dormir(ctx: Ctx, texto = 'Zzz... Passa um mês...') {
  await ctx.fade(1, 500)
  ctx.jingle('dormir')
  await ctx.say(texto)
  const antes = ctx.estado()
  const { estado: depois, relatorio } = avancarMesNegocio(antes)
  ctx.definir(depois)
  ctx.levar('casa', 7, 3, 'down')
  await ctx.fade(0, 500)
  await manhaNegocio(ctx, depois, relatorio)
  if (ctx.estado().gameOver) {
    await resumoFinalNegocio(ctx)
    ctx.terminar()
  }
}

function linhasRelatorio(r: RelatorioNegocio, n: EstadoNegocio): string[] {
  const def = NEGOCIOS[n.tipo]
  const mesNome = nomeMes(r.mes).split(' ·')[0].toUpperCase()
  const l = [`CONTAS DE ${mesNome}: ${num(r.clientes)} ${def.cliente} (procura ${num(r.procura)}, a equipa consegue ${num(r.capacidade)}).`]
  if (r.procura > r.capacidade * 1.05) l.push(`Ficaram ${num(r.procura - r.capacidade)} ${def.cliente} por servir. Faltou gente na equipa!`)
  else if (r.capacidade > r.procura * 1.4) l.push('A equipa esteve muitas vezes parada: havia gente a mais para tão pouca procura.')
  l.push(`Vendas: ${euros(r.vendas)}, com IVA. Desse dinheiro, ${euros(r.ivaVendas)} são IVA (do Estado). Receita da empresa: ${euros(r.receita)}.`)
  const custos = [
    `produtos ${euros(r.produtos)}`,
    `salários ${euros(r.salarios)} + TSU ${euros(r.tsu)}`,
    r.gerente ? `o teu ordenado ${euros(r.gerente * (1 + TSU_EMPRESA))} (com TSU)` : '',
    `renda ${euros(r.renda)}`,
    `luz, água, seguros e contabilista ${euros(r.despesas)}`,
    r.marketing ? `publicidade ${euros(r.marketing)}` : '',
    r.juros ? `juros ${euros(r.juros)}` : '',
    ...r.extras.map((e) => `${e.texto.toLowerCase()} ${e.valor < 0 ? '+' : ''}${euros(Math.abs(e.valor))}`),
  ].filter(Boolean)
  l.push(`Custos: ${custos.join(' · ')}.`)
  if (r.subsidio) l.push('Mês de subsídio: os salários contaram a dobrar.')
  if (r.irc) l.push(`Fecho do ano: IRC de ${euros(r.irc)} (${pctN(TAXA_IRC)} do lucro).`)
  l.push(r.lucro >= 0 ? `LUCRO DO MÊS: ${euros(r.lucro)}.` : `PREJUÍZO DO MÊS: ${euros(-r.lucro)}.`)
  const caixa = [`Caixa da empresa: ${euros(r.caixa)}.`]
  if (r.ivaEntregue) caixa.push(`Entregaste ${euros(r.ivaEntregue)} de IVA ao Estado (fim do trimestre).`)
  if (r.capital) caixa.push(`Pagaste ${euros(r.capital)} do empréstimo (isto sai da caixa, mas não é um custo).`)
  if (r.caixa < 0) caixa.push(r.caixa < LIMITE_DESCOBERTO ? 'A conta passou o limite do descoberto: há SALÁRIOS EM ATRASO!' : 'A conta da empresa está a descoberto e paga juros.')
  if (!r.gerente && n.salarioGerente > 0) caixa.push('A caixa não chegou para o teu ordenado: o dono é sempre o último a receber.')
  l.push(caixa.join(' '))
  return l
}

async function verificarConquistasNegocio(ctx: Ctx) {
  const n = neg(ctx)
  if (n.caixa >= 2 * custosFixos(n) && n.historico.length > 0) await ctx.cracha('maneio')
  if (n.funcionarios.length >= 2) await ctx.cracha('emprego')
}

export async function manhaNegocio(ctx: Ctx, depois: EstadoMercado, r: RelatorioNegocio) {
  const n = depois.negocio!
  await ctx.say(depois.gameOver ? `Chegou o fim do ano, ${depois.name}!` : `Novo mês: ${nomeMes(depois.mes)}. Mês ${depois.mes} de ${MESES_NEGOCIO}.`)
  await ctx.say(linhasRelatorio(r, n), JOANA)

  const s = ctx.estado()
  await ctx.say(
    `Contas pessoais: ${r.gerente ? `recebeste ${euros(salarioLiquido({ ...s, salarioBruto: r.gerente }).liquido)} de ordenado. ` : 'sem ordenado este mês. '}Conta: ${euros(s.conta)} · Depósito: ${euros(s.poupanca)}${s.divida > 0 ? ` · DÍVIDA: ${euros(s.divida)}` : ''}.`,
    'BANCO',
  )

  if (r.lucro > 0) await ctx.cracha('lucro')
  if (r.ivaEntregue > 0 && r.caixa >= 0) await ctx.cracha('iva')
  if (r.subsidio && r.caixa >= LIMITE_DESCOBERTO && (r.salarios > 0 || r.gerente > 0)) await ctx.cracha('subsidios')

  if (!n.aberto) {
    await ctx.say(
      [
        `A empresa deve demasiado (${euros(-n.caixa)}) e o banco cortou o crédito. A empresa teve de fechar.`,
        'Acontece a muitas empresas: faltou caixa para aguentar os meses maus. Na vida real, pede-se ajuda cedo: à contabilista, ao banco, a um gestor.',
      ],
      MESTRE,
    )
    return
  }
  if (depois.gameOver) {
    if (n.lucroAno > 0 && n.mesesEmAtraso === 0) await ctx.cracha('ano')
    return
  }

  // avisos que ajudam a planear o mês que começa
  if (mesDeSubsidio(depois.mes)) await ctx.say(`Atenção: este mês há subsídio ${depois.mes === 6 ? 'de férias' : 'de Natal'}. Os salários contam a dobrar!`, JOANA)
  if (depois.mes === 5 && n.tipo === 'gelados') await ctx.say('O verão está a chegar: vem aí muita procura. Contratos a termo servem para isso.', MESTRE)
  if (depois.mes === 10 && n.tipo === 'gelados') await ctx.say('Acabou o verão: a procura vai cair muito. Tens equipa a mais para o inverno?', MESTRE)
  if (n.caixa < 0 && n.caixa >= FALENCIA) await ctx.say('A empresa está a descoberto. Corta custos, sobe as vendas ou põe dinheiro teu (no computador da loja).', MESTRE)

  const ev = escolherEventoNegocio(ctx.estado())
  if (ev) {
    await ctx.say(`Na empresa: ${ev.titulo}`)
    const i = await ctx.ask(ev.texto(neg(ctx)), ev.opcoes.map((o) => o.label))
    const op = ev.opcoes[i]
    const { negocio, texto } = op.aplicar(neg(ctx), ctx.estado().mes)
    mudar(ctx, (x) => ({ ...x, negocio, flags: [...x.flags, `evn_${ev.id}`] }))
    await ctx.say(texto)
    if (ev.id === 'encomenda' && i === 0) {
      const jogo = await ctx.jogar(NEGOCIOS[n.tipo].minijogo)
      const bom = jogo.pontos >= 3
      mudarN(ctx, (x) => ({ ...receitaExtra(x, 1500), reputacao: clamp(x.reputacao + (bom ? 4 : -2)) }))
      await ctx.say([`${jogo.texto}.`, bom ? 'O cliente adorou e já falou de ti a outras empresas (reputação +4). +1.500€ de vendas!' : 'Correu mais ou menos: pagaram os 1.500€, mas não ficaram fãs (reputação -2).'])
    }
    if (op.conquista) await ctx.cracha(op.conquista)
  }
  await verificarConquistasNegocio(ctx)
}

export async function resumoFinalNegocio(ctx: Ctx) {
  const s = ctx.estado()
  const n = s.negocio!
  const meses = n.historico.length
  await ctx.say(
    [
      n.aberto ? `${s.name}, a tua empresa fez ${meses} meses!` : `${s.name}, a tua empresa fechou ao fim de ${meses} meses.`,
      `Resultado do ano: ${n.lucroAno >= 0 ? 'lucro' : 'prejuízo'} de ${euros(Math.abs(n.lucroAno))}${n.lucroAno > 0 ? ', já depois do IRC' : ''}. Caixa: ${euros(n.caixa)}.`,
      `Criaste ${n.funcionarios.length} ${n.funcionarios.length === 1 ? 'emprego' : 'empregos'} (no fim do ano)${n.mesesEmAtraso ? `, mas houve ${n.mesesEmAtraso} ${n.mesesEmAtraso === 1 ? 'mês' : 'meses'} com salários em atraso` : ' e pagaste sempre os salários a tempo'}.`,
      `O teu património (casa, poupanças, investimentos e a empresa): ${euros(patrimonioM(s))}. Investimentos: ${euros(carteiraM(s))}.`,
      'Ter uma empresa é arriscar o teu dinheiro e o teu tempo para criar algo teu e dar trabalho a outras pessoas. Exige contas certas: IVA, TSU, subsídios, IRC e caixa para os meses maus.',
      `Conquistas: ${s.crachas.length} de ${CONQUISTAS_NEGOCIO.length}. Simulação educativa com valores simplificados: na vida real, fala sempre com um contabilista antes de abrir uma empresa.`,
    ],
    MESTRE,
  )
}

/** Trânsito: igual ao d'O Mercado, mas a recuperação no hospital passa um mês da empresa. */
export const TRANSITO_NEGOCIO_SCRIPTS = {
  foraPassadeira: TRANSITO_MERCADO_SCRIPTS.foraPassadeira,
  async atropelado(ctx: Ctx) {
    await ctx.say('CUIDADO!!!')
    await ctx.fade(1, 400)
    await ctx.say(['Um carro não conseguiu travar...', 'Foste de ambulância para o hospital.'])
    const seguro = ctx.estado().pagamentos.some((p) => p.id === 'seguro')
    const custo = seguro ? 30 : 250
    stats(ctx, { saude: -25 })
    mudar(ctx, (x) => ({ ...x, conta: round2(x.conta - custo) }))
    mudarN(ctx, (x) => ({ ...x, reputacao: clamp(x.reputacao - 3) }))
    ctx.levar('hospital', 4, 4, 'right')
    await ctx.fade(0, 400)
    await ctx.say(
      [
        'Partiste uma perna. Vais ficar bem, mas precisas de um mês de recuperação.',
        'A empresa continua a funcionar sem ti... mas nota-se a tua falta (reputação -3).',
        `${seguro ? `Com o seguro de saúde, pagaste só ${euros(custo)}.` : `A fisioterapia custou ${euros(custo)}.`} Atravessa sempre nas passadeiras!`,
      ],
      'Dra. Ana',
    )
    await dormir(ctx, 'Passas o mês a recuperar...')
  },
}
