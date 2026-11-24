import { useImperativeHandle, useState } from 'react'
import type { InfoMapa } from '../../game/modo'
import { iconeCracha } from '../../game/pixel/cenario'
import { CONQUISTAS_REFORMA, objetivoReforma } from '../../game/reforma/conquistas'
import {
  ANOS_REFORMA,
  despesasAno,
  ESTILOS,
  euros,
  faltaPorAno,
  idadeDe,
  IDADE_REFORMA,
  LEVANTAMENTO_SEGURO,
  patrimonioR,
  pensaoAno,
  taxaLevantamento,
  type EstadoReforma,
} from '../../game/reforma/economia'
import { GrowthChart } from '../GrowthChart'
import { MapaMini } from './MapaMini'
import type { PropsMenu } from './modo'
import { Cursor, PixelImg, u } from './ui'

const OPCOES = ['CONTAS', 'FICHA', 'CONQUISTAS', 'MAPA', 'GRÁFICO', 'FECHAR'] as const
type Aba = (typeof OPCOES)[number]

const pct = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString('pt-PT')}%`

/** Menu START da Reforma: as contas do ano, a ficha, as conquistas, o mapa e o gráfico. */
export function MenuReforma({ estado: s, ctx, onFechar, ref }: PropsMenu<EstadoReforma>) {
  const [indice, setIndice] = useState(0)
  const [aba, setAba] = useState<Aba | null>(null)

  const escolher = (i: number) => {
    setIndice(i)
    if (OPCOES[i] === 'FECHAR') onFechar()
    else setAba(OPCOES[i])
  }

  useImperativeHandle(ref, () => ({
    tecla(t) {
      if (aba) {
        if (t === 'A' || t === 'B' || t === 'START') setAba(null)
        return
      }
      const n = OPCOES.length
      if (t === 'UP' || t === 'DOWN') setIndice((indice + (t === 'UP' ? -1 : 1) + n) % n)
      else if (t === 'A') escolher(indice)
      else if (t === 'B' || t === 'START') onFechar()
    },
  }))

  if (aba) {
    return (
      <div className="janela" data-testid="menu-reforma" style={{ position: 'absolute', inset: u(3), padding: u(7), display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: u(4) }}>
          <span style={{ fontSize: u(11), fontWeight: 700, color: '#3a4262' }}>{aba}</span>
          <button onClick={() => setAba(null)} style={{ fontSize: u(7), color: '#8890a8' }}>
            B: voltar
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, fontSize: u(6.5), lineHeight: u(9), overflow: 'auto' }}>{conteudo(aba, s, aba === 'MAPA' ? ctx.mapa() : null)}</div>
      </div>
    )
  }
  return (
    <div className="janela" style={{ position: 'absolute', top: u(3), right: u(3), width: u(132), padding: `${u(5)} ${u(6)}` }}>
      <div style={{ fontSize: u(7), color: '#7a8298', marginBottom: u(3) }}>
        {idadeDe(s)} ANOS · ANO {Math.min(s.ano, ANOS_REFORMA)}/{ANOS_REFORMA}
      </div>
      {OPCOES.map((o, i) => (
        <div key={o} onClick={() => escolher(i)} style={{ display: 'flex', alignItems: 'center', fontSize: u(9), lineHeight: u(15), cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Cursor visivel={i === indice} />
          {o}
        </div>
      ))}
    </div>
  )
}

function Linha({ nome, valor, cor }: { nome: string; valor: string; cor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{nome}</span>
      <strong style={{ color: cor ?? '#3a4262' }}>{valor}</strong>
    </div>
  )
}

function conteudo(aba: Aba, s: EstadoReforma, info: InfoMapa | null) {
  switch (aba) {
    case 'CONTAS': {
      const t = taxaLevantamento(s)
      return (
        <>
          <Linha nome="Conta" valor={euros(s.conta)} />
          <Linha nome="Depósito (seguro)" valor={euros(s.deposito)} cor="#2a8a5a" />
          <Linha nome="Investido (oscila)" valor={euros(s.investido)} cor="#4a7ad0" />
          <Linha nome="PPR" valor={euros(s.ppr)} />
          {s.casaPropria && <Linha nome="Casa" valor={euros(s.valorCasa)} />}
          <Linha nome="PATRIMÓNIO" valor={euros(patrimonioR(s))} cor="#c08a10" />
          <div style={{ borderTop: `${u(1)} solid #d8dce6`, margin: `${u(2)} 0` }} />
          <Linha nome="Pensão por ano" valor={euros(pensaoAno(s))} cor="#2a8a5a" />
          <Linha nome="Despesas por ano" valor={euros(despesasAno(s))} cor="#d04848" />
          <Linha nome={`Das poupanças (${pct(t)})`} valor={euros(faltaPorAno(s))} cor={t > LEVANTAMENTO_SEGURO ? '#d04848' : '#2a8a5a'} />
          <p style={{ fontSize: u(5.5), color: '#7a8298', margin: `${u(2)} 0 0` }}>
            Estilo {ESTILOS[s.estilo].nome.toLowerCase()}. Até {pct(LEVANTAMENTO_SEGURO)} por ano, as poupanças costumam durar décadas.
          </p>
        </>
      )
    }
    case 'FICHA':
      return (
        <>
          <p style={{ margin: 0 }}>
            {s.name}, {idadeDe(s)} anos. Reformado(a) desde os {IDADE_REFORMA}.
          </p>
          <Linha nome="Saúde" valor={`${s.stats.saude}/100`} cor={s.stats.saude < 30 ? '#d04848' : '#2a8a5a'} />
          <Linha nome="Relações" valor={`${s.stats.relacoes}/100`} cor={s.stats.relacoes < 30 ? '#d04848' : '#2a8a5a'} />
          <Linha nome="Estilo de vida" valor={ESTILOS[s.estilo].nome} />
          <Linha nome="Preços desde os 65" valor={`+${pct(s.indice - 1)}`} />
          <p style={{ fontSize: u(6), color: '#7a8298', margin: `${u(3)} 0 0` }}>Ginástica, amigos, pesca e a família mantêm a Saúde e as Relações.</p>
        </>
      )
    case 'CONQUISTAS': {
      const obj = objetivoReforma(s.crachas)
      return (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: u(3), justifyContent: 'center', marginBottom: u(4) }}>
            {CONQUISTAS_REFORMA.map((c) => (
              <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala={u(1.6)} style={{ opacity: s.crachas.includes(c.id) ? 1 : 0.5 }} />
            ))}
          </div>
          {obj ? (
            <p style={{ margin: 0 }}>
              <b>Próxima: {obj.nome}.</b> {obj.objetivo}
            </p>
          ) : (
            <p style={{ margin: 0 }}>Ganhaste todas as conquistas!</p>
          )}
        </>
      )
    }
    case 'MAPA':
      return info ? <MapaMini info={info} altura={100} /> : null
    case 'GRÁFICO':
      return <GrowthChart history={s.history} unidade="Idade" />
    default:
      return null
  }
}
