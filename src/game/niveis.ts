import { euros, META_VIAGEM, novoEstadoCidade, patrimonio, poupadoViagem } from './cidade/economia'
import { CRACHAS, CRACHAS_PARA_PASSAR, META_OBJETIVO } from './crachas'
import { novoJogador } from './data'
import type { EstadoCidade } from './cidade/tipos'
import type { Modo } from './gravar'
import { META_CASA, novoEstadoCasa, novoEstadoMercado, patrimonioM } from './mercado/economia'
import { META_PATRIMONIO_CASA } from './mercado/habitacao'
import { MESES_NEGOCIO, NEGOCIOS, novoEstadoNegocio } from './negocio/economia'
import { ANOS_REFORMA, daVidaAtivaParaReforma, idadeDe, novoEstadoReforma, patrimonioR, poupancas, type EstadoReforma } from './reforma/economia'
import type { EstadoMercado } from './mercado/tipos'
import type { PlayerState } from './types'

export const NOME_MODO: Record<Modo, string> = { reino: 'Vila Moeda', cidade: 'A Cidade', mercado: 'O Mercado', casa: 'A Casa', negocio: 'O Negócio', reforma: 'A Reforma' }

export const PROXIMO: Partial<Record<Modo, Modo>> = { reino: 'cidade', cidade: 'mercado', mercado: 'casa', casa: 'negocio', negocio: 'reforma' }

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
  if (modo === 'negocio') {
    const s = estado as EstadoMercado
    const ok = !!s.negocio?.aberto
    return { ok, regra: 'chegar ao fim do ano com a empresa aberta', situacao: ok ? undefined : 'A empresa fechou por falta de caixa.' }
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
  if (modo === 'reforma') return novoEstadoReforma(name, avatar)
  return novoEstadoCasa(name, avatar)
}

/** O que a personagem traz das fases anteriores (fica nas flags "passado_..." até ao fim do jogo). */
function passado(flags: string[], novos: Record<string, boolean>) {
  return [...flags.filter((f) => f.startsWith('passado_')), ...Object.entries(novos).filter(([f, v]) => v && !flags.includes(f)).map(([f]) => f)]
}

