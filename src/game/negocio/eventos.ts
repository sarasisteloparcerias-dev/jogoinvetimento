import { clamp } from '../data'
import type { EstadoMercado } from '../mercado/tipos'
import { deslocar } from '../variacao'
import { euros, NEGOCIOS, round2, type EstadoNegocio } from './economia'

/** Um acontecimento na empresa, com escolhas. */
export interface EventoNegocio {
  id: string
  titulo: string
  /** Só acontece se... */
  quando?: (n: EstadoNegocio, mes: number) => boolean
  texto: (n: EstadoNegocio) => string
  opcoes: {
    label: string
    /** O que muda; devolve também a explicação. */
    aplicar: (n: EstadoNegocio, mes: number) => { negocio: EstadoNegocio; texto: string }
    conquista?: string
  }[]
}

const extra = (n: EstadoNegocio, texto: string, valor: number): EstadoNegocio => ({ ...n, extrasMes: [...n.extrasMes, { texto, valor }] })
const efeito = (n: EstadoNegocio, id: string, procura: number, capacidade: number, ate: number): EstadoNegocio => ({
  ...n,
  efeitos: [...n.efeitos.filter((e) => e.id !== id), { id, procura, capacidade, ate }],
})
const reputacao = (n: EstadoNegocio, d: number): EstadoNegocio => ({ ...n, reputacao: clamp(n.reputacao + d) })

