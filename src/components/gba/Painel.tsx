import { useImperativeHandle, useState, type ReactNode } from 'react'
import { CONQUISTAS_MERCADO, objetivoMercado } from '../../game/mercado/conquistas'
import {
  ACOES_M,
  ATIVO_M,
  ATIVOS_M,
  CASAS,
  COMISSAO,
  comprarM,
  despesasFixas,
  dividaPrestacoes,
  euros,
  IMPOSTO_CAPITAL,
  MESES,
  META_CASA,
  nomeMes,
  patrimonioM,
  round2,
  salarioLiquido,
  taxaDeposito,
  valorAtivoM,
  carteiraM,
  venderM,
} from '../../game/mercado/economia'
import { verificarConquistasM } from '../../game/mercado/scripts'
import { PROFISSOES } from '../../game/mercado/profissoes'
import type { AtivoM, EstadoMercado } from '../../game/mercado/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { GrowthChart } from '../GrowthChart'
import type { PropsMenu } from './modo'
import { Barra, CabecalhoAtivos, corVariacao, Grafico, Linha, LinhaAtivo, pct, Risco, teclaTelefone, Telefone, useTelefone, type AppTelefone, type Opcao } from './telefone'
import { PixelImg, u } from './ui'

type Ecra = 'inicio' | 'banco' | 'debitos' | 'investir' | 'ativo' | 'mes' | 'jornal' | 'metas' | 'perfil' | 'grafico'

const APPS: AppTelefone<Ecra>[] = [
  { ecra: 'banco', nome: 'BANCO', cor: '#4a7ad0', simbolo: '€' },
  { ecra: 'investir', nome: 'INVESTIR', cor: '#2a9a5a', simbolo: '%' },
  { ecra: 'mes', nome: 'MÊS', cor: '#3aa0a0', simbolo: '=' },
  { ecra: 'jornal', nome: 'JORNAL', cor: '#e05050', simbolo: 'N' },
  { ecra: 'metas', nome: 'METAS', cor: '#e0a020', simbolo: '★' },
  { ecra: 'perfil', nome: 'PERFIL', cor: '#8a6ad0', simbolo: '☺' },
]

const PAI: Partial<Record<Ecra, Ecra>> = { debitos: 'banco', ativo: 'investir', grafico: 'perfil' }
const PLANOS = [0, 50, 100, 200, 400]

function variacaoMes(s: EstadoMercado, id: AtivoM) {
  const h = s.historicoPrecos[id]
  return h.length > 1 ? h[h.length - 1] / h[h.length - 2] - 1 : 0
}

