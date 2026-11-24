import { clamp } from '../data'
import type { CtxJogo } from '../modo'
import { deslocar } from '../variacao'
import type { Interacao } from '../world/motor'
import { CONQUISTAS_REFORMA } from './conquistas'
import {
  ANOS_ATE_REFORMA,
  ANOS_REFORMA,
  APOIO_ANUAL,
  avancarAno,
  despesasAno,
  ESTILOS,
  euros,
  faltaPorAno,
  idadeDe,
  IDADE_REFORMA,
  LEVANTAMENTO_SEGURO,
  patrimonioR,
  pensaoAno,
  poupancas,
  round2,
  taxaLevantamento,
  type EstadoReforma,
  type RelatorioAno,
} from './economia'

type Ctx = CtxJogo<EstadoReforma>

const MESTRE = 'Mestre Moedas'
const SOFIA = 'Gestora Sofia'
const NETA = 'Neta Leonor'

function mudar(ctx: Ctx, f: (s: EstadoReforma) => EstadoReforma) {
  ctx.definir(f(ctx.estado()))
}

function stats(ctx: Ctx, saude: number, relacoes: number) {
  mudar(ctx, (s) => ({ ...s, stats: { saude: clamp(s.stats.saude + saude), relacoes: clamp(s.stats.relacoes + relacoes) } }))
}

function tem(ctx: Ctx, flag: string) {
  return ctx.estado().flags.includes(flag)
}

function comFlag(ctx: Ctx, flag: string): boolean {
  if (tem(ctx, flag)) return true
  mudar(ctx, (s) => ({ ...s, flags: [...s.flags, flag] }))
  return false
}

/** Um gasto já: sai da conta e, se não chegar, do depósito. */
function gastar(ctx: Ctx, valor: number) {
  mudar(ctx, (s) => {
    const daConta = Math.min(s.conta, valor)
    return { ...s, conta: round2(s.conta - daConta), deposito: round2(Math.max(0, s.deposito - (valor - daConta))) }
  })
}

