import { clamp } from '../data'
import type { CtxJogo } from '../modo'
import type { StatKey } from '../types'
import type { Interacao } from '../world/motor'
import { CONQUISTAS_CIDADE, objetivoCidade } from './conquistas'
import {
  ATIVO,
  ativosNaCarteira,
  avancarSemanaCidade,
  BOLSA_MERITO,
  COMISSAO_STANDARD,
  custoDespesas,
  DESPESAS_BASE,
  euros,
  MAX_TURNOS,
  MESADA,
  META_EMERGENCIA,
  META_VIAGEM,
  patrimonio,
  poupadoViagem,
  round2,
  SEMANAS,
  valorAtivo,
  valorCarteira,
} from './economia'
import { escolherEventoCidade } from './eventos'
import type { AtivoId, EstadoCidade, Noticia } from './tipos'
import { TRABALHOS_CIDADE, type TrabalhoCidade } from './trabalhos'

export type CtxCidade = CtxJogo<EstadoCidade>
type Ctx = CtxCidade

const MESTRE = 'Mestre Moedas'
const MAE = 'Mãe'

function mudar(ctx: Ctx, f: (s: EstadoCidade) => EstadoCidade) {
  ctx.definir(f(ctx.estado()))
}

function stats(ctx: Ctx, m: Partial<Record<StatKey, number>>) {
  mudar(ctx, (s) => {
    const n = { ...s.stats }
    for (const [k, v] of Object.entries(m) as [StatKey, number][]) n[k] = clamp(n[k] + v)
    return { ...s, stats: n }
  })
}

function tem(ctx: Ctx, flag: string) {
  return ctx.estado().flags.includes(flag)
}

/** Marca uma flag e diz se já estava marcada. */
function comFlag(ctx: Ctx, flag: string): boolean {
  if (tem(ctx, flag)) return true
  mudar(ctx, (s) => ({ ...s, flags: [...s.flags, flag] }))
  return false
}

function pct(n: number) {
  const v = Math.round(n * 1000) / 10
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-PT')}%`
}

/** Ações e ETFs (o que conta para a lição da crise). */
const ARRISCADOS: AtivoId[] = ['etf', 'pixel', 'brisa']

export async function verificarConquistas(ctx: Ctx) {
  const s = ctx.estado()
  if (ativosNaCarteira(s).length >= 3) await ctx.cracha('diversificada')
  if (s.poupanca >= META_EMERGENCIA) await ctx.cracha('emergencia')
  if (poupadoViagem(ctx.estado()) >= META_VIAGEM) await ctx.cracha('viagem')
}

// ---------------------------------------------------------------------------

export async function tutorialCidade(ctx: Ctx) {
  const s = ctx.estado()
  await ctx.say(
    [
      `Bom dia, ${s.name}! Primeiro dia de aulas. Este ano vais ter mais liberdade... e mais responsabilidade.`,
      `Tens ${euros(s.dinheiro)} na carteira. Todas as semanas dou-te ${MESADA}€ de mesada, mas o lanche e o passe custam uns ${DESPESAS_BASE}€.`,
      'Se quiseres mais, o Café Grão Dourado procura alguém para part-time ao fim de semana.',
      'Mas atenção: para receberes um salário precisas de uma conta bancária. O Banco Ponte é o prédio azul do outro lado da estrada.',
      'No teu telemóvel (START) tens a app do banco, os investimentos, as notícias e o teu objetivo.',
      `O grande objetivo do ano: juntar ${META_VIAGEM}€ para a Viagem de Finalistas!`,
      'Para passares à semana seguinte, vai dormir na tua cama. Boa sorte!',
    ],
    MAE,
  )
  comFlag(ctx, 'tutorial')
}

const DICAS_MAE = [
  'Faz como os adultos: primeiro guarda uma parte, depois gasta o que sobra. Não ao contrário!',
  'Uma regra simples: 50% para o que precisas, 30% para o que queres, 20% para poupar.',
  'Antes de comprares uma coisa cara, espera 48 horas. Se ainda a quiseres, compra.',
  'Trabalhar é bom, mas a escola é o teu trabalho principal. Não deixes as notas cair!',
  'Os anúncios e os influencers são pagos para te fazer querer coisas. Desconfia do "só hoje".',
  'Antes de investir, tem um fundo de emergência na poupança. Imprevistos acontecem!',
]

const ITENS_LOJA: Record<string, { nome: string; preco: number; stats: Partial<Record<StatKey, number>>; frase: string }> = {
  loja_tenis: { nome: 'Ténis de marca', preco: 80, stats: { relacoes: 3 }, frase: 'Os ténis que toda a gente usa.' },
  loja_auscultadores: { nome: 'Auscultadores', preco: 45, stats: { relacoes: 1, saude: 1 }, frase: 'Auscultadores com cancelamento de ruído.' },
  loja_tshirt: { nome: 'T-shirt da banda', preco: 18, stats: { relacoes: 1 }, frase: 'A t-shirt oficial da tua banda favorita.' },
  loja_telemovel: { nome: 'Capa brilhante', preco: 15, stats: { relacoes: 1 }, frase: 'Uma capa de telemóvel com brilhantes.' },
}

