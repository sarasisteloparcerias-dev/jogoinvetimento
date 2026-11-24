import { r } from '../pixel/draw'
import { sfx } from '../som'
import { H, textoContorno, textoQuebrado, W, type MiniJogo, type Teclas } from './tipos'

const K = '#283040'

interface Cartao {
  autor: string
  texto: string
  /** true: é o que se procura (publicidade escondida, cláusula abusiva...). */
  sim: boolean
  porque: string
}

interface Config {
  titulo: string
  instrucoes: string[]
  rotuloSim: string
  rotuloNao: string
  cartoes: Cartao[]
  fundo: string
  topo: string
  rondas: number
  segundos: number
  resultado: (certos: number, total: number) => string
}

const ANUNCIOS: Cartao[] = [
  { autor: '@kiko.fit', texto: 'Uso estes ténis TODOS os dias! Código KIKO10 na bio #parceria', sim: true, porque: 'Código de desconto e #parceria: é publicidade paga.' },
  { autor: '@ines_22', texto: 'Hoje fomos à praia e o meu cão apanhou uma onda!', sim: false, porque: 'Uma amiga a partilhar o dia. Nada para vender.' },
  { autor: '@glow.beauty', texto: 'Este creme mudou a minha pele! Link na bio, só hoje -50%', sim: true, porque: '"Só hoje" e link na bio: pressa para comprar.' },
  { autor: '@escola.ponte', texto: 'Amanhã não há aulas de tarde: reunião de professores.', sim: false, porque: 'Informação da escola.' },
  { autor: '@cripto.rico', texto: 'Fiquei rico com LuaCoin! Entra no meu grupo VIP por 20€', sim: true, porque: 'Promete riqueza e vende acesso: publicidade (e possível burla).' },
  { autor: '@rui.bola', texto: 'Que golo no treino de ontem! Para a semana há mais.', sim: false, porque: 'Um amigo a falar do treino.' },
  { autor: '@gamer.pro', texto: 'Obrigado à SuperSnack por estes lanches! Que bons!', sim: true, porque: 'Agradece a uma marca que lhe ofereceu produtos: é publicidade.' },
  { autor: '@biblioteca', texto: 'Novos livros de banda desenhada! Empréstimo grátis.', sim: false, porque: 'Serviço público e grátis.' },
  { autor: '@moda.top', texto: 'Toda a gente já tem este casaco. E tu? Envio grátis!', sim: true, porque: '"Toda a gente tem" é pressão para comprar.' },
  { autor: '@avo.rosa', texto: 'Fiz bolo de laranja! Quem vem lanchar no domingo?', sim: false, porque: 'Família. Só bolo, sem vendas!' },
  { autor: '@tech.review', texto: 'Recebi este telemóvel da marca para testar. 10/10!', sim: true, porque: 'Recebeu o produto da marca: a opinião pode não ser imparcial.' },
  { autor: '@clube.leitura', texto: 'Este mês lemos "O Principezinho". Aparece!', sim: false, porque: 'Um convite, sem nada para comprar.' },
]

const CLAUSULAS: Cartao[] = [
  { autor: 'CLÁUSULA 3', texto: 'A renda paga-se até ao dia 8 de cada mês, por transferência.', sim: false, porque: 'Normal: data e forma de pagamento.' },
  { autor: 'CLÁUSULA 5', texto: 'A caução (2 rendas) não é devolvida em caso nenhum.', sim: true, porque: 'A caução devolve-se no fim, se a casa estiver em bom estado.' },
  { autor: 'CLÁUSULA 7', texto: 'O senhorio pode entrar na casa quando quiser, sem avisar.', sim: true, porque: 'A casa arrendada é o teu domicílio: o senhorio tem de combinar a visita.' },
  { autor: 'CLÁUSULA 2', texto: 'Contrato de 1 ano, renovável automaticamente.', sim: false, porque: 'Normal: prazo e renovação.' },
  { autor: 'CLÁUSULA 9', texto: 'O inquilino paga todas as obras do telhado e da fachada do prédio.', sim: true, porque: 'Obras na estrutura do prédio são do senhorio.' },
  { autor: 'CLÁUSULA 4', texto: 'A renda é atualizada uma vez por ano, pelo coeficiente oficial.', sim: false, porque: 'Normal: a lei define a atualização anual.' },
  { autor: 'CLÁUSULA 11', texto: 'A renda sobe 20% todos os anos, sem aviso.', sim: true, porque: 'Aumentos assim são abusivos: há um coeficiente oficial.' },
  { autor: 'CLÁUSULA 6', texto: 'Pequenas reparações do dia a dia são do inquilino.', sim: false, porque: 'Normal: lâmpadas, torneiras a pingar, etc.' },
  { autor: 'CLÁUSULA 8', texto: 'Taxa de "reserva" de 500€, não devolvida, a pagar hoje.', sim: true, porque: 'Taxas estranhas e pressa para pagar: sinal de alerta.' },
  { autor: 'CLÁUSULA 10', texto: 'Para sair, o inquilino avisa com 2 meses de antecedência.', sim: false, porque: 'Normal: há um pré-aviso.' },
]