const pct = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('pt-PT')}%`

// ---------------------------------------------------------------------------

export async function tutorialReforma(ctx: Ctx) {
  const s = ctx.estado()
  const p = s.projecao
  const total = p.deposito + p.investido + p.ppr
  await ctx.say(
    [
      `${s.name}! Passaram ${ANOS_ATE_REFORMA} anos. Tens ${IDADE_REFORMA} anos e acabaste de te reformar.`,
      'Voltaste a viver na Vila Moeda, na casa onde cresceste. Eu já tenho uns 100 anos... mas a cabeça ainda funciona!',
      'Lembras-te do mealheiro? Vamos ver o que o TEMPO fez ao teu dinheiro.',
    ],
    MESTRE,
  )
  await ctx.say(
    [
      `Aos ${p.idade} anos, tinhas ${euros(p.inicial)} em conta, depósito, PPR e investimentos. E continuaste a poupar 100€ por mês${p.plano ? `, mais ${euros(p.plano)} por mês no plano do ETF` : ''}.`,
      `Hoje: depósito ${euros(p.deposito)}, investimentos ${euros(p.investido)}${p.empresa ? ` (com o que fizeste ao vender a empresa)` : ''}, PPR ${euros(p.ppr)}. Total: ${euros(total)}.`,
      `Se tivesses deixado tudo parado no depósito, terias só ${euros(p.soDeposito)}. A diferença é o juro composto dos investimentos.`,
      `E repara: 100€ por mês num ETF, a começar aos 30, dão ${euros(p.tarde)} aos 65. A começar aos 20, dão ${euros(p.cedo)}. Dez anos de diferença valem o dobro!`,
    ],
    MESTRE,
  )
  await ctx.cracha('juro_composto')
  await ctx.say(
    [
      `Agora recebes a pensão da Segurança Social: ${euros(s.pensaoMes)} por mês, 14 vezes por ano (${euros(pensaoAno(s))}).`,
      'A pensão costuma ser bem menor do que o último salário. O que faltar sai das tuas poupanças.',
      `Cada noite que dormes passa um ANO. O objetivo é chegar aos ${IDADE_REFORMA + ANOS_REFORMA} anos sem ficar sem dinheiro, e com saúde e amigos.`,
      'Primeiro: que vida queres ter na reforma?',
    ],
    MESTRE,
  )
  await escolherEstilo(ctx, MESTRE)
  await ctx.say(
    [
      'Na Gestora Sofia, no Banco, decides quanto fica no depósito (seguro) e quanto fica investido (rende mais, mas oscila).',
      'Em casa está a tua neta, a Leonor. E na vila há amigos de infância à tua espera... Tens START para ver as contas. Boa reforma!',
    ],
    MESTRE,
  )
  comFlag(ctx, 'tutorial')
}

async function escolherEstilo(ctx: Ctx, quem: string) {
  const s = ctx.estado()
  const linhas = ESTILOS.map((e, i) => {
    const t = { ...s, estilo: i as 0 | 1 | 2 }
    return `${e.nome}: ${euros(despesasAno(t))}/ano. ${e.texto} Tira ${euros(faltaPorAno(t))} por ano às poupanças (${pct(taxaLevantamento(t))}).`
  })
  await ctx.say([...linhas, `Regra prática: tirar até uns ${pct(LEVANTAMENTO_SEGURO)} das poupanças por ano costuma dar para muitas décadas.`], quem)
  const r = await ctx.ask('Que estilo de vida?', ESTILOS.map((e) => e.nome), quem)
  mudar(ctx, (x) => ({ ...x, estilo: r as 0 | 1 | 2 }))
  const t = taxaLevantamento(ctx.estado())
  await ctx.say(
    t <= LEVANTAMENTO_SEGURO
      ? `${ESTILOS[r].nome}: ${pct(t)} por ano. Sustentável!`
      : `${ESTILOS[r].nome}: ${pct(t)} por ano. É acima do recomendado: as poupanças podem não chegar aos ${IDADE_REFORMA + ANOS_REFORMA}.`,
    quem,
  )
}

async function verificar(ctx: Ctx) {
  const s = ctx.estado()
  if (s.conta + s.deposito >= 2 * faltaPorAno(s) && faltaPorAno(s) > 0) await ctx.cracha('almofada')
  if (s.anosSustentaveis >= 5) await ctx.cracha('regra4')
}

// ---------------------------------------------------------------------------
// Pessoas

const ACOES_NPC: Record<string, (ctx: Ctx) => Promise<void>> = {
  async neta(ctx) {
    const s = ctx.estado()
    const r = await ctx.ask('Olá! Brincas comigo?', ['JOGO DA MEMÓRIA', 'O MEALHEIRO DELA', 'DAR-LHE 20€', 'ADEUS'], NETA, 3)
    if (r === 3) return ctx.say('Adeus! Volta amanhã!', NETA)
    if (r === 0) {
      const jogo = await ctx.jogar('memoria')
      stats(ctx, 1, 4)
      await ctx.say([`${jogo.texto}!`, 'Tu sabes tanto de moedas! Ensinas-me a poupar como tu?'], NETA)
      await ctx.say(
        [
          'Contaste-lhe a história da macieira da Avó Rosa: as sementes que se plantam em vez de se comerem.',
          'Ela vai guardar metade da mesada no mealheiro. O círculo fecha-se!',
        ],
      )
      return ctx.cracha('neta')
    }
    if (r === 1) {
      return ctx.say(
        ['Tenho 23 moedas no mealheiro! Quero comprar uma bicicleta... custa 120.', 'Se eu guardar 5 por semana, quanto tempo demoro?'],
        NETA,
      )
    }
    if (comFlag(ctx, `prenda_${s.ano}`)) return ctx.say('Já me deste uma prenda este ano! Obrigada!', NETA)
    gastar(ctx, 20)
    stats(ctx, 0, 3)
    await ctx.say(['Obrigada! Vou pôr 10 no mealheiro e gastar 10 em gomas!', 'Boa escolha: metade para poupar, metade para gastar.'], NETA)
  },

  async vizinha(ctx) {
    await ctx.say(
      [
        'Ai, sabe o que me aconteceu? Recebi uma mensagem: "Olá mãe, mudei de número, preciso de dinheiro urgente".',
        'Quase transferi 900€! Liguei para o número antigo do meu filho... e ele estava no trabalho, nem sabia de nada.',
        'Dizem que estas burlas são cada vez mais comuns com os mais velhos. Cuidado!',
      ],
      'D. Graça',
    )
  },

  async loja_r(ctx) {
    const quem = 'Sr. Doce Júnior'
    const s = ctx.estado()
    const r = await ctx.ask('O meu pai falava muito de si! O que deseja?', ['UM GELADO', 'AJUDAR NA CAIXA', 'COMPARAR PREÇOS', 'ADEUS'], quem, 3)
    if (r === 3) return ctx.say('Volte sempre!', quem)
    if (r === 0) {
      const preco = round2(2.5 * s.indice)
      gastar(ctx, preco)
      return ctx.say(
        [`Aqui tem: ${euros(preco)}.`, 'Quando era criança, um gelado custava 10 moedas da vila. Os preços sobem com o tempo: é a inflação, que também come a pensão.'],
        quem,
      )
    }
    if (r === 1) {
      const jogo = await ctx.jogar('troco_euros')
      stats(ctx, 1, 2)
      return ctx.say([`${jogo.texto}.`, 'Está mais rápido do que eu! Fazer contas de cabeça mantém o cérebro em forma.'], quem)
    }
    const jogo = await ctx.jogar('comparar')
    stats(ctx, 1, 0)
    await ctx.say([`${jogo.texto}.`, 'Na reforma, cada euro poupado nas compras é um euro que não sai das poupanças.'], quem)
  },

  async cliente_r(ctx) {
    await ctx.say('Os preços estão sempre a subir... e a minha pensão sobe menos. Ainda bem que guardei algum dinheiro.', 'Cliente')
  },

  async sofia_r(ctx) {
    for (;;) {
      const s = ctx.estado()
      const r = await ctx.ask(
        `Depósito ${euros(s.deposito)} · Investido ${euros(s.investido)} · PPR ${euros(s.ppr)}. O que deseja?`,
        ['MAIS SEGURO (+10.000€ DEPÓSITO)', 'MAIS INVESTIDO (+10.000€)', 'ESTILO DE VIDA', 'COMPARAR OFERTAS', 'ADEUS'],
        SOFIA,
        4,
      )
      if (r === 4) return ctx.say('Até à próxima! Lembre-se: nada de decisões com pressa.', SOFIA)
      if (r === 0 || r === 1) {
        const de = r === 0 ? 'investido' : 'deposito'
        const para = r === 0 ? 'deposito' : 'investido'
        const v = Math.min(10000, s[de])
        if (v <= 0) {
          await ctx.say('Não há dinheiro para mudar.', SOFIA)
          continue
        }
        mudar(ctx, (x) => ({ ...x, [de]: round2(x[de] - v), [para]: round2(x[para] + v) }))
        await ctx.say(
          r === 0
            ? [`${euros(v)} passaram para o depósito: rende pouco, mas não cai.`, 'Uma almofada de 2 anos de despesas no depósito evita vender investimentos quando a bolsa cai.']
            : [`${euros(v)} passaram para investimentos: rende mais em média, mas oscila.`, 'Na reforma ainda se vive 20 ou 30 anos: uma parte investida ajuda o dinheiro a acompanhar a inflação.'],
          SOFIA,
        )
        await verificar(ctx)
        continue
      }
      if (r === 2) {
        await escolherEstilo(ctx, SOFIA)
        await verificar(ctx)
        continue
      }
      const jogo = await ctx.jogar('comparar_adulto')
      await ctx.say([`${jogo.texto}.`, 'Mesmo reformado, compare sempre: seguros de saúde, comissões, ofertas de crédito... e desconfie de juros "garantidos" altos.'], SOFIA)
    }
  },

  async mestre_r(ctx) {
    const s = ctx.estado()
    const temas = ['A REGRA DOS 4%', 'E SE A BOLSA CAIR?', 'A INFLAÇÃO', 'HERANÇA', 'ADEUS']
    await ctx.say(`${s.name}, tens ${idadeDe(s)} anos e ${euros(patrimonioR(s))} de património (com a casa). Senta-te.`, MESTRE)
    for (;;) {
      const r = await ctx.ask('Sobre o que queres conversar?', temas, MESTRE, 4)
      if (r === 4) return ctx.say('Estou orgulhoso de ti. Começaste com um mealheiro... e olha até onde chegaste.', MESTRE)
      const atual = ctx.estado()
      const falas = [
        [
          `Este ano vais tirar ${pct(taxaLevantamento(atual))} das poupanças. Até uns ${pct(LEVANTAMENTO_SEGURO)} por ano, o dinheiro costuma durar 30 anos.`,
          'Se gastares mais nos primeiros anos, sobra menos para os últimos, quando a saúde costuma custar mais.',
        ],
        [
          'Na reforma, o perigo de uma queda na bolsa é ter de VENDER barato para pagar as contas.',
          'Por isso: 2 anos de despesas no depósito. Assim, quando a bolsa cai, gastas o depósito e esperas que recupere.',
        ],
        [
          `Desde que te reformaste, os preços já subiram ${pct(atual.indice - 1)}. A pensão também sobe, mas costuma subir menos.`,
          'Dinheiro todo parado no depósito perde para a inflação. Uma parte investida ajuda a acompanhar.',
        ],
        [
          'O que sobrar será a herança da tua família. Fazer um testamento evita confusões.',
          'Mas a melhor herança é o que ensinas: a tua neta a pôr metade da mesada no mealheiro vale ouro!',
        ],
      ]
      await ctx.say(falas[r], MESTRE)
    }
  },

  async voluntariado(ctx) {
    const quem = 'Diretora Inês'
    const r = await ctx.ask('Procuramos voluntários para dar uma aula de dinheiro aos alunos. Quer ajudar?', ['DAR A AULA', 'AGORA NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Quando quiser, a porta está aberta!', quem)
    await ctx.say('Os alunos fazem-lhe perguntas. Responda com calma!', quem)
    const jogo = await ctx.jogar('explicacoes')
    stats(ctx, 2, 6)
    await ctx.say([`${jogo.texto}.`, 'Os alunos adoraram! Um deles disse que vai começar a poupar já esta semana.'], quem)
    await ctx.cracha('voluntario')
  },

  async aluno_r(ctx) {
    await ctx.say('Sabia que se eu poupar 1€ por dia, ao fim de um ano tenho 365€? E se investir, ainda mais!', 'Aluno')
  },

  async marta_r(ctx) {
    const s = ctx.estado()
    await ctx.say(
      [
        `${s.name}! Lembras-te de quando poupei para a bicicleta? Nunca mais deixei de poupar.`,
        'Aos 25 comecei a pôr um bocadinho todos os meses num fundo. Nunca fui rica... mas agora viajo com o meu marido e não me preocupo.',
      ],
      'Marta',
    )
  },

  async tiago_r(ctx) {
    await ctx.say(
      [
        'Olá... Lembras-te do pneu furado, quando eu não tinha nada guardado? A vida inteira foi um bocado assim.',
        'Gastei tudo, sempre. Agora só tenho a pensão, e no fim do mês aperta. Se pudesse voltar atrás, começava a poupar logo aos 20.',
        'Mas olha: nunca é tarde para pôr as contas em ordem. Estou a aprender com a minha neta!',
      ],
      'Tiago',
    )
  },

  async ginastica(ctx) {
    const quem = 'Prof. Zé (ginástica)'
    const s = ctx.estado()
    if (comFlag(ctx, `ginastica_${s.ano}`)) return ctx.say('Já treinou este ano! Para o ano há mais.', quem)
    const r = await ctx.ask('Ginástica sénior no campo! É grátis, da junta de freguesia. Vamos?', ['VAMOS!', 'HOJE NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Mexer o corpo é o melhor remédio. Volte quando quiser!', quem)
    const jogo = await ctx.jogar('ginasio')
    mudar(ctx, (x) => ({ ...x, ginastica: x.ginastica + 1 }))
    stats(ctx, 8, 3)
    await ctx.say([`${jogo.texto}.`, 'Saúde +8! Quem se mexe gasta menos em médicos e medicamentos.'], quem)
    if (ctx.estado().ginastica >= 3) await ctx.cracha('saude_senior')
  },

  async amigos_r(ctx) {
    const quem = 'Leo e Bia'
    const r = await ctx.ask('Lembras-te de nós? Vamos ao bowling com o clube sénior? São 8€.', ['VAMOS!', 'HOJE NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Fica para a próxima! Estamos sempre por aqui.', quem)
    gastar(ctx, round2(8 * ctx.estado().indice))
    const jogo = await ctx.jogar('bowling')
    stats(ctx, 2, 6)
    await ctx.say([`${jogo.texto}!`, 'Na reforma, os amigos são o melhor investimento. Relações +6.'], quem)
  },

  async antigo_cliente(ctx) {
    const quem = 'Sr. Rogério'
    const f = ctx.estado().flags
    const linhas: string[] = []
    if (f.includes('passado_negocio_cafe')) linhas.push('Eu conheço-o! Tomava o pequeno-almoço no seu café todos os dias, há 35 anos. Aquelas torradas!')
    else if (f.includes('passado_negocio_gelados')) linhas.push('Lembra-se de mim? Os meus filhos iam à sua gelataria todos os verões. Ainda falam do gelado de morango!')
    else if (f.includes('passado_negocio_entregas')) linhas.push('Eu era cliente da sua empresa de estafetas! As minhas encomendas chegavam sempre a horas, de bicicleta.')
    else linhas.push('Bom dia! Mudei-me para a vila há pouco tempo. Dizem que cresceu aqui!')
    if (f.includes('passado_empregos')) linhas.push('E sabe que mais? A minha filha teve o primeiro emprego na sua empresa. Ainda diz que aprendeu muito consigo.')
    if (f.includes('passado_lucro')) linhas.push('Uma empresa bem gerida deixa marcas na terra. Obrigado!')
    if (f.includes('passado_gato')) linhas.push('Ah, e aquele gato laranja no seu quintal... é bisneto do Bolinhas, não é?')
    await ctx.say(linhas, quem)
  },

  async feirante(ctx) {
    const quem = 'Sr. Manel (feira)'
    const r = await ctx.ask('Ainda me lembro de ti pequeno! Regateamos como antigamente?', ['VAMOS!', 'SÓ VER'], quem, 1)
    if (r !== 0) return ctx.say('Os anos passam e a feira continua. Volta quando quiseres!', quem)
    const jogo = await ctx.jogar('regatear')
    stats(ctx, 1, 3)
    await ctx.say([`${jogo.texto}!`, 'Na reforma, cada euro conta: comprar em segunda mão e regatear com simpatia ajuda a esticar a pensão.'], quem)
  },

  async pescar(ctx) {
    const quem = 'Sr. Alberto'
    const r = await ctx.ask('O lago está calmo hoje. Pescamos um bocado? Tenho uma cana a mais.', ['PESCAR', 'SÓ CONVERSAR'], quem)
    if (r === 1) {
      return ctx.say(
        ['Pescar é como investir: muita paciência e pouca pressa. Quem puxa a linha antes do tempo fica sem nada.', 'E quem passa o dia a olhar para a boia também não pesca mais!'],
        quem,
      )
    }
    const jogo = await ctx.jogar('pesca')
    stats(ctx, 3, 3)
    await ctx.say([`${jogo.texto}!`, jogo.pontos >= 6 ? 'Grande pescaria! Tens jeito e paciência.' : 'Paciência: espera que o peixe morda bem antes de puxar.'], quem)
  },
}

const ACOES_OBJETO: Record<string, (ctx: Ctx) => Promise<void>> = {
  async cama(ctx) {
    const r = await ctx.ask('Queres ir dormir? Vai passar um ANO.', ['SIM', 'NÃO'], undefined, 1)
    if (r === 0) await dormir(ctx)
  },
  async mealheiro(ctx) {
    await ctx.say(['O teu mealheiro de criança! Ainda tem 3 moedas da vila lá dentro.', 'Foi aqui que tudo começou: 10 moedas de cada vez.'])
  },
  async tv(ctx) {
    await ctx.say(['Anúncio: "Crédito para seniores! Dinheiro já, sem perguntas!"', 'Crédito fácil na reforma é perigoso: a pensão não aumenta para pagar prestações.'])
  },
  async livros(ctx) {
    await ctx.say('Os teus livros de sempre. Um deles: "O esquilo que guardou nozes para o inverno". Afinal tinha razão!')
  },
  async cofre(ctx) {
    await ctx.say('O cofre do banco. Os depósitos continuam garantidos até 100.000€ por pessoa e por banco.')
  },
  async quadro(ctx) {
    await ctx.say(['No quadro, alguém escreveu:', 'POUPAR · INVESTIR · ESPERAR. E por baixo, com outra letra: "obrigado pela aula!"'])
  },
  async correio(ctx) {
    const s = ctx.estado()
    await ctx.say(`Uma carta da Segurança Social: "A sua pensão é de ${euros(s.pensaoMes)} por mês, paga 14 vezes por ano."`)
  },
  async bola(ctx) {
    const jogo = await ctx.jogar('futebol')
    stats(ctx, 2, 1)
    await ctx.say([`${jogo.texto}!`, 'Uns penáltis com o neto do vizinho. Ainda tens pontaria!'])
  },
}

export async function executarInteracaoReforma(i: Interacao, ctx: Ctx) {
  if (i.tipo === 'npc') return ACOES_NPC[i.npc.script]?.(ctx)
  if (i.tipo === 'prop' && i.prop.script) return ACOES_OBJETO[i.prop.script]?.(ctx)
  if (i.tipo === 'placa') return ctx.say(i.placa.texto.replace('{nome}', ctx.estado().name.toUpperCase()))
  if (i.tipo === 'trancado') return ctx.say(i.texto)
}

// ---------------------------------------------------------------------------
// O ano

interface EventoReforma {
  id: string
  ano?: number
  quando?: (s: EstadoReforma) => boolean
  titulo: string
  texto: (s: EstadoReforma) => string
  opcoes: { label: string; aplicar: (ctx: Ctx) => Promise<void> }[]
}

const extra = (ctx: Ctx, texto: string, valor: number) => mudar(ctx, (s) => ({ ...s, extrasAno: [...s.extrasAno, { texto, valor: round2(valor) }] }))

const EVENTOS: EventoReforma[] = [
  {
    id: 'burla_neto',
    ano: 2,
    titulo: 'uma mensagem estranha.',
    texto: () => 'SMS: "Olá avó/avô, sou eu, mudei de número! Preciso de 900€ para pagar uma conta urgente, depois devolvo. Não digas nada aos pais."',
    opcoes: [
      {
        label: 'TRANSFERIR',
        aplicar: async (ctx) => {
          gastar(ctx, 900)
          await ctx.say('Era uma burla: o teu neto nunca mudou de número. Os 900€ desapareceram. Liga sempre para o número antigo antes de transferir!')
        },
      },
      {
        label: 'LIGAR AO NÚMERO ANTIGO',
        aplicar: async (ctx) => {
          await ctx.say('O teu neto atendeu no número de sempre: não tinha enviado nada! Era uma burla. Fizeste muito bem.')
          await ctx.cracha('anti_burla')
        },
      },
    ],
  },
  {
    id: 'crash',
    ano: 4,
    titulo: 'a bolsa caiu 28%!',
    texto: (s) => `No ano passado a bolsa caiu muito: os teus investimentos valem agora ${euros(s.investido)}. Na televisão só se fala de crise. O que fazes?`,
    opcoes: [
      {
        label: 'VENDER TUDO',
        aplicar: async (ctx) => {
          mudar(ctx, (s) => ({ ...s, deposito: round2(s.deposito + s.investido), investido: 0, flags: [...s.flags, 'vendeu_crise'] }))
          await ctx.say('Passaste tudo para o depósito. Ficas seguro... mas a perda ficou definitiva, e não vais apanhar a recuperação dos próximos anos.')
        },
      },
      {
        label: 'AGUENTAR',
        aplicar: async (ctx) => {
          await ctx.say('Respiraste fundo e não vendeste. Se tiveres depósito para os gastos, não precisas de tocar nos investimentos.')
          await ctx.cracha('mao_firme')
        },
      },
    ],
  },
  {
    id: 'universidade',
    ano: 6,
    titulo: 'a Leonor entrou na universidade!',
    texto: () => 'A tua neta entrou na universidade, longe de casa. Os pais pedem ajuda para o quarto no primeiro ano.',
    opcoes: [
      {
        label: 'AJUDAR (3.000€)',
        aplicar: async (ctx) => {
          extra(ctx, 'Ajuda à universidade', 3000)
          stats(ctx, 0, 10)
          await ctx.say('A Leonor ficou felicíssima. Ajudar a família é uma boa razão para ter poupado, desde que não ponha em risco a tua própria reforma.')
        },
      },
      {
        label: 'AJUDAR (1.000€)',
        aplicar: async (ctx) => {
          extra(ctx, 'Ajuda à universidade', 1000)
          stats(ctx, 0, 5)
          await ctx.say('Uma ajuda à medida das tuas possibilidades. Ela agradeceu muito.')
        },
      },
      { label: 'NÃO POSSO', aplicar: async (ctx) => ctx.say('Explicaste que a tua reforma tem de durar. Ela percebeu: também está a aprender a fazer contas.') },
    ],
  },
  {
    id: 'cruzeiro',
    titulo: 'convite para um cruzeiro!',
    texto: () => 'A Marta e o marido convidam-te para um cruzeiro de 10 dias pelo Mediterrâneo: 2.800€.',
    opcoes: [
      {
        label: 'IR',
        aplicar: async (ctx) => {
          extra(ctx, 'Cruzeiro', 2800)
          stats(ctx, 6, 10)
          await ctx.say('Dias inesquecíveis! A reforma também é para viver. O importante é caber no orçamento.')
        },
      },
      { label: 'FICAR', aplicar: async (ctx) => ctx.say('Ficaste em casa. Há passeios bem mais baratos aqui perto.') },
    ],
  },
  {
    id: 'dentes',
    titulo: 'consulta no dentista.',
    texto: () => 'Precisas de um implante dentário: 1.600€ no privado, ou esperar pela consulta no serviço público.',
    opcoes: [
      {
        label: 'PRIVADO (1.600€)',
        aplicar: async (ctx) => {
          extra(ctx, 'Dentista', 1600)
          stats(ctx, 4, 0)
          await ctx.say('Resolvido! Na reforma, a saúde é uma das maiores despesas.')
        },
      },
      {
        label: 'ESPERAR',
        aplicar: async (ctx) => {
          stats(ctx, -6, 0)
          await ctx.say('Poupaste, mas foram meses com dores. Saúde -6.')
        },
      },
    ],
  },
  {
    id: 'golpe',
    titulo: 'uma "oportunidade" de investimento.',
    texto: () => 'Um senhor muito simpático liga: "Investimento GARANTIDO de 12% ao ano, só para reformados. Mínimo 10.000€, tem de decidir hoje."',
    opcoes: [
      {
        label: 'INVESTIR',
        aplicar: async (ctx) => {
          extra(ctx, 'Burla do investimento "garantido"', Math.min(10000, poupancas(ctx.estado())))
          await ctx.say('Ao fim de uns meses, o "senhor simpático" desapareceu, com o dinheiro. Juros garantidos altos e pressa para decidir: sinais de burla!')
        },
      },
      { label: 'DESLIGAR', aplicar: async (ctx) => ctx.say('Desligaste. Não existem ganhos altos garantidos, e ninguém sério pressiona para decidir no mesmo dia.') },
    ],
  },
  {
    id: 'casa_grande',
    ano: 9,
    quando: (s) => s.casaPropria,
    titulo: 'a casa está grande demais.',
    texto: (s) => `Os filhos saíram há muito e a casa tem escadas e quartos vazios. Vale uns ${euros(s.valorCasa)}. Podias vender e comprar um apartamento mais pequeno, sem escadas, por metade.`,
    opcoes: [
      {
        label: 'MUDAR PARA UM T1',
        aplicar: async (ctx) => {
          const s = ctx.estado()
          const liberta = round2(s.valorCasa * 0.5 - s.valorCasa * 0.07)
          mudar(ctx, (x) => ({ ...x, deposito: round2(x.deposito + liberta), valorCasa: round2(x.valorCasa * 0.5) }))
          stats(ctx, 4, -2)
          await ctx.say(`Venda, compra, impostos e mudança: ficaste com mais ${euros(liberta)} no depósito e uma casa mais prática. Mas custou deixar a casa de sempre.`)
        },
      },
      { label: 'FICAR', aplicar: async (ctx) => ctx.say('Ficas na casa onde cresceste. Tem memórias que não têm preço.') },
    ],
  },
  {
    id: 'telhado',
    quando: (s) => s.casaPropria,
    titulo: 'chove dentro de casa!',
    texto: () => 'O telhado precisa de obras: 4.500€.',
    opcoes: [
      {
        label: 'FAZER AS OBRAS',
        aplicar: async (ctx) => {
          extra(ctx, 'Obras no telhado', 4500)
          await ctx.say('Telhado novo. Quem tem casa própria não paga renda, mas paga as obras.')
        },
      },
      {
        label: 'REMENDAR (800€)',
        aplicar: async (ctx) => {
          extra(ctx, 'Remendo no telhado', 800)
          stats(ctx, -3, 0)
          await ctx.say('Remendado... por agora. A humidade não faz bem à saúde.')
        },
      },
    ],
  },
  {
    id: 'apoio',
    ano: 14,
    titulo: 'precisas de mais ajuda.',
    texto: () => `Aos ${IDADE_REFORMA + 13}, as tarefas da casa custam mais. Um apoio domiciliário (limpeza, compras, refeições) custa uns ${euros(APOIO_ANUAL / 12)} por mês.`,
    opcoes: [
      {
        label: 'APOIO DOMICILIÁRIO',
        aplicar: async (ctx) => {
          mudar(ctx, (s) => ({ ...s, apoio: true }))
          stats(ctx, 6, 0)
          await ctx.say('Ficas em casa, com ajuda. É por isto que convém chegar a esta idade com poupanças: é quando os custos de saúde e apoio sobem.')
        },
      },
      {
        label: 'A FAMÍLIA AJUDA',
        aplicar: async (ctx) => {
          stats(ctx, -2, 6)
          await ctx.say('A família passa a vir mais vezes. Poupa-se dinheiro, mas é muito trabalho para eles.')
        },
      },
    ],
  },
  {
    id: 'doar',
    ano: 17,
    titulo: 'pensar na herança.',
    texto: (s) => `Tens ${euros(poupancas(s))} de poupanças. Os teus filhos estão a comprar casa. Dar-lhes já 10.000€ em vida?`,
    opcoes: [
      {
        label: 'DOAR 10.000€',
        aplicar: async (ctx) => {
          extra(ctx, 'Doação aos filhos', 10000)
          stats(ctx, 0, 8)
          await ctx.say('Ajudaste quando mais precisavam. Doações entre pais e filhos não pagam imposto do selo, mas declaram-se. Só faz sentido se a tua reforma continuar garantida!')
        },
      },
      { label: 'FAZER TESTAMENTO', aplicar: async (ctx) => ctx.say('Fizeste testamento no notário: fica tudo claro para o futuro, e o dinheiro continua a pagar a tua reforma.') },
    ],
  },
]

function escolherEvento(s: EstadoReforma): EventoReforma | null {
  const visto = (e: EventoReforma) => s.flags.includes(`evr_${e.id}`)
  // a altura muda de jogo para jogo (a queda da bolsa não: vem sempre logo no início)
  const ano = (e: EventoReforma) => (e.ano === undefined || e.id === 'crash' ? e.ano : deslocar(s, e.id, e.ano, 0, 2))
  const fixo = EVENTOS.find((e) => ano(e) === s.ano && !visto(e) && (!e.quando || e.quando(s)))
  if (fixo) return fixo
  const livres = EVENTOS.filter((e) => e.ano === undefined && !visto(e) && (!e.quando || e.quando(s)))
  if (!livres.length || Math.random() < 0.35) return null
  return livres[Math.floor(Math.random() * livres.length)]
}

async function dormir(ctx: Ctx) {
  await ctx.fade(1, 500)
  ctx.jingle('dormir')
  await ctx.say('Zzz... Passa um ano...')
  const { estado, relatorio } = avancarAno(ctx.estado())
  ctx.definir(estado)
  ctx.levar('casa', 7, 3, 'down')
  await ctx.fade(0, 500)
  await manha(ctx, relatorio)
  if (ctx.estado().gameOver) {
    await resumoFinal(ctx)
    ctx.terminar()
  }
}

async function manha(ctx: Ctx, r: RelatorioAno) {
  const s = ctx.estado()
  await ctx.say(s.gameOver ? `Fizeste ${r.idade + 1} anos! Chegaste ao fim da aventura.` : `Fizeste ${r.idade + 1} anos! Começa o ano ${s.ano} de ${ANOS_REFORMA} da reforma.`)
  const linhas = [
    `O ANO QUE PASSOU: pensão ${euros(r.pensao)} · despesas ${euros(r.despesas)}${r.extras.length ? ` (com ${r.extras.map((e) => e.texto.toLowerCase()).join(', ')})` : ''}.`,
    r.levantado > 0 ? `Tiraste ${euros(r.levantado)} das poupanças.` : 'A pensão chegou para tudo: não tocaste nas poupanças!',
    `Investimentos: ${r.retornoInvestido >= 0 ? '+' : ''}${pct(r.retornoInvestido)} · inflação: ${pct(r.inflacao)}.`,
    `Agora: depósito ${euros(s.deposito)} · investido ${euros(s.investido)} · PPR ${euros(s.ppr)} · conta ${euros(s.conta)}.`,
  ]
  if (r.vendeuInvestimentos) linhas.push(r.retornoInvestido < 0 ? 'O depósito não chegou e tiveste de vender investimentos num ano mau. Uma almofada maior evitava isso.' : 'O depósito acabou: começaste a vender investimentos.')
  if (r.faltou > 0) linhas.push(`As poupanças acabaram: faltaram ${euros(r.faltou)}. Tiveste de cortar em tudo. Saúde e Relações descem.`)
  await ctx.say(linhas, 'Gestora Sofia (carta)')

  if (!s.gameOver) {
    if (s.ano === 3) await ctx.say('Este ano a inflação foi de 6% e a pensão só subiu 3%. Com uma pensão fixa, a inflação vai comendo o poder de compra.', MESTRE)
    const t = taxaLevantamento(s)
    if (t > 0.06 && poupancas(s) > 0) await ctx.say(`Atenção: ao ritmo atual estás a tirar ${pct(t)} das poupanças por ano. Pensa em mudar de estilo de vida, na Gestora Sofia.`, MESTRE)
    if (s.stats.saude < 30) await ctx.say('Andas com pouca energia. A ginástica sénior no campo é grátis!', NETA)
    if (s.stats.relacoes < 30) await ctx.say('Há muito tempo que não vens jantar connosco! Os amigos e a família também precisam de ti.', NETA)

    const ev = escolherEvento(s)
    if (ev) {
      await ctx.say(`Este ano: ${ev.titulo}`)
      const i = await ctx.ask(ev.texto(ctx.estado()), ev.opcoes.map((o) => o.label))
      mudar(ctx, (x) => ({ ...x, flags: [...x.flags, `evr_${ev.id}`] }))
      await ev.opcoes[i].aplicar(ctx)
    }
  } else if (!s.semDinheiro) await ctx.cracha('tranquila')
  await verificar(ctx)
}

async function resumoFinal(ctx: Ctx) {
  const s = ctx.estado()
  await ctx.say(
    [
      `${s.name}, chegaste aos ${IDADE_REFORMA + ANOS_REFORMA} anos.`,
      s.semDinheiro
        ? 'A certa altura, as poupanças acabaram e passaste a viver só da pensão. Foi apertado... mas a família e os amigos ajudaram.'
        : `As poupanças chegaram até ao fim: ainda tens ${euros(poupancas(s))}${s.casaPropria ? `, e a casa vale ${euros(s.valorCasa)}` : ''}.`,
      'Lembras-te do teu primeiro mealheiro? Da primeira conta no banco, do primeiro salário, da casa, da empresa... Cada escolha contou.',
      'Poupar um bocadinho, começar cedo, investir com paciência, fugir de dívidas caras e de burlas, e cuidar da saúde e das pessoas. Foi esta a aventura toda.',
      `Conquistas desta fase: ${s.crachas.length} de ${CONQUISTAS_REFORMA.length}. Obrigado por jogares a Vila Moeda!`,
    ],
    MESTRE,
  )
}
