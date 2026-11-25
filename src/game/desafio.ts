import type { TemaReferencial } from './escola'

/**
 * O desafio do dinheiro: as mesmas perguntas antes e depois de jogar, para ver quanto se aprendeu.
 * Os resultados ficam só neste dispositivo.
 */

export type NivelDesafio = 'jovem' | 'maior'

export interface Pergunta {
  pergunta: string
  opcoes: [string, string, string]
  /** Índice da opção certa. */
  certa: 0 | 1 | 2
  explicacao: string
  tema: TemaReferencial
}

export const NOME_NIVEL: Record<NivelDesafio, string> = { jovem: '8 a 14 anos', maior: '15 anos ou mais' }

export const PERGUNTAS: Record<NivelDesafio, Pergunta[]> = {
  jovem: [
    {
      pergunta: 'Tens 10€ e queres um jogo de 25€. Se poupares 3€ por semana, quantas semanas precisas?',
      opcoes: ['3 semanas', '5 semanas', '8 semanas'],
      certa: 1,
      explicacao: 'Faltam 15€. Com 3€ por semana são 5 semanas (3 × 5 = 15).',
      tema: 'Planeamento e gestão do orçamento',
    },
    {
      pergunta: 'Qual destas coisas é uma NECESSIDADE?',
      opcoes: ['Sapatilhas de marca', 'Comida', 'Um jogo novo'],
      certa: 1,
      explicacao: 'Precisamos de comida para viver. As outras são desejos: podem ser boas, mas podem esperar.',
      tema: 'Planeamento e gestão do orçamento',
    },
    {
      pergunta: 'O que é o juro de uma conta poupança?',
      opcoes: ['Dinheiro que o banco te paga por guardares lá o teu', 'Uma multa por levantares dinheiro', 'O preço de abrir a conta'],
      certa: 0,
      explicacao: 'O banco usa o dinheiro guardado e paga-te uma parte por isso: o juro.',
      tema: 'Sistema e produtos financeiros básicos',
    },
    {
      pergunta: 'Pões 100€ a render 10% ao ano e não tiras nada. Quanto tens ao fim de 2 anos?',
      opcoes: ['110€', '120€', '121€'],
      certa: 2,
      explicacao: 'No 1.º ano ganhas 10€ (110€). No 2.º ganhas 10% de 110€, ou seja 11€. É o juro composto: juros sobre juros.',
      tema: 'Poupança',
    },
    {
      pergunta: 'Pacote grande: 10 bolachas por 2€. Pacote pequeno: 4 bolachas por 1€. Qual é mais barato por bolacha?',
      opcoes: ['O grande', 'O pequeno', 'Custam o mesmo'],
      certa: 0,
      explicacao: 'No grande cada bolacha custa 0,20€; no pequeno custa 0,25€. Mas só compensa se as comeres todas!',
      tema: 'Planeamento e gestão do orçamento',
    },
    {
      pergunta: 'Para que serve uma reserva para imprevistos?',
      opcoes: ['Para comprar doces ao fim de semana', 'Para pagar coisas inesperadas, como arranjar a bicicleta', 'Para emprestar a quem pedir'],
      certa: 1,
      explicacao: 'Os imprevistos acontecem a toda a gente. Com uma reserva não é preciso pedir emprestado.',
      tema: 'Poupança',
    },
    {
      pergunta: 'Investir tem risco. O que quer dizer isso?',
      opcoes: ['Que o valor pode subir ou descer', 'Que se ganha sempre', 'Que é proibido a menores'],
      certa: 0,
      explicacao: 'Quem investe pode ganhar mais do que no banco, mas o valor também pode descer. Por isso é preciso paciência.',
      tema: 'Sistema e produtos financeiros básicos',
    },
    {
      pergunta: 'Recebes uma mensagem: "Ganhaste um telemóvel! Envia os dados do cartão dos teus pais." O que fazes?',
      opcoes: ['Envio, é um prémio', 'Não respondo e conto a um adulto', 'Envio só metade dos dados'],
      certa: 1,
      explicacao: 'É uma burla. Ninguém dá prémios a pedir dados de cartões. Conta sempre a um adulto de confiança.',
      tema: 'Direitos e deveres',
    },
    {
      pergunta: 'Um vídeo de uma pessoa famosa mostra um produto e tem escrito #pub. O que significa?',
      opcoes: ['Que é a opinião sincera dela', 'Que é publicidade paga', 'Que o produto é grátis'],
      certa: 1,
      explicacao: '#pub quer dizer publicidade: alguém pagou para mostrarem o produto.',
      tema: 'Direitos e deveres',
    },
    {
      pergunta: 'Se os preços sobem e o teu dinheiro fica igual, o que acontece?',
      opcoes: ['Compras mais coisas', 'Compras menos coisas', 'Fica tudo igual'],
      certa: 1,
      explicacao: 'Chama-se inflação: o mesmo dinheiro compra menos. Por isso é bom que as poupanças rendam alguma coisa.',
      tema: 'Poupança',
    },
  ],
  maior: [
    {
      pergunta: 'O salário líquido é...',
      opcoes: ['O salário antes dos descontos', 'O que recebes depois dos descontos de IRS e Segurança Social', 'O salário mais o subsídio de férias'],
      certa: 1,
      explicacao: 'O bruto é o valor do contrato; o líquido é o que chega à conta depois dos descontos.',
      tema: 'Planeamento e gestão do orçamento',
    },
    {
      pergunta: 'Para que serve a TAEG?',
      opcoes: ['Para comparar o custo total de créditos', 'Para saber o valor da prestação', 'Para calcular o IRS'],
      certa: 0,
      explicacao: 'A TAEG junta juros, comissões e outros encargos num só número. Quanto mais baixa, mais barato é o crédito.',
      tema: 'Crédito',
    },
    {
      pergunta: 'O que acontece se pagares só o valor mínimo do cartão de crédito todos os meses?',
      opcoes: ['A dívida acaba depressa', 'Pagas muitos juros e a dívida demora anos a acabar', 'O banco perdoa o resto'],
      certa: 1,
      explicacao: 'O que fica por pagar continua a acumular juros altos. Pagar só o mínimo é das formas mais caras de dever dinheiro.',
      tema: 'Crédito',
    },
    {
      pergunta: 'Quanto se costuma aconselhar ter num fundo de emergência?',
      opcoes: ['Uma semana de despesas', '3 a 6 meses de despesas', 'Não é preciso, há o cartão de crédito'],
      certa: 1,
      explicacao: 'Entre 3 e 6 meses de despesas dá para aguentar uma avaria, uma doença ou uma fase sem trabalho.',
      tema: 'Poupança',
    },
    {
      pergunta: 'O que é diversificar os investimentos?',
      opcoes: ['Pôr tudo na ação que mais subiu', 'Espalhar o dinheiro por vários investimentos para reduzir o risco', 'Mudar de banco todos os anos'],
      certa: 1,
      explicacao: 'Se um investimento correr mal, os outros amortecem a queda. Um ETF, por exemplo, junta centenas de empresas.',
      tema: 'Sistema e produtos financeiros básicos',
    },
    {
      pergunta: 'Tens um crédito à habitação com taxa variável. Se a Euribor subir, a prestação...',
      opcoes: ['Sobe', 'Desce', 'Fica igual'],
      certa: 0,
      explicacao: 'Na taxa variável, a taxa é a Euribor mais um spread. Se a Euribor sobe, a prestação sobe na revisão seguinte.',
      tema: 'Crédito',
    },
    {
      pergunta: 'A inflação está nos 3% e o teu depósito rende 1% ao ano. O que acontece ao teu dinheiro?',
      opcoes: ['Ganha poder de compra', 'Perde poder de compra', 'Fica igual'],
      certa: 1,
      explicacao: 'Os preços sobem mais depressa do que o dinheiro: no fim do ano compras menos com ele.',
      tema: 'Poupança',
    },
    {
      pergunta: 'Uma empresa vende 123€ com IVA a 23%. Quanto desse dinheiro é da empresa?',
      opcoes: ['123€', '100€', '77€'],
      certa: 1,
      explicacao: 'O preço sem IVA é 100€; os outros 23€ são IVA, que a empresa tem de entregar ao Estado.',
      tema: 'Direitos e deveres',
    },
    {
      pergunta: 'Quem começa a investir 100€ por mês aos 25 anos, comparado com quem começa aos 45, chega aos 65 com...',
      opcoes: ['O dobro do dinheiro', 'Bastante mais do que o dobro', 'O mesmo, porque investe o mesmo por mês'],
      certa: 1,
      explicacao: 'Investe o dobro do tempo, mas por causa do juro composto acaba com muito mais do que o dobro. Começar cedo é a maior vantagem.',
      tema: 'Poupança',
    },
    {
      pergunta: 'Recebes um SMS do "teu banco" a pedir o código que acabou de chegar ao telemóvel. O que fazes?',
      opcoes: ['Dou o código, é o meu banco', 'Nunca dou o código e ligo para o número oficial do banco', 'Respondo a perguntar se é mesmo o banco'],
      certa: 1,
      explicacao: 'Os bancos nunca pedem códigos por SMS, email ou telefone. Na dúvida, contacta o banco pelos canais oficiais.',
      tema: 'Direitos e deveres',
    },
  ],
}

