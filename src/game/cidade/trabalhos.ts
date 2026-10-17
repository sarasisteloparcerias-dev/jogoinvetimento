import type { ResultadoMiniJogo, TipoMiniJogo } from '../minijogos/tipos'
import type { Stats } from '../types'
import type { EstadoCidade } from './tipos'

export type TrabalhoCidade = 'cafe' | 'entregas' | 'babysitting' | 'explicacoes'

export interface DefTrabalho {
  nome: string
  curto: string
  chefe: string
  /** Pagamento fixo por turno. */
  base: number
  minijogo: TipoMiniJogo
  /** Extra conforme o mini-jogo (gorjetas, entregas, respostas certas...). */
  extra(r: ResultadoMiniJogo): number
  textoExtra: string
  /** O que cada turno faz às estatísticas. */
  efeitos: Partial<Stats>
  descricao: string[]
  instrucao: string
  requisito?(s: EstadoCidade): string | null
}

export const TRABALHOS_CIDADE: Record<TrabalhoCidade, DefTrabalho> = {
  cafe: {
    nome: 'Café Grão Dourado',
    curto: 'Café',
    chefe: 'D. Clara',
    base: 15,
    minijogo: 'cafe',
    extra: (r) => r.valor ?? 0,
    textoExtra: 'de gorjetas',
    efeitos: { saude: -2 },
    descricao: ['Procuro alguém para servir cafés e bolos ao fim de semana.', 'Pago 15€ por turno, mais as gorjetas. Cansa um bocadinho!'],
    instrucao: 'Serve a cada cliente o que ele pediu. Depressa, que as gorjetas dependem disso!',
  },
  entregas: {
    nome: 'RapidEntregas',
    curto: 'Entregas',
    chefe: 'Marco',
    base: 12,
    minijogo: 'entregas',
    extra: (r) => r.valor ?? 0,
    textoExtra: 'por entregas',
    efeitos: { saude: 2, relacoes: -1 },
    descricao: ['Precisamos de quem entregue encomendas de bicicleta pela cidade.', '12€ por turno, mais 1€ por cada entrega. Fazes exercício, mas cuidado com o trânsito!'],
    instrucao: 'Apanha as encomendas e foge dos carros. Capacete posto!',
  },
  babysitting: {
    nome: 'Babysitting',
    curto: 'Babysitting',
    chefe: 'Sra. Helena',
    base: 16,
    minijogo: 'babysitting',
    extra: (r) => Math.min(8, r.pontos) * 0.5,
    textoExtra: 'de extra (o bebé divertiu-se)',
    efeitos: { relacoes: 2, saude: -1 },
    descricao: ['Preciso de quem tome conta do meu bebé ao sábado à tarde.', '16€ por tarde, e um extra se ele se divertir. É preciso paciência e atenção!'],
    instrucao: 'Ele adora brincar ao "repete o que eu faço". Presta atenção aos brinquedos!',
  },
  explicacoes: {
    nome: 'Explicações',
    curto: 'Explicações',
    chefe: 'Prof. Nuno',
    base: 20,
    minijogo: 'explicacoes',
    extra: (r) => r.pontos,
    textoExtra: 'por respostas certas',
    efeitos: { educacao: 2 },
    descricao: ['Tenho alunos mais novos que precisam de ajuda a Matemática.', '20€ por sessão, mais 1€ por cada resposta certa. E ensinar também te faz aprender!'],
    instrucao: 'Responde certo e depressa: o teu aluno está a contar contigo.',
    requisito: (s) => (s.stats.educacao < 60 ? `Para dares explicações precisas de Educação 60 ou mais (tens ${Math.round(s.stats.educacao)}). Estuda na biblioteca e volta!` : null),
  },
}
