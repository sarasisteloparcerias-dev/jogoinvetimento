import { clamp } from '../data'
import { comprarM, euros, round2 } from './economia'
import { PROFISSOES } from './profissoes'
import type { EstadoMercado, StatsAdulto } from './tipos'

export interface OpcaoEventoM {
  label: string
  aplicar(s: EstadoMercado): { estado: EstadoMercado; texto: string }
  conquista?: string
}

export interface EventoMercado {
  id: string
  titulo: string
  texto(s: EstadoMercado): string
  mes?: number
  condicao?(s: EstadoMercado): boolean
  opcoes: OpcaoEventoM[]
}

function stats(s: EstadoMercado, m: Partial<StatsAdulto>): EstadoMercado {
  const n = { ...s.stats }
  for (const [k, v] of Object.entries(m) as [keyof StatsAdulto, number][]) n[k] = clamp(n[k] + v)
  return { ...s, stats: n }
}

const conta = (s: EstadoMercado, v: number): EstadoMercado => ({ ...s, conta: round2(s.conta + v) })
const flag = (s: EstadoMercado, f: string): EstadoMercado => ({ ...s, flags: [...s.flags, f] })

/** Paga já: da conta, ou do cartão de crédito (fica em dívida) se a conta não chegar. */
function gastar(s: EstadoMercado, v: number): { estado: EstadoMercado; nota: string } | null {
  if (s.conta >= v) return { estado: conta(s, -v), nota: '' }
  if (s.cartaoCredito) {
    const falta = round2(v - s.conta)
    return { estado: { ...s, conta: 0, divida: round2(s.divida + falta) }, nota: ` A conta não chegava: ${euros(falta)} ficaram no cartão de crédito, com juros.` }
  }
  return null
}

const SEM = (v: number) => `Não tens ${euros(v)} na conta (e não tens cartão de crédito). Às vezes, não ter crédito protege-nos.`

function pagarOuNao(v: (s: EstadoMercado) => number, ok: string, m: Partial<StatsAdulto> = {}, extra?: (s: EstadoMercado) => EstadoMercado) {
  return (s: EstadoMercado) => {
    const valor = round2(v(s))
    const r = gastar(s, valor)
    if (!r) return { estado: s, texto: SEM(valor) }
    const e = stats(r.estado, m)
    return { estado: extra ? extra(e) : e, texto: ok + r.nota }
  }
}

