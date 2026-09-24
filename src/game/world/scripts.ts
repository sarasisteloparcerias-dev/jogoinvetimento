import { CRACHAS, META_OBJETIVO, objetivoAtual } from '../crachas'
import { executarAcao, registarLog } from '../engine'
import { MENTOR } from '../mentor'
import { MARTA, TIAGO } from '../npcs'
import type { ActionId, GameEvent, PlayerState } from '../types'
import type { Interacao } from './motor'

export interface Ctx {
  say(texto: string | string[], quem?: string): Promise<void>
  ask(texto: string, opcoes: string[], quem?: string, cancelar?: number): Promise<number>
  estado(): PlayerState
  definir(s: PlayerState): void
  cracha(id: string): Promise<void>
  dormir(): Promise<void>
}

export function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })
}

function sinal(n: number) {
  return (n > 0 ? '+' : '') + fmt(n)
}

export function descreverMudancas(antes: PlayerState, depois: PlayerState): string {
  const partes: string[] = []
  const add = (nome: string, a: number, b: number) => {
    if (Math.abs(b - a) > 0.001) partes.push(`${nome} ${sinal(b - a)}`)
  }
  add('Carteira', antes.saldo, depois.saldo)
  add('Mealheiro', antes.poupanca, depois.poupanca)
  add('Investimento', antes.investimento.amount, depois.investimento.amount)
  add('Relações', antes.stats.relacoes, depois.stats.relacoes)
  add('Saúde', antes.stats.saude, depois.stats.saude)
  add('Educação', antes.stats.educacao, depois.stats.educacao)
  return partes.join(' · ')
}

function semEmoji(t: string) {
  return t.replace(/^[^\p{L}]+/u, '')
}

function comFlag(ctx: Ctx, flag: string): boolean {
  const s = ctx.estado()
  if (s.flags.includes(flag)) return true
  ctx.definir({ ...s, flags: [...s.flags, flag] })
  return false
}

/** Executa uma ação do motor financeiro e devolve o antes/depois, ou null se não houver moedas. */
function fazer(ctx: Ctx, id: ActionId) {
  const antes = ctx.estado()
  const depois = executarAcao(antes, id)
  if (depois === antes) return null
  ctx.definir(depois)
  return { antes, depois }
}

async function verificarObjetivo(ctx: Ctx) {
  if (ctx.estado().poupanca >= META_OBJETIVO) await ctx.cracha('objetivo')
}

async function semMoedas(ctx: Ctx, quem: string, custo: number) {
  await ctx.say(`Precisas de ${custo} moedas na carteira e só tens ${fmt(ctx.estado().saldo)}. Dorme na tua cama e de manhã recebes a mesada!`, quem)
}

// ---------------------------------------------------------------------------

export async function tutorial(ctx: Ctx) {
  const nome = ctx.estado().name
  await ctx.say(
    [
      `Bom dia, ${nome}! Hoje começa a tua grande aventura na Vila Moeda!`,
      'Aqui tens 15 moedas. E todas as semanas vou dar-te uma mesada.',
      'Com o dinheiro podes GASTAR na loja, POUPAR no teu mealheiro ou INVESTIR no Banco.',
      'Para falares com alguém, vira-te para a pessoa e carrega em A.',
      'Para passares à semana seguinte, vai dormir na tua cama.',
      'Carrega em START para veres a tua mochila, os teus crachás e o teu objetivo.',
      'Começa por guardar umas moedas no mealheiro. Está ali, ao lado da planta!',
    ],
    'Mãe',
  )
  comFlag(ctx, 'tutorial')
}

const DICAS_MAE = [
  'Antes de comprares alguma coisa, pergunta-te: PRECISO disto, ou só QUERO isto agora?',
  'Se guardares moedas no mealheiro, elas crescem sozinhas. Chama-se juro!',
  'Não gastes tudo no mesmo dia. Guarda sempre um bocadinho para imprevistos.',
  'Cada noite que dormes passa uma semana. Aproveita bem cada semana!',
  'Dinheiro não é tudo: amigos, saúde e escola também contam muito.',
]

