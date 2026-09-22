import { useState } from 'react'
import type { NPCDef } from '../game/types'
import { CharacterSVG } from './CharacterSVG'

interface DialogueBoxProps {
  npc: NPCDef
  onFechar: () => void
}

export function DialogueBox({ npc, onFechar }: DialogueBoxProps) {
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
    <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-3 z-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-emerald-300 overflow-hidden">
        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 border-b-2 border-emerald-100">
          <div className="bg-white rounded-full border-2 border-emerald-200">
            <CharacterSVG avatar={npc.avatar} height={48} />
          </div>
          <p className="font-heading font-bold text-emerald-700">{npc.nome}</p>
        </div>

        <div className="p-4 min-h-[110px] flex items-center">
          <p className="text-slate-700 leading-relaxed">{topico ? topico.linhas[linha] : npc.saudacao}</p>
        </div>

        {topico ? (
          <button
            onClick={avancar}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-heading font-bold py-3 transition-colors"
          >
            {!ultimaLinha ? 'Continuar ▶' : ehHistoria ? 'Até à próxima! 👋' : 'Perguntar outra coisa'}
          </button>
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
  )
}