/** O painel do adulto (START n'O Mercado): banco, corretora, orçamento, jornal, metas e perfil. */
export function Painel({ estado: s, ctx, onFechar, ref }: PropsMenu<EstadoMercado>) {
  const tel = useTelefone<Ecra>('inicio', PAI)
  const { ecra, ir, indice, setIndice, avisar, voltar } = tel
  const [ativo, setAtivo] = useState<AtivoM>('etf')

  const definir = (n: EstadoMercado, texto: string) => {
    ctx.definir(n)
    avisar(texto)
    void verificarConquistasM(ctx)
  }
  const mover = (v: number, onde: 'poupanca' | 'ppr') => () => {
    if (v > 0 && s.conta < v) return avisar(`Não tens ${euros(v)} na conta.`)
    if (v < 0 && s[onde] < -v) return avisar(`O depósito não tem ${euros(-v)}.`)
    const n = { ...s, conta: round2(s.conta - v), [onde]: round2(s[onde] + v) }
    if (onde === 'ppr') n.pprAno = round2(s.pprAno + v)
    definir(n, v > 0 ? `${euros(v)} para ${onde === 'ppr' ? 'o PPR' : 'o depósito'}.` : `${euros(-v)} de volta à conta.`)
  }

  let titulo = ''
  let conteudo: ReactNode = null
  let opcoes: Opcao[] = []
  let lado = false

  switch (ecra) {
    case 'inicio':
      opcoes = [...APPS.map((a) => ({ r: a.nome, f: () => ir(a.ecra) })), { r: 'FECHAR', f: onFechar }]
      break

    case 'banco':
      titulo = 'BANCO PONTE'
      conteudo = (
        <>
          <Linha nome="CONTA À ORDEM" valor={euros(s.conta)} nota="Para o dia a dia." />
          <Linha nome="DEPÓSITO" valor={euros(s.poupanca)} nota={`${pct(taxaDeposito(s))}/ano, menos 28% de imposto.`} />
          <Linha nome="PPR" valor={euros(s.ppr)} nota="Para a reforma. Desconta no IRS." />
          {(s.cartaoCredito || s.divida > 0) && <Linha nome="DÍVIDA" valor={euros(s.divida)} nota={s.cartaoCredito ? 'Cartão de crédito: ~21%/ano.' : 'Descoberto.'} cor={s.divida > 0 ? '#d03a3a' : undefined} />}
          {dividaPrestacoes(s) > 0 && <Linha nome="PRESTAÇÕES" valor={euros(dividaPrestacoes(s))} nota="O que falta pagar em créditos." cor="#d03a3a" />}
        </>
      )
      opcoes = [
        { r: 'POUPAR 100€', f: mover(100, 'poupanca') },
        { r: 'POUPAR 500€', f: mover(500, 'poupanca') },
        { r: 'TIRAR 100€', f: mover(-100, 'poupanca') },
        { r: 'PPR +100€', f: mover(100, 'ppr') },
        {
          r: 'PAGAR DÍVIDA',
          f: () => {
            if (s.divida <= 0) return avisar('Não deves nada. Ótimo!')
            const paga = round2(Math.min(s.divida, s.conta))
            if (paga <= 0) return avisar('Não tens dinheiro na conta.')
            definir({ ...s, conta: round2(s.conta - paga), divida: round2(s.divida - paga) }, `Pagaste ${euros(paga)} de dívida.`)
          },
        },
        { r: `DÉBITOS (${s.pagamentos.length})`, f: () => ir('debitos') },
        voltar,
      ]
      lado = true
      break

    case 'debitos':
      titulo = 'DÉBITOS DIRETOS'
      conteudo = s.pagamentos.length ? (
        s.pagamentos.map((p) => (
          <Linha key={p.id} nome={p.nome.toUpperCase()} valor={`${euros(p.valor)}/mês`} nota={p.restam === null ? (p.cancelavel ? 'Até cancelares.' : 'Compromisso sem fim.') : `Faltam ${p.restam} meses. Não dá para cancelar.`} />
        ))
      ) : (
        <p style={{ margin: 0 }}>Não tens débitos diretos.</p>
      )
      opcoes = [
        ...s.pagamentos
          .filter((p) => p.cancelavel)
          .map((p) => ({
            r: `CANCELAR ${p.nome.toUpperCase()}`,
            f: () => {
              ctx.definir({ ...s, pagamentos: s.pagamentos.filter((x) => x.id !== p.id) })
              avisar(`${p.nome} cancelado.`)
              setIndice(0)
            },
          })),
        voltar,
      ]
      break

    case 'investir': {
      titulo = 'CORRETORA'
      if (!s.flags.includes('investir')) {
        conteudo = <p style={{ margin: 0 }}>Fala primeiro com o Mestre Moedas no Banco Ponte: ele abre-te a corretora e explica custos e impostos.</p>
        opcoes = [voltar]
        break
      }
      const carteira = carteiraM(s)
      const custo = Object.values(s.custo).reduce((a, b) => a + b, 0)
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Carteira: {euros(carteira)}</span>
            {custo > 0 && (
              <span style={{ color: corVariacao(carteira - custo) }}>
                {carteira - custo >= 0 ? '+' : ''}
                {euros(carteira - custo)}
              </span>
            )}
          </div>
          <CabecalhoAtivos periodo="MÊS" />
        </>
      )
      opcoes = [
        ...ATIVOS_M.map((a) => {
          const tens = valorAtivoM(s, a.id)
          return {
            r: <LinhaAtivo nome={a.curto} preco={euros(s.precos[a.id])} variacao={variacaoMes(s, a.id)} tens={tens >= 0.01 ? euros(tens) : null} />,
            f: () => {
              setAtivo(a.id)
              ir('ativo')
            },
          }
        }),
        {
          r: `PLANO MENSAL ETF: ${s.planoMensal}€`,
          f: () => {
            const prox = PLANOS[(PLANOS.indexOf(s.planoMensal) + 1) % PLANOS.length]
            ctx.definir({ ...s, planoMensal: prox })
            avisar(prox ? `Todos os meses: ${prox}€ no ETF Mundo.` : 'Plano mensal desligado.')
          },
        },
        voltar,
      ]
      break
    }

    case 'ativo': {
      const a = ATIVO_M[ativo]
      const tens = valorAtivoM(s, a.id)
      const ganho = tens - s.custo[a.id]
      titulo = a.nome.toUpperCase()
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: u(5.5) }}>
            <span>{a.tipo}</span>
            <Risco n={a.risco} />
          </div>
          <div>
            {euros(s.precos[a.id])} <span style={{ color: corVariacao(variacaoMes(s, a.id)) }}>{pct(variacaoMes(s, a.id))}</span>
          </div>
          <Grafico valores={s.historicoPrecos[a.id]} />
          <div style={{ fontSize: u(5.5) }}>
            Tens {euros(tens)}
            {s.custo[a.id] > 0 && (
              <span style={{ color: corVariacao(ganho) }}>
                {' '}
                ({ganho >= 0 ? '+' : ''}
                {euros(ganho)})
              </span>
            )}
          </div>
          <div style={{ fontSize: u(5), lineHeight: u(7), color: '#5a6280', marginTop: u(2) }}>
            Comissão {COMISSAO}€ · Imposto {Math.round(IMPOSTO_CAPITAL * 100)}% sobre o lucro. {a.descricao}
          </div>
        </>
      )
      const compra = (v: number) => () => {
        const n = comprarM(s, a.id, v)
        if (n) definir(n, `Compraste ${euros(v)} (+${COMISSAO}€ de comissão).`)
        else avisar(`Precisas de ${euros(v + COMISSAO)} na conta.`)
      }
      opcoes = [
        { r: 'COMPRAR 50€', f: compra(50) },
        { r: 'COMPRAR 200€', f: compra(200) },
        {
          r: 'VENDER TUDO',
          f: () => {
            if (tens < 0.01) return avisar('Não tens nada para vender.')
            const { estado, valor, imposto } = venderM(s, a.id)
            const crise = s.mes >= 7 && s.mes <= 10 && ACOES_M.includes(a.id)
            definir(crise ? { ...estado, flags: [...estado.flags, 'vendeu_crise'] } : estado, `Vendeste por ${euros(valor)}${imposto > 0 ? ` (imposto ${euros(imposto)})` : ''}, comissão ${COMISSAO}€.`)
          },
        },
        voltar,
      ]
      lado = true
      break
    }

    case 'mes': {
      titulo = 'ORÇAMENTO DO MÊS'
      const sal = salarioLiquido(s)
      const fixas = despesasFixas(s)
      const total = fixas.reduce((t, d) => t + d.valor, 0) + s.planoMensal
      const sobra = sal.liquido - total
      conteudo = (
        <>
          <Linha nome="SALÁRIO LÍQUIDO" valor={euros(sal.liquido)} nota={`Bruto ${euros(sal.bruto)} - SS ${euros(sal.ss)} - IRS ${euros(sal.irs)}`} cor="#1f9a50" />
          {fixas.map((d) => (
            <div key={d.texto} style={{ display: 'flex', justifyContent: 'space-between', fontSize: u(5.5) }}>
              <span>{d.texto}</span>
              <span>-{euros(d.valor)}</span>
            </div>
          ))}
          {s.planoMensal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: u(5.5) }}>
              <span>Plano de investimento</span>
              <span>-{euros(s.planoMensal)}</span>
            </div>
          )}
          <Linha nome="SOBRA" valor={euros(sobra)} nota={`Taxa de poupança: ${pct(Math.max(0, sobra + s.planoMensal) / sal.liquido)} do líquido.`} cor={sobra >= 0 ? '#1f9a50' : '#d03a3a'} />
        </>
      )
      opcoes = [voltar]
      break
    }

    case 'jornal':
      titulo = 'JORNAL DO MÊS'
      conteudo = [...s.noticias]
        .reverse()
        .slice(0, 3)
        .map((n) => (
          <div key={n.semana} style={{ marginBottom: u(4) }}>
            <div style={{ fontSize: u(5), color: '#8890a8' }}>{nomeMes(n.semana).toUpperCase()}</div>
            <div style={{ fontWeight: 700, color: '#3a4262' }}>{n.titulo}</div>
            <div style={{ fontSize: u(5.5), lineHeight: u(7.5), color: '#5a6280' }}>{n.texto}</div>
          </div>
        ))
      opcoes = [voltar]
      break

    case 'metas': {
      titulo = 'METAS'
      const liq = patrimonioM(s)
      const obj = objetivoMercado(s.crachas)
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>ENTRADA DA CASA</span>
            <span>
              {euros(liq)} / {euros(META_CASA)}
            </span>
          </div>
          <div style={{ height: u(6), background: '#e4e9f2', border: `${u(1)} solid #3a4262`, margin: `${u(2)} 0` }}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (liq / META_CASA) * 100))}%`, background: '#e8743a' }} />
          </div>
          <div style={{ fontSize: u(5.5), color: '#7a8298', marginBottom: u(4) }}>Património líquido: tudo o que tens menos o que deves.</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: u(3) }}>
            {CONQUISTAS_MERCADO.map((c) => (
              <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala={u(1.3)} style={{ opacity: s.crachas.includes(c.id) ? 1 : 0.5 }} />
            ))}
          </div>
          <div style={{ fontSize: u(6), lineHeight: u(8.5) }}>
            {obj ? (
              <>
                <b>Próxima: {obj.nome}.</b> {obj.objetivo}
              </>
            ) : (
              'Ganhaste todas as conquistas!'
            )}
          </div>
        </>
      )
      opcoes = [voltar]
      break
    }

    case 'perfil':
      titulo = s.name.toUpperCase()
      conteudo = (
        <>
          <div style={{ fontSize: u(5.5), marginBottom: u(3) }}>
            {PROFISSOES[s.profissao].nome} ({PROFISSOES[s.profissao].empresa}) · {euros(s.salarioBruto)} brutos · {CASAS[s.casa].nome}
          </div>
          <Barra nome="Relações" valor={s.stats.relacoes} cor="#f06090" />
          <Barra nome="Saúde" valor={s.stats.saude} cor="#48b870" />
          <Barra nome="Carreira" valor={s.stats.carreira} cor="#4a8ad8" />
          <div style={{ fontSize: u(5.5) }}>Juros de dívidas pagos: {euros(s.jurosPagos)}</div>
        </>
      )
      opcoes = [{ r: 'GRÁFICO', f: () => ir('grafico') }, voltar]
      lado = true
      break

    case 'grafico':
      titulo = 'O TEU DINHEIRO'
      conteudo = <GrowthChart history={s.history} />
      opcoes = [voltar]
      break
  }

  useImperativeHandle(ref, () => ({
    tecla: (t) => teclaTelefone(t, { noInicio: tel.noInicio, opcoes, indice, setIndice, voltar, onFechar }),
  }))

  return (
    <Telefone
      testid="painel"
      topo={[`${nomeMes(s.mes).toUpperCase()} (${Math.min(s.mes, MESES)}/${MESES})`, euros(s.conta)]}
      noInicio={tel.noInicio}
      apps={APPS}
      saudacao={`Olá, ${s.name}!`}
      resumo={`Conta ${euros(s.conta)} · Património ${euros(patrimonioM(s))}`}
      titulo={titulo}
      conteudo={conteudo}
      opcoes={opcoes}
      lado={lado}
      colado={ecra === 'investir'}
      indice={indice}
      setIndice={setIndice}
      aviso={tel.aviso}
      onApp={ir}
      onFechar={onFechar}
      moldura="#2a2f40"
    />
  )
}