const TOPICOS_MESTRE: { titulo: string; linhas: (s: EstadoCidade) => string[] }[] = [
  {
    titulo: 'AÇÕES',
    linhas: () => [
      'Uma AÇÃO é um pedacinho de uma empresa. Se a empresa crescer e der lucro, a ação costuma valer mais.',
      'Se a empresa correr mal, a ação vale menos. Na app INVESTIR tens duas: a PixelSoft (videojogos) e a Refrescos Brisa (bebidas).',
    ],
  },
  {
    titulo: 'ETFs',
    linhas: () => [
      'Um ETF é um cesto com ações de muitas empresas ao mesmo tempo.',
      'Com 10€ no ETF Mundo ficas dono de um bocadinho de centenas de empresas. Se uma correr mal, quase não se nota.',
    ],
  },
  {
    titulo: 'OBRIGAÇÕES',
    linhas: () => [
      'Com uma OBRIGAÇÃO emprestas dinheiro ao Estado ou a uma empresa, e eles pagam-te juros.',
      'Risco baixo, ganho baixo. São a parte "calma" de uma carteira.',
    ],
  },
  {
    titulo: 'CRIPTO',
    linhas: () => [
      'As criptomoedas, como a LuaCoin, são moedas digitais. Não são empresas e não dão lucros.',
      'O preço depende só da moda: pode subir 60% numa semana e cair 70% na seguinte. Só com dinheiro que aceites perder todo!',
    ],
  },
  {
    titulo: 'INFLAÇÃO',
    linhas: (s) => [
      `INFLAÇÃO é a subida dos preços. Desde o início do ano, tudo ficou ${pct(s.indicePrecos - 1)} mais caro.`,
      'Se a tua poupança rende 3% ao ano e os preços sobem 7%, o teu dinheiro compra cada vez menos. Por isso há quem invista uma parte.',
    ],
  },
  {
    titulo: 'DIVERSIFICAR',
    linhas: () => [
      'Nunca ponhas os ovos todos no mesmo cesto! Se só tiveres uma empresa e ela cair, perdes muito.',
      'Se tiveres várias coisas diferentes, quando uma desce as outras seguram. Isso é DIVERSIFICAR.',
    ],
  },
  {
    titulo: 'RISCO E TEMPO',
    linhas: () => [
      'Quanto mais um investimento pode ganhar, mais pode perder. Risco e ganho andam sempre juntos.',
      'Investe só dinheiro de que não vais precisar nos próximos tempos. Com tempo, as descidas costumam recuperar... mas não há garantias.',
    ],
  },
]

async function estudar(ctx: Ctx, quem: string | undefined, onde: string) {
  const s = ctx.estado()
  if (comFlag(ctx, `estudou_${s.semana}`)) return ctx.say('Já estudaste esta semana. Descansa um bocadinho!', quem)
  stats(ctx, { educacao: 6 })
  await ctx.say([`Passaste a tarde a estudar ${onde}. Educação +6.`, 'Estudar é grátis e é dos melhores investimentos que há: o que aprendes ninguém te tira.'], quem)
}

async function entrevistaCafe(ctx: Ctx, quem: string) {
  await ctx.say('Vamos fazer uma pequena entrevista.', quem)
  const r1 = await ctx.ask('Porque queres trabalhar aqui?', ['QUERO O MEU DINHEIRO', 'GOSTO DE PESSOAS', 'NÃO SEI...'], quem)
  await ctx.say(['Honesto! Ganhar o teu próprio dinheiro dá muita liberdade.', 'Ótimo, aqui falamos com muita gente todos os dias.', 'Ninguém sabe tudo à primeira. Gosto de sinceridade.'][r1], quem)
  const r2 = await ctx.ask('Um cliente diz que o café está frio. O que fazes?', ['PEÇO DESCULPA E FAÇO OUTRO', 'DIGO QUE ESTÁ BOM', 'CHAMO-A A SI'], quem)
  await ctx.say(['Perfeito! O cliente fica contente e volta.', 'Hmm... o cliente tem sempre razão, pelo menos aqui!', 'Pedir ajuda também está certo.'][r2], quem)
}