export const EVENTOS_MERCADO: EventoMercado[] = [
  {
    id: 'subscricoes',
    mes: 2,
    titulo: 'Pacote de subscrições',
    texto: () => 'Streaming, música e cloud num pacote "imperdível": 30€ por mês. Aceitas?',
    opcoes: [
      {
        label: 'ACEITAR',
        aplicar: (s) => ({
          estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'subscricoes', nome: 'Subscrições', valor: 30, restam: null, cancelavel: true }] }, { relacoes: 2 }),
          texto: '30€ por mês são 360€ por ano. Podes cancelar no BANCO do painel, em DÉBITOS.',
        }),
      },
      { label: 'SÓ A MÚSICA (6€)', aplicar: (s) => ({ estado: { ...s, pagamentos: [...s.pagamentos, { id: 'musica', nome: 'Música', valor: 6, restam: null, cancelavel: true }] }, texto: 'Ficas só com o que usas mesmo. Boa escolha!' }) },
      { label: 'NÃO', aplicar: (s) => ({ estado: s, texto: 'Menos um débito todos os meses.' }) },
    ],
  },
  {
    id: 'colega_lua',
    mes: 4,
    titulo: 'O colega da LuaCoin',
    texto: () => 'O teu amigo Tiago diz que a LuaCoin já subiu 40% e que pediu um crédito para comprar mais. Entras com 300€?',
    opcoes: [
      {
        label: 'COMPRAR 300€',
        aplicar: (s) => {
          const n = comprarM(s, 'lua', 300)
          if (!n) return { estado: s, texto: 'Não tens 300€ na conta. Talvez seja um sinal...' }
          return { estado: n, texto: 'Compraste 300€ de LuaCoin (+1€ de comissão). Quando até quem nunca investiu pede crédito para comprar, costuma ser o topo.' }
        },
      },
      { label: 'NÃO, OBRIGADO', aplicar: (s) => ({ estado: stats(s, { carreira: 1 }), texto: 'Nunca invistas dinheiro emprestado em algo que pode cair 70% num mês.' }) },
    ],
  },
  {
    id: 'ponzi',
    mes: 6,
    titulo: 'Investimento "garantido"',
    texto: () => 'Um conhecido apresenta-te a "Lunar Capital": 8% ao mês, garantido, sem risco. "Traz amigos e ganhas comissão!" Entras com 1.000€?',
    opcoes: [
      {
        label: 'ENTRAR COM 1.000€',
        aplicar: (s) => {
          const perda = Math.min(1000, s.conta)
          return { estado: flag(conta(s, -perda), 'burlado'), texto: `Três meses depois, a "Lunar Capital" desapareceu com o dinheiro. Perdeste ${euros(perda)}. Era um esquema em pirâmide.` }
        },
      },
      {
        label: 'PEDIR PROVAS',
        conquista: 'anti_burla',
        aplicar: (s) => ({ estado: s, texto: 'Não estava registada no regulador e não sabiam explicar de onde vinha o lucro. Ganho alto + garantido + "traz amigos" = burla.' }),
      },
      { label: 'RECUSAR', conquista: 'anti_burla', aplicar: (s) => ({ estado: s, texto: 'Ninguém garante 8% ao mês. Se parece bom demais, é porque não é verdade.' }) },
    ],
  },
  {
    id: 'layoff',
    mes: 8,
    titulo: 'Lay-off na empresa',
    texto: (s) => `Por causa da recessão, a ${PROFISSOES[s.profissao].empresa} vai pôr toda a gente em lay-off: nos próximos 2 meses recebes só 2/3 do salário.`,
    opcoes: [
      {
        label: 'OK...',
        aplicar: (s) => ({
          estado: flag(s, 'layoff'),
          texto: s.poupanca >= 1000 ? 'Ainda bem que tens um fundo de emergência: estes dois meses vão ser tranquilos.' : 'Sem fundo de emergência, estes dois meses vão ser apertados. É para isto que ele serve.',
        }),
      },
    ],
  },
  {
    id: 'phishing',
    mes: 10,
    titulo: 'SMS do "banco"',
    texto: () => 'SMS: "Banco Ponte: a sua conta foi bloqueada. Confirme os seus dados em bancoponte-seguro.co". O que fazes?',
    opcoes: [
      {
        label: 'CARREGAR NO LINK',
        aplicar: (s) => {
          const perda = Math.min(s.conta, 600)
          return { estado: flag(conta(s, -perda), 'burlado'), texto: `O site era falso. Com os teus dados, levaram ${euros(perda)}. Liga logo ao banco e apresenta queixa.` }
        },
      },
      { label: 'LIGAR AO BANCO', conquista: 'anti_burla', aplicar: (s) => ({ estado: s, texto: 'Ligaste para o número oficial: era phishing. O banco nunca pede dados por SMS.' }) },
      { label: 'APAGAR', conquista: 'anti_burla', aplicar: (s) => ({ estado: s, texto: 'Apagado. O endereço nem era o do banco.' }) },
    ],
  },
  {
    id: 'avaliacao',
    mes: 12,
    titulo: 'Avaliação anual',
    texto: (s) => `${PROFISSOES[s.profissao].chefe} faz a avaliação do ano. A tua Carreira está em ${Math.round(s.stats.carreira)}/100. Pedes aumento?`,
    opcoes: [
      {
        label: 'PEDIR AUMENTO',
        aplicar: (s) => {
          if (s.stats.carreira >= 65) return { estado: flag({ ...s, salarioBruto: round2(s.salarioBruto * 1.1) }, 'aumento'), texto: `Aumento de 10%! O teu salário bruto passa a ${euros(s.salarioBruto * 1.1)}.` }
          if (s.stats.carreira >= 45) return { estado: { ...s, salarioBruto: round2(s.salarioBruto * 1.03) }, texto: 'Aumento de 3%. Para mais, mostra mais: formação e empenho contam.' }
          return { estado: s, texto: '"Ainda não." Formação e empenho no trabalho fazem subir a Carreira.' }
        },
      },
      { label: 'NÃO PEDIR', aplicar: (s) => ({ estado: s, texto: 'Ninguém te ofereceu nada. Muitas vezes, quem não pede não recebe.' }) },
    ],
  },
  {
    id: 'credito_ferias',
    mes: 15,
    titulo: 'Crédito para férias',
    texto: () => 'O banco oferece-te um crédito pessoal de 2.000€ para férias: 24 prestações de 94€ (TAEG 12%). Aceitas?',
    opcoes: [
      {
        label: 'ACEITAR',
        aplicar: (s) => ({
          estado: stats({ ...conta(s, 2000), pagamentos: [...s.pagamentos, { id: 'credito', nome: 'Crédito pessoal', valor: 94, restam: 24, cancelavel: false }], flags: [...s.flags, 'credito_pessoal'] }, { relacoes: 5, saude: 5 }),
          texto: 'Recebeste 2.000€, mas vais pagar 2.256€ ao longo de 2 anos. As férias acabam; as prestações continuam.',
        }),
      },
      { label: 'POUPAR PARA AS FÉRIAS', aplicar: (s) => ({ estado: s, texto: 'Juntar primeiro e gastar depois sai sempre mais barato.' }) },
    ],
  },
  {
    id: 'black_friday',
    mes: 11,
    titulo: 'Black Friday',
    texto: (s) => `Televisão enorme com 40% de desconto: ${euros(700 * s.indicePrecos)}. "Só até à meia-noite!"`,
    opcoes: [
      { label: 'COMPRAR', aplicar: pagarOuNao((s) => 700 * s.indicePrecos, 'Televisão nova! Era mesmo precisa, ou foi o "só até à meia-noite"?', { relacoes: 2 }) },
      { label: 'NÃO PRECISO', aplicar: (s) => ({ estado: s, texto: 'Um desconto numa coisa de que não precisas não é uma poupança: é uma despesa.' }) },
    ],
  },
  {
    id: 'avaria',
    titulo: 'A scooter avariou',
    texto: (s) => `A tua scooter elétrica avariou. O arranjo custa ${euros(280 * s.indicePrecos)}.`,
    opcoes: [
      { label: 'ARRANJAR', aplicar: pagarOuNao((s) => 280 * s.indicePrecos, 'Arranjada. Imprevistos destes são a razão de ter um fundo de emergência.') },
      { label: 'ANDAR A PÉ', aplicar: (s) => ({ estado: stats(s, { saude: 3, carreira: -2 }), texto: 'Fazes mais exercício, mas chegas tarde ao trabalho mais vezes.' }) },
    ],
  },
  {
    id: 'dentista',
    titulo: 'Dor de dentes',
    texto: (s) => `Precisas de ir ao dentista: ${euros((s.pagamentos.some((p) => p.id === 'seguro') ? 40 : 180) * s.indicePrecos)}${s.pagamentos.some((p) => p.id === 'seguro') ? ' (com o teu seguro de saúde)' : ''}.`,
    opcoes: [
      { label: 'IR AO DENTISTA', aplicar: pagarOuNao((s) => (s.pagamentos.some((p) => p.id === 'seguro') ? 40 : 180) * s.indicePrecos, 'Tratado! Adiar a saúde costuma sair mais caro.', { saude: 4 }) },
      { label: 'ADIAR', aplicar: (s) => ({ estado: stats(s, { saude: -10 }), texto: 'A dor piorou. Saúde -10.' }) },
    ],
  },
  {
    id: 'seguro',
    titulo: 'Seguro de saúde',
    texto: () => 'A empresa propõe um seguro de saúde com desconto: 22€ por mês. Aderes?',
    opcoes: [
      { label: 'ADERIR', aplicar: (s) => ({ estado: { ...s, pagamentos: [...s.pagamentos, { id: 'seguro', nome: 'Seguro de saúde', valor: 22, restam: null, cancelavel: true }] }, texto: 'Um seguro é pagar um pouco todos os meses para não pagar muito de uma vez.' }) },
      { label: 'NÃO', aplicar: (s) => ({ estado: s, texto: 'Ficas a contar com o SNS e com o teu fundo de emergência.' }) },
    ],
  },
  {
    id: 'casamento',
    titulo: 'Casamento de um amigo',
    texto: (s) => `O Rui vai casar! Entre prenda, roupa e viagem são uns ${euros(250 * s.indicePrecos)}.`,
    opcoes: [
      { label: 'IR', aplicar: pagarOuNao((s) => 250 * s.indicePrecos, 'Foi uma festa incrível. Há despesas que valem cada cêntimo.', { relacoes: 8 }) },
      { label: 'IR SEM GASTAR MUITO', aplicar: pagarOuNao((s) => 90 * s.indicePrecos, 'Foste com a roupa que tinhas e deste uma prenda simples. O Rui só queria que estivesses lá.', { relacoes: 6 }) },
      { label: 'NÃO IR', aplicar: (s) => ({ estado: stats(s, { relacoes: -8 }), texto: 'O Rui ficou triste.' }) },
    ],
  },
  {
    id: 'heranca',
    titulo: 'Uma herança',
    texto: () => 'Uma tia-avó deixou-te 1.500€. O que fazes?',
    opcoes: [
      { label: 'DEPÓSITO', aplicar: (s) => ({ estado: { ...s, poupanca: round2(s.poupanca + 1500) }, texto: 'Foi tudo para o depósito: o fundo de emergência agradece.' }) },
      {
        label: 'INVESTIR NO ETF',
        aplicar: (s) => {
          const n = comprarM(conta(s, 1500), 'etf', 1499)
          return { estado: n ?? conta(s, 1500), texto: 'Investiste no ETF Mundo, a pensar no longo prazo.' }
        },
      },
      { label: 'VIAJAR', aplicar: (s) => ({ estado: stats(conta(s, 1500 - 1200), { relacoes: 6, saude: 6 }), texto: 'Uma viagem de sonho de 1.200€. Sobraram 300€ na conta.' }) },
    ],
  },
  {
    id: 'jantares',
    titulo: 'Jantares de sexta',
    texto: () => 'Os colegas jantam fora todas as sextas: uns 80€ por mês. Alinhas sempre?',
    opcoes: [
      { label: 'SEMPRE', aplicar: (s) => ({ estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'jantares', nome: 'Jantares de sexta', valor: 80, restam: null, cancelavel: true }] }, { relacoes: 6 }), texto: 'Ótimo para a equipa. São 960€ por ano: podes cortar no BANCO do painel, em DÉBITOS.' }) },
      { label: 'UMA VEZ POR MÊS', aplicar: (s) => ({ estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'jantares', nome: 'Jantar do mês', valor: 20, restam: null, cancelavel: true }] }, { relacoes: 3 }), texto: 'Um bom meio-termo.' }) },
      { label: 'NUNCA', aplicar: (s) => ({ estado: stats(s, { relacoes: -4 }), texto: 'Poupas, mas ficas de fora.' }) },
    ],
  },
  {
    id: 'formacao',
    titulo: 'Curso de formação',
    texto: () => 'Há um curso de gestão de projetos à noite: 350€. Ajuda muito na Carreira. Inscreves-te?',
    opcoes: [
      { label: 'INSCREVER', aplicar: pagarOuNao(() => 350, 'Três meses de aulas à noite. Carreira +15!', { carreira: 15, saude: -3 }) },
      { label: 'AGORA NÃO', aplicar: (s) => ({ estado: s, texto: 'Fica para outra altura.' }) },
    ],
  },
  {
    id: 'freelance',
    titulo: 'Trabalho extra',
    texto: () => 'Um cliente quer que lhe faças um site num fim de semana: 400€ (passas recibo e uma parte vai para impostos). Aceitas?',
    opcoes: [
      { label: 'ACEITAR', aplicar: (s) => ({ estado: stats(conta(s, 300), { saude: -4, relacoes: -2, carreira: 3 }), texto: 'Recebeste 400€; depois da retenção de imposto ficaram 300€ na conta. Trabalho extra também é tributado.' }) },
      { label: 'DESCANSAR', aplicar: (s) => ({ estado: stats(s, { saude: 3 }), texto: 'Também é preciso descansar.' }) },
    ],
  },
  {
    id: 'renda_sobe',
    titulo: 'A renda vai subir',
    condicao: (s) => s.casa !== 'pais' && !s.flags.includes('renda_sobe') && s.mes >= 12,
    texto: () => 'O senhorio avisa: a renda sobe 5% a partir do próximo mês, por causa da inflação.',
    opcoes: [{ label: 'OK', aplicar: (s) => ({ estado: flag(s, 'renda_sobe'), texto: 'A inflação também chega às rendas. Revê o teu orçamento no painel (MÊS).' }) }],
  },
  {
    id: 'cao',
    titulo: 'Adotar um cão',
    texto: () => 'O canil tem um cão adorável para adoção. Ração, veterinário e afins: uns 45€ por mês.',
    opcoes: [
      { label: 'ADOTAR', aplicar: (s) => ({ estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'cao', nome: 'Cão', valor: 45, restam: null, cancelavel: false }] }, { relacoes: 6, saude: 4 }), texto: 'Ganhaste um amigo para a vida! Um animal é um compromisso de muitos anos.' }) },
      { label: 'AINDA NÃO', aplicar: (s) => ({ estado: s, texto: 'Talvez mais tarde, quando tiveres mais espaço.' }) },
    ],
  },
  {
    id: 'telemovel',
    titulo: 'Telemóvel a prestações',
    texto: () => 'Telemóvel topo de gama: 1.200€ "sem juros" em 12 prestações de 100€. Aceitas?',
    opcoes: [
      { label: 'ACEITAR', aplicar: (s) => ({ estado: stats({ ...s, pagamentos: [...s.pagamentos, { id: 'telemovel', nome: 'Prestação telemóvel', valor: 100, restam: 12, cancelavel: false }] }, { relacoes: 2 }), texto: 'Sem juros, mas são 100€ por mês durante um ano inteiro.' }) },
      { label: 'MANTER O MEU', aplicar: (s) => ({ estado: s, texto: 'O teu ainda funciona. 1.200€ que ficam para os teus objetivos.' }) },
    ],
  },
  {
    id: 'multa',
    titulo: 'Multa',
    texto: () => 'Deixaste a scooter mal estacionada: multa de 60€.',
    opcoes: [{ label: 'PAGAR', aplicar: pagarOuNao(() => 60, 'Pagaste a multa. Pagar a tempo evita que fique mais cara.') }],
  },
]

