import { clamp } from '../data'
import type { StatKey } from '../types'
import { comprar, euros, round2 } from './economia'
import { TRABALHOS_CIDADE } from './trabalhos'
import type { EstadoCidade } from './tipos'

export interface OpcaoEvento {
  label: string
  aplicar(s: EstadoCidade): { estado: EstadoCidade; texto: string }
  /** Conquista ganha ao escolher esta opção. */
  conquista?: string
}

export interface EventoCidade {
  id: string
  titulo: string
  texto(s: EstadoCidade): string
  /** Semana em que acontece sempre (eventos da história). Sem semana, sai ao acaso. */
  semana?: number
  condicao?(s: EstadoCidade): boolean
  opcoes: OpcaoEvento[]
}

type Mudancas = Partial<Record<StatKey, number>>

function stats(s: EstadoCidade, m: Mudancas): EstadoCidade {
  const n = { ...s.stats }
  for (const [k, v] of Object.entries(m) as [StatKey, number][]) n[k] = clamp(n[k] + v)
  return { ...s, stats: n }
}

function dinheiro(s: EstadoCidade, v: number): EstadoCidade {
  return { ...s, dinheiro: round2(s.dinheiro + v) }
}

/** Paga se houver dinheiro na conta; senão devolve null. */
function pagar(s: EstadoCidade, v: number): EstadoCidade | null {
  return s.dinheiro >= v ? dinheiro(s, -v) : null
}

function flag(s: EstadoCidade, f: string): EstadoCidade {
  return { ...s, flags: [...s.flags, f] }
}

const chefe = (s: EstadoCidade) => (s.emprego ? TRABALHOS_CIDADE[s.emprego].chefe : 'O teu chefe')

const SEM_DINHEIRO = (v: number) => `Não tens ${euros(v)} na conta. Às vezes é o próprio saldo que decide por nós!`

