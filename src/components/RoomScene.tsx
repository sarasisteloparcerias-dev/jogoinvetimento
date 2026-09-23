import { useEffect, useState } from 'react'
import { ACOES, podeExecutar } from '../game/engine'
import { MENTOR } from '../game/mentor'
import { MARTA, TIAGO } from '../game/npcs'
import type { ActionId, NPCDef, PlayerState } from '../game/types'
import { CharacterSVG } from './CharacterSVG'
import { DialogueBox } from './DialogueBox'
import { Arvore, CORES_DECORATIVAS, CORES_EDIFICIOS, Edificio } from './WorldArt'

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

const WORLD_COLS = 15
const WORLD_ROWS = 15
const VIEW_COLS = 7
const VIEW_ROWS = 7

const ZONES: ZoneDef[] = [
  { id: 'mealheiro', emoji: '🐷', label: 'Mealheiro', gx: 3, gy: 3, action: 'poupar' },
  { id: 'loja', emoji: '🍭', label: 'Loja', gx: 11, gy: 3, action: 'gastar' },
  {
    id: 'banco',
    emoji: '🏦',
    label: 'Banco',
    gx: 11,
    gy: 11,
    subs: [
      { action: 'investir_baixo', label: '🌱 Baixo risco' },
      { action: 'investir_alto', label: '🎢 Alto risco' },
    ],
  },
  { id: 'escola', emoji: '📚', label: 'Escola', gx: 3, gy: 11, action: 'estudar' },
  { id: 'parque', emoji: '⚽', label: 'Parque', gx: 11, gy: 7, action: 'exercicio' },
  { id: 'amigos', emoji: '🎈', label: 'Amigos', gx: 3, gy: 7, action: 'socializar' },
]

const NPCS: NPCDef[] = [MENTOR, MARTA, TIAGO]

const ARVORES = [
  { gx: 1, gy: 1 },
  { gx: 13, gy: 1 },
  { gx: 1, gy: 13 },
  { gx: 13, gy: 13 },
  { gx: 5, gy: 1 },
  { gx: 9, gy: 1 },
  { gx: 1, gy: 5 },
  { gx: 1, gy: 9 },
  { gx: 13, gy: 5 },
  { gx: 13, gy: 9 },
  { gx: 5, gy: 13 },
  { gx: 9, gy: 13 },
  { gx: 2, gy: 9 },
  { gx: 9, gy: 2 },
  { gx: 12, gy: 5 },
  { gx: 4, gy: 12 },
]

const LAGO = [
  { gx: 13, gy: 11 },
  { gx: 13, gy: 12 },
  { gx: 12, gy: 12 },
]

const BANCO_JARDIM = { gx: 12, gy: 6 }

/** Casas só decorativas — dão vida ao mapa, mas não têm nenhuma ação associada. */
const CASAS_DECORATIVAS = [
  { gx: 5, gy: 5 },
  { gx: 9, gy: 5 },
  { gx: 5, gy: 9 },
  { gx: 2, gy: 4 },
  { gx: 12, gy: 9 },
]

const FLORES = [
  { gx: 4, gy: 4 },
  { gx: 10, gy: 4 },
  { gx: 4, gy: 10 },
  { gx: 10, gy: 10 },
  { gx: 6, gy: 5 },
  { gx: 8, gy: 9 },
  { gx: 6, gy: 12 },
  { gx: 11, gy: 9 },
]

const INICIO = { x: 7, y: 7 }

