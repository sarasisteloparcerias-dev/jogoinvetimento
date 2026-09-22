import { useState } from 'react'
import { AVATAR_PADRAO, CORES_CABELO, CORES_PELE, CORES_ROUPA } from '../game/data'
import type { AvatarConfig } from '../game/types'
import { CharacterSVG } from './CharacterSVG'

interface CharacterCreationProps {
  onStart: (name: string, avatar: AvatarConfig) => void
}

interface SeletorCorProps {
  label: string
  cores: string[]
  valor: string
  onChange: (cor: string) => void
}

function SeletorCor({ label, cores, valor, onChange }: SeletorCorProps) {
  return (
    <div className="mb-4">
      <p className="text-sm font-bold text-slate-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {cores.map((cor) => (
          <button
            key={cor}
            onClick={() => onChange(cor)}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${
              valor === cor ? 'border-violet-500 scale-110' : 'border-white'
            }`}
            style={{ background: cor, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
            aria-label={cor}
          />
        ))}
      </div>
    </div>
  )
}

export function CharacterCreation({ onStart }: CharacterCreationProps) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<AvatarConfig>(AVATAR_PADRAO)

  return (
    <div className="max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white">
      <h2 className="font-heading text-2xl font-bold text-slate-800 mb-1">Cria o teu herói do Reino!</h2>
      <p className="text-slate-500 mb-5">Escolhe um nome e personaliza o teu avatar.</p>

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

      <div className="flex justify-center mb-4 bg-slate-50 rounded-2xl py-4 border-2 border-slate-200">
        <CharacterSVG avatar={avatar} height={140} />
      </div>

      <SeletorCor label="Cor de pele" cores={CORES_PELE} valor={avatar.pele} onChange={(pele) => setAvatar({ ...avatar, pele })} />
      <SeletorCor
        label="Cor de cabelo"
        cores={CORES_CABELO}
        valor={avatar.cabelo}
        onChange={(cabelo) => setAvatar({ ...avatar, cabelo })}
      />
      <SeletorCor label="Cor de roupa" cores={CORES_ROUPA} valor={avatar.roupa} onChange={(roupa) => setAvatar({ ...avatar, roupa })} />

      <button
        disabled={name.trim().length === 0}
        onClick={() => onStart(name.trim(), avatar)}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-heading font-bold py-3 transition-colors mt-2"
      >
        Começar a aventura!
      </button>
    </div>
  )
}
