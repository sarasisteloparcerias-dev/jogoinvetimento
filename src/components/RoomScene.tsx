import { useEffect, useState } from 'react'
import { ACOES, podeExecutar } from '../game/engine'
import { MENTOR } from '../game/mentor'
import type { ActionId, PlayerState } from '../game/types'
import { CharacterSVG } from './CharacterSVG'
import { DialogueBox } from './DialogueBox'

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
  gx: number
  gy: number
  action?: ActionId
  subs?: ZoneAction[]
}

const COLS = 7
const ROWS = 7

const ZONES: ZoneDef[] = [
  { id: 'mealheiro', emoji: '🐷', label: 'Mealheiro', gx: 1, gy: 1, action: 'poupar' },
  { id: 'loja', emoji: '🍭', label: 'Loja', gx: 5, gy: 1, action: 'gastar' },
  {
    id: 'banco',
    emoji: '🏦',
    label: 'Banco',
    gx: 5,
    gy: 5,
    subs: [
      { action: 'investir_baixo', label: '🌱 Baixo risco' },
      { action: 'investir_alto', label: '🎢 Alto risco' },
    ],
  },
  { id: 'escola', emoji: '📚', label: 'Escola', gx: 1, gy: 5, action: 'estudar' },
  { id: 'parque', emoji: '⚽', label: 'Parque', gx: 5, gy: 3, action: 'exercicio' },
  { id: 'amigos', emoji: '🎈', label: 'Amigos', gx: 1, gy: 3, action: 'socializar' },
]

const ARVORES = [
  { gx: 0, gy: 0 },
  { gx: 6, gy: 0 },
  { gx: 0, gy: 6 },
  { gx: 6, gy: 6 },
  { gx: 2, gy: 6 },
  { gx: 4, gy: 0 },
]

const INICIO = { x: 3, y: 3 }

type Direcao = 'cima' | 'baixo' | 'esquerda' | 'direita'

