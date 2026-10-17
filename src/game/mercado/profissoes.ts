import type { TipoMiniJogo } from '../minijogos/tipos'
import type { StatsAdulto } from './tipos'

export type Profissao = 'escritorio' | 'restaurante' | 'estafeta'

export interface DefProfissao {
  nome: string
  empresa: string
  chefe: string
  /** Onde se trabalha (para as falas). */
  local: string
  salario: number
  /** Gorjetas que entram todos os meses (só em alguns trabalhos). */
  gorjetas: number
  carreira: number
  minijogo: TipoMiniJogo
  /** O que o trabalho faz às estatísticas todos os meses. */
  efeitosMes: Partial<StatsAdulto>
  resumo: string
  descricao: string[]
}

export const PROFISSOES: Record<Profissao, DefProfissao> = {
  escritorio: {
    nome: 'Assistente de projeto',
    empresa: 'Nexo Digital',
    chefe: 'Eng.ª Sofia',
    local: 'no escritório da Nexo',
    salario: 1300,
    gorjetas: 0,
    carreira: 45,
    minijogo: 'emails',
    efeitosMes: { saude: -1 },
    resumo: '1.300€ brutos, horário fixo, muita secretária.',
    descricao: ['Escritório da Nexo Digital: 1.300€ brutos por mês, horário das 9h às 18h.', 'É o salário mais alto, mas passas o dia sentado ao computador.'],
  },
  restaurante: {
    nome: 'Serviço de mesa',
    empresa: 'Café Grão Dourado',
    chefe: 'D. Clara',
    local: 'no Café Grão Dourado',
    salario: 1050,
    gorjetas: 90,
    carreira: 40,
    minijogo: 'cafe',
    efeitosMes: { relacoes: -1 },
    resumo: '1.050€ brutos + gorjetas, fins de semana a trabalhar.',
    descricao: ['Café Grão Dourado: 1.050€ brutos por mês, mais uns 90€ de gorjetas.', 'Trabalhas por turnos e muitas vezes ao fim de semana, o que custa nas relações.'],
  },
  estafeta: {
    nome: 'Estafeta',
    empresa: 'RapidEntregas',
    chefe: 'Marco',
    local: 'na RapidEntregas',
    salario: 1100,
    gorjetas: 0,
    carreira: 35,
    minijogo: 'entregas',
    efeitosMes: { saude: 2 },
    resumo: '1.100€ brutos, sempre em movimento de bicicleta.',
    descricao: ['RapidEntregas: 1.100€ brutos por mês, entregas de bicicleta pela cidade.', 'Fazes exercício todos os dias, mas é cansativo e há pouca progressão.'],
  },
}

export const LISTA_PROFISSOES = Object.keys(PROFISSOES) as Profissao[]
