import { CRACHAS, objetivoAtual } from '../../game/crachas'
import { iconeCracha } from '../../game/pixel/cenario'
import { fmt } from '../../game/world/scripts'
import type { PlayerState } from '../../game/types'
import { GrowthChart } from '../GrowthChart'
import { Cursor, PixelImg, SpriteView, u } from './ui'

export const OPCOES_MENU = ['MOCHILA', 'FICHA', 'CRACHÁS', 'OBJETIVO', 'GRÁFICO', 'FECHAR'] as const
export type Aba = (typeof OPCOES_MENU)[number]

export interface EstadoMenu {
  indice: number
  aba: Aba | null
}

interface Props {
  estado: PlayerState
  menu: EstadoMenu
  onEscolher: (i: number) => void
  onVoltar: () => void
}

export function StartMenu({ estado, menu, onEscolher, onVoltar }: Props) {
  if (menu.aba) {
    return (
      <div className="janela" style={{ position: 'absolute', inset: u(3), padding: u(8), display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: u(5) }}>
          <span style={{ fontSize: u(12), fontWeight: 700, color: '#3a4262' }}>{menu.aba}</span>
          <button onClick={onVoltar} style={{ fontSize: u(8), color: '#8890a8' }}>
            B: voltar
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, fontSize: u(9), lineHeight: u(12) }}>
          <Conteudo aba={menu.aba} estado={estado} />
        </div>
      </div>
    )
  }
  return (
    <div className="janela" style={{ position: 'absolute', top: u(3), right: u(3), width: u(82), padding: `${u(5)} ${u(6)}` }}>
      {OPCOES_MENU.map((o, i) => (
        <div key={o} onClick={() => onEscolher(i)} style={{ display: 'flex', alignItems: 'center', fontSize: u(10), lineHeight: u(15), cursor: 'pointer' }}>
          <Cursor visivel={i === menu.indice} />
          {o}
        </div>
      ))}
    </div>
  )
}

function Linha({ nome, valor, nota, cor }: { nome: string; valor: string; nota: string; cor: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: u(6), padding: `${u(2)} 0`, borderBottom: `${u(1)} solid #e4e9f2` }}>
      <div>
        <div style={{ color: cor, fontWeight: 700 }}>{nome}</div>
        <div style={{ fontSize: u(7.5), lineHeight: u(9), color: '#7a8298' }}>{nota}</div>
      </div>
      <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{valor}</div>
    </div>
  )
}

function Barra({ nome, valor, cor }: { nome: string; valor: number; cor: string }) {
  return (
    <div style={{ marginBottom: u(4) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{nome}</span>
        <span>{Math.round(valor)}/100</span>
      </div>
      <div style={{ height: u(5), background: '#e4e9f2', border: `${u(1)} solid #3a4262` }}>
        <div style={{ height: '100%', width: `${valor}%`, background: cor }} />
      </div>
    </div>
  )
}

function Conteudo({ aba, estado: s }: { aba: Aba; estado: PlayerState }) {
  switch (aba) {
    case 'MOCHILA': {
      const risco = s.investimento.risk === 'alto' ? 'alto risco' : 'baixo risco'
      return (
        <div>
          <Linha nome="CARTEIRA" valor={`${fmt(s.saldo)} moedas`} nota="Dinheiro para gastar." cor="#c08a10" />
          <Linha nome="MEALHEIRO" valor={`${fmt(s.poupanca)} moedas`} nota="Guardado. Cresce um bocadinho todas as semanas (juro)." cor="#d04880" />
          <Linha
            nome="INVESTIMENTO"
            valor={`${fmt(s.investimento.amount)} moedas`}
            nota={s.investimento.amount > 0 ? `Em ${risco}: pode subir ou descer.` : 'Ainda não investiste. Vai ao Banco!'}
            cor="#2a8a5a"
          />
          <Linha nome="TOTAL" valor={`${fmt(s.saldo + s.poupanca + s.investimento.amount)} moedas`} nota="Tudo o que tens, somado." cor="#3a4262" />
        </div>
      )
    }
    case 'FICHA':
      return (
        <div style={{ display: 'flex', gap: u(10) }}>
          <div style={{ textAlign: 'center' }}>
            <SpriteView avatar={s.avatar} escala={u(3)} />
            <div style={{ fontWeight: 700 }}>{s.name}</div>
            <div>Semana {Math.min(s.week, 20)}/20</div>
          </div>
          <div style={{ flex: 1 }}>
            <Barra nome="Relações" valor={s.stats.relacoes} cor="#f06090" />
            <Barra nome="Saúde" valor={s.stats.saude} cor="#48b870" />
            <Barra nome="Educação" valor={s.stats.educacao} cor="#4a8ad8" />
            <div style={{ fontSize: u(7.5), lineHeight: u(9), color: '#7a8298' }}>
              Se não cuidares delas, descem um pouco todas as semanas.
            </div>
          </div>
        </div>
      )
    case 'CRACHÁS':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: u(4), textAlign: 'center' }}>
          {CRACHAS.map((c) => {
            const tem = s.crachas.includes(c.id)
            return (
              <div key={c.id} style={{ opacity: tem ? 1 : 0.55 }}>
                <PixelImg src={iconeCracha(c.id, tem)} escala={u(2)} />
                <div style={{ fontSize: u(7.5), lineHeight: u(9) }}>{tem ? c.nome.replace('Crachá ', '') : '???'}</div>
              </div>
            )
          })}
        </div>
      )
    case 'OBJETIVO': {
      const obj = objetivoAtual(s)
      if (!obj) return <p>Ganhaste todos os crachás! És um verdadeiro mestre das moedas.</p>
      return (
        <div style={{ display: 'flex', gap: u(8), alignItems: 'flex-start' }}>
          <PixelImg src={iconeCracha(obj.id, true)} escala={u(3)} />
          <div>
            <div style={{ fontWeight: 700, color: '#3a4262' }}>{obj.nome}</div>
            <p style={{ margin: `${u(3)} 0` }}>{obj.objetivo}</p>
            <p style={{ fontSize: u(7.5), lineHeight: u(9), color: '#7a8298', margin: 0 }}>
              Crachás ganhos: {s.crachas.length} de {CRACHAS.length}
            </p>
          </div>
        </div>
      )
    }
    case 'GRÁFICO':
      return (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <GrowthChart history={s.history} />
        </div>
      )
    default:
      return null
  }
}
