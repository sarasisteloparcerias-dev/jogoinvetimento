import { useState } from 'react'
import type { GameEvent, GameEventChoice, PlayerState } from '../game/types'

interface EventModalProps {
  evento: GameEvent
  state: PlayerState
  onResolve: (choice: GameEventChoice) => void
}

const AREA_INFO: Record<GameEvent['area'], { emoji: string; label: string; color: string }> = {
  dinheiro: { emoji: '💰', label: 'Dinheiro', color: 'bg-amber-100 text-amber-700' },
  relacoes: { emoji: '❤️', label: 'Relações', color: 'bg-pink-100 text-pink-700' },
  saude: { emoji: '🩺', label: 'Saúde', color: 'bg-emerald-100 text-emerald-700' },
  educacao: { emoji: '📚', label: 'Educação', color: 'bg-sky-100 text-sky-700' },
}

export function EventModal({ evento, state, onResolve }: EventModalProps) {
  const [escolha, setEscolha] = useState<GameEventChoice | null>(null)
  const info = AREA_INFO[evento.area]

  if (escolha) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-white">
          <p className="text-4xl mb-2 text-center">✨</p>
          <p className="text-center text-slate-700 font-semibold mb-4">{escolha.resultText(state)}</p>
          <button
            onClick={() => onResolve(escolha)}
            className="w-full rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-heading font-bold py-3 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-white">
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${info.color}`}>
          {info.emoji} {info.label}
        </span>
        <h3 className="font-heading text-xl font-bold text-slate-800 mb-2">{evento.title}</h3>
        <p className="text-slate-600 mb-5">{evento.description(state)}</p>
        <div className="flex flex-col gap-2">
          {evento.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => setEscolha(choice)}
              className="rounded-2xl border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-left px-4 py-3 font-semibold text-slate-700 transition-colors"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