export const EVENTOS_NEGOCIO: EventoNegocio[] = [
  {
    id: 'avaria',
    titulo: 'uma máquina avariou!',
    texto: (n) => (n.tipo === 'entregas' ? 'Três bicicletas avariaram ao mesmo tempo. Sem elas, a equipa faz menos entregas.' : 'A máquina principal avariou. Sem ela, serve-se muito menos gente.'),
    opcoes: [
      { label: 'REPARAR (600€)', aplicar: (n) => ({ negocio: extra(n, 'Reparação', 600), texto: 'Reparado no próprio dia. 600€ que não estavam no orçamento: é para isto que serve ter folga na caixa.' }) },
      {
        label: 'COMPRAR NOVA (2.000€)',
        aplicar: (n) => ({ negocio: reputacao({ ...extra(n, 'Equipamento novo', 2000), equipamento: n.equipamento + 2000 }, 3), texto: 'Equipamento novo: mais caro agora, mas mais rápido e com garantia. Os clientes notaram (reputação +3).' }),
      },
      {
        label: 'ADIAR',
        aplicar: (n, mes) => ({ negocio: reputacao(efeito(n, 'avaria', 1, 0.7, mes), -5), texto: 'Poupaste agora, mas este mês serves 30% menos clientes e a reputação desceu. Às vezes, poupar sai caro.' }),
      },
    ],
  },
  {
    id: 'aumento',
    titulo: 'pedido de aumento.',
    quando: (n) => n.funcionarios.length > 0,
    texto: (n) => `${n.funcionarios[0].nome} pede um aumento de 80€ por mês: "Trabalho cá desde o início e faço muitas horas."`,
    opcoes: [
      {
        label: 'ACEITAR (+80€)',
        aplicar: (n) => ({
          negocio: reputacao({ ...n, funcionarios: n.funcionarios.map((f, i) => (i === 0 ? { ...f, salario: f.salario + 80, produtividade: f.produtividade + 60 } : f)) }, 2),
          texto: `Equipa motivada trabalha melhor. Lembra-te: cada 80€ de salário custam à empresa ${euros(80 * 1.2375)} com a TSU, e mais nos meses dos subsídios.`,
        }),
      },
      {
        label: 'RECUSAR',
        aplicar: (n) => {
          if (Math.random() < 0.5) {
            const f = n.funcionarios[0]
            return { negocio: reputacao({ ...n, funcionarios: n.funcionarios.slice(1) }, -3), texto: `${f.nome} arranjou outro emprego e saiu. Encontrar e formar alguém novo também custa.` }
          }
          return { negocio: n, texto: 'Ficou triste, mas aceitou. Para a próxima pode não ficar.' }
        },
      },
    ],
  },
  {
    id: 'festa',
    titulo: 'vem aí a festa da cidade!',
    texto: () => 'Este mês há festa na cidade: vai haver muito mais gente na rua.',
    opcoes: [
      {
        label: 'PREPARAR (+200€ MARKETING)',
        aplicar: (n, mes) => ({ negocio: extra(efeito(n, 'festa', 1.45, 1, mes), 'Publicidade da festa', 200), texto: 'Cartazes e uma banca na rua: este mês vai haver muita procura. Tens equipa para tanta gente?' }),
      },
      { label: 'NÃO FAZER NADA', aplicar: (n, mes) => ({ negocio: efeito(n, 'festa', 1.25, 1, mes), texto: 'Mesmo assim vai aparecer mais gente. Confirma se tens equipa suficiente.' }) },
    ],
  },
  {
    id: 'concorrente',
    titulo: 'abriu um concorrente mesmo ao lado!',
    texto: (n) => `Abriu outro negócio de ${NEGOCIOS[n.tipo].produto} na tua rua, com preços de inauguração.`,
    opcoes: [
      {
        label: 'BAIXAR PREÇOS',
        aplicar: (n, mes) => ({
          negocio: efeito({ ...n, preco: 0 }, 'concorrente', 0.95, 1, mes + 2),
          texto: 'Preços no BAIXO. Vendes mais, mas ganhas menos em cada venda. Quem compete só no preço precisa de vender muito mais.',
        }),
      },
      {
        label: 'MAIS QUALIDADE',
        aplicar: (n, mes) => ({
          negocio: reputacao(extra(efeito(n, 'concorrente', 0.9, 1, mes + 2), 'Formação e produtos melhores', 400), 6),
          texto: 'Formação para a equipa e produtos melhores (400€). A reputação subiu: clientes fiéis são o melhor escudo contra a concorrência.',
        }),
      },
      { label: 'NÃO FAZER NADA', aplicar: (n, mes) => ({ negocio: efeito(n, 'concorrente', 0.82, 1, mes + 2), texto: 'Nos próximos 3 meses vais perder perto de 18% dos clientes.' }) },
    ],
  },
  {
    id: 'influencer',
    titulo: 'o Kiko quer fazer publicidade.',
    texto: () => 'O Kiko, o influencer da cidade, oferece um vídeo sobre a tua empresa por 300€.',
    opcoes: [
      {
        label: 'ACEITAR (300€)',
        aplicar: (n, mes) =>
          n.reputacao >= 50
            ? { negocio: extra(efeito(n, 'kiko', 1.2, 1, mes), 'Vídeo do Kiko', 300), texto: 'O vídeo correu bem: este mês vem mais 20% de gente. Publicidade funciona melhor quando o produto já é bom.' }
            : { negocio: reputacao(extra(n, 'Vídeo do Kiko', 300), -2), texto: 'Muita gente veio... e saiu desiludida. Com a reputação baixa, a publicidade até pode piorar as coisas.' },
      },
      { label: 'RECUSAR', aplicar: (n) => ({ negocio: n, texto: 'Ficas com os 300€. O melhor marketing continua a ser o cliente satisfeito.' }) },
    ],
  },
  {
    id: 'fornecedor',
    titulo: 'o fornecedor sobe os preços.',
    texto: () => 'O teu fornecedor avisa: a partir de agora, tudo fica 10% mais caro. É a inflação.',
    opcoes: [
      { label: 'ACEITAR', aplicar: (n) => ({ negocio: { ...n, custo: round2(n.custo * 1.1) }, texto: 'Os produtos ficam mais caros e a tua margem encolhe. Talvez seja altura de rever os preços.' }) },
      {
        label: 'PROCURAR OUTRO',
        aplicar: (n) =>
          Math.random() < 0.6
            ? { negocio: { ...n, custo: round2(n.custo * 1.03) }, texto: 'Encontraste outro fornecedor só 3% mais caro. Comparar fornecedores é como comparar bancos: vale sempre a pena.' }
            : { negocio: reputacao({ ...n, custo: round2(n.custo * 0.98) }, -5), texto: 'O fornecedor novo é mais barato... mas a qualidade é pior. Os clientes notaram (reputação -5).' },
      },
    ],
  },
  {
    id: 'formacao',
    titulo: 'carta sobre higiene e segurança.',
    quando: (n) => !n.extrasMes.some((e) => e.texto.startsWith('Formação')),
    texto: () => 'A lei obriga a formação de higiene e segurança no trabalho para toda a equipa. Custa 250€.',
    opcoes: [
      { label: 'FAZER A FORMAÇÃO', aplicar: (n) => ({ negocio: reputacao(extra(n, 'Formação de higiene e segurança', 250), 2), texto: 'Equipa formada e certificado na parede. Se vier uma inspeção, estás tranquilo.' }) },
      { label: 'DEIXAR PARA DEPOIS', aplicar: (n) => ({ negocio: n, texto: 'Fica para depois... desde que não venha nenhuma inspeção.' }) },
    ],
  },
  {
    id: 'inspecao',
    titulo: 'chegou uma inspeção!',
    quando: (n) => n.historico.length >= 2,
    texto: () => 'Uma inspeção verifica contratos, higiene, segurança e livro de reclamações.',
    opcoes: [
      {
        label: 'MOSTRAR TUDO',
        aplicar: (n) => {
          const formado = n.historico.some((r) => r.extras.some((e) => e.texto.startsWith('Formação de higiene')))
          return formado
            ? { negocio: reputacao(n, 2), texto: 'Tudo em ordem: contratos, formação e livro de reclamações. A inspeção foi embora satisfeita.' }
            : { negocio: extra(n, 'Coima da inspeção', 1200), texto: 'Faltava a formação de higiene e segurança da equipa: coima de 1.200€. Cumprir a lei sai mais barato.' }
        },
      },
    ],
  },
  {
    id: 'encomenda',
    titulo: 'uma grande encomenda!',
    texto: (n) => `Uma empresa quer ${n.tipo === 'entregas' ? 'contratar-te para 300 entregas' : 'um lanche para 120 pessoas'} num sábado: paga 1.500€ (com IVA). Mas é preciso trabalhar a dobrar.`,
    opcoes: [
      { label: 'ACEITAR', aplicar: (n) => ({ negocio: n, texto: 'Aceitaste! Agora é mostrar serviço.' }) },
      { label: 'RECUSAR', aplicar: (n) => ({ negocio: n, texto: 'Fica para a próxima. Dizer que não também é gerir: não se pode fazer tudo.' }) },
    ],
  },
  {
    id: 'baixa',
    titulo: 'alguém da equipa adoeceu.',
    quando: (n) => n.funcionarios.length > 0,
    texto: (n) => `${n.funcionarios[n.funcionarios.length - 1].nome} vai estar de baixa médica este mês.`,
    opcoes: [
      {
        label: 'DESEJAR AS MELHORAS',
        aplicar: (n, mes) => {
          const f = n.funcionarios[n.funcionarios.length - 1]
          return {
            negocio: { ...efeito(n, 'baixa', 1, 1 - f.produtividade / (550 + n.funcionarios.reduce((t, x) => t + x.produtividade, 0)), mes), extrasMes: [...n.extrasMes, { texto: 'Baixa (a Segurança Social paga)', valor: -f.salario }] },
            texto: 'Durante a baixa, quem paga é a Segurança Social, não a empresa. Mas há menos gente a trabalhar: talvez faças turnos extra ao balcão.',
          }
        },
      },
    ],
  },
  {
    id: 'fatura',
    titulo: 'e-mail de um fornecedor.',
    texto: () => '"Mudámos de banco! Pague a fatura de 1.240€ para este IBAN novo, ainda hoje, por favor." O e-mail parece do teu fornecedor... mas o endereço é estranho.',
    opcoes: [
      { label: 'PAGAR JÁ', aplicar: (n) => ({ negocio: extra(n, 'Fatura falsa (burla)', 1240), texto: 'Era uma burla! O dinheiro foi para a conta de um burlão. Muda-se de IBAN? Confirma sempre por telefone, para o número que já conheces.' }) },
      {
        label: 'LIGAR AO FORNECEDOR',
        conquista: 'fatura',
        aplicar: (n) => ({ negocio: n, texto: 'O fornecedor nunca mudou de banco: era uma burla! Muitas empresas perdem dinheiro com faturas falsas. Confirmar evita o prejuízo.' }),
      },
    ],
  },
]

