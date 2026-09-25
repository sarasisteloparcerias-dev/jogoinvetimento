import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { criarMiniJogo } from '../../game/minijogos'
import { H, W, type ResultadoMiniJogo, type TeclaJogo, type Teclas, type TipoMiniJogo } from '../../game/minijogos/tipos'
import type { AvatarConfig } from '../../game/types'
import type { Tecla } from './dialogo'
import { u } from './ui'

export interface ControloMiniJogo {
  premir(t: Tecla): void
  soltar(t: Tecla): void
}

interface Props {
  tipo: TipoMiniJogo
  avatar: AvatarConfig
  onFim: (r: ResultadoMiniJogo) => void
  ref: Ref<ControloMiniJogo>
}

type Fase = 'titulo' | 'jogo' | 'fim'

/** Evita que um A carregado a correr (ex. o último remate) salte o título ou o resultado sem a criança os ver. */
const ESPERA_A_MS = 700

export function MiniJogoView({ tipo, avatar, onFim, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [jogo] = useState(() => criarMiniJogo(tipo, avatar))
  const [fase, setFaseState] = useState<Fase>('titulo')
  const faseRef = useRef<Fase>('titulo')
  const faseDesde = useRef(0)
  const teclas = useRef<Teclas>({ seguras: new Set(), premidas: new Set() })

  const setFase = (f: Fase) => {
    faseRef.current = f
    faseDesde.current = performance.now()
    setFaseState(f)
  }

  useEffect(() => {
    faseDesde.current = performance.now()
  }, [])

  useImperativeHandle(ref, () => ({
    premir(t) {
      if (t === 'START') return
      const pronto = performance.now() - faseDesde.current > ESPERA_A_MS
      if (faseRef.current === 'titulo') {
        if (t === 'A' && pronto) setFase('jogo')
        return
      }
      if (faseRef.current === 'fim') {
        if (t === 'A' && pronto) onFim(jogo.resultado())
        return
      }
      teclas.current.seguras.add(t as TeclaJogo)
      teclas.current.premidas.add(t as TeclaJogo)
    },
    soltar(t) {
      teclas.current.seguras.delete(t as TeclaJogo)
    },
  }))

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    let ultimo = performance.now()
    let raf = 0
    const ciclo = (t: number) => {
      const dt = Math.max(0, Math.min(50, t - ultimo))
      ultimo = t
      if (faseRef.current === 'jogo') {
        jogo.update(dt, teclas.current)
        teclas.current.premidas.clear()
        if (jogo.terminado) {
          faseRef.current = 'fim'
          faseDesde.current = performance.now()
          setFaseState('fim')
        }
      }
      jogo.render(ctx)
      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    return () => cancelAnimationFrame(raf)
  }, [jogo])

  return (
    <>
      <canvas ref={canvasRef} width={W} height={H} className="ecra-canvas" data-testid="minijogo" />
      {fase !== 'jogo' && (
        <div
          className="janela"
          onClick={() => {
            if (performance.now() - faseDesde.current <= ESPERA_A_MS) return
            if (fase === 'titulo') setFase('jogo')
            else onFim(jogo.resultado())
          }}
          style={{ position: 'absolute', left: u(24), right: u(24), top: u(30), padding: u(8), textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: u(10), lineHeight: u(14), color: '#e8743a', marginBottom: u(6) }}>{fase === 'titulo' ? jogo.titulo : 'FIM!'}</div>
          {fase === 'titulo' ? (
            jogo.instrucoes.map((l) => (
              <div key={l} style={{ fontSize: u(6.5), lineHeight: u(10) }}>
                {l}
              </div>
            ))
          ) : (
            <div style={{ fontSize: u(8), lineHeight: u(12) }}>{jogo.resultado().texto}</div>
          )}
          <div className="seta-piscar" style={{ fontSize: u(7), marginTop: u(8), color: '#e04848' }}>
            A: {fase === 'titulo' ? 'começar' : 'continuar'}
          </div>
        </div>
      )}
    </>
  )
}