const temCasa = (s: EstadoMercado) => !!s.hipoteca
const reutilizar = (id: string, mes?: number) => ({ ...EVENTOS_MERCADO.find((e) => e.id === id)!, mes })

/** Eventos do nível "A Casa": a vida de quem compra (ou ainda procura) casa. */
export const EVENTOS_CASA: EventoMercado[] = [
  {
    id: 'burla_imi',
    mes: 3,
    titulo: 'SMS das "Finanças"',
    texto: () => 'SMS: "Finanças: tem uma dívida de IMI. Pague hoje em financas-pagar.co para evitar penhora." O que fazes?',
    opcoes: [
      {
        label: 'PAGAR NO LINK',
        aplicar: (s) => {
          const perda = Math.min(s.conta, 480)
          return { estado: flag(conta(s, -perda), 'burlado'), texto: `Era falso! Perdeste ${euros(perda)}. As Finanças nunca pedem pagamentos por links em SMS.` }
        },
      },
      { label: 'VER NO PORTAL OFICIAL', conquista: 'anti_burla', aplicar: (s) => ({ estado: s, texto: 'No portal oficial não havia dívida nenhuma. Era uma burla.' }) },
      { label: 'APAGAR', conquista: 'anti_burla', aplicar: (s) => ({ estado: s, texto: 'Apagado. Desconfiar de pressa e de links é meio caminho andado.' }) },
    ],
  },
  reutilizar('avaliacao', 12),
  {
    id: 'canos',
    condicao: temCasa,
    titulo: 'Obras inesperadas',
    texto: (s) =>
      s.hipoteca?.casa === 't0'
        ? 'A canalização do T0 é antiga e começou a pingar por todo o lado. Arranjar tudo custa 3.500€.'
        : 'O esquentador avariou de vez. Um novo, instalado, custa 450€.',
    opcoes: [
      {
        label: 'ARRANJAR',
        aplicar: (s) => {
          const v = s.hipoteca?.casa === 't0' ? 3500 : 450
          const r = gastar(s, v)
          if (!r) return { estado: stats(s, { saude: -6 }), texto: `${SEM(v)} Vais viver com o problema até juntares o dinheiro.` }
          return { estado: r.estado, texto: `Arranjado. Quem compra casa tem de contar com obras.${r.nota}` }
        },
      },
      { label: 'ADIAR', aplicar: (s) => ({ estado: stats(s, { saude: -6 }), texto: 'Adiar obras costuma sair mais caro. Saúde -6.' }) },
    ],
  },
  {
    id: 'inundacao',
    condicao: temCasa,
    titulo: 'Cano rebentado!',
    texto: () => 'Um cano rebentou e estragou o chão da sala: 1.800€ de estragos. Felizmente tens o seguro multirriscos (obrigatório com o crédito).',
    opcoes: [{ label: 'ACIONAR O SEGURO', aplicar: (s) => ({ estado: conta(s, -150), texto: 'O seguro pagou tudo menos a franquia de 150€. É para isto que servem os seguros!' }) }],
  },
  {
    id: 'condominio_extra',
    condicao: temCasa,
    titulo: 'Obras no prédio',
    texto: () => 'A reunião de condomínio aprovou obras no telhado: cada casa paga 400€ extra.',
    opcoes: [{ label: 'PAGAR', aplicar: (s) => {
      const r = gastar(s, 400)
      return r ? { estado: r.estado, texto: `Pago. O condomínio é de todos os vizinhos.${r.nota}` } : { estado: flag(s, 'divida_condominio'), texto: 'Ficaste a dever ao condomínio. Os vizinhos não gostaram.' }
    } }],
  },
  {
    id: 'eletrodomestico',
    titulo: 'A máquina de lavar avariou',
    texto: () => 'A máquina de lavar roupa deixou de funcionar. Uma nova custa 380€.',
    opcoes: [
      { label: 'COMPRAR NOVA', aplicar: pagarOuNao(() => 380, 'Máquina nova. Imprevistos destes acontecem a todos.') },
      { label: 'LAVANDARIA', aplicar: (s) => ({ estado: { ...s, pagamentos: [...s.pagamentos, { id: 'lavandaria', nome: 'Lavandaria', valor: 25, restam: null, cancelavel: true }] }, texto: 'Lavandaria self-service: 25€ por mês. Podes cancelar em DÉBITOS.' }) },
    ],
  },
  {
    id: 'inquilino',
    condicao: (s) => s.hipoteca?.casa === 't2' && !s.flags.includes('inquilino'),
    titulo: 'Arrendar um quarto',
    texto: () => 'Um colega procura quarto. No teu T2 sobra um: ele paga 300€ por mês. Arrendas?',
    opcoes: [
      { label: 'ARRENDAR', aplicar: (s) => ({ estado: stats(flag(s, 'inquilino'), { relacoes: -2 }), texto: 'Mais 300€ por mês! Atenção: as rendas recebidas pagam imposto (aqui, 25%). E dividir a casa tem custos na privacidade.' }) },
      { label: 'NÃO', aplicar: (s) => ({ estado: s, texto: 'A tua casa, as tuas regras.' }) },
    ],
  },
  {
    id: 'consolidar',
    titulo: 'Junte os seus créditos!',
    texto: () => 'Anúncio: "Junte todos os seus créditos numa só prestação, muito mais baixa!" Pedes informações?',
    opcoes: [
      { label: 'PEDIR INFORMAÇÕES', aplicar: (s) => ({ estado: stats(s, { carreira: 1 }), texto: 'A prestação desce porque o prazo aumenta muito: no total pagarias muito mais juros. Ler as letras pequenas compensa.' }) },
      { label: 'IGNORAR', aplicar: (s) => ({ estado: s, texto: 'Desconfia de soluções mágicas para dívidas.' }) },
    ],
  },
  reutilizar('heranca'),
  reutilizar('casamento'),
  reutilizar('dentista'),
  reutilizar('freelance'),
  reutilizar('formacao'),
  reutilizar('multa'),
  { ...reutilizar('black_friday'), mes: 11 },
]

export function escolherEventoMercado(s: EstadoMercado): EventoMercado {
  const lista = s.nivel === 'casa' ? EVENTOS_CASA : EVENTOS_MERCADO
  const vistos = new Set(s.flags.filter((f) => f.startsWith('ev_')).map((f) => f.slice(3)))
  const fixo = lista.find((e) => e.mes === s.mes && !vistos.has(e.id))
  if (fixo) return fixo
  const livres = lista.filter((e) => e.mes === undefined && !vistos.has(e.id) && (e.condicao?.(s) ?? true))
  if (livres.length) return livres[Math.floor(Math.random() * livres.length)]
  return EVENTOS_MERCADO.find((e) => e.id === 'freelance')!
}
