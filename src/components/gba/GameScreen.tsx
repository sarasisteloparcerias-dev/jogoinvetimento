import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ResultadoMiniJogo, TipoMiniJogo } from '../../game/minijogos/tipos'
import type { Dir } from '../../game/pixel/sprites'
import { ECRA_H, ECRA_W, Motor } from '../../game/world/motor'
import { Consola } from './Consola'
import { CaixaDialogo, useDialogo, type Tecla } from './dialogo'
import { MiniJogoView, type ControloMiniJogo } from './MiniJogoView'
import type { ControloMenu, CtxJogo, EstadoBase, ModoJogo } from './modo'
import { PixelImg, u } from './ui'

const DIRS: Partial<Record<Tecla, Dir>> = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' }

interface Props<S extends EstadoBase> {
  modo: ModoJogo<S>
  estadoInicial: S
  onMudar: (s: S) => void
  onFim: (s: S) => void
}

export function GameScreen<S extends EstadoBase>({ modo, estadoInicial, onMudar, onFim }: Props<S>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motorRef = useRef<Motor | null>(null)
  const estadoRef = useRef(estadoInicial)
  const [estado, setEstado] = useState(estadoInicial)
  const dlg = useDialogo()
  const [menuAberto, setMenuAbertoState] = useState(false)
  const menuAbertoRef = useRef(false)
  const menuRef = useRef<ControloMenu | null>(null)
  const [cracha, setCracha] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ nome: string; k: number } | null>(null)
  const [mini, setMini] = useState<{ tipo: TipoMiniJogo; k: number; resolver: (r: ResultadoMiniJogo) => void } | null>(null)
  const miniRef = useRef<ControloMiniJogo | null>(null)
  const scriptAtivo = useRef(false)
  const iniciado = useRef(false)
  const callbacks = useRef({ onMudar, onFim })
  useLayoutEffect(() => {
    callbacks.current = { onMudar, onFim }
  })

  const setMenuAberto = useCallback((v: boolean) => {
    menuAbertoRef.current = v
    setMenuAbertoState(v)
  }, [])

  const definir = useCallback((s: S) => {
    estadoRef.current = s
    setEstado(s)
    callbacks.current.onMudar(s)
  }, [])

  const [ctx] = useState<CtxJogo<S>>(() => ({
    say: dlg.say,
    ask: dlg.ask,
    estado: () => estadoRef.current,
    definir,
    async cracha(id) {
      const s = estadoRef.current
      if (s.crachas.includes(id)) return
      const c = modo.conquistas.find((x) => x.id === id)!
      definir({ ...s, crachas: [...s.crachas, id] })
      setCracha(id)
      await dlg.say(`${s.name} ganhou: ${c.nome.toUpperCase()}!`)
      await dlg.say(c.licao, modo.mentor)
      setCracha(null)
    },
    jogar(tipo) {
      motorRef.current?.limparTeclas()
      return new Promise<ResultadoMiniJogo>((resolver) => setMini({ tipo, k: Date.now(), resolver }))
    },
    fade(alvo, ms) {
      motorRef.current?.limparTeclas()
      return motorRef.current!.fadeTo(alvo, ms)
    },
    levar(mapa, x, y, dir) {
      motorRef.current!.carregar(mapa, x, y, dir)
    },
    terminar() {
      callbacks.current.onFim(estadoRef.current)
    },
  }))

  const correr = useCallback(
    async (fn: (c: CtxJogo<S>) => Promise<void>) => {
      if (scriptAtivo.current) return
      scriptAtivo.current = true
      try {
        await fn(ctx)
      } finally {
        scriptAtivo.current = false
      }
    },
    [ctx],
  )

  useEffect(() => {
    const { mapa, x, y, dir } = modo.inicio
    motorRef.current ??= new Motor(modo.mapas, modo.sprites, estadoRef.current.avatar, mapa, x, y, dir)
    const m = motorRef.current
    m.onEntrarMapa = (def) => setBanner({ nome: def.nome, k: Date.now() })
    m.onInteragir = (i) => void correr((c) => modo.interagir(i, c))
    const g = canvasRef.current!.getContext('2d')!
    g.imageSmoothingEnabled = false
    let ultimo = performance.now()
    let raf = 0
    const ciclo = (t: number) => {
      const dt = Math.max(0, Math.min(50, t - ultimo))
      ultimo = t
      m.bloqueado = scriptAtivo.current || menuAbertoRef.current
      m.update(dt)
      m.render(g)
      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    if (!iniciado.current) {
      iniciado.current = true
      setBanner({ nome: m.mapa.def.nome, k: Date.now() })
      if (!estadoRef.current.flags.includes('tutorial')) void correr(modo.tutorial)
    }
    return () => cancelAnimationFrame(raf)
  }, [correr, modo])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 1800)
    return () => clearTimeout(t)
  }, [banner])

  const premir = (t: Tecla) => {
    const m = motorRef.current
    if (!m) return
    if (miniRef.current) return miniRef.current.premir(t)
    const dir = DIRS[t]
    if (dir) m.premir(dir)
    if (dlg.aberto()) return dlg.tecla(t)
    if (menuAbertoRef.current) return menuRef.current?.tecla(t)
    if (scriptAtivo.current) return
    if (t === 'A') m.botaoA()
    else if (t === 'START') {
      m.limparTeclas()
      setMenuAberto(true)
    }
  }

  const soltar = (t: Tecla) => {
    miniRef.current?.soltar(t)
    const dir = DIRS[t]
    if (dir) motorRef.current?.soltar(dir)
  }

  const Menu = modo.Menu

  return (
    <Consola onPremir={premir} onSoltar={soltar}>
      <canvas ref={canvasRef} width={ECRA_W} height={ECRA_H} className="ecra-canvas" />

      {banner && !dlg.dialogo && (
        <div key={banner.k} className="janela banner" style={{ position: 'absolute', left: u(4), top: u(4), padding: `${u(2)} ${u(7)}`, fontSize: u(9) }}>
          {banner.nome}
        </div>
      )}

      {cracha && (
        <div
          className="janela brilho"
          style={{ position: 'absolute', left: '50%', top: u(10), transform: 'translateX(-50%)', padding: u(6), textAlign: 'center' }}
        >
          <PixelImg src={modo.iconeConquista(cracha, true)} escala={u(3)} />
        </div>
      )}

      {menuAberto && <Menu estado={estado} ctx={ctx} onFechar={() => setMenuAberto(false)} ref={menuRef} />}

      {mini && (
        <MiniJogoView
          key={mini.k}
          tipo={mini.tipo}
          avatar={estado.avatar}
          sprites={modo.sprites}
          ref={miniRef}
          onFim={(r) => {
            setMini(null)
            mini.resolver(r)
          }}
        />
      )}

      {dlg.dialogo && <CaixaDialogo d={dlg.dialogo} onA={() => dlg.tecla('A')} onEscolher={dlg.escolher} />}
    </Consola>
  )
}
