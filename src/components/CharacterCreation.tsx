import { useState } from 'react'
import { AVATARES } from '../game/data'
import type { AvatarId } from '../game/types'

interface CharacterCreationProps {
  onStart: (name: string, avatar: AvatarId) => void
}

export function CharacterCreation({ onStart }: CharacterCreationProps) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<AvatarId>('raposa')

  return (
    <div className="max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white">
      <h2 className="font-heading text-2xl font-bold text-slate-800 mb-1">Cria o teu herói do Reino!</h2>
      <p className="text-slate-500 mb-5">Escolhe um nome e um companheiro para a tua aventura financeira.</p>

      <label className="block text-sm font-bold text-slate-600 mb-1" htmlFor="nome">
        Como te chamas?
      </label>
      <input
        id="nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={18}
        placeholder="O teu nome"
        className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 mb-5 focus:border-violet-400 focus:outline-none"
      />

      <p className="text-sm font-bold text-slate-600 mb-2">Escolhe o teu companheiro</p>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {AVATARES.map((a) => (
          <button
            key={a.id}
            onClick={() => setAvatar(a.id)}
            className={`rounded-2xl border-2 py-3 text-3xl transition-transform ${
              avatar === a.id ? 'border-violet-400 bg-violet-50 scale-110' : 'border-slate-200 bg-white'
            }`}
            aria-label={a.label}
            title={a.label}
          >
            {a.emoji}
          </button>
        ))}
      </div>

      <button
        disabled={name.trim().length === 0}
        onClick={() => onStart(name.trim(), avatar)}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-heading font-bold py-3 transition-colors"
      >
        Começar a aventura!
      </button>
    </div>
  )
}
