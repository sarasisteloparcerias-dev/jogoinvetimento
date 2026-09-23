import { useState } from 'react'
import type { AvatarConfig, NPCDef } from '../game/types'
import { CharacterSVG } from './CharacterSVG'

interface DialogueBoxProps {
  npc: NPCDef
  playerAvatar: AvatarConfig
  onFechar: () => void
}

export function DialogueBox({ npc, playerAvatar, onFechar }: DialogueBoxProps) {
  const ehHistoria = npc.estilo === 'historia'
  const [topicoId, setTopicoId] = useState<string | null>(ehHistoria ? npc.topicos[0].id : null)
  const [linha, setLinha] = useState(0)

  const topico = npc.topicos.find((t) => t.id === topicoId) ?? null
  const ultimaLinha = topico ? linha === topico.linhas.length - 1 : false

  function avancar() {
    if (!topico) return
    if (!ultimaLinha) {
      setLinha(linha + 1)
      return
    }
    if (ehHistoria) {
      onFechar()
    } else {
      setTopicoId(null)
      setLinha(0)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(180deg, var(--reino-bg-from) 0%, var(--reino-bg-to) 62%, var(--reino-bg-to) 100%)' }}
    >
      <div className="relative flex-1 overflow-hidden">
        {/* linha do chão */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: '46%', background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)' }}
        />

        {/* plataforma + NPC */}
        <div className="absolute right-[12%] top-[10%] flex flex-col items-center encontro-entrar-npc">
          <div className="w-28 h-6 rounded-full bg-black/15 blur-[1px]" />
          <div className="-mt-20">
            <CharacterSVG avatar={npc.avatar} height={140} />
          </div>
        </div>

        {/* plataforma + jogador */}
        <div className="absolute left-[10%] bottom-[6%] flex flex-col items-center encontro-entrar-jogador">
          <CharacterSVG avatar={playerAvatar} height={110} />
          <div className="w-24 h-5 -mt-2 rounded-full bg-black/15 blur-[1px]" />
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-3 pb-3 sm:pb-5">
        <div className="relative bg-white rounded-2xl shadow-2xl border-4 border-emerald-300">
          <div className="absolute -top-4 left-4 bg-emerald-500 text-white text-sm font-heading font-bold px-3 py-1 rounded-full shadow z-10">
            {npc.nome}
          </div>

          <div className="p-4 pt-6 min-h-[100px] flex items-center">
            <p className="text-slate-700 leading-relaxed">{topico ? topico.linhas[linha] : npc.saudacao}</p>
          </div>

          {topico ? (
            <div className="flex justify-end px-4 pb-3">
              <button onClick={avancar} className="flex items-center gap-1 text-emerald-600 font-heading font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors">
                {!ultimaLinha ? 'Continuar' : ehHistoria ? 'Até à próxima! 👋' : 'Perguntar outra coisa'}
                <span className="encontro-seta">▼</span>
              </button>
            </div>
          ) : (
            <div className="p-3 pt-0 grid gap-2">
              {npc.topicos.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTopicoId(t.id)
                    setLinha(0)
                  }}
                  className="rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-left px-4 py-2.5 font-semibold text-slate-700 transition-colors"
                >
                  {t.titulo}
                </button>
              ))}
              <button
                onClick={onFechar}
                className="rounded-2xl border-2 border-slate-100 hover:bg-slate-50 text-center px-4 py-2.5 font-semibold text-slate-400 transition-colors"
              >
                Adeus 👋
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