/** Conversa com quem dá trabalho: contratar, trocar de trabalho, fazer um turno ou despedir-se. */
async function patrao(ctx: Ctx, id: TrabalhoCidade) {
  const t = TRABALHOS_CIDADE[id]
  const quem = t.chefe
  let s = ctx.estado()
  if (s.emprego !== id) {
    const falta = t.requisito?.(s)
    if (falta) return ctx.say(falta, quem)
    await ctx.say(t.descricao, quem)
    if (id === 'cafe') await entrevistaCafe(ctx, quem)
    const antes = s.emprego ? `Já trabalhas em ${TRABALHOS_CIDADE[s.emprego].curto}: se aceitares, deixas esse trabalho. ` : ''
    const r = await ctx.ask(`${antes}Aceitas?`, ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Se mudares de ideias, já sabes onde estou.', quem)
    const primeiro = !comFlag(ctx, 'trabalhou')
    mudar(ctx, (x) => ({ ...x, emprego: id }))
    await ctx.say(
      [
        'Combinado! Boas-vindas!',
        `São no máximo ${MAX_TURNOS} turnos por semana: ${euros(t.base)} cada, mais o extra ${t.textoExtra}.`,
        ...(primeiro ? ['O trabalho para jovens tem regras: poucas horas, nunca à noite e com autorização dos pais. Os teus já assinaram!'] : []),
      ],
      quem,
    )
    s = ctx.estado()
  }
  if (!s.conta) return ctx.say('Pago por transferência, por isso preciso do teu IBAN. Abre uma conta no Banco Ponte e volta cá!', quem)
  if (s.turnos >= MAX_TURNOS) return ctx.say(`Já fizeste ${MAX_TURNOS} turnos esta semana. Vai descansar e estudar!`, quem)
  const r = await ctx.ask(`Vamos a um turno? (${s.turnos}/${MAX_TURNOS} esta semana)`, ['SIM', 'NÃO', 'DEIXAR O TRABALHO'], quem, 1)
  if (r === 2) {
    mudar(ctx, (x) => ({ ...x, emprego: null }))
    return ctx.say('Tenho pena! Agradeço o teu trabalho. Se quiseres voltar, fala comigo.', quem)
  }
  if (r !== 0) return ctx.say('Está bem. Estou cá quando quiseres.', quem)
  await ctx.say(t.instrucao, quem)
  const jogo = await ctx.jogar(t.minijogo)
  const extra = round2(t.extra(jogo))
  const total = round2(t.base + extra)
  const turnos = s.turnos + 1
  mudar(ctx, (x) => ({ ...x, dinheiro: round2(x.dinheiro + total), salarioTotal: round2(x.salarioTotal + total), turnos }))
  const cansaco = turnos >= 2 && id !== 'explicacoes' ? { educacao: (t.efeitos.educacao ?? 0) - 3 } : {}
  stats(ctx, { ...t.efeitos, ...cansaco })
  const efeitos = Object.entries({ ...t.efeitos, ...cansaco })
    .filter(([, v]) => v)
    .map(([k, v]) => `${{ relacoes: 'Relações', saude: 'Saúde', educacao: 'Educação' }[k]} ${v! > 0 ? '+' : ''}${v}`)
    .join(' · ')
  await ctx.say([`${jogo.texto}. Bom trabalho!`, `Ganhaste ${euros(t.base)} + ${euros(extra)} ${t.textoExtra} = ${euros(total)}, já na tua conta.`], quem)
  await ctx.say(turnos >= 2 && id !== 'explicacoes' ? `Dois turnos na mesma semana tiram tempo ao estudo. ${efeitos}.` : `${efeitos}.`)
  await ctx.cracha('salario')
  await verificarConquistas(ctx)
}

const ACOES_NPC: Record<string, (ctx: Ctx) => Promise<void>> = {
  async mae(ctx) {
    const s = ctx.estado()
    await ctx.say(`Olá, ${s.name}! ${DICAS_MAE[s.semana % DICAS_MAE.length]}`, MAE)
    if (!s.conta) return ctx.say('Ainda não abriste conta? O Banco Ponte é o prédio azul, ao lado da praça.', MAE)
    if (!s.emprego) {
      return ctx.say(
        [
          'Há vários part-times para a tua idade. Escolhe o que combina contigo:',
          'o Café Grão Dourado, entregas de bicicleta (o Marco, ao pé do cruzamento), babysitting (a Sra. Helena, no parque) ou explicações (o Prof. Nuno, se tiveres boas notas).',
        ],
        MAE,
      )
    }
    const obj = objetivoCidade(s.crachas)
    if (obj) await ctx.say(`Próximo desafio: ${obj.objetivo}`, MAE)
  },

  async clara(ctx) {
    await patrao(ctx, 'cafe')
  },

  async marco(ctx) {
    await patrao(ctx, 'entregas')
  },

  async helena(ctx) {
    await patrao(ctx, 'babysitting')
  },

  async medica(ctx) {
    await ctx.say('Descansa. E da próxima vez, passadeira!', 'Dra. Ana')
  },

  async cliente_cafe(ctx) {
    await ctx.say('Venho cá todos os dias. Um café por dia são uns 25€ por mês! Se calhar devia fazer as contas...', 'Cliente')
  },

  async rita(ctx) {
    const quem = 'Rita'
    const s = ctx.estado()
    if (!s.conta) {
      await ctx.say('Olá! Boas-vindas ao Banco Ponte! Queres abrir a tua primeira conta? Temos duas para jovens.', quem)
      for (;;) {
        const r = await ctx.ask('Qual escolhes?', ['CONTA JOVEM', 'CONTA STANDARD', 'EXPLICA-ME', 'AGORA NÃO'], quem, 3)
        if (r === 3) return ctx.say('Quando quiseres, estou aqui.', quem)
        if (r === 2) {
          await ctx.say(
            [
              'CONTA JOVEM: sem comissões, cartão de débito grátis e conta poupança que rende 3% ao ano.',
              'CONTA STANDARD: oferecemos já uns auscultadores (valem 20€)!',
              `...e nas letras pequenas: comissão de manutenção de ${COMISSAO_STANDARD}€ por semana.`,
            ],
            quem,
          )
          continue
        }
        const tipo = r === 0 ? 'jovem' : 'standard'
        mudar(ctx, (x) => ({
          ...x,
          conta: tipo,
          flags: [...x.flags, `aberta_${x.semana}`],
          compras: tipo === 'standard' ? [...x.compras, 'Auscultadores (brinde)'] : x.compras,
        }))
        if (tipo === 'standard') stats(ctx, { relacoes: 2 })
        await ctx.say(
          [
            `Conta ${tipo === 'jovem' ? 'Jovem' : 'Standard'} aberta! Depositei os teus ${euros(s.dinheiro)}.`,
            'O teu cartão é de DÉBITO: só podes gastar o dinheiro que tens na conta.',
            tipo === 'standard'
              ? `Aqui estão os auscultadores! Lembra-te: a comissão de ${COMISSAO_STANDARD}€ é cobrada todas as semanas.`
              : 'Sem comissões, todo o teu dinheiro fica para ti.',
            'No telemóvel, a app BANCO já mostra a tua conta. Se quiseres investir, fala com o Mestre Moedas.',
          ],
          quem,
        )
        return ctx.cracha('conta')
      }
    }
    const opcoes = s.conta === 'standard' ? ['MUDAR PARA CONTA JOVEM', 'DÉBITO OU CRÉDITO?', 'ADEUS'] : ['DÉBITO OU CRÉDITO?', 'ADEUS']
    const r = await ctx.ask('Em que posso ajudar?', opcoes, quem, opcoes.length - 1)
    const escolha = opcoes[r]
    if (escolha === 'MUDAR PARA CONTA JOVEM') {
      mudar(ctx, (x) => ({ ...x, conta: 'jovem' }))
      stats(ctx, { educacao: 2 })
      return ctx.say('Feito! Acabaram-se as comissões. Ler as letras pequenas compensa sempre.', quem)
    }
    if (escolha === 'DÉBITO OU CRÉDITO?') {
      return ctx.say(
        [
          'Com um cartão de DÉBITO pagas com dinheiro que já é teu.',
          'Com um cartão de CRÉDITO, o banco empresta-te o dinheiro. Se não pagares a tempo, cobra juros muito altos.',
          'Por isso, aos menores de idade só se dão cartões de débito.',
        ],
        quem,
      )
    }
    return ctx.say('Até breve!', quem)
  },

  async mestre(ctx) {
    const s = ctx.estado()
    if (!s.conta) {
      return ctx.say([`Olá, ${s.name}! Que bom ver-te por cá.`, 'Para investir, primeiro precisas de uma conta. A Rita, ali no balcão, trata disso.'], MESTRE)
    }
    if (!comFlag(ctx, 'investir')) {
      await ctx.say(
        [
          `${s.name}, já tens conta! Então posso abrir-te a app INVESTIR no telemóvel (START).`,
          'Podes comprar a partir de 10€: obrigações, um ETF, ações de duas empresas e uma criptomoeda.',
          'São ativos inventados, para aprenderes sem perder dinheiro a sério. Mas os preços comportam-se como os verdadeiros.',
          'Antes de comprares, pergunta-me o que é cada coisa!',
        ],
        MESTRE,
      )
    } else {
      await ctx.say(`Olá, ${s.name}! Tens ${euros(valorCarteira(s))} investidos. Queres aprender mais?`, MESTRE)
    }
    const titulos = TOPICOS_MESTRE.map((t) => t.titulo)
    for (;;) {
      const r = await ctx.ask('Escolhe um tema:', [...titulos, 'ADEUS'], MESTRE, titulos.length)
      if (r === titulos.length) return ctx.say('Investir é uma maratona, não um sprint. Até breve!', MESTRE)
      await ctx.say(TOPICOS_MESTRE[r].linhas(ctx.estado()), MESTRE)
    }
  },

  async prof(ctx) {
    const quem = 'Prof. Nuno'
    if (!comFlag(ctx, 'prof')) await ctx.say(['Olá! Sou o Professor Nuno, de Economia.', 'Às vezes dou explicações grátis depois das aulas.'], quem)
    const r = await ctx.ask('Em que posso ajudar?', ['EXPLICAÇÃO GRÁTIS', ctx.estado().emprego === 'explicacoes' ? 'DAR EXPLICAÇÕES' : 'TRABALHAR A DAR EXPLICAÇÕES', 'ADEUS'], quem, 2)
    if (r === 1) return patrao(ctx, 'explicacoes')
    if (r !== 0) return ctx.say('Está bem! A biblioteca também está aberta, ali à direita.', quem)
    const s = ctx.estado()
    const licoes = [
      ['Hoje: o ORÇAMENTO.', 'Escreve o que entra e o que sai todas as semanas. Só assim sabes quanto podes poupar.'],
      ['Hoje: o JURO COMPOSTO.', 'Se 100€ renderem 5% ao ano, ao fim de 10 anos são 163€: os juros também ganham juros.'],
      ['Hoje: os IMPOSTOS.', 'Quando os adultos recebem o salário, uma parte vai para impostos. Pagam escolas, hospitais e estradas.'],
      ['Hoje: OFERTA e PROCURA.', 'Quando muita gente quer comprar uma coisa, o preço sobe. É por isso que a LuaCoin dispara quando está na moda.'],
    ]
    await ctx.say(licoes[s.semana % licoes.length], quem)
    await estudar(ctx, quem, 'com o Prof. Nuno')
  },

  async tomas(ctx) {
    await ctx.say('Estudo aqui na biblioteca todas as semanas. Se a média for alta, no fim do ano há uma bolsa de mérito de 100€!', 'Tomás')
  },

  async amigos(ctx) {
    const quem = 'Rui e Inês'
    const s = ctx.estado()
    const lanche = round2(5 * s.indicePrecos)
    const bowling = round2(8 * s.indicePrecos)
    const r = await ctx.ask(
      `O que fazemos hoje? Bicicleta e lanche (${euros(lanche)}), bowling (${euros(bowling)}) ou só conversar (grátis)?`,
      ['BICICLETA', 'BOWLING', 'SÓ CONVERSAR', 'NÃO'],
      quem,
      3,
    )
    if (r === 3) return ctx.say('Combinado, fica para a próxima!', quem)
    if (r === 2) {
      if (comFlag(ctx, `conversou_${s.semana}`)) return ctx.say('Já pusemos a conversa em dia esta semana!', quem)
      stats(ctx, { relacoes: 3 })
      return ctx.say(['Ficaram a conversar no parque a tarde toda. Relações +3.', 'Estar com amigos não tem de custar dinheiro.'])
    }
    const preco = r === 0 ? lanche : bowling
    if (s.dinheiro < preco) return ctx.say(`Não tens ${euros(preco)} na conta. Ficamos a conversar no parque, que é grátis!`, quem)
    mudar(ctx, (x) => ({ ...x, dinheiro: round2(x.dinheiro - preco) }))
    if (r === 0) {
      await ctx.say('Bora! Cuidado com os cones e as poças!', quem)
      const jogo = await ctx.jogar('bicicleta')
      stats(ctx, { relacoes: jogo.pontos >= 10 ? 5 : 3, saude: 2 })
      return ctx.say([`Que passeio! (${jogo.texto})`, `-${euros(preco)} do lanche · Relações +${jogo.pontos >= 10 ? 5 : 3} · Saúde +2.`])
    }
    await ctx.say('Ao bowling! Quem fizer menos pinos paga as pipocas... a brincar!', quem)
    const jogo = await ctx.jogar('bowling')
    stats(ctx, { relacoes: jogo.pontos >= 25 ? 6 : 4 })
    await ctx.say([`${jogo.texto}!`, `-${euros(preco)} · Relações +${jogo.pontos >= 25 ? 6 : 4}.`])
  },

  async duarte(ctx) {
    const quem = 'Duarte'
    const r = await ctx.ask('Ei! Jogamos aos penáltis? O campo é público, não custa nada.', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Quando quiseres!', quem)
    const jogo = await ctx.jogar('futebol')
    const s = ctx.estado()
    const ganho = comFlag(ctx, `treinou_${s.semana}`) ? 0 : 4
    if (ganho) stats(ctx, { saude: ganho, relacoes: 1 })
    await ctx.say([`${jogo.texto}!`, ganho ? 'Exercício e amigos, de graça. Saúde +4 · Relações +1.' : 'Já treinaste esta semana, mas foi divertido na mesma!'], quem)
  },

  async influencer(ctx) {
    const quem = 'Kiko'
    await ctx.say(
      ['Olá, malta! Estou a gravar para os meus 200 mil seguidores!', 'Eu fiquei rico com a LuaCoin! Usa o meu código KIKO10 e compra já!'],
      quem,
    )
    const r = await ctx.ask('O que pensas disto?', ['PAGAM-TE PARA DIZERES?', 'VOU COMPRAR!', 'IGNORAR'], undefined, 2)
    if (r === 0) {
      await ctx.say('Hã... bem... a app paga-me por cada pessoa que use o código. Mas é um ótimo negócio, a sério!', quem)
      stats(ctx, { educacao: 2 })
      return ctx.say('Pois. Quem promove um produto em troca de dinheiro está a fazer publicidade, mesmo que pareça um conselho de amigo.')
    }
    if (r === 1) return ctx.say('Antes de comprares, lembra-te: o Kiko ganha dinheiro se tu comprares, e não perde nada se tu perderes.')
  },

  async amelia(ctx) {
    const s = ctx.estado()
    await ctx.say(
      [
        'Ai, no meu tempo uma bica custava 50 cêntimos!',
        `E só este ano tudo já subiu ${pct(s.indicePrecos - 1)}. É a inflação. O dinheiro debaixo do colchão vale cada vez menos.`,
      ],
      'D. Amélia',
    )
  },

  async beatriz(ctx) {
    await ctx.say('Vou estudar para a biblioteca da escola. É grátis, tem computadores e não há distrações!', 'Beatriz')
  },

  async vendedor(ctx) {
    const quem = 'Vendedor'
    await ctx.say(
      ['PROMOÇÃO RELÂMPAGO! Só nos próximos 10 minutos!', 'Leva já, que amanhã já não há! Toda a gente está a comprar!'],
      quem,
    )
    await ctx.say('Repara nas técnicas: pressa ("só 10 minutos"), escassez ("amanhã já não há") e fazer como os outros. Servem para não pensares.')
  },

  async cliente_loja(ctx) {
    await ctx.say('Vim só ver... e já levo três sacos. Nem sei bem o que comprei!', 'Cliente')
  },
}

async function loja(ctx: Ctx, id: string) {
  const item = ITENS_LOJA[id]
  const s = ctx.estado()
  const preco = round2(item.preco * s.indicePrecos)
  if (s.compras.includes(item.nome)) return ctx.say(`Já tens: ${item.nome}. Não precisas de outro!`)
  const pensou = s.pensar[id]
  let r: number
  if (pensou !== undefined && s.semana > pensou) {
    r = await ctx.ask(`Já pensaste no assunto. Ainda queres ${item.nome} por ${euros(preco)}?`, ['COMPRAR', 'JÁ NÃO QUERO'], undefined, 1)
    if (r === 1) {
      mudar(ctx, (x) => {
        const p = { ...x.pensar }
        delete p[id]
        return { ...x, pensar: p }
      })
      stats(ctx, { educacao: 2 })
      return ctx.say(`A vontade passou e poupaste ${euros(preco)}. É para isto que serve a regra das 48 horas!`)
    }
  } else {
    r = await ctx.ask(`${item.frase} ${item.nome}: ${euros(preco)}. Comprar?`, ['COMPRAR', 'PENSAR (48H)', 'NÃO'], undefined, 2)
    if (r === 2) return ctx.say('Ver montras também é grátis!')
    if (r === 1) {
      mudar(ctx, (x) => ({ ...x, pensar: { ...x.pensar, [id]: x.semana } }))
      return ctx.say('Boa ideia! Volta noutra semana: se ainda o quiseres, compra-o sem pressas.')
    }
  }
  const atual = ctx.estado()
  if (atual.dinheiro < preco) return ctx.say(`Na conta só tens ${euros(atual.dinheiro)}. O cartão de débito não deixa gastar o que não tens!`)
  mudar(ctx, (x) => ({ ...x, dinheiro: round2(x.dinheiro - preco), compras: [...x.compras, item.nome] }))
  stats(ctx, item.stats)
  await ctx.say([`Compraste: ${item.nome}! Ficas com ${euros(ctx.estado().dinheiro)} na conta.`, 'Foi uma compra pensada, ou por impulso? Só tu sabes!'])
}

const ACOES_OBJETO: Record<string, (ctx: Ctx) => Promise<void>> = {
  async cama(ctx) {
    const r = await ctx.ask('Queres ir dormir? Vai passar uma semana.', ['SIM', 'NÃO'], undefined, 1)
    if (r === 0) await dormir(ctx)
  },

  async pc(ctx) {
    const s = ctx.estado()
    const fixos = custoDespesas(s) + (s.conta === 'standard' ? COMISSAO_STANDARD : 0) + s.pagamentos.reduce((t, p) => t + p.valor, 0)
    const trabalho = s.emprego ? MAX_TURNOS * (TRABALHOS_CIDADE[s.emprego].base + 2) : 0
    await ctx.say([
      'Abres a folha de cálculo do teu ORÇAMENTO semanal:',
      `ENTRA: mesada ${euros(MESADA)}${s.emprego ? ` + ${TRABALHOS_CIDADE[s.emprego].curto.toLowerCase()} até ${euros(trabalho)}` : ''}.`,
      `SAI (fixo): ${euros(fixos)} (lanche, passe${s.conta === 'standard' ? ', comissão' : ''}${s.pagamentos.length ? ', pagamentos automáticos' : ''}).`,
      `SOBRA até ${euros(MESADA + trabalho - fixos)} por semana para poupar, investir ou gastar.`,
    ])
  },

  async tv(ctx) {
    await ctx.say([
      'Anúncio: "Compra agora, paga depois! Sem juros*!"',
      '*Letras pequenas: comissões em caso de atraso. Pagar em prestações parece barato, mas compromete o dinheiro das próximas semanas.',
    ])
  },

  async livros(ctx) {
    await ctx.say('Livros da escola e um romance meio lido. E um livro chamado "O teu primeiro salário".')
  },

  async maquina(ctx) {
    await ctx.say('A máquina de café profissional. Só a D. Clara e a equipa é que mexem nela.')
  },

  async cotacoes(ctx) {
    const s = ctx.estado()
    const linhas = Object.values(ATIVO).map((a) => {
      const h = s.historicoPrecos[a.id]
      const ant = h.length > 1 ? h[h.length - 2] : h[0]
      return `${a.curto}: ${euros(s.precos[a.id])} (${pct(s.precos[a.id] / ant - 1)})`
    })
    await ctx.say(['Painel de cotações desta semana:', ...linhas])
  },

  async cofre(ctx) {
    await ctx.say('O cofre do banco. Hoje em dia quase todo o dinheiro é digital: são números nas contas.')
  },

  async quadro(ctx) {
    await ctx.say(['No quadro está escrito:', 'RISCO e RETORNO andam juntos. Quem promete muito ganho sem risco está a mentir... ou a burlar.'])
  },

  async biblioteca(ctx) {
    await estudar(ctx, undefined, 'na biblioteca')
  },

  async multibanco(ctx) {
    const s = ctx.estado()
    if (!s.conta) return ctx.say('Uma caixa multibanco. Para a usar precisas de um cartão... e de uma conta no banco.')
    await ctx.say(`MULTIBANCO. Saldo da conta: ${euros(s.dinheiro)}. Poupança: ${euros(s.poupanca)}. Nunca digas o teu código a ninguém!`)
  },

  async bola(ctx) {
    await ACOES_NPC.duarte(ctx)
  },
}

export async function executarInteracaoCidade(i: Interacao, ctx: Ctx) {
  if (i.tipo === 'npc') return ACOES_NPC[i.npc.script]?.(ctx)
  if (i.tipo === 'prop' && i.prop.script) {
    if (i.prop.script.startsWith('loja_')) return loja(ctx, i.prop.script)
    return ACOES_OBJETO[i.prop.script]?.(ctx)
  }
  if (i.tipo === 'placa') return ctx.say(i.placa.texto.replace('{nome}', ctx.estado().name.toUpperCase()))
  if (i.tipo === 'trancado') return ctx.say(i.texto)
}

// ---------------------------------------------------------------------------

async function dormir(ctx: Ctx, texto = 'Zzz... Zzz... Zzz...') {
  await ctx.fade(1, 500)
  await ctx.say(texto)
  const antes = ctx.estado()
  const { estado: depois, noticia } = avancarSemanaCidade(antes)
  ctx.definir(depois)
  ctx.levar('casa', 7, 3, 'down')
  await ctx.fade(0, 500)
  await manhaCidade(ctx, antes, depois, noticia)
  if (ctx.estado().gameOver) {
    await resumoFinalCidade(ctx)
    ctx.terminar()
  }
}

const AGENTE = 'Agente Pereira'

/** Trânsito: multa por atravessar fora da passadeira e hospital em caso de atropelamento. */
export const TRANSITO_CIDADE_SCRIPTS = {
  async foraPassadeira(ctx: Ctx) {
    const s = ctx.estado()
    if (!comFlag(ctx, 'aviso_passadeira')) {
      return ctx.say(['Ei! Atravessar fora da passadeira é perigoso: os carros só param nas passadeiras.', 'E dá multa! Desta vez fica só o aviso.'], AGENTE)
    }
    if (tem(ctx, `multa_peao_${s.semana}`) || Math.random() > 0.35) return
    comFlag(ctx, `multa_peao_${s.semana}`)
    mudar(ctx, (x) => ({ ...x, dinheiro: round2(Math.max(0, x.dinheiro - 10)) }))
    await ctx.say(['Outra vez fora da passadeira! Multa de 10€.', 'Os teus pais pagaram... e descontaram na tua mesada. -10€.'], AGENTE)
  },

  async atropelado(ctx: Ctx) {
    await ctx.say('CUIDADO!!!')
    await ctx.fade(1, 400)
    await ctx.say(['Um carro não conseguiu travar...', 'Foste de ambulância para o hospital.'])
    stats(ctx, { saude: -25 })
    ctx.levar('hospital', 4, 4, 'right')
    await ctx.fade(0, 400)
    await ctx.say(
      [
        'Tiveste sorte: partiste um braço, mas vais ficar bem.',
        'No SNS o tratamento não te custou nada... mas perdes uma semana de aulas, de trabalho e de amigos. Saúde -25.',
        'Os carros só param nas passadeiras. Atravessa sempre nelas, e olha para os dois lados!',
      ],
      'Dra. Ana',
    )
    await dormir(ctx, 'Passas a semana no hospital a recuperar...')
  },
}

function valorCom(s: EstadoCidade, precos: Record<AtivoId, number>, id: AtivoId) {
  return s.unidades[id] * precos[id]
}

/** Manhã: a Mãe e o telemóvel explicam, com os números do jogo, o que aconteceu durante a semana. */
export async function manhaCidade(ctx: Ctx, antes: EstadoCidade, depois: EstadoCidade, noticia: Noticia) {
  const semana = Math.min(depois.semana, SEMANAS)
  await ctx.say(`Bom dia, ${depois.name}! ${depois.gameOver ? 'É o último dia do ano letivo!' : `Começa a semana ${semana} de ${SEMANAS}.`}`, MAE)

  const movs = depois.movimentos.filter((m) => m.valor !== 0).map((m) => `${m.texto} ${m.valor > 0 ? '+' : ''}${euros(m.valor)}`)
  await ctx.say([`Movimentos da semana: ${movs.join(' · ')}.`, `Na conta: ${euros(depois.dinheiro)}${depois.conta ? ` · Poupança: ${euros(depois.poupanca)}` : ''}.`], 'BANCO')
  if (depois.movimentos.some((m) => m.texto.startsWith('Tirado da poupança'))) {
    await ctx.say('A conta não chegou para as despesas e o banco foi buscar o resto à tua poupança.', 'BANCO')
  }
  if (depois.flags.includes(`sem_lanche_${depois.semana}`)) await ctx.say('Ficaste sem dinheiro para o lanche durante a semana. Saúde -4.', MAE)
  if (depois.pagamentos.some((p) => p.id.startsWith('multa_'))) {
    await ctx.say('Falhaste uma prestação! Na próxima semana pagas o que faltou mais uma multa. Dívidas em atraso ficam sempre mais caras.', 'BANCO')
  }

  const aberta = depois.flags.find((f) => f.startsWith('aberta_'))
  if (depois.conta === 'standard' && aberta && [8, 16].includes(depois.semana)) {
    const pago = depois.semana - Number(aberta.slice(7))
    await ctx.say(`Já pagaste uns ${pago}€ de comissões na Conta Standard. O brinde valia 20€... A Rita pode mudar-te para a Conta Jovem.`, MAE)
  }
  if ([6, 12, 18].includes(depois.semana)) {
    await ctx.say(
      [
        `Reparaste? O lanche e o passe custavam ${euros(DESPESAS_BASE)} e agora custam ${euros(custoDespesas(depois))}. É a INFLAÇÃO: os preços sobem com o tempo.`,
        ...(depois.semana === 12 ? ['A poupança rende 3% ao ano, mas os preços estão a subir uns 7%. O dinheiro parado compra cada vez menos.'] : []),
      ],
      MAE,
    )
  }

  // notícia e carteira
  await ctx.say(`${noticia.titulo}. ${noticia.texto}`, 'NOTÍCIAS')
  const valorAntes = Object.values(ATIVO).reduce((t, a) => t + valorCom(antes, antes.precos, a.id), 0)
  const valorDepois = valorCarteira(depois)
  if (valorAntes >= 1) {
    await ctx.say(`A tua carteira valia ${euros(valorAntes)} e agora vale ${euros(valorDepois)} (${pct(valorDepois / valorAntes - 1)}).`, 'INVESTIR')
  }
  await licoesDoMercado(ctx, antes, depois, valorAntes, valorDepois)

  const { relacoes, saude, educacao } = depois.stats
  const menor = Math.min(relacoes, saude, educacao)
  if (menor < 35) {
    if (menor === saude) await ctx.say('Pareces sem energia. Descansa, faz desporto no campo de jogos e não exageres nos turnos.', MAE)
    else if (menor === relacoes) await ctx.say('Os teus amigos têm saudades tuas. O Rui e a Inês costumam estar no parque.', MAE)
    else await ctx.say('As notas estão a descer. A biblioteca da escola é grátis!', MAE)
  }

  // evento da semana
  if (!depois.gameOver) {
    const atual = ctx.estado()
    const ev = escolherEventoCidade(atual)
    await ctx.say(`Aconteceu uma coisa: ${ev.titulo}`)
    const op = ev.opcoes[await ctx.ask(ev.texto(atual), ev.opcoes.map((o) => o.label))]
    const { estado, texto } = op.aplicar(ctx.estado())
    ctx.definir({ ...estado, flags: [...estado.flags, `ev_${ev.id}`] })
    await ctx.say(texto)
    if (op.conquista) await ctx.cracha(op.conquista)
  }
  await verificarConquistas(ctx)
}

async function licoesDoMercado(ctx: Ctx, antes: EstadoCidade, depois: EstadoCidade, valorAntes: number, valorDepois: number) {
  const semana = depois.semana
  const tinha = (id: AtivoId) => valorCom(antes, antes.precos, id) >= 1
  if (semana === 5 && tinha('lua')) {
    await ctx.say('A tua LuaCoin disparou! Mas lembra-te: o que sobe muito depressa também pode cair muito depressa.', MESTRE)
  }
  if (semana === 7) {
    if (tinha('lua')) {
      const perda = valorCom(antes, antes.precos, 'lua') - valorAtivo(depois, 'lua')
      await ctx.say(
        [`A LuaCoin caiu 70% e perdeste ${euros(perda)}.`, 'Comprar só porque está na moda e toda a gente está a comprar é dos erros mais comuns. Não ponhas em cripto o que não aceitas perder.'],
        MESTRE,
      )
    } else {
      await ctx.say('Viste a LuaCoin? Quem comprou no pico perdeu 70% numa semana. Ainda bem que não foste atrás da moda!', MESTRE)
    }
  }
  if (semana === 9) {
    const exposto = ARRISCADOS.some(tinha)
    await ctx.say(
      [
        'Crise! Em todo o mundo, as bolsas estão a cair. Acontece de tempos a tempos.',
        exposto
          ? 'Os teus investimentos desceram. Calma: a perda só fica real se venderes. Quem vende em pânico costuma vender no pior momento.'
          : 'Se tiveres ações ou ETFs, não vendas em pânico. As crises costumam passar, embora ninguém saiba quando.',
      ],
      MESTRE,
    )
    if (exposto) comFlag(ctx, 'na_crise')
  }
  if (semana === 13 && tem(ctx, 'na_crise') && !tem(ctx, 'vendeu_crise') && ARRISCADOS.some((id) => valorAtivo(depois, id) >= 1)) {
    await ctx.say('A crise está a passar e tu aguentaste sem vender. Muito bem!', MESTRE)
    await ctx.cracha('mao_firme')
  }
  if (semana === 17 && valorAntes >= 1) {
    const brisaAntes = valorCom(antes, antes.precos, 'brisa')
    if (brisaAntes >= 1) {
      const perda = brisaAntes - valorAtivo(depois, 'brisa')
      const total = valorDepois / valorAntes - 1
      const so = ativosNaCarteira(antes).length === 1
      await ctx.say(
        [
          `A Refrescos Brisa afundou e perdeste ${euros(perda)} nela.`,
          so
            ? 'Como só tinhas Brisa, a tua carteira inteira afundou com ela. É por isto que se diversifica!'
            : `Mas a tua carteira toda variou só ${pct(total)}: os outros investimentos seguraram a queda. Isto é DIVERSIFICAR!`,
        ],
        MESTRE,
      )
    } else if (tinha('etf')) {
      await ctx.say('A Brisa afundou, mas o teu ETF Mundo quase nem sentiu: lá dentro, a Brisa é só uma de centenas de empresas.', MESTRE)
    }
  }
}

export async function resumoFinalCidade(ctx: Ctx) {
  const s = ctx.estado()
  if (s.stats.educacao >= 70) {
    mudar(ctx, (x) => ({ ...x, dinheiro: round2(x.dinheiro + BOLSA_MERITO), flags: [...x.flags, 'bolsa'] }))
    await ctx.say(
      [`Grandes notas este ano! A escola deu-te uma BOLSA DE MÉRITO de ${euros(BOLSA_MERITO)}.`, 'Investir em ti, a estudar, também rendeu dinheiro!'],
      'Prof. Nuno',
    )
  }
  const f = ctx.estado()
  const viagem = poupadoViagem(f) >= META_VIAGEM || f.crachas.includes('viagem')
  await ctx.say(
    [
      `${f.name}, chegaste ao fim do ano letivo!`,
      `Património final: ${euros(patrimonio(f))} (conta ${euros(f.dinheiro)}, poupança ${euros(f.poupanca)}, investimentos ${euros(valorCarteira(f))}).`,
      f.salarioTotal > 0 ? `Ganhaste ${euros(f.salarioTotal)} a trabalhar no Café.` : 'Este ano não trabalhaste: a mesada sozinha chega para pouco.',
      viagem ? 'E conseguiste juntar o dinheiro da Viagem de Finalistas. Boa viagem!' : `Faltou pouco para os ${META_VIAGEM}€ da Viagem de Finalistas. Para o ano há mais!`,
      `Ganhaste ${f.crachas.length} de ${CONQUISTAS_CIDADE.length} conquistas.`,
      'Lembra-te: tudo isto foi uma simulação com dinheiro e empresas a fingir. Na vida real, antes de investir, aprende mais e fala com um adulto de confiança.',
    ],
    MESTRE,
  )
}
