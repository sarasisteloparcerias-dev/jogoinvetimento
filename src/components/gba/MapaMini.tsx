import { useEffect, useRef } from 'react'
import { CORES_EDIFICIO } from '../../game/pixel/cenario'
import type { InfoMapa } from '../../game/modo'
import { u } from './ui'

const CORES: Record<string, string> = {
  '.': '#8ccf6a',
  f: '#9ad476',
  T: '#2f7a3c',
  '#': '#d8c08a',
  w: '#4a9ae0',
  F: '#4aa84a',
  R: '#5a5f6e',
  Z: '#e8e8ee',
  p: '#c8ccd4',
  q: '#ddd4c2',
  '=': '#a87a4a',
}

const PX = 5


/** O mapa da zona, visto de cima: edifícios com nome, onde estás (vermelho) e o destino (amarelo). */
export function MapaMini({ info, altura = 104 }: { info: InfoMapa; altura?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const def = info.mapas[info.exterior]
  const w = def.grelha[0].length
  const h = def.grelha.length

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    def.grelha.forEach((linha, y) =>
      [...linha].forEach((ch, x) => {
        ctx.fillStyle = CORES[ch] ?? '#8ccf6a'
        ctx.fillRect(x * PX, y * PX, PX, PX)
      }),
    )
    const tempo = performance.now()
    for (const e of def.edificios ?? []) {
      const destino = !!e.interior && e.interior === info.destino
      ctx.fillStyle = '#283040'
      ctx.fillRect(e.x * PX - 1, e.y * PX - 1, e.w * PX + 2, e.h * PX + 2)
      ctx.fillStyle = destino ? '#f8e040' : CORES_EDIFICIO[e.cor].telhado
      ctx.fillRect(e.x * PX, e.y * PX, e.w * PX, e.h * PX)
      ctx.fillStyle = '#283040'
      ctx.fillRect((e.x + e.porta) * PX + 1, (e.y + e.h - 1) * PX + 1, PX - 2, PX - 1)
      const nome = e.interior === 'casa' ? 'CASA' : (e.letreiro ?? (e.interior ? info.mapas[e.interior]?.nome : ''))
      if (!nome) continue
      ctx.font = "5px 'Press Start 2P'"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const palavras = nome.split(' ')
      const linhas = palavras.length > 1 && ctx.measureText(nome).width > e.w * PX ? [palavras[0], palavras.slice(1).join(' ')] : [nome]
      linhas.forEach((l, i) => {
        const cx = (e.x + e.w / 2) * PX
        const cy = (e.y + e.h / 2) * PX + (i - (linhas.length - 1) / 2) * 7
        ctx.fillStyle = '#283040'
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(l, cx + dx, cy + dy)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(l, cx, cy)
      })
    }
    // onde estás
    ctx.fillStyle = '#283040'
    ctx.fillRect(info.x * PX - 2, info.y * PX - 2, PX + 4, PX + 4)
    ctx.fillStyle = Math.floor(tempo / 400) % 2 ? '#e04848' : '#ff7070'
    ctx.fillRect(info.x * PX - 1, info.y * PX - 1, PX + 2, PX + 2)
  }, [def, info])

  return (
    <div>
    <canvas
      ref={ref}
      width={w * PX}
      height={h * PX}
      data-testid="mapa"
      style={{ display: 'block', margin: '0 auto', height: u(altura), width: 'auto', maxWidth: '100%', imageRendering: 'pixelated', border: `${u(1)} solid #283040` }}
    />
    <div style={{ display: 'flex', justifyContent: 'center', gap: u(6), fontSize: u(5), marginTop: u(2), color: '#5a6280' }}>
      <span><span style={{ color: '#e04848' }}>■</span> ESTÁS AQUI</span>
      {info.destino && <span><span style={{ color: '#d0a010' }}>■</span> DESTINO</span>}
    </div>
    </div>
  )
}