export const CONFIG_ANUNCIOS: Config = {
  titulo: 'É PUBLICIDADE?',
  instrucoes: ['A: É PUBLICIDADE.', 'B: NÃO É.', 'Pistas: códigos, #parceria, "só hoje", "link na bio"...'],
  rotuloSim: 'A: PUBLICIDADE',
  rotuloNao: 'B: NÃO É',
  cartoes: ANUNCIOS,
  fundo: '#e8eaf4',
  topo: '#d04880',
  rondas: 10,
  segundos: 8,
  resultado: (c, t) => `${c} de ${t} publicações bem identificadas`,
}

export const CONFIG_CONTRATO: Config = {
  titulo: 'AS LETRAS PEQUENAS',
  instrucoes: ['A: CLÁUSULA ABUSIVA (perigo!).', 'B: CLÁUSULA NORMAL.', 'Lê com atenção antes de assinar!'],
  rotuloSim: 'A: ABUSIVA',
  rotuloNao: 'B: NORMAL',
  cartoes: CLAUSULAS,
  fundo: '#f4efe0',
  topo: '#7a8496',
  rondas: 8,
  segundos: 10,
  resultado: (c, t) => `${c} de ${t} cláusulas bem avaliadas`,
}

/** Um cartão de cada vez: decidir SIM (A) ou NÃO (B). Usado para a publicidade e para o contrato. */
export class Decidir implements MiniJogo {
  titulo: string
  instrucoes: string[]
  terminado = false
  private lista: Cartao[]
  private atual = 0
  private t: number
  private certos = 0
  private feedback: { certo: boolean; t: number } | null = null
  private c: Config

  constructor(c: Config) {
    this.c = c
    this.titulo = c.titulo
    this.instrucoes = c.instrucoes
    this.lista = [...c.cartoes].sort(() => Math.random() - 0.5).slice(0, c.rondas)
    this.t = c.segundos
  }

  update(dt: number, teclas: Teclas) {
    const s = dt / 1000
    if (this.feedback) {
      this.feedback.t -= s
      if (this.feedback.t <= 0 || (this.feedback.t < 1.6 && (teclas.premidas.has('A') || teclas.premidas.has('B')))) {
        this.feedback = null
        this.atual++
        this.t = this.c.segundos
        if (this.atual >= this.lista.length) this.terminado = true
      }
      return
    }
    this.t -= s
    const sim = teclas.premidas.has('A') ? true : teclas.premidas.has('B') ? false : null
    if (sim !== null || this.t <= 0) {
      const certo = sim === this.lista[this.atual].sim
      if (certo) this.certos++
      sfx(certo ? 'ponto' : 'erro')
      this.feedback = { certo, t: 2.4 }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    r(ctx, 0, 0, W, H, this.c.fundo)
    const cartao = this.lista[Math.min(this.atual, this.lista.length - 1)]
    r(ctx, 20, 14, 200, 92, K)
    r(ctx, 21, 15, 198, 90, '#ffffff')
    r(ctx, 21, 15, 198, 14, this.c.topo)
    textoContorno(ctx, cartao.autor, 28, 18, '#ffffff', 'left', 6)
    textoQuebrado(ctx, cartao.texto, 28, 36, 184, '#283040', 7, 11)
    if (this.feedback) {
      textoContorno(ctx, this.feedback.certo ? 'CERTO!' : 'ERRADO!', W / 2, 110, this.feedback.certo ? '#48b048' : '#e04848', 'center', 8)
      textoQuebrado(ctx, cartao.porque, 10, 124, 220, '#ffffff', 6, 9)
    } else {
      textoContorno(ctx, this.c.rotuloSim, 62, 116, '#e04848', 'center', 6)
      textoContorno(ctx, this.c.rotuloNao, 178, 116, '#4a7ad0', 'center', 6)
      r(ctx, 20, 140, 200, 4, K)
      r(ctx, 20, 140, Math.round(200 * Math.max(0, this.t / this.c.segundos)), 4, '#48b048')
    }
    textoContorno(ctx, `${this.certos} certos`, 4, 2, '#283040', 'left', 6)
    textoContorno(ctx, `${Math.min(this.atual + 1, this.lista.length)}/${this.lista.length}`, W - 4, 2, '#283040', 'right', 6)
  }

  resultado() {
    return { pontos: this.certos, texto: this.c.resultado(this.certos, this.lista.length) }
  }
}