const ACOES_NPC: Record<string, (ctx: Ctx) => Promise<void>> = {
  async mae(ctx) {
    const s = ctx.estado()
    const obj = objetivoAtual(s)
    await ctx.say(`Olá, ${s.name}! ${DICAS_MAE[s.week % DICAS_MAE.length]}`, 'Mãe')
    if (obj) await ctx.say(`O teu próximo desafio: ${obj.objetivo}`, 'Mãe')
  },

  async avo(ctx) {
    await ctx.say(
      [
        `Olá, ${ctx.estado().name}! Senta-te, que eu conto-te uma história.`,
        'Quando eu era pequena, plantei uma macieira. No primeiro ano deu só 2 maçãs...',
        'Mas eu não comi as sementes: plantei-as! No ano seguinte tinha 3 árvores. Depois 9...',
        'O dinheiro guardado faz o mesmo: o juro também ganha juro. Chama-se JURO COMPOSTO.',
        'O segredo é começar cedo e ter paciência. O tempo é o melhor amigo de quem poupa!',
      ],
      'Avó Rosa',
    )
  },

  async sr_doce(ctx) {
    const quem = 'Sr. Doce'
    if (!comFlag(ctx, 'loja')) {
      await ctx.say(
        ['Bem-vindo à Loja do Sr. Doce!', 'Um conselho de amigo: antes de comprares, pensa se PRECISAS disso ou se só QUERES agora.'],
        quem,
      )
    }
    const r = await ctx.ask('Um gelado gigante custa 10 moedas. Queres um?', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Boa escolha também! Às vezes, a melhor compra é não comprar nada.', quem)
    const res = fazer(ctx, 'gastar')
    if (!res) return semMoedas(ctx, quem, 10)
    await ctx.say('Aqui tens! Hmm, que delícia!', quem)
    await ctx.say(`${descreverMudancas(res.antes, res.depois)}. Foi divertido, mas essas moedas já não voltam.`)
  },

  async cliente(ctx) {
    await ctx.say('Hmm... gelado agora, ou poupar para a bicicleta? Não dá para ter tudo ao mesmo tempo. Escolher é difícil!', 'Cliente')
  },

  async sofia(ctx) {
    const quem = 'Sofia'
    for (;;) {
      const r = await ctx.ask('Bem-vindo ao Banco! Queres investir 10 moedas?', ['BAIXO RISCO', 'ALTO RISCO', 'EXPLICA-ME', 'ADEUS'], quem, 3)
      if (r === 2) {
        await ctx.say(
          [
            'BAIXO RISCO é como andar de bicicleta devagar: quase nunca cais, mas também não vais muito depressa.',
            'ALTO RISCO é como andar de skate numa rampa: podes ir muito mais depressa, mas também podes cair.',
            'Uma regra de ouro: nunca invistas as moedas de que vais precisar em breve!',
          ],
          quem,
        )
        continue
      }
      if (r === 3) return ctx.say('Até breve!', quem)
      const res = fazer(ctx, r === 0 ? 'investir_baixo' : 'investir_alto')
      if (!res) return semMoedas(ctx, quem, 10)
      await ctx.say(
        r === 0
          ? 'Feito! Investiste em BAIXO RISCO: cresce devagar, mas quase nunca desce.'
          : 'Feito! Investiste em ALTO RISCO: pode crescer muito... ou descer bastante. Coragem!',
        quem,
      )
      await ctx.say('Amanhã de manhã vais ver o que aconteceu ao teu investimento.', quem)
      return ctx.cracha('investidor')
    }
  },

  async mestre(ctx) {
    const quem = 'Mestre Moedas'
    await ctx.say(`Olá, ${ctx.estado().name}! Queres aprender alguma coisa sobre dinheiro?`, quem)
    const titulos = MENTOR.topicos.map((t) => semEmoji(t.titulo))
    for (;;) {
      const r = await ctx.ask('Escolhe um tema:', [...titulos, 'ADEUS'], quem, titulos.length)
      if (r === titulos.length) return ctx.say('Volta sempre! Aprender nunca custa dinheiro.', quem)
      await ctx.say(MENTOR.topicos[r].linhas, quem)
    }
  },

  async prof(ctx) {
    const quem = 'Prof. Luz'
    if (!comFlag(ctx, 'escola')) {
      await ctx.say(
        ['Olá! Sou a Professora Luz.', 'Sabias que quem estuda mais costuma ganhar mais no futuro? Aqui na vila é igual: a tua mesada sobe com a Educação!'],
        quem,
      )
    }
    const r = await ctx.ask('Uma aula custa 8 moedas (livros e material). Queres estudar?', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Está bem. A escola está sempre aberta para ti!', quem)
    const res = fazer(ctx, 'estudar')
    if (!res) return semMoedas(ctx, quem, 8)
    await ctx.say('Muito bem! Aprendeste imenso hoje.', quem)
    await ctx.say(`${descreverMudancas(res.antes, res.depois)}. Estudar é um investimento em TI!`)
  },

  async aluno(ctx) {
    await ctx.say('Eu estudo todas as semanas. A minha avó diz que o conhecimento é o único tesouro que ninguém te pode tirar!', 'Tomás')
  },

  async treinador(ctx) {
    const quem = 'Treinador Zé'
    const r = await ctx.ask('Olá, campeão! O treino custa 5 moedas (aluguer do campo). Vamos lá?', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Fica para a próxima! Correr no parque também é grátis.', quem)
    const res = fazer(ctx, 'exercicio')
    if (!res) return semMoedas(ctx, quem, 5)
    await ctx.say('Boa! Correste, saltaste e marcaste golo!', quem)
    await ctx.say(`${descreverMudancas(res.antes, res.depois)}. Cuidar da saúde também é uma riqueza!`)
  },

  async amigos(ctx) {
    const quem = 'Leo e Bia'
    const r = await ctx.ask('Olá! Vamos ao cinema? Cada um paga 6 moedas.', ['SIM', 'NÃO'], quem, 1)
    if (r !== 0) return ctx.say('Não faz mal! Também podemos brincar aqui no parque, de graça.', quem)
    const res = fazer(ctx, 'socializar')
    if (!res) return semMoedas(ctx, quem, 6)
    await ctx.say('Foi o máximo! Rimo-nos imenso.', quem)
    await ctx.say(`${descreverMudancas(res.antes, res.depois)}. Gastar com amigos não faz mal: o segredo é não gastar tudo!`)
  },

  async marta(ctx) {
    await ctx.say(MARTA.topicos[0].linhas, 'Marta')
  },

  async tiago(ctx) {
    await ctx.say(TIAGO.topicos[0].linhas, 'Tiago')
  },
}

const ACOES_OBJETO: Record<string, (ctx: Ctx) => Promise<void>> = {
  async mealheiro(ctx) {
    const s = ctx.estado()
    const r = await ctx.ask(
      `É o teu mealheiro! Tem ${fmt(s.poupanca)} moedas. Na carteira tens ${fmt(s.saldo)}. Guardar 10 moedas?`,
      ['SIM', 'NÃO'],
      undefined,
      1,
    )
    if (r !== 0) return ctx.say('Está bem. O mealheiro fica à tua espera!')
    const res = fazer(ctx, 'poupar')
    if (!res) return semMoedas(ctx, '', 10)
    await ctx.say(`Clink! Guardaste 10 moedas. O mealheiro agora tem ${fmt(res.depois.poupanca)}.`)
    if (res.antes.poupanca === 0) await ctx.say('Amanhã de manhã, espreita: o mealheiro vai ter crescido um bocadinho sozinho!')
    await ctx.cracha('poupanca')
    await verificarObjetivo(ctx)
  },

  async cama(ctx) {
    const r = await ctx.ask('Queres ir dormir? Vai passar uma semana.', ['SIM', 'NÃO'], undefined, 1)
    if (r === 0) await ctx.dormir()
  },

  async tv(ctx) {
    await ctx.say([
      'Está a dar um anúncio: "COMPRA JÁ! SÓ HOJE! O SUPER BRINQUEDO!"',
      'Os anúncios querem que compres sem pensar. Truque: espera um dia antes de decidir. Muitas vezes, a vontade passa!',
    ])
  },

  async livros(ctx) {
    await ctx.say('São livros. Um chama-se "O esquilo que guardou nozes para o inverno". Parece giro!')
  },

  async cofre(ctx) {
    await ctx.say('É o cofre do Banco. Aqui o dinheiro fica bem guardado... mas parado não cresce muito. Investido pode crescer mais!')
  },

  async quadro(ctx) {
    await ctx.say([
      'No quadro está escrito:',
      'POUPAR = guardar para depois. INVESTIR = pôr o dinheiro a trabalhar. RISCO = pode subir ou descer.',
    ])
  },

  async correio(ctx) {
    await ctx.say('É a caixa do correio da tua casa. Está vazia... por agora!')
  },

  async bola(ctx) {
    await ctx.say('É uma bola de futebol. Jogar à bola com os amigos é grátis e divertido!')
  },
}

export async function executarInteracao(i: Interacao, ctx: Ctx) {
  if (i.tipo === 'npc') return ACOES_NPC[i.npc.script]?.(ctx)
  if (i.tipo === 'prop' && i.prop.script) return ACOES_OBJETO[i.prop.script]?.(ctx)
  if (i.tipo === 'placa') return ctx.say(i.placa.texto.replace('{nome}', ctx.estado().name.toUpperCase()))
  if (i.tipo === 'trancado') return ctx.say(i.texto)
}

// ---------------------------------------------------------------------------

/** A manhã depois de dormir: a Mãe explica, com os números reais do jogo, o que aconteceu ao dinheiro. */
export async function manha(ctx: Ctx, antes: PlayerState, depois: PlayerState, evento: GameEvent) {
  const mae = 'Mãe'
  const semana = Math.min(depois.week, 20)
  await ctx.say(`Bom dia, ${depois.name}! ${depois.gameOver ? 'É a última manhã da aventura!' : `Começa a semana ${semana} de 20.`}`, mae)

  const mesada = depois.saldo - antes.saldo
  await ctx.say(`Aqui tens a tua mesada: ${fmt(mesada)} moedas.${mesada > 20 ? ' Como tens estudado, a tua mesada aumentou! Quem sabe mais, ganha mais.' : ''}`, mae)

  if (antes.poupanca > 0) {
    const ganho = depois.poupanca - antes.poupanca
    await ctx.say(
      `O teu mealheiro tinha ${fmt(antes.poupanca)} moedas e agora tem ${fmt(depois.poupanca)}. Ganhaste ${fmt(ganho)} sem fazer nada! Isso chama-se JURO.`,
      mae,
    )
    await ctx.cracha('juro')
  }

  if (antes.investimento.amount > 0) {
    const dif = depois.investimento.amount - antes.investimento.amount
    if (dif >= 0) {
      await ctx.say(`O teu investimento subiu ${fmt(dif)} moedas! O teu dinheiro trabalhou enquanto dormias.`, mae)
    } else {
      await ctx.say(
        [`Oh, o teu investimento desceu ${fmt(-dif)} moedas...`, 'Calma! Quem investe sabe que há semanas más. O importante é não desistir à primeira descida.'],
        mae,
      )
      await ctx.cracha('risco')
    }
  }

  const { relacoes, saude, educacao } = depois.stats
  const menor = Math.min(relacoes, saude, educacao)
  if (menor < 35) {
    if (menor === saude) await ctx.say('Pareces cansado. Que tal ires treinar ao Parque? A saúde também conta!', mae)
    else if (menor === relacoes) await ctx.say('Os teus amigos têm saudades tuas. O Leo e a Bia estão no Parque!', mae)
    else await ctx.say('A Professora Luz perguntou por ti. Passa pela Escola!', mae)
  }

  // Os crachás desta manhã já alteraram o estado, por isso o evento aplica-se ao estado atual e não a `depois`.
  const atual = ctx.estado()
  await ctx.say(`Aconteceu uma coisa: ${evento.title}`)
  const escolha = evento.choices[await ctx.ask(evento.description(atual), evento.choices.map((c) => c.label))]
  const texto = escolha.resultText(atual)
  const resultado = registarLog(escolha.apply(atual), `${evento.title} — ${texto}`, 'neutra')
  ctx.definir(resultado)
  const mudancas = descreverMudancas(atual, resultado)
  await ctx.say(mudancas ? [texto, mudancas] : texto)

  if (resultado.poupanca < atual.poupanca) await ctx.cracha('reserva')
  await verificarObjetivo(ctx)
}

export async function resumoFinal(ctx: Ctx) {
  const s = ctx.estado()
  const total = s.saldo + s.poupanca + s.investimento.amount
  const quem = 'Mestre Moedas'
  await ctx.say(
    [
      `Parabéns, ${s.name}! Chegaste ao fim das 20 semanas!`,
      `No total juntaste ${fmt(total)} moedas: ${fmt(s.saldo)} na carteira, ${fmt(s.poupanca)} no mealheiro e ${fmt(s.investimento.amount)} investidas.`,
      `Ganhaste ${s.crachas.length} de ${CRACHAS.length} crachás.`,
      'Lembra-te do que aprendeste aqui: poupa um bocadinho sempre, investe com calma e cuida de ti e dos outros.',
    ],
    quem,
  )
}