function pctX(gx: number) {
  return ((gx + 0.5) / COLS) * 100
}
function pctY(gy: number) {
  return ((gy + 0.5) / ROWS) * 100
}

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
  const [pos, setPos] = useState(INICIO)
  const [facing, setFacing] = useState<Direcao>('baixo')
  const [busy, setBusy] = useState(false)
  const [popover, setPopover] = useState<string | null>(null)
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [bubble, setBubble] = useState<{ key: number; text: string; tom: 'boa' | 'ma' } | null>(null)

  useEffect(() => {
    if (!feedback) return
    const texto = formatarDeltas(feedback.deltas)
    if (!texto) return
    setBubble({ key: feedback.key, text: texto, tom: 'boa' })
    const t = setTimeout(() => setBubble(null), 1300)
    return () => clearTimeout(t)
  }, [feedback])

  function agir(actionId: ActionId) {
    if (busy) return
    if (!podeExecutar(state, ACOES.find((a) => a.id === actionId)!)) {
      setPopover(null)
      setBubble({ key: Date.now(), text: 'Não chega! 😅', tom: 'ma' })
      setTimeout(() => setBubble(null), 1300)
      return
    }
    setBusy(true)
    setPopover(null)
    setTimeout(() => onAction(actionId), 200)
    setTimeout(() => setBusy(false), 700)
  }

  function interagir(zone: ZoneDef) {
    if (busy || dialogoAberto) return
    if (zone.subs) {
      setPopover((p) => (p === zone.id ? null : zone.id))
      return
    }
    if (zone.action) agir(zone.action)
  }

  function mover(dx: number, dy: number, direcao: Direcao) {
    if (busy || dialogoAberto) return
    setFacing(direcao)
    setPopover(null)
    const alvoX = pos.x + dx
    const alvoY = pos.y + dy

    if (alvoX === MENTOR.gx && alvoY === MENTOR.gy) {
      setDialogoAberto(true)
      return
    }
    const zonaNoAlvo = ZONES.find((z) => z.gx === alvoX && z.gy === alvoY)
    if (zonaNoAlvo) {
      interagir(zonaNoAlvo)
      return
    }
    if (ARVORES.some((a) => a.gx === alvoX && a.gy === alvoY)) return
    if (alvoX < 0 || alvoX >= COLS || alvoY < 0 || alvoY >= ROWS) return
    setPos({ x: alvoX, y: alvoY })
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') mover(0, -1, 'cima')
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') mover(0, 1, 'baixo')
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') mover(-1, 0, 'esquerda')
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') mover(1, 0, 'direita')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, busy, dialogoAberto])

  return (
    <div>
      <p className="text-sm text-slate-500 mb-2 text-center">
        🎮 Anda com as setas ou o D-pad. Fala com o Mestre Moedas para aprenderes a investir!
      </p>
      <div
        className="relative w-full rounded-3xl overflow-hidden border-4 border-white shadow-inner"
        style={{
          aspectRatio: '1 / 1',
          backgroundColor: '#8fd97f',
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1.2px), radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1.2px)',
          backgroundSize: '10px 10px, 14px 14px',
          backgroundPosition: '0 0, 5px 7px',
        }}
      >
        {/* caminho de terra em cruz */}
        <div
          className="absolute bg-amber-100/70"
          style={{ left: `${pctX(3) - 100 / COLS / 2}%`, top: 0, width: `${100 / COLS}%`, height: '100%' }}
        />
        <div
          className="absolute bg-amber-100/70"
          style={{ top: `${pctY(3) - 100 / ROWS / 2}%`, left: 0, height: `${100 / ROWS}%`, width: '100%' }}
        />

        {ARVORES.map((a, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none drop-shadow-sm"
            style={{ left: `${pctX(a.gx)}%`, top: `${pctY(a.gy)}%` }}
          >
            🌳
          </span>
        ))}

        <button
          onClick={() => setDialogoAberto(true)}
          className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-10"
          style={{ left: `${pctX(MENTOR.gx)}%`, top: `${pctY(MENTOR.gy)}%` }}
        >
          <CharacterSVG avatar={MENTOR.avatar} height={40} />
          <span className="text-[11px] font-bold bg-emerald-100 rounded-full px-2 py-0.5 text-emerald-700 shadow">
            {MENTOR.nome}
          </span>
        </button>

        {ZONES.map((zone) => {
          const disabled = zone.action ? !podeExecutar(state, ACOES.find((a) => a.id === zone.action)!) : false
          const zx = pctX(zone.gx)
          const zy = pctY(zone.gy)
          return (
            <div key={zone.id}>
              <button
                onClick={() => interagir(zone)}
                disabled={busy}
                className={`absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-transform ${
                  disabled ? 'opacity-50' : 'hover:scale-110'
                }`}
                style={{ left: `${zx}%`, top: `${zy}%` }}
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
                    zx > 60 ? '' : zx < 40 ? '' : '-translate-x-1/2'
                  }`}
                  style={
                    zx > 60
                      ? { right: `${100 - zx - 6}%`, top: `${zy - 24}%` }
                      : zx < 40
                        ? { left: `${zx - 6}%`, top: `${zy - 24}%` }
                        : { left: `${zx}%`, top: `${zy - 24}%` }
                  }
                >
                  {zone.subs.map((sub) => {
                    const subDisabled = !podeExecutar(state, ACOES.find((a) => a.id === sub.action)!)
                    return (
                      <button
                        key={sub.action}
                        disabled={subDisabled}
                        onClick={() => agir(sub.action)}
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
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-linear flex flex-col items-center"
          style={{ left: `${pctX(pos.x)}%`, top: `${pctY(pos.y)}%` }}
        >
          {bubble && (
            <span
              key={bubble.key}
              className={`absolute -top-9 whitespace-nowrap text-xs font-extrabold px-2 py-1 rounded-full shadow animate-[float-up_1.3s_ease-out] ${
                bubble.tom === 'ma' ? 'bg-red-100 text-red-600' : 'bg-white text-slate-700'
              }`}
              style={
                pctX(pos.x) > 65
                  ? { right: '-4px', left: 'auto' }
                  : pctX(pos.x) < 35
                    ? { left: '-4px' }
                    : { left: '50%', transform: 'translateX(-50%)' }
              }
            >
              {bubble.text}
            </span>
          )}
          <div className="character-idle" style={{ transform: facing === 'esquerda' ? 'scaleX(-1)' : 'scaleX(1)' }}>
            <CharacterSVG avatar={state.avatar} height={80} />
          </div>
          <span className="w-8 h-2 rounded-full bg-black/15 -mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-36 mx-auto mt-4 select-none">
        <div />
        <button
          onClick={() => mover(0, -1, 'cima')}
          className="rounded-xl bg-white border-2 border-slate-200 shadow active:scale-90 active:bg-violet-50 py-2 text-lg"
          aria-label="Andar para cima"
        >
          ▲
        </button>
        <div />
        <button
          onClick={() => mover(-1, 0, 'esquerda')}
          className="rounded-xl bg-white border-2 border-slate-200 shadow active:scale-90 active:bg-violet-50 py-2 text-lg"
          aria-label="Andar para a esquerda"
        >
          ◀
        </button>
        <div className="flex items-center justify-center text-slate-300 text-xs">●</div>
        <button
          onClick={() => mover(1, 0, 'direita')}
          className="rounded-xl bg-white border-2 border-slate-200 shadow active:scale-90 active:bg-violet-50 py-2 text-lg"
          aria-label="Andar para a direita"
        >
          ▶
        </button>
        <div />
        <button
          onClick={() => mover(0, 1, 'baixo')}
          className="rounded-xl bg-white border-2 border-slate-200 shadow active:scale-90 active:bg-violet-50 py-2 text-lg"
          aria-label="Andar para baixo"
        >
          ▼
        </button>
        <div />
      </div>

      {dialogoAberto && <DialogueBox npc={MENTOR} onFechar={() => setDialogoAberto(false)} />}
    </div>
  )
}
