import { euros, META_VIAGEM, novoEstadoCidade, patrimonio, poupadoViagem } from './cidade/economia'
import { CRACHAS, CRACHAS_PARA_PASSAR, META_OBJETIVO } from './crachas'
import { novoJogador } from './data'
import type { EstadoCidade } from './cidade/tipos'
import type { Modo } from './gravar'
import { META_CASA, novoEstadoCasa, novoEstadoMercado, patrimonioM } from './mercado/economia'
import { META_PATRIMONIO_CASA } from './mercado/habitacao'
import { MESES_NEGOCIO, NEGOCIOS, novoEstadoNegocio } from './negocio/economia'
import type { EstadoMercado } from './mercado/tipos'
import type { PlayerState } from './types'

export const NOME_MODO: Record<Modo, string> = { reino: 'Vila Moeda', cidade: 'A Cidade', mercado: 'O Mercado', casa: 'A Casa', negocio: 'O Negócio' }

export const PROXIMO: Partial<Record<Modo, Modo>> = { reino: 'cidade', cidade: 'mercado', mercado: 'casa', casa: 'negocio' }

export interface Requisito {
  ok: boolean
  /** O que é preciso para passar à fase seguinte. */
  regra: string
  /** Como ficou (só quando falhou). */
  situacao?: string
}

/** O que é preciso para passar da fase atual para a seguinte (null na última fase). */
export function requisitoNivel(modo: Modo, estado: unknown): Requisito | null {
  if (modo === 'reino') {
    const s = estado as PlayerState
    const objetivo = s.crachas.includes('objetivo')
    const ok = objetivo && s.crachas.length >= CRACHAS_PARA_PASSAR
    return {
      ok,
      regra: `ganhar o crachá Objetivo (${META_OBJETIVO} moedas no mealheiro) e pelo menos ${CRACHAS_PARA_PASSAR} dos ${CRACHAS.length} crachás`,
      situacao: ok ? undefined : `Ganhaste ${s.crachas.length} crachás${objetivo ? '' : ' e falta o crachá Objetivo'}.`,
    }
  }
  if (modo === 'cidade') {
    const s = estado as EstadoCidade
    const junto = poupadoViagem(s)
    const ok = s.crachas.includes('viagem') || junto >= META_VIAGEM
    return {
      ok,
      regra: `juntar os ${META_VIAGEM}€ da Viagem de Finalistas (poupança + investimentos)`,
      situacao: ok ? undefined : `Juntaste ${euros(junto)}.`,
    }
  }
  if (modo === 'mercado') {
    const s = estado as EstadoMercado
    const total = patrimonioM(s)
    const ok = s.crachas.includes('casa') || total >= META_CASA
    return {
      ok,
      regra: `chegar a ${euros(META_CASA)} de património líquido (a entrada da casa)`,
      situacao: ok ? undefined : `Chegaste a ${euros(total)}.`,
    }
  }
  if (modo === 'casa') {
    const s = estado as EstadoMercado
    const total = patrimonioM(s)
    const ok = s.crachas.includes('patrimonio') || total >= META_PATRIMONIO_CASA || (!!s.hipoteca && s.crachas.includes('emergencia'))
    return {
      ok,
      regra: `chegar a ${euros(META_PATRIMONIO_CASA)} de património líquido, ou comprar casa e ter o fundo de emergência`,
      situacao: ok ? undefined : `Chegaste a ${euros(total)}${s.hipoteca ? ' e compraste casa, mas falta o fundo de emergência' : ''}.`,
    }
  }
  return null
}

/** Volta a jogar a mesma fase com a mesma personagem, do início. */
export function repetirNivel(modo: Modo, estado: unknown): unknown {
  const { name, avatar } = estado as PlayerState
  if (modo === 'reino') return novoJogador(name, avatar)
  if (modo === 'cidade') return novoEstadoCidade(name, avatar)
  if (modo === 'mercado') return novoEstadoMercado(name, avatar)
  if (modo === 'negocio') return novoEstadoNegocio(name, avatar)
  return novoEstadoCasa(name, avatar)
}

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
  if (modo === 'casa') {
    const s = estado as EstadoMercado
    const n: EstadoMercado = {
      ...s,
      nivel: 'negocio',
      mes: 1,
      gameOver: false,
      crachas: [],
      turnos: 0,
      movimentos: [],
      flags: [...s.flags.filter((f) => f === 'investir'), 'veio_da_casa'],
      noticias: [{ semana: 1, titulo: 'Começa um novo ano', texto: 'Abrem muitas empresas novas na cidade.' }],
      history: [{ week: 0, saldo: s.conta, poupanca: s.poupanca + s.ppr, investimento: 0 }],
    }
    return {
      modo: 'negocio',
      estado: n,
      linhas: [
        `${s.name}, passaste todas as fases! Tens ${euros(patrimonioM(s))} de património.`,
        'Desbloqueaste a fase final: O NEGÓCIO. Vais criar a tua própria empresa e ser tu a pagar os ordenados!',
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
  if (modo === 'negocio') {
    const n = s.negocio
    if (fim) return `${s.name} acabou O Negócio${n ? ` (${n.lucroAno >= 0 ? 'lucro' : 'prejuízo'} de ${euros(Math.abs(n.lucroAno))})` : ''}`
    return `${s.name} · O Negócio${n ? ` · ${NEGOCIOS[n.tipo].nome}` : ''} · mês ${Math.min(s.mes, MESES_NEGOCIO)}/${MESES_NEGOCIO}`
  }
  const nome = modo === 'casa' ? 'A Casa' : 'O Mercado'
  return fim ? `${s.name} acabou ${nome} (${euros(patrimonioM(s))})` : `${s.name} · ${nome} · mês ${Math.min(s.mes, 24)}/24`
}

/** Uma linha para o percurso (o resumo de todas as fases, no fim do jogo). */
export function resumoPercurso(modo: Modo, estado: unknown): string {
  if (modo === 'reino') {
    const s = estado as PlayerState
    return `${s.crachas.length} crachás e ${Math.round(s.saldo + s.poupanca + s.investimento.amount)} moedas`
  }
  if (modo === 'cidade') {
    const s = estado as EstadoCidade
    return `${euros(poupadoViagem(s))} juntos para a viagem e ${s.crachas.length} conquistas`
  }
  const s = estado as EstadoMercado
  if (modo === 'mercado') return `${euros(patrimonioM(s))} de património e ${s.crachas.length} conquistas`
  if (modo === 'casa') return `${s.hipoteca ? 'casa comprada, ' : 'sem casa própria, '}${euros(patrimonioM(s))} de património`
  const n = s.negocio
  return n ? `${NEGOCIOS[n.tipo].nome}: ${n.lucroAno >= 0 ? 'lucro' : 'prejuízo'} de ${euros(Math.abs(n.lucroAno))} no ano, ${n.funcionarios.length} empregos criados` : 'empresa por abrir'
}