export interface ResultadoDesafio {
  acertos: number
  total: number
  /** Data em formato AAAA-MM-DD. */
  data: string
}

export interface RegistoDesafio {
  antes?: ResultadoDesafio
  depois?: ResultadoDesafio
}

const CHAVE = 'vila-moeda:desafio'

export function lerDesafio(): Partial<Record<NivelDesafio, RegistoDesafio>> {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Partial<Record<NivelDesafio, RegistoDesafio>>
    return d && typeof d === 'object' ? d : {}
  } catch {
    return {}
  }
}

/** A primeira vez conta como "antes de jogar"; as seguintes como "depois". */
export function registarDesafio(nivel: NivelDesafio, r: ResultadoDesafio): 'antes' | 'depois' {
  const d = lerDesafio()
  const atual = d[nivel] ?? {}
  const quando = atual.antes ? 'depois' : 'antes'
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...d, [nivel]: { ...atual, [quando]: r } }))
  } catch {
    // sem armazenamento: o resultado só aparece no ecrã
  }
  return quando
}

export function limparDesafio() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a fazer
  }
}

/** Quantos pontos percentuais melhorou (ou null se ainda não há antes e depois). */
export function melhoria(r: RegistoDesafio | undefined): number | null {
  if (!r?.antes || !r.depois) return null
  return Math.round((r.depois.acertos / r.depois.total - r.antes.acertos / r.antes.total) * 100)
}

/** As perguntas por uma ordem diferente de cada vez (as opções ficam no sítio). */
export function baralhar<T>(lista: T[], aleatorio = Math.random): T[] {
  const l = [...lista]
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[l[i], l[j]] = [l[j], l[i]]
  }
  return l
}