/** Escolhe um acontecimento que ainda não tenha acontecido (os mais úteis primeiro). */
export function escolherEventoNegocio(s: EstadoMercado): EventoNegocio | null {
  const n = s.negocio!
  const mes = s.mes
  // alguns têm mês certo, para a história fazer sentido
  // a altura de cada um muda de jogo para jogo (a formação vem sempre antes da inspeção)
  const fixos: Record<string, number> = {
    formacao: deslocar(s, 'formacao', 2, 0, 1),
    fatura: deslocar(s, 'fatura', 4, -1, 3),
    festa: deslocar(s, 'festa', 5, 0, 3),
    concorrente: deslocar(s, 'concorrente', 7, -1, 2),
    inspecao: deslocar(s, 'inspecao', 9, 0, 2),
  }
  const fixo = EVENTOS_NEGOCIO.find((e) => fixos[e.id] === mes && !s.flags.includes(`evn_${e.id}`))
  if (fixo && (!fixo.quando || fixo.quando(n, mes))) return fixo
  const livres = EVENTOS_NEGOCIO.filter((e) => !(e.id in fixos) && !s.flags.includes(`evn_${e.id}`) && (!e.quando || e.quando(n, mes)))
  if (!livres.length || Math.random() < 0.25) return null
  return livres[Math.floor(Math.random() * livres.length)]
}
