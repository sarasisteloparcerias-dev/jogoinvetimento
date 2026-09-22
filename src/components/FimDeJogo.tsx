import { AVATARES } from '../game/data'
import type { PlayerState } from '../game/types'
import { GrowthChart } from './GrowthChart'

interface FimDeJogoProps {
  state: PlayerState
  onReiniciar: () => void
}

export function FimDeJogo({ state, onReiniciar }: FimDeJogoProps) {
  const avatar = AVATARES.find((a) => a.id === state.avatar)
  const patrimonio = Math.round(state.saldo + state.poupanca + state.investimento.amount)
  const mediaStats = Math.round((state.stats.relacoes + state.stats.saude + state.stats.educacao) / 3)

  let mensagem = 'Foi uma boa aventura! Continua a praticar boas escolhas financeiras.'
  if (state.poupanca + state.investimento.amount > state.saldo && mediaStats >= 60) {
    mensagem = 'Excelente equilíbrio! Guardaste e investiste bem, sem nunca esquecer amigos, saúde e estudo.'
  } else if (patrimonio < 20) {
    mensagem = 'Gastaste quase tudo pelo caminho. Da próxima vez, tenta guardar uma parte todas as semanas!'
  } else if (mediaStats < 40) {
    mensagem = 'Cuidaste bem do dinheiro, mas esqueceste um pouco de ti e dos outros. O equilíbrio é a chave!'
  }

  return (
    <div className="max-w-lg mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white text-center">
      <p className="text-5xl mb-2">{avatar?.emoji} 🏆</p>
      <h2 className="font-heading text-2xl font-bold text-slate-800 mb-1">Fim da aventura de {state.name}!</h2>
      <p className="text-slate-500 mb-4">{mensagem}</p>

      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-slate-400 font-semibold">Património</p>
          <p className="font-heading text-xl font-bold text-amber-600">{patrimonio}</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-3">
          <p className="text-slate-400 font-semibold">Relações</p>
          <p className="font-heading text-xl font-bold text-pink-600">{Math.round(state.stats.relacoes)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-slate-400 font-semibold">Saúde</p>
          <p className="font-heading text-xl font-bold text-emerald-600">{Math.round(state.stats.saude)}</p>
        </div>
      </div>

      <div className="mb-6">
        <GrowthChart history={state.history} />
      </div>

      <button
        onClick={onReiniciar}
        className="w-full rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-heading font-bold py-3 transition-colors"
      >
        Jogar novamente
      </button>
    </div>
  )
}