/** Passa a mesma personagem para o nível seguinte, levando parte do que juntou. Devolve o novo estado e o que o Mestre Moedas explica. */
export function passarNivel(modo: Modo, estado: unknown): { modo: Modo; estado: unknown; linhas: string[] } | null {
  if (modo === 'reino') {
    const s = estado as PlayerState
    const moedas = s.saldo + s.poupanca + s.investimento.amount
    const trazes = Math.round(moedas / 4)
    const n = novoEstadoCidade(s.name, s.avatar)
    const p = passado(s.flags, { passado_gato: s.flags.includes('gato'), passado_solidario: s.crachas.includes('ajudar'), passado_comparar: s.crachas.includes('comparar') })
    const linhas = [
      `${s.name}! Cresceste e agora vives na Cidade.`,
      `Das ${Math.round(moedas)} moedas que juntaste na Vila Moeda, a tua família guardou ${euros(trazes)} para ti. Já estão na tua carteira!`,
    ]
    if (p.includes('passado_gato')) linhas.push('E o Bolinhas, o teu gato, veio contigo! Agora és tu que pagas a ração: 2€ por semana.')
    if (p.includes('passado_solidario')) linhas.push('Na escola nova já sabem que ajudaste na campanha solidária da Vila. Começas com mais amigos!')
    if (p.includes('passado_comparar')) linhas.push('E continuas a comparar preços antes de comprar: isso vai poupar-te muito dinheiro aqui.')
    linhas.push('Aqui o dinheiro é a sério (a fingir, claro): euros, contas no banco, ações e um primeiro trabalho.')
    return {
      modo: 'cidade',
      estado: {
        ...n,
        dinheiro: n.dinheiro + trazes,
        flags: ['veio_da_vila', ...p],
        stats: { ...n.stats, relacoes: n.stats.relacoes + (p.includes('passado_solidario') ? 8 : 0) },
        pagamentos: p.includes('passado_gato') ? [{ id: 'bolinhas', nome: 'Ração do Bolinhas', valor: 2, restam: null, cancelavel: false }] : [],
      },
      linhas,
    }
  }
  if (modo === 'cidade') {
    const s = estado as EstadoCidade
    const trazes = Math.max(0, Math.round(patrimonio(s)))
    const n = novoEstadoMercado(s.name, s.avatar)
    const p = passado(s.flags, {
      passado_bicicleta: s.flags.includes('bicicleta'),
      passado_negociou: s.flags.includes('mesada_extra'),
      passado_anti_anuncios: s.crachas.includes('publicidade'),
      passado_anti_burla: s.crachas.includes('anti_burla'),
    })
    const linhas = [
      `${s.name}, passaram uns anos: acabaste os estudos e começa a vida adulta!`,
      `Os ${euros(trazes)} que juntaste na Cidade continuam contigo: somam-se aos 800€ que tens na conta.`,
    ]
    if (p.includes('passado_negociou')) linhas.push('Como aprendeste a negociar a mesada, negociaste também o primeiro salário: mais 60€ brutos por mês!')
    if (p.includes('passado_bicicleta')) linhas.push('Ainda tens a bicicleta: em vez do passe completo, gastas menos em transportes.')
    if (p.includes('passado_anti_burla') || p.includes('passado_anti_anuncios')) linhas.push('E já sabes reconhecer burlas e publicidade escondida: vais precisar disso!')
    linhas.push('Agora há salário, renda, impostos, cartão de crédito... e o objetivo de juntar a entrada para uma casa.')
    return {
      modo: 'mercado',
      estado: {
        ...n,
        conta: n.conta + trazes,
        salarioBruto: n.salarioBruto + (p.includes('passado_negociou') ? 60 : 0),
        history: [{ week: 0, saldo: n.conta + trazes, poupanca: 0, investimento: 0 }],
        flags: ['veio_da_cidade', ...p],
      },
      linhas,
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
      flags: [...s.flags.filter((f) => f === 'investir'), 'veio_do_mercado', ...passado(s.flags, { passado_carta: s.carta === 'carta', passado_contrato: s.crachas.includes('contrato') })],
      noticias: [{ semana: 1, titulo: 'Começa um novo ano', texto: 'Fala-se muito de juros e de casas.' }],
      history: [{ week: 0, saldo: s.conta, poupanca: s.poupanca + s.ppr, investimento: 0 }],
    }
    return {
      modo: 'casa',
      estado: n,
      linhas: [
        `${s.name}, juntaste ${euros(patrimonioM(s))}. Chegou a hora de pensar em comprar casa!`,
        `Com a experiência dos últimos anos, o teu salário subiu para ${euros(n.salarioBruto)} brutos.`,
        ...(s.carta === 'carta' ? ['Já tens carta de condução: não precisas de voltar à escola de condução.'] : []),
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
      flags: [...s.flags.filter((f) => f === 'investir'), 'veio_da_casa', ...passado(s.flags, { passado_casa: !!s.hipoteca, passado_bebe: s.flags.includes('bebe') })],
      noticias: [{ semana: 1, titulo: 'Começa um novo ano', texto: 'Abrem muitas empresas novas na cidade.' }],
      history: [{ week: 0, saldo: s.conta, poupanca: s.poupanca + s.ppr, investimento: 0 }],
    }
    return {
      modo: 'negocio',
      estado: n,
      linhas: [
        `${s.name}, passaste todas as fases! Tens ${euros(patrimonioM(s))} de património.`,
        'Desbloqueaste uma fase nova: O NEGÓCIO. Vais criar a tua própria empresa e ser tu a pagar os ordenados!',
      ],
    }
  }
  if (modo === 'negocio') {
    const s = estado as EstadoMercado
    const r = daVidaAtivaParaReforma(s)
    const n = s.negocio
    const p = passado(s.flags, {
      [`passado_negocio_${n?.tipo ?? 'nenhum'}`]: !!n,
      passado_empregos: !!n && n.funcionarios.length >= 2,
      passado_lucro: !!n && n.lucroAno > 0,
    })
    return {
      modo: 'reforma',
      estado: { ...r, flags: [...r.flags, ...p] },
      linhas: [`${s.name}, a tua empresa aguentou o primeiro ano!`, 'Agora, uma viagem no tempo: passam 35 anos de trabalho, poupança e investimento...'],
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
  if (modo === 'reforma') {
    const r = estado as EstadoReforma
    return fim ? `${r.name} acabou A Reforma (${euros(poupancas(r))} de poupanças)` : `${r.name} · A Reforma · ${idadeDe(r)} anos (ano ${Math.min(r.ano, ANOS_REFORMA)}/${ANOS_REFORMA})`
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
  if (modo === 'reforma') {
    const r = estado as EstadoReforma
    return `${r.semDinheiro ? 'as poupanças acabaram antes dos 85' : `chegou aos 85 com ${euros(poupancas(r))} de poupanças`}, património de ${euros(patrimonioR(r))}`
  }
  const s = estado as EstadoMercado
  if (modo === 'mercado') return `${euros(patrimonioM(s))} de património e ${s.crachas.length} conquistas`
  if (modo === 'casa') return `${s.hipoteca ? 'casa comprada, ' : 'sem casa própria, '}${euros(patrimonioM(s))} de património`
  const n = s.negocio
  return n ? `${NEGOCIOS[n.tipo].nome}: ${n.lucroAno >= 0 ? 'lucro' : 'prejuízo'} de ${euros(Math.abs(n.lucroAno))} no ano, ${n.funcionarios.length} empregos criados` : 'empresa por abrir'
}
