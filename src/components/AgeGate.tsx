import { useState } from 'react'

export type Modo = 'reino' | 'cidade' | 'mercado'

interface AgeGateProps {
  onEscolherModo: (modo: Modo) => void
}

function modoParaIdade(idade: number): Modo {
  if (idade <= 14) return 'reino'
  if (idade <= 17) return 'cidade'
  return 'mercado'
}

export function AgeGate({ onEscolherModo }: AgeGateProps) {
  const [idade, setIdade] = useState<number | ''>('')

  return (
    <div className="max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white text-center">
      <p className="text-5xl mb-3">🏰💰📈</p>
      <h1 className="font-heading text-2xl font-bold text-slate-800 mb-2">Simulador de Vida & Finanças</h1>
      <p className="text-slate-500 mb-6">
        Diz-nos a tua idade para adaptarmos o jogo — linguagem, desafios e estilo — a ti.
      </p>

      <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="idade">
        Qual é a tua idade?
      </label>
      <input
        id="idade"
        type="number"
        min={6}
        max={99}
        value={idade}
        onChange={(e) => setIdade(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 mb-6 text-center text-lg focus:border-violet-400 focus:outline-none"
        placeholder="ex: 11"
      />

      <button
        disabled={idade === ''}
        onClick={() => idade !== '' && onEscolherModo(modoParaIdade(idade))}
        className="w-full rounded-2xl bg-violet-500 hover:bg-violet-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-heading font-bold py-3 transition-colors"
      >
        Entrar no jogo
      </button>
    </div>
  )
}
