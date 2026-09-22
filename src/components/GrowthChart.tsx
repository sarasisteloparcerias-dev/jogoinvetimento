import { useRef, useState } from 'react'
import type { HistoryPoint } from '../game/types'

interface GrowthChartProps {
  history: HistoryPoint[]
}

const WIDTH = 520
const HEIGHT = 220
const PAD_LEFT = 40
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28

const SERIES = [
  { key: 'saldo' as const, label: 'Saldo', color: 'var(--series-saldo)' },
  { key: 'poupanca' as const, label: 'Poupança', color: 'var(--series-poupanca)' },
  { key: 'investimento' as const, label: 'Investimento', color: 'var(--series-investimento)' },
]

export function GrowthChart({ history }: GrowthChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (history.length < 2) {
    return <p className="text-sm text-slate-500">O gráfico aparece assim que avançares algumas semanas.</p>
  }

  const maxValue = Math.max(
    10,
    ...history.map((h) => Math.max(h.saldo, h.poupanca, h.investimento)),
  )
  const niceMax = Math.ceil(maxValue / 10) * 10
  const minWeek = history[0].week
  const maxWeek = history[history.length - 1].week

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const xFor = (week: number) => PAD_LEFT + ((week - minWeek) / Math.max(1, maxWeek - minWeek)) * innerW
  const yFor = (value: number) => PAD_TOP + innerH - (value / niceMax) * innerH

  const pathFor = (key: 'saldo' | 'poupanca' | 'investimento') =>
    history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xFor(h.week).toFixed(1)} ${yFor(h[key]).toFixed(1)}`).join(' ')

  const ticksY = [0, niceMax * 0.5, niceMax]

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const x = (e.clientX - rect.left) * scaleX
    let closest = 0
    let closestDist = Infinity
    history.forEach((h, i) => {
      const dist = Math.abs(xFor(h.week) - x)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  const hovered = hoverIndex !== null ? history[hoverIndex] : null

  return (
    <div className="viz-root relative" style={{ background: 'var(--chart-surface)' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto touch-none select-none"
        role="img"
        aria-label="Gráfico da evolução do saldo, poupança e investimento ao longo das semanas"
      >
        {ticksY.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yFor(t) + 4} textAnchor="end" fontSize={11} fill="var(--chart-text-secondary)">
              {Math.round(t)}
            </text>
          </g>
        ))}

        {SERIES.map((s) => (
          <path
            key={s.key}
            d={pathFor(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {SERIES.map((s) => {
          const last = history[history.length - 1]
          return (
            <circle
              key={`end-${s.key}`}
              cx={xFor(last.week)}
              cy={yFor(last[s.key])}
              r={5}
              fill={s.color}
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          )
        })}

        {hovered && (
          <>
            <line
              x1={xFor(hovered.week)}
              x2={xFor(hovered.week)}
              y1={PAD_TOP}
              y2={PAD_TOP + innerH}
              stroke="var(--chart-text-secondary)"
              strokeWidth={1}
              strokeDasharray="0"
              opacity={0.5}
            />
            {SERIES.map((s) => (
              <circle
                key={`hover-${s.key}`}
                cx={xFor(hovered.week)}
                cy={yFor(hovered[s.key])}
                r={4}
                fill={s.color}
                stroke="var(--chart-surface)"
                strokeWidth={2}
              />
            ))}
          </>
        )}

        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={innerW}
          height={innerH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: `${(xFor(hovered.week) / WIDTH) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-bold text-slate-700 mb-1">Semana {hovered.week}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="flex items-center gap-1.5 text-slate-600">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: s.color }} />
              {s.label}: <strong style={{ color: 'var(--chart-text-primary)' }}>{Math.round(hovered[s.key])}</strong>
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
