import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Tecla } from './dialogo'

const MAPA_TECLAS: Record<string, Tecla> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  z: 'A',
  Z: 'A',
  ' ': 'A',
  Enter: 'A',
  x: 'B',
  X: 'B',
  Escape: 'B',
  Backspace: 'B',
  m: 'START',
  M: 'START',
  Tab: 'START',
}

const ALTURA_COMANDOS = 180

function calcularEscala() {
  const w = window.innerWidth - 24
  const h = window.innerHeight - ALTURA_COMANDOS - 36
  let s = Math.min(w / 240, h / 160)
  if (s >= 2) s = Math.floor(s)
  return Math.max(1, Math.min(s, 5))
}

interface ConsolaProps {
  children: ReactNode
  onPremir: (t: Tecla) => void
  onSoltar: (t: Tecla) => void
}

export function Consola({ children, onPremir, onSoltar }: ConsolaProps) {
  const [s, setS] = useState(calcularEscala)
  const premir = useRef(onPremir)
  const soltar = useRef(onSoltar)
  useLayoutEffect(() => {
    premir.current = onPremir
    soltar.current = onSoltar
  })

  useEffect(() => {
    const redimensionar = () => setS(calcularEscala())
    const baixo = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const t = MAPA_TECLAS[e.key]
      if (!t) return
      e.preventDefault()
      if (!e.repeat) premir.current(t)
    }
    const cima = (e: KeyboardEvent) => {
      const t = MAPA_TECLAS[e.key]
      if (t) soltar.current(t)
    }
    const perderFoco = () => (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Tecla[]).forEach((t) => soltar.current(t))
    window.addEventListener('resize', redimensionar)
    window.addEventListener('keydown', baixo)
    window.addEventListener('keyup', cima)
    window.addEventListener('blur', perderFoco)
    return () => {
      window.removeEventListener('resize', redimensionar)
      window.removeEventListener('keydown', baixo)
      window.removeEventListener('keyup', cima)
      window.removeEventListener('blur', perderFoco)
    }
  }, [])

  const botao = (t: Tecla, className: string, conteudo: ReactNode, rotulo: string, style?: CSSProperties) => (
    <button
      aria-label={rotulo}
      className={className}
      style={style}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        premir.current(t)
      }}
      onPointerUp={() => soltar.current(t)}
      onPointerCancel={() => soltar.current(t)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {conteudo}
    </button>
  )

  return (
    <div className="consola">
      <div className="moldura">
        <div className="ecra" style={{ width: 240 * s, height: 160 * s, ['--s' as string]: s }}>
          {children}
        </div>
      </div>

      <div className="comandos">
        <div className="dpad">
          {botao('UP', 'dpad-cima', '', 'Cima')}
          {botao('LEFT', 'dpad-esq', '', 'Esquerda')}
          <span className="dpad-centro" />
          {botao('RIGHT', 'dpad-dir', '', 'Direita')}
          {botao('DOWN', 'dpad-baixo', '', 'Baixo')}
        </div>
        <div className="botoes-meio">
          {botao('START', 'botao-start', 'START', 'Start')}
        </div>
        <div className="botoes-ab">
          {botao('B', 'botao-redondo botao-b', 'B', 'Botão B')}
          {botao('A', 'botao-redondo botao-a', 'A', 'Botão A')}
        </div>
      </div>
      <p className="ajuda">Setas: andar · Z / Espaço / Enter: A · X / Esc: B · M: START</p>
    </div>
  )
}
