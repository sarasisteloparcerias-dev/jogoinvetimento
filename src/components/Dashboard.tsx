import { AVATARES } from '../game/data'
import { TOTAL_SEMANAS } from '../game/engine'
import type { PlayerState } from '../game/types'
import { GrowthChart } from './GrowthChart'
import type { ActionFeedback } from './RoomScene'
import { RoomScene } from './RoomScene'
import { StatBar } from './StatBar'
import type { ActionId } from '../game/types'

interface DashboardProps {
  state: PlayerState
  onAction: (id: ActionId) => void
  onAvancar: () => void
  feedback: ActionFeedback | null
}

export function Dashboard({ state, onAction, onAvancar, feedback }: DashboardProps) {
  const avatar = AVATARES.find((a) => a.id === state.avatar)
  const investLabel = state.investimento.risk === 'baixo' ? 'baixo risco 🌱' : state.investimento.risk === 'alto' ? 'alto risco 🎢' : 'médio risco'

  return (
    <div className="max-w-3xl mx-auto grid gap-4">
      <div className="bg-white/90 rounded-3xl shadow-xl p-4 border-4 border-white flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{avatar?.emoji}</span>
          <div className="text-left">
            <p className="font-heading font-bold text-slate-800">{state.name}</p>
            <p className="text-xs text-slate-400">
              Semana {state.week} de {TOTAL_SEMANAS}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-center">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Saldo</p>
            <p className="font-heading text-lg font-bold text-amber-600">{Math.round(state.saldo)} 🪙</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Poupança</p>
            <p className="font-heading text-lg font-bold text-orange-600">{Math.round(state.poupanca)} 🐷</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Investimento</p>
            <p className="font-heading text-lg font-bold text-emerald-600">
              {Math.round(state.investimento.amount)} {state.investimento.amount > 0 ? '📈' : ''}
            </p>
          </div>
        </div>
      </div>

      {state.investimento.amount > 0 && (
        <p className="text-xs text-slate-500 -mt-2">
          O teu investimento está em <strong>{investLabel}</strong>.
        </p>
      )}

      <div className="bg-white/90 rounded-3xl shadow-xl p-4 border-4 border-white grid gap-3">
        <StatBar label="Relações" emoji="❤️" value={state.stats.relacoes} colorClass="bg-pink-400" />
        <StatBar label="Saúde" emoji="🩺" value={state.stats.saude} colorClass="bg-emerald-400" />
        <StatBar label="Educação" emoji="📚" value={state.stats.educacao} colorClass="bg-sky-400" />
      </div>

      <div className="bg-white/90 rounded-3xl shadow-xl p-4 border-4 border-white">
        <RoomScene state={state} onAction={onAction} feedback={feedback} />
      </div>

      <div className="bg-white/90 rounded-3xl shadow-xl p-4 border-4 border-white">
        <GrowthChart history={state.history} />
      </div>

      {state.log.length > 0 && (
        <div className="bg-white/90 rounded-3xl shadow-xl p-4 border-4 border-white text-left">
          <h3 className="font-heading font-bold text-slate-700 mb-2">O que aconteceu</h3>
          <ul className="text-sm text-slate-600 grid gap-1 max-h-32 overflow-y-auto">
            {state.log.map((entry, i) => (
              <li key={i}>
                <span className="text-slate-400">S{entry.week}:</span> {entry.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onAvancar}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-bold py-4 text-lg transition-colors shadow-lg"
      >
        ⏩ Avançar Semana
      </button>
    </div>
  )
}
