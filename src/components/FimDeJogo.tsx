import { CRACHAS } from '../game/crachas'
import { iconeCracha } from '../game/pixel/cenario'
import type { PlayerState } from '../game/types'
import { fmt } from '../game/world/scripts'
import { PixelImg, SpriteView } from './gba/ui'
import { GrowthChart } from './GrowthChart'

interface FimDeJogoProps {
  state: PlayerState
  onReiniciar: () => void
}

export function FimDeJogo({ state, onReiniciar }: FimDeJogoProps) {
  const patrimonio = state.saldo + state.poupanca + state.investimento.amount
  const mediaStats = (state.stats.relacoes + state.stats.saude + state.stats.educacao) / 3

  let mensagem = 'Foi uma boa aventura! Continua a praticar boas escolhas com o teu dinheiro.'
  if (state.poupanca + state.investimento.amount > state.saldo && mediaStats >= 60) {
    mensagem = 'Excelente equilíbrio! Guardaste e investiste bem, sem nunca esquecer amigos, saúde e estudo.'
  } else if (patrimonio < 20) {
    mensagem = 'Gastaste quase tudo pelo caminho. Da próxima vez, tenta guardar uma parte todas as semanas!'
  } else if (mediaStats < 40) {
    mensagem = 'Cuidaste bem do dinheiro, mas esqueceste um pouco de ti e dos outros. O equilíbrio é a chave!'
  }

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 560, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={state.avatar} escala="5px" />
        <h2 style={{ fontSize: 26, margin: '8px 0 4px' }}>Fim da aventura de {state.name}!</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16, fontSize: 15 }}>
          <div className="caixa-valor">
            Tudo junto
            <strong style={{ color: '#c08a10' }}>{fmt(patrimonio)}</strong>
          </div>
          <div className="caixa-valor">
            Mealheiro
            <strong style={{ color: '#d04880' }}>{fmt(state.poupanca)}</strong>
          </div>
          <div className="caixa-valor">
            Investido
            <strong style={{ color: '#2a8a5a' }}>{fmt(state.investimento.amount)}</strong>
          </div>
        </div>

        <p style={{ marginBottom: 6 }}>
          Crachás: {state.crachas.length} de {CRACHAS.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {CRACHAS.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, state.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <GrowthChart history={state.history} />
        </div>

        <button onClick={onReiniciar} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Jogar outra vez
        </button>
      </div>
    </div>
  )
}
