import { useState } from 'react'
import { Avatar3D } from './LazyAvatar3D'
import { AvatarCreatorFrame } from './AvatarCreatorFrame'

interface CharacterCreationProps {
  onStart: (name: string, avatarUrl: string) => void
}

export function CharacterCreation({ onStart }: CharacterCreationProps) {
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  return (
    <div className="max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white">
      <h2 className="font-heading text-2xl font-bold text-slate-800 mb-1">Cria o teu herói do Reino!</h2>
      <p className="text-slate-500 mb-5">Escolhe um nome e cria o teu avatar para a tua aventura financeira.</p>

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

      <p className="text-sm font-bold text-slate-600 mb-2">Cria o teu avatar</p>
      {avatarUrl ? (
        <div className="flex flex-col items-center gap-2 mb-5 bg-slate-50 rounded-2xl py-4 border-2 border-slate-200">
          <Avatar3D url={avatarUrl} size={160} />
          <button onClick={() => setAvatarUrl(null)} className="text-xs font-semibold text-violet-500 underline">
            Refazer avatar
          </button>
        </div>
      ) : (
        <div className="mb-5">
          <AvatarCreatorFrame onAvatarReady={setAvatarUrl} />
        </div>
      )}

      <button
        disabled={name.trim().length === 0 || !avatarUrl}
        onClick={() => avatarUrl && onStart(name.trim(), avatarUrl)}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-heading font-bold py-3 transition-colors"
      >
        Começar a aventura!
      </button>
    </div>
  )
}
