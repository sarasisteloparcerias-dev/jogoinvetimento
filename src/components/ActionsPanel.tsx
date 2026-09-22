import { ACOES, podeExecutar } from '../game/engine'
import type { ActionId, PlayerState } from '../game/types'

interface ActionsPanelProps {
  state: PlayerState
  onAction: (id: ActionId) => void
}

export function ActionsPanel({ state, onAction }: ActionsPanelProps) {
  return (
    <div>
      <h3 className="font-heading font-bold text-slate-700 mb-2">O que vais fazer esta semana?</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACOES.map((acao) => {
          const disabled = !podeExecutar(state, acao)
          return (
            <button
              key={acao.id}
              disabled={disabled}
              onClick={() => onAction(acao.id)}
              title={acao.descricao}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${
                disabled
                  ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                  : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50 text-slate-700'
              }`}
            >
              <span className="text-2xl">{acao.emoji}</span>
              <span>{acao.label}</span>
              <span className="text-xs font-semibold text-slate-400">-{acao.custo} moedas</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
