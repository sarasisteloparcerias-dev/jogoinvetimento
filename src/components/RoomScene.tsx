import { useEffect, useState } from 'react'
import { ACOES, podeExecutar } from '../game/engine'
import type { ActionId, PlayerState } from '../game/types'
import { Avatar3D } from './LazyAvatar3D'

export interface ActionFeedback {
  key: number
  deltas: Partial<Record<'saldo' | 'poupanca' | 'investimento' | 'relacoes' | 'saude' | 'educacao', number>>
}

interface ZoneAction {
  action: ActionId
  label: string
}

interface ZoneDef {
  id: string
  emoji: string
  label: string
  x: number
  y: number
  action?: ActionId
  subs?: ZoneAction[]
}

const ZONES: ZoneDef[] = [
  { id: 'mealheiro', emoji: '🐷', label: 'Mealheiro', x: 18, y: 24, action: 'poupar' },
  { id: 'loja', emoji: '🍭', label: 'Loja', x: 82, y: 24, action: 'gastar' },
  {
    id: 'banco',
    emoji: '🏦',
    label: 'Banco',
    x: 86,
    y: 58,
    subs: [
      { action: 'investir_baixo', label: '🌱 Baixo risco' },
      { action: 'investir_alto', label: '🎢 Alto risco' },
    ],
  },
  { id: 'escola', emoji: '📚', label: 'Escola', x: 18, y: 84, action: 'estudar' },
  { id: 'parque', emoji: '⚽', label: 'Parque', x: 82, y: 84, action: 'exercicio' },
  { id: 'amigos', emoji: '🎈', label: 'Amigos', x: 14, y: 58, action: 'socializar' },
]

const CENTRO = { x: 50, y: 50 }

function custoDe(actionId: ActionId): number {
  return ACOES.find((a) => a.id === actionId)?.custo ?? 0
}

function formatarDeltas(deltas: ActionFeedback['deltas']): string {
  const emojiPorChave: Record<string, string> = {
    saldo: '🪙',
    poupanca: '🐷',
    investimento: '📈',
    relacoes: '❤️',
    saude: '🩺',
    educacao: '📚',
  }
  return Object.entries(deltas)
    .filter(([, v]) => v)
    .map(([k, v]) => `${v! > 0 ? '+' : ''}${Math.round(v!)} ${emojiPorChave[k]}`)
    .join('  ')
}

interface RoomSceneProps {
  state: PlayerState
  onAction: (id: ActionId) => void
  feedback: ActionFeedback | null
}

export function RoomScene({ state, onAction, feedback }: RoomSceneProps) {
  const [pos, setPos] = useState(CENTRO)
  const [busy, setBusy] = useState(false)
  const [popover, setPopover] = useState<string | null>(null)
  const [bubble, setBubble] = useState<{ key: number; text: string; tom: 'boa' | 'ma' } | null>(null)

  useEffect(() => {
    if (!feedback) return
    const texto = formatarDeltas(feedback.deltas)
    if (!texto) return
    setBubble({ key: feedback.key, text: texto, tom: 'boa' })
    const t = setTimeout(() => setBubble(null), 1300)
    return () => clearTimeout(t)
  }, [feedback])

  function agir(zone: ZoneDef, actionId: ActionId) {
    if (busy) return
    if (!podeExecutar(state, ACOES.find((a) => a.id === actionId)!)) {
      setPopover(null)
      setPos({ x: zone.x, y: zone.y })
      setBubble({ key: Date.now(), text: 'Não chega! 😅', tom: 'ma' })
      setTimeout(() => setBubble(null), 1300)
      setTimeout(() => setPos(CENTRO), 900)
      return
    }
    setBusy(true)
    setPopover(null)
    setPos({ x: zone.x, y: zone.y })
    setTimeout(() => onAction(actionId), 420)
    setTimeout(() => setPos(CENTRO), 1150)
    setTimeout(() => setBusy(false), 1500)
  }

  function handleZoneClick(zone: ZoneDef) {
    if (busy) return
    if (zone.subs) {
      setPopover((p) => (p === zone.id ? null : zone.id))
      return
    }
    if (zone.action) agir(zone, zone.action)
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-2 text-center">
        👉 Toca num local do Reino para agires esta semana.
      </p>
      <div
        className="relative w-full rounded-3xl overflow-hidden border-4 border-white shadow-inner"
        style={{
          aspectRatio: '1 / 1',
          background: 'linear-gradient(180deg, #bfe7ff 0%, #bfe7ff 38%, #b7e8b0 38%, #9adf8f 100%)',
        }}
      >
        {ZONES.map((zone) => {
          const disabled = zone.action ? !podeExecutar(state, ACOES.find((a) => a.id === zone.action)!) : false
          return (
            <div key={zone.id}>
              <button
                onClick={() => handleZoneClick(zone)}
                disabled={busy}
                className={`absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-transform ${
                  disabled ? 'opacity-50' : 'hover:scale-110'
                }`}
                style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              >
                <span className="text-3xl drop-shadow-sm">{zone.emoji}</span>
                <span className="text-[11px] font-bold bg-white/85 rounded-full px-2 py-0.5 text-slate-700 shadow">
                  {zone.label}
                  {zone.action ? ` · -${custoDe(zone.action)}` : ''}
                </span>
              </button>

              {zone.subs && popover === zone.id && (
                <div
                  className={`absolute z-10 flex flex-col gap-1 bg-white rounded-2xl shadow-xl border-2 border-violet-200 p-2 ${
                    zone.x > 60 ? '' : zone.x < 40 ? '' : '-translate-x-1/2'
                  }`}
                  style={
                    zone.x > 60
                      ? { right: `${100 - zone.x - 6}%`, top: `${zone.y - 24}%` }
                      : zone.x < 40
                        ? { left: `${zone.x - 6}%`, top: `${zone.y - 24}%` }
                        : { left: `${zone.x}%`, top: `${zone.y - 24}%` }
                  }
                >
                  {zone.subs.map((sub) => {
                    const subDisabled = !podeExecutar(state, ACOES.find((a) => a.id === sub.action)!)
                    return (
                      <button
                        key={sub.action}
                        disabled={subDisabled}
                        onClick={() => agir(zone, sub.action)}
                        className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold ${
                          subDisabled
                            ? 'bg-slate-100 text-slate-300'
                            : 'bg-violet-50 text-slate-700 hover:bg-violet-100'
                        }`}
                      >
                        {sub.label} · -{custoDe(sub.action)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out flex flex-col items-center"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          {bubble && (
            <span
              key={bubble.key}
              className={`absolute -top-9 whitespace-nowrap text-xs font-extrabold px-2 py-1 rounded-full shadow animate-[float-up_1.3s_ease-out] ${
                bubble.tom === 'ma' ? 'bg-red-100 text-red-600' : 'bg-white text-slate-700'
              }`}
              style={
                pos.x > 65
                  ? { right: '-4px', left: 'auto' }
                  : pos.x < 35
                    ? { left: '-4px' }
                    : { left: '50%', transform: 'translateX(-50%)' }
              }
            >
              {bubble.text}
            </span>
          )}
          <div className="character-idle">
            <Avatar3D url={state.avatarUrl} size={104} />
          </div>
          <span className="w-8 h-2 rounded-full bg-black/15 -mt-2" />
        </div>
      </div>
    </div>
  )
}