export const EVENTOS_CIDADE: EventoCidade[] = [
  {
    id: 'streaming',
    semana: 2,
    titulo: 'Subscrição de streaming',
    texto: () => 'Os teus amigos só falam de uma série nova. A app de streaming custa 2€ por semana, cobrados na conta. Subscrever?',
    opcoes: [
      {
        label: 'SUBSCREVER',
        aplicar: (s) => ({
          estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'streaming', nome: 'Streaming', valor: 2, restam: null, cancelavel: true }] }, { relacoes: 3 }),
          texto: 'Subscreveste. 2€ por semana parece pouco, mas são 48€ num ano. Podes cancelar na app BANCO do telemóvel, em DÉBITOS.',
        }),
      },
      {
        label: 'VER COM A FAMÍLIA',
        aplicar: (s) => ({
          estado: stats(s, { relacoes: 2 }),
          texto: 'A tua família já tem uma conta e partilha contigo. Mesma série, 0€!',
        }),
      },
      { label: 'NÃO PRECISO', aplicar: (s) => ({ estado: s, texto: 'Ficas sem a série, mas também sem mais um pagamento todas as semanas.' }) },
    ],
  },
  {
    id: 'colega_lua',
    semana: 3,
    titulo: 'A Inês e a LuaCoin',
    texto: () => 'A Inês diz que a LuaCoin já subiu 25% e "vai triplicar". Toda a gente da turma está a comprar. Entras com 20€?',
    opcoes: [
      {
        label: 'COMPRAR 20€',
        aplicar: (s) => {
          if (!s.conta) return { estado: s, texto: 'Ainda não tens conta no banco, por isso nem dá para comprar. Talvez seja melhor assim...' }
          const n = comprar(s, 'lua', 20)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(20) }
          return { estado: n, texto: 'Compraste 20€ de LuaCoin. Vê o preço na app INVESTIR do telemóvel... e lembra-te de quem te deu a dica.' }
        },
      },
      {
        label: 'PESQUISAR PRIMEIRO',
        aplicar: (s) => ({
          estado: stats(s, { educacao: 3 }),
          texto: 'Leste sobre a LuaCoin: não é uma empresa, não dá lucros e já caiu 80% outras vezes. Comprar só porque "toda a gente compra" é arriscado.',
        }),
      },
      { label: 'NÃO ME INTERESSA', aplicar: (s) => ({ estado: s, texto: 'A Inês encolhe os ombros. "Depois não digas que não te avisei!"' }) },
    ],
  },
  {
    id: 'burla',
    semana: 4,
    titulo: 'Mensagem no telemóvel',
    texto: () => 'SMS: "PARABÉNS! Ganhaste um telemóvel novo! Paga só 2,99€ de portes neste link nos próximos 10 minutos." O que fazes?',
    opcoes: [
      {
        label: 'PAGAR OS PORTES',
        aplicar: (s) => {
          const perda = Math.min(s.dinheiro, 35)
          return {
            estado: flag(dinheiro(s, -perda), 'burlado'),
            texto: `Era uma BURLA! Com os dados do cartão, tiraram ${euros(perda)} da tua conta. Liga ao banco para bloquear o cartão e conta a um adulto.`,
          }
        },
      },
      {
        label: 'APAGAR A MENSAGEM',
        conquista: 'anti_burla',
        aplicar: (s) => ({ estado: s, texto: 'Fizeste bem. Ninguém dá telemóveis a quem não participou em nada.' }),
      },
      {
        label: 'PERGUNTAR À MÃE',
        conquista: 'anti_burla',
        aplicar: (s) => ({ estado: stats(s, { relacoes: 2 }), texto: 'A Mãe confirma: é uma burla clássica. "Ainda bem que perguntaste!"' }),
      },
    ],
  },
  {
    id: 'bnpl',
    semana: 6,
    titulo: '"Compra agora, paga depois"',
    texto: (s) =>
      `Na MegaStore: auscultadores sem fios de ${euros(120 * s.indicePrecos)}. "Não pagas nada hoje! São só 6 prestações de ${euros(22 * s.indicePrecos)}." Aceitas?`,
    opcoes: [
      {
        label: 'ACEITAR',
        aplicar: (s) => {
          const prest = round2(22 * s.indicePrecos)
          return {
            estado: stats(
              { ...s, compras: [...s.compras, 'Auscultadores'], pagamentos: [...s.pagamentos, { id: 'bnpl', nome: 'Prestação auscultadores', valor: prest, restam: 6, cancelavel: false }] },
              { relacoes: 3 },
            ),
            texto: `Levaste os auscultadores. Vais pagar ${euros(prest * 6)} em vez de ${euros(120 * s.indicePrecos)}, e as próximas 6 semanas já têm dinheiro comprometido. Se falhares uma prestação, há multa.`,
          }
        },
      },
      {
        label: 'POUPAR E COMPRAR DEPOIS',
        aplicar: (s) => ({ estado: stats(s, { educacao: 2 }), texto: 'Boa! Se juntares o dinheiro primeiro, pagas menos e não ficas a dever a ninguém.' }),
      },
      { label: 'NÃO PRECISO', aplicar: (s) => ({ estado: s, texto: 'Os teus auscultadores antigos ainda funcionam. Às vezes a melhor compra é não comprar.' }) },
    ],
  },
  {
    id: 'anuncio_tenis',
    titulo: 'Anúncio nas redes',
    texto: (s) => `"SÓ HOJE! Ténis AirPixel -30%: ${euros(90 * s.indicePrecos)}!" O anúncio aparece-te em todo o lado. Compras?`,
    opcoes: [
      {
        label: 'COMPRAR JÁ',
        aplicar: (s) => {
          const v = round2(90 * s.indicePrecos)
          const n = pagar(s, v)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(v) }
          return { estado: stats({ ...n, compras: [...n.compras, 'Ténis AirPixel'] }, { relacoes: 3 }), texto: 'Ténis novos! Mas repara: o "só hoje" serve para não teres tempo de pensar.' }
        },
      },
      {
        label: 'ESPERAR 48 HORAS',
        aplicar: (s) => ({
          estado: stats(s, { educacao: 2 }),
          texto: 'Dois dias depois, a vontade passou. E o "só hoje" voltou a aparecer na semana seguinte...',
        }),
      },
      { label: 'IGNORAR', aplicar: (s) => ({ estado: s, texto: 'Fechaste o anúncio. Os algoritmos sabem o que queres, mas tu decides.' }) },
    ],
  },
  {
    id: 'emprestimo',
    titulo: 'O Rui pede dinheiro',
    texto: () => 'O teu amigo Rui pede-te 30€ emprestados. Diz que te paga daqui a umas semanas. O que fazes?',
    opcoes: [
      {
        label: 'EMPRESTAR 30€',
        aplicar: (s) => {
          const n = pagar(s, 30)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(30) }
          return { estado: stats(flag(n, `emprestou_${s.semana}`), { relacoes: 4 }), texto: 'Emprestaste. Regra de ouro: só empresta o que não te fizer falta se não voltar.' }
        },
      },
      {
        label: 'EMPRESTAR 10€',
        aplicar: (s) => {
          const n = pagar(s, 10)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(10) }
          return { estado: stats(n, { relacoes: 2 }), texto: 'Ajudaste com o que podias. O Rui agradece e devolve-te logo na semana seguinte.' }
        },
      },
      { label: 'DIZER QUE NÃO', aplicar: (s) => ({ estado: stats(s, { relacoes: -2 }), texto: 'O Rui fica um bocado chateado, mas percebe. Dizer que não também é saber gerir dinheiro.' }) },
    ],
  },
  {
    id: 'devolve',
    titulo: 'O Rui voltou',
    condicao: (s) => s.flags.some((f) => f.startsWith('emprestou_') && s.semana - Number(f.slice(10)) >= 3) && !s.flags.includes('devolvido'),
    texto: () => 'O Rui aparece com um envelope: "Obrigado pelos 30€! Aqui estão."',
    opcoes: [
      {
        label: 'OBRIGADO!',
        aplicar: (s) => ({ estado: stats(flag(dinheiro(s, 30), 'devolvido'), { relacoes: 3 }), texto: 'Recebeste 30€. Nem sempre corre assim, mas desta vez a confiança valeu a pena.' }),
      },
    ],
  },
  {
    id: 'ecra',
    titulo: 'Ecrã partido!',
    texto: (s) => `O telemóvel caiu-te e o ecrã partiu. Arranjar custa ${euros(60 * s.indicePrecos)}.${s.poupanca >= 60 ? ' Tens poupança que chegue.' : ''}`,
    opcoes: [
      {
        label: 'PAGAR DA CONTA',
        aplicar: (s) => {
          const v = round2(60 * s.indicePrecos)
          const n = pagar(s, v)
          if (!n) return { estado: stats(s, { relacoes: -2 }), texto: `${SEM_DINHEIRO(v)} Vais andar com o ecrã rachado.` }
          return { estado: n, texto: 'Ecrã novo. Imprevistos destes acontecem a toda a gente.' }
        },
      },
      {
        label: 'PAGAR DA POUPANÇA',
        aplicar: (s) => {
          const v = round2(60 * s.indicePrecos)
          if (s.poupanca < v) return { estado: stats(s, { relacoes: -2 }), texto: 'A tua poupança não chega. Ficas com o ecrã rachado até juntares dinheiro.' }
          return { estado: { ...s, poupanca: round2(s.poupanca - v) }, texto: 'Para isto mesmo é que serve um fundo de emergência. Resolvido sem stress!' }
        },
      },
      { label: 'FICAR ASSIM', aplicar: (s) => ({ estado: stats(s, { relacoes: -1 }), texto: 'O ecrã rachado funciona... mais ou menos.' }) },
    ],
  },
  {
    id: 'exames',
    titulo: 'Semana de exames',
    condicao: (s) => !!s.emprego,
    texto: (s) => `Esta semana há exames. ${chefe(s)} pede-te um turno extra no sábado (+20€). O que escolhes?`,
    opcoes: [
      { label: 'ESTUDAR', aplicar: (s) => ({ estado: stats(s, { educacao: 8 }), texto: 'Correu-te muito bem nos exames! Investir em ti também rende.' }) },
      {
        label: 'TRABALHAR',
        aplicar: (s) => ({ estado: stats({ ...dinheiro(s, 20), salarioTotal: s.salarioTotal + 20 }, { educacao: -6, saude: -3 }), texto: '+20€, mas os exames correram pior. O tempo também é um recurso que se gasta.' }),
      },
    ],
  },
  {
    id: 'festa',
    titulo: 'Festa de anos',
    texto: () => 'É a festa de anos da Marta! Toda a gente leva uma prenda de uns 15€.',
    opcoes: [
      {
        label: 'PRENDA DE 15€',
        aplicar: (s) => {
          const n = pagar(s, 15)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(15) }
          return { estado: stats(n, { relacoes: 5 }), texto: 'A Marta adorou a prenda!' }
        },
      },
      { label: 'FAZER UMA PRENDA', aplicar: (s) => ({ estado: stats(s, { relacoes: 4 }), texto: 'Fizeste-lhe um álbum de fotos. Foi a prenda mais especial da festa, e custou 0€.' }) },
      { label: 'NÃO IR', aplicar: (s) => ({ estado: stats(s, { relacoes: -5 }), texto: 'Ficaste em casa. A Marta perguntou por ti.' }) },
    ],
  },
  {
    id: 'concerto',
    titulo: 'Concerto!',
    texto: (s) => `A tua banda favorita vem à cidade. O bilhete custa ${euros(35 * s.indicePrecos)}.`,
    opcoes: [
      {
        label: 'COMPRAR BILHETE',
        aplicar: (s) => {
          const v = round2(35 * s.indicePrecos)
          const n = pagar(s, v)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(v) }
          return { estado: stats(n, { relacoes: 6, saude: 2 }), texto: 'Uma noite inesquecível! Gastar em experiências de que gostas mesmo não é desperdício.' }
        },
      },
      { label: 'VER O DIRETO', aplicar: (s) => ({ estado: stats(s, { relacoes: 1 }), texto: 'Viste o concerto em direto no telemóvel com amigos. Não é igual, mas foi grátis.' }) },
    ],
  },
  {
    id: 'roupa',
    titulo: 'Roupa que já não usas',
    texto: () => 'O teu armário está cheio de roupa que já não te serve. O que fazes?',
    opcoes: [
      { label: 'VENDER ONLINE', aplicar: (s) => ({ estado: dinheiro(s, 20), texto: 'Vendeste tudo numa app de roupa usada: +20€! E a roupa ganha uma segunda vida.' }) },
      { label: 'DOAR', aplicar: (s) => ({ estado: stats(s, { relacoes: 3 }), texto: 'Doaste a uma associação. Alguém vai ficar muito contente.' }) },
      { label: 'GUARDAR', aplicar: (s) => ({ estado: s, texto: 'Fica tudo no armário... por agora.' }) },
    ],
  },
  {
    id: 'avo',
    titulo: 'Prenda da avó',
    texto: () => 'A tua avó dá-te 50€: "Para gastares no que quiseres!" O que fazes?',
    opcoes: [
      {
        label: 'POUPAR TUDO',
        aplicar: (s) =>
          s.conta
            ? { estado: { ...s, poupanca: round2(s.poupanca + 50) }, texto: 'Foram os 50€ direitinhos para a conta poupança.' }
            : { estado: dinheiro(s, 50), texto: 'Ainda não tens conta poupança, por isso ficam na carteira. Abre conta no Banco Ponte!' },
      },
      {
        label: 'METADE E METADE',
        aplicar: (s) => {
          const n = s.conta ? { ...s, poupanca: round2(s.poupanca + 25), dinheiro: round2(s.dinheiro + 25) } : dinheiro(s, 50)
          return { estado: stats(n, { relacoes: 2 }), texto: 'Metade para guardar, metade para aproveitar. Um bom equilíbrio!' }
        },
      },
      { label: 'GASTAR TUDO', aplicar: (s) => ({ estado: stats(dinheiro(s, 50), { relacoes: 2 }), texto: '+50€ na conta para gastar. Aproveita... com cabeça!' }) },
    ],
  },
  {
    id: 'gripe',
    titulo: 'Apanhaste gripe',
    texto: (s) => `Estás com febre. Os medicamentos na farmácia custam ${euros(12 * s.indicePrecos)}.`,
    opcoes: [
      {
        label: 'IR À FARMÁCIA',
        aplicar: (s) => {
          const v = round2(12 * s.indicePrecos)
          const n = pagar(s, v)
          if (!n) return { estado: stats(s, { saude: -8 }), texto: `${SEM_DINHEIRO(v)} A recuperação vai ser mais lenta.` }
          return { estado: stats(n, { saude: 4 }), texto: 'Em poucos dias estás melhor. A saúde vem primeiro.' }
        },
      },
      { label: 'AGUENTAR', aplicar: (s) => ({ estado: stats(s, { saude: -8 }), texto: 'Poupaste o dinheiro, mas passaste uma semana péssima.' }) },
    ],
  },
  {
    id: 'voluntariado',
    titulo: 'Voluntariado',
    texto: () => 'O banco alimentar precisa de voluntários no sábado. Vais?',
    opcoes: [
      { label: 'VOU!', aplicar: (s) => ({ estado: stats(s, { relacoes: 5, saude: 2, educacao: 2 }), texto: 'Ajudaste dezenas de famílias. Nem tudo o que vale a pena se paga com dinheiro.' }) },
      { label: 'NÃO POSSO', aplicar: (s) => ({ estado: s, texto: 'Fica para a próxima.' }) },
    ],
  },
  {
    id: 'turno_extra',
    titulo: 'Turno extra',
    condicao: (s) => !!s.emprego,
    texto: (s) => `${chefe(s)} precisa de ajuda: falta alguém no domingo. Fazes um turno extra (+20€)?`,
    opcoes: [
      {
        label: 'ACEITAR',
        aplicar: (s) => ({ estado: stats({ ...dinheiro(s, 20), salarioTotal: s.salarioTotal + 20 }, { saude: -5 }), texto: '+20€! Mas o domingo de descanso foi-se.' }),
      },
      { label: 'RECUSAR', aplicar: (s) => ({ estado: stats(s, { saude: 2 }), texto: 'Descansaste. Também é preciso.' }) },
    ],
  },
  {
    id: 'telemovel_novo',
    titulo: 'Telemóvel novo',
    texto: (s) => `Saiu o novo PixelPhone 9 por ${euros(400 * s.indicePrecos)}. O teu ainda funciona bem, mas metade da turma já tem o novo.`,
    opcoes: [
      {
        label: 'COMPRAR',
        aplicar: (s) => {
          const v = round2(400 * s.indicePrecos)
          const n = pagar(s, v)
          if (!n) return { estado: s, texto: SEM_DINHEIRO(v) }
          return { estado: stats({ ...n, compras: [...n.compras, 'PixelPhone 9'] }, { relacoes: 4 }), texto: 'Telemóvel novo... e a conta quase vazia. Daqui a um ano já há o PixelPhone 10.' }
        },
      },
      { label: 'MANTER O MEU', aplicar: (s) => ({ estado: stats(s, { educacao: 1 }), texto: 'O teu funciona perfeitamente. Mais 400€ que ficam para os teus objetivos!' }) },
    ],
  },
]

export function escolherEventoCidade(s: EstadoCidade): EventoCidade {
  const vistos = new Set(s.flags.filter((f) => f.startsWith('ev_')).map((f) => f.slice(3)))
  const fixo = EVENTOS_CIDADE.find((e) => e.semana === s.semana && !vistos.has(e.id))
  if (fixo) return fixo
  const devolve = EVENTOS_CIDADE.find((e) => e.id === 'devolve')!
  if (devolve.condicao!(s)) return devolve
  const livres = EVENTOS_CIDADE.filter((e) => e.semana === undefined && e.id !== 'devolve' && !vistos.has(e.id) && (e.condicao?.(s) ?? true))
  if (livres.length) return livres[Math.floor(Math.random() * livres.length)]
  const repetiveis = EVENTOS_CIDADE.filter((e) => ['voluntariado', 'roupa', 'festa'].includes(e.id))
  return repetiveis[Math.floor(Math.random() * repetiveis.length)]
}