function distancia(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

type Direcao = 'cima' | 'baixo' | 'esquerda' | 'direita'

function pctX(gx: number, cols: number) {
  return ((gx + 0.5) / cols) * 100
}
function pctY(gy: number, rows: number) {
  return ((gy + 0.5) / rows) * 100
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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
  const [passo, setPasso] = useState(false)
  const [busy, setBusy] = useState(false)
  const [popover, setPopover] = useState<string | null>(null)
  const [npcAtivo, setNpcAtivo] = useState<NPCDef | null>(null)
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
    if (busy || npcAtivo) return
    if (zone.subs) {
      setPopover((p) => (p === zone.id ? null : zone.id))
      return
    }
    if (zone.action) agir(zone.action)
  }

  function mover(dx: number, dy: number, direcao: Direcao) {
    if (busy || npcAtivo) return
    setFacing(direcao)
    setPopover(null)
    const alvoX = pos.x + dx
    const alvoY = pos.y + dy

    const npcNoAlvo = NPCS.find((n) => n.gx === alvoX && n.gy === alvoY)
    if (npcNoAlvo) {
      setNpcAtivo(npcNoAlvo)
      return
    }
    const zonaNoAlvo = ZONES.find((z) => z.gx === alvoX && z.gy === alvoY)
    if (zonaNoAlvo) {
      interagir(zonaNoAlvo)
      return
    }
    if (ARVORES.some((a) => a.gx === alvoX && a.gy === alvoY)) return
    if (LAGO.some((l) => l.gx === alvoX && l.gy === alvoY)) return
    if (CASAS_DECORATIVAS.some((c) => c.gx === alvoX && c.gy === alvoY)) return
    if (alvoX < 0 || alvoX >= WORLD_COLS || alvoY < 0 || alvoY >= WORLD_ROWS) return

    setPos({ x: alvoX, y: alvoY })
    setPasso(true)
    setTimeout(() => setPasso(false), 160)
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
  }, [pos, busy, npcAtivo])

  const camX = clamp(pos.x - Math.floor(VIEW_COLS / 2), 0, WORLD_COLS - VIEW_COLS)
  const camY = clamp(pos.y - Math.floor(VIEW_ROWS / 2), 0, WORLD_ROWS - VIEW_ROWS)
  const mundoLargura = (WORLD_COLS / VIEW_COLS) * 100
  const mundoAltura = (WORLD_ROWS / VIEW_ROWS) * 100
  // transform: translate() percentages are relative to the element's OWN size,
  // and the world div is (WORLD_COLS/VIEW_COLS)x its container's width — so the
  // shift (in tiles) must be expressed as a fraction of WORLD_COLS, not VIEW_COLS.
  const deslocX = -(camX / WORLD_COLS) * 100
  const deslocY = -(camY / WORLD_ROWS) * 100

  return (
    <div>
      <p className="text-sm text-slate-500 mb-2 text-center">
        🎮 Anda com as setas ou o D-pad e explora O Reino! Fala com os personagens que encontrares.
      </p>
      <div
        className="relative w-full rounded-3xl overflow-hidden border-4 border-white shadow-inner"
        style={{ aspectRatio: '1 / 1' }}
      >
        <div
          className="absolute transition-transform duration-150 ease-linear"
          style={{
            width: `${mundoLargura}%`,
            height: `${mundoAltura}%`,
            transform: `translate(${deslocX}%, ${deslocY}%)`,
            backgroundColor: '#8fd97f',
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1.2px), radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1.2px)',
            backgroundSize: '10px 10px, 14px 14px',
            backgroundPosition: '0 0, 5px 7px',
          }}
        >
          {/* caminhos de terra ligando os NPCs e a praça central */}
          <div
            className="absolute"
            style={{
              left: `${pctX(7, WORLD_COLS) - 100 / WORLD_COLS / 2}%`,
              top: 0,
              width: `${100 / WORLD_COLS}%`,
              height: '100%',
              backgroundColor: '#e3c58f',
              backgroundImage: 'radial-gradient(circle, rgba(120,80,40,0.22) 1.5px, transparent 1.8px)',
              backgroundSize: '9px 9px',
            }}
          />
          <div
            className="absolute"
            style={{
              top: `${pctY(7, WORLD_ROWS) - 100 / WORLD_ROWS / 2}%`,
              left: 0,
              height: `${100 / WORLD_ROWS}%`,
              width: '100%',
              backgroundColor: '#e3c58f',
              backgroundImage: 'radial-gradient(circle, rgba(120,80,40,0.22) 1.5px, transparent 1.8px)',
              backgroundSize: '9px 9px',
            }}
          />

          {/* flores decorativas */}
          {FLORES.map((f, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-base pointer-events-none"
              style={{ left: `${pctX(f.gx, WORLD_COLS)}%`, top: `${pctY(f.gy, WORLD_ROWS)}%` }}
            >
              🌼
            </span>
          ))}

          {/* lago com margem e leve brilho animado */}
          {LAGO.map((l, i) => (
            <div key={i}>
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl"
                style={{
                  left: `${pctX(l.gx, WORLD_COLS)}%`,
                  top: `${pctY(l.gy, WORLD_ROWS)}%`,
                  width: `${(100 / WORLD_COLS) * 1.25}%`,
                  height: `${(100 / WORLD_ROWS) * 1.25}%`,
                  backgroundColor: '#e8dcb5',
                }}
              />
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg lago-agua"
                style={{
                  left: `${pctX(l.gx, WORLD_COLS)}%`,
                  top: `${pctY(l.gy, WORLD_ROWS)}%`,
                  width: `${100 / WORLD_COLS}%`,
                  height: `${100 / WORLD_ROWS}%`,
                }}
              />
            </div>
          ))}

          {/* banco de jardim (decorativo) */}
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl pointer-events-none"
            style={{ left: `${pctX(BANCO_JARDIM.gx, WORLD_COLS)}%`, top: `${pctY(BANCO_JARDIM.gy, WORLD_ROWS)}%` }}
          >
            🪑
          </span>

          {ARVORES.map((a, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${pctX(a.gx, WORLD_COLS)}%`, top: `${pctY(a.gy, WORLD_ROWS)}%`, width: '9%', height: '9%' }}
            >
              <Arvore />
            </div>
          ))}

          {CASAS_DECORATIVAS.map((casa, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${pctX(casa.gx, WORLD_COLS)}%`,
                top: `${pctY(casa.gy, WORLD_ROWS)}%`,
                width: `${(100 / WORLD_COLS) * 1.7}%`,
                aspectRatio: '100 / 78',
              }}
            >
              <Edificio {...CORES_DECORATIVAS[i % CORES_DECORATIVAS.length]} />
            </div>
          ))}

          {NPCS.map((npc) => {
            const perto = distancia(pos.x, pos.y, npc.gx, npc.gy) <= 1
            return (
              <button
                key={npc.id}
                onClick={() => setNpcAtivo(npc)}
                className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 z-10"
                style={{ left: `${pctX(npc.gx, WORLD_COLS)}%`, top: `${pctY(npc.gy, WORLD_ROWS)}%` }}
              >
                <CharacterSVG avatar={npc.avatar} height={40} />
                {perto && (
                  <span className="text-[11px] font-bold bg-emerald-100 rounded-full px-2 py-0.5 text-emerald-700 shadow whitespace-nowrap animate-[float-up_0.4s_ease-out]">
                    💬 Falar com {npc.nome}
                  </span>
                )}
              </button>
            )
          })}

          {ZONES.map((zone) => {
            const disabled = zone.action ? !podeExecutar(state, ACOES.find((a) => a.id === zone.action)!) : false
            const zx = pctX(zone.gx, WORLD_COLS)
            const zy = pctY(zone.gy, WORLD_ROWS)
            const perto = distancia(pos.x, pos.y, zone.gx, zone.gy) <= 1
            const cores = CORES_EDIFICIOS[zone.id]
            const larguraTile = 100 / WORLD_COLS
            return (
              <div key={zone.id}>
                <button
                  onClick={() => interagir(zone)}
                  disabled={busy}
                  className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-transform ${
                    disabled ? 'opacity-60' : 'hover:scale-105'
                  }`}
                  style={{
                    left: `${zx}%`,
                    top: `${zy}%`,
                    width: `${larguraTile * (cores ? 1.7 : 2.1)}%`,
                    aspectRatio: cores ? '100 / 78' : '1 / 1',
                  }}
                >
                  {cores ? (
                    <Edificio {...cores} />
                  ) : (
                    <div className="w-full h-full rounded-2xl" style={{ backgroundColor: 'rgba(190, 242, 160, 0.55)' }} />
                  )}
                  {perto && (
                    <span className="text-[11px] font-bold bg-white/90 rounded-full px-2 py-0.5 text-slate-700 shadow whitespace-nowrap -mt-1 animate-[float-up_0.4s_ease-out]">
                      {zone.emoji} {zone.label}
                      {zone.action ? ` · -${custoDe(zone.action)}` : ''}
                    </span>
                  )}
                </button>

                {zone.subs && popover === zone.id && (
                  <div
                    className="absolute z-20 flex flex-col gap-1 bg-white rounded-2xl shadow-xl border-2 border-violet-200 p-2 -translate-x-1/2"
                    style={{ left: `${zx}%`, top: `${zy - 100 / WORLD_ROWS / 2 - 6}%`, transform: 'translate(-50%, -100%)' }}
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
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-linear flex flex-col items-center z-10"
            style={{ left: `${pctX(pos.x, WORLD_COLS)}%`, top: `${pctY(pos.y, WORLD_ROWS)}%` }}
          >
            {bubble && (
              <span
                key={bubble.key}
                className={`absolute -top-9 whitespace-nowrap text-xs font-extrabold px-2 py-1 rounded-full shadow animate-[float-up_1.3s_ease-out] ${
                  bubble.tom === 'ma' ? 'bg-red-100 text-red-600' : 'bg-white text-slate-700'
                }`}
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              >
                {bubble.text}
              </span>
            )}
            <div style={{ transform: facing === 'esquerda' ? 'scaleX(-1)' : 'scaleX(1)' }}>
              <div className={passo ? 'character-step' : 'character-idle'}>
                <CharacterSVG avatar={state.avatar} height={80} />
              </div>
            </div>
            <span className="w-8 h-2 rounded-full bg-black/15 -mt-2" />
          </div>
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

      {npcAtivo && <DialogueBox npc={npcAtivo} onFechar={() => setNpcAtivo(null)} />}
    </div>
  )
}
