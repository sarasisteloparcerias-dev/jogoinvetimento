import { euros, novoEstadoCidade, patrimonio } from './cidade/economia'
import type { EstadoCidade } from './cidade/tipos'
import type { Modo } from './gravar'
import { novoEstadoMercado, patrimonioM } from './mercado/economia'
import type { EstadoMercado } from './mercado/tipos'
import type { PlayerState } from './types'

export const NOME_MODO: Record<Modo, string> = { reino: 'Vila Moeda', cidade: 'A Cidade', mercado: 'O Mercado', casa: 'A Casa' }

export const PROXIMO: Partial<Record<Modo, Modo>> = { reino: 'cidade', cidade: 'mercado', mercado: 'casa' }

/** Passa a mesma personagem para o nível seguinte, levando parte do que juntou. Devolve o novo estado e o que o Mestre Moedas explica. */
export function passarNivel(modo: Modo, estado: unknown): { modo: Modo; estado: unknown; linhas: string[] } | null {
  if (modo === 'reino') {
    const s = estado as PlayerState
    const moedas = s.saldo + s.poupanca + s.investimento.amount
    const trazes = Math.round(moedas / 4)
    const n = novoEstadoCidade(s.name, s.avatar)
    return {
      modo: 'cidade',
      estado: { ...n, dinheiro: n.dinheiro + trazes, flags: ['veio_da_vila'] },
      linhas: [
        `${s.name}! Cresceste e agora vives na Cidade.`,
        `Das ${Math.round(moedas)} moedas que juntaste na Vila Moeda, a tua família guardou ${euros(trazes)} para ti. Já estão na tua carteira!`,
        'Aqui o dinheiro é a sério (a fingir, claro): euros, contas no banco, ações e um primeiro trabalho.',
      ],
    }
  }
  if (modo === 'cidade') {
    const s = estado as EstadoCidade
    const trazes = Math.max(0, Math.round(patrimonio(s)))
    const n = novoEstadoMercado(s.name, s.avatar)
    return {
      modo: 'mercado',
      estado: { ...n, conta: n.conta + trazes, history: [{ week: 0, saldo: n.conta + trazes, poupanca: 0, investimento: 0 }], flags: ['veio_da_cidade'] },
      linhas: [
        `${s.name}, passaram uns anos: acabaste os estudos e começa a vida adulta!`,
        `Os ${euros(trazes)} que juntaste na Cidade continuam contigo: somam-se aos 800€ que tens na conta.`,
        'Agora há salário, renda, impostos, cartão de crédito... e o objetivo de juntar a entrada para uma casa.',
      ],
    }
  }
  if (modo === 'mercado') {
    const s = estado as EstadoMercado
    const n: EstadoMercado = {
      ...s,
      nivel: 'casa',
      mes: 1,
      gameOver: false,
      crachas: [],
      salarioBruto: Math.round(s.salarioBruto * 1.1),
      turnos: 0,
      movimentos: [],
      flags: [...s.flags.filter((f) => f === 'investir'), 'veio_do_mercado'],
      noticias: [{ semana: 1, titulo: 'Começa um novo ano', texto: 'Fala-se muito de juros e de casas.' }],
      history: [{ week: 0, saldo: s.conta, poupanca: s.poupanca + s.ppr, investimento: 0 }],
    }
    return {
      modo: 'casa',
      estado: n,
      linhas: [
        `${s.name}, juntaste ${euros(patrimonioM(s))}. Chegou a hora de pensar em comprar casa!`,
        `Com a experiência dos últimos anos, o teu salário subiu para ${euros(n.salarioBruto)} brutos.`,
      ],
    }
  }
  return null
}

/** Uma frase curta para o botão "Continuar". */
export function resumoGravacao(modo: Modo, estado: unknown, fim: boolean): string {
  if (modo === 'reino') {
    const s = estado as PlayerState
    return fim ? `${s.name} acabou a Vila Moeda` : `${s.name} · Vila Moeda · semana ${Math.min(s.week, 20)}/20`
  }
  if (modo === 'cidade') {
    const s = estado as EstadoCidade
    return fim ? `${s.name} acabou A Cidade` : `${s.name} · A Cidade · semana ${Math.min(s.semana, 24)}/24`
  }
  const s = estado as EstadoMercado
  const nome = modo === 'casa' ? 'A Casa' : 'O Mercado'
  return fim ? `${s.name} acabou ${nome} (${euros(patrimonioM(s))})` : `${s.name} · ${nome} · mês ${Math.min(s.mes, 24)}/24`
}
