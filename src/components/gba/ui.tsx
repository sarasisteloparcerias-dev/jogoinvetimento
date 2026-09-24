import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { framesPersonagem, type Dir } from '../../game/pixel/sprites'
import type { AvatarConfig } from '../../game/types'

/** Converte píxeis "nativos" do GBA (240x160) em píxeis de ecrã, usando a escala --s do ecrã. */
export function u(n: number) {
  return `calc(var(--s) * ${n}px)`
}

export function PixelImg({ src, escala, style }: { src: HTMLCanvasElement; escala: string; style?: CSSProperties }) {
  const url = useMemo(() => src.toDataURL(), [src])
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      style={{ display: 'inline-block', width: `calc(${escala} * ${src.width})`, height: `calc(${escala} * ${src.height})`, imageRendering: 'pixelated', ...style }}
    />
  )
}

export function SpriteView({ avatar, dir = 'down', escala, girar = false }: { avatar: AvatarConfig; dir?: Dir; escala: string; girar?: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!girar) return
    const t = setInterval(() => setI((v) => v + 1), 700)
    return () => clearInterval(t)
  }, [girar])
  const ordem: Dir[] = ['down', 'left', 'up', 'right']
  const d = girar ? ordem[i % 4] : dir
  const frames = framesPersonagem(avatar)
  return <PixelImg src={frames[d][0]} escala={escala} />
}

/** Triângulo "▶" do cursor dos menus de GBA, desenhado com bordas CSS para ficar nítido. */
export function Cursor({ visivel = true }: { visivel?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 0,
        height: 0,
        borderTop: `${u(3.5)} solid transparent`,
        borderBottom: `${u(3.5)} solid transparent`,
        borderLeft: `${u(5)} solid #e04848`,
        marginRight: u(4),
        visibility: visivel ? 'visible' : 'hidden',
        flexShrink: 0,
      }}
    />
  )
}

export function SetaBaixo({ style }: { style?: CSSProperties }) {
  return (
    <span
      className="seta-piscar"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        borderLeft: `${u(4)} solid transparent`,
        borderRight: `${u(4)} solid transparent`,
        borderTop: `${u(5)} solid #e04848`,
        ...style,
      }}
    />
  )
}
