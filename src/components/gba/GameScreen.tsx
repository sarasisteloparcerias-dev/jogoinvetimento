import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CRACHAS } from '../../game/crachas'
import { avancarSemana } from '../../game/engine'
import { iconeCracha } from '../../game/pixel/cenario'
import type { Dir } from '../../game/pixel/sprites'
import { ECRA_H, ECRA_W, Motor } from '../../game/world/motor'
import { executarInteracao, manha, resumoFinal, tutorial, type Ctx } from '../../game/world/scripts'
import type { PlayerState } from '../../game/types'
import { Consola } from './Consola'
import { CaixaDialogo, useDialogo, type Tecla } from './dialogo'
import { OPCOES_MENU, StartMenu, type EstadoMenu } from './StartMenu'
import { PixelImg, u } from './ui'

const DIRS: Partial<Record<Tecla, Dir>> = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' }

interface Props {
  estadoInicial: PlayerState
  onMudar: (s: PlayerState) => void
  onFim: (s: PlayerState) => void
}

export function GameScreen({ estadoInicial, onMudar, onFim }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motorRef = useRef<Motor | null>(null)
  const estadoRef = useRef(estadoInicial)
  const [estado, setEstado] = useState(estadoInicial)
  const dlg = useDialogo()
  const [menu, setMenuState] = useState<EstadoMenu | null>(null)
  const menuRef = useRef<EstadoMenu | null>(null)
  const [cracha, setCracha] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ nome: string; k: number } | null>(null)
  const scriptAtivo = useRef(false)
  const iniciado = useRef(false)
  const callbacks = useRef({ onMudar, onFim })
  useLayoutEffect(() => {
    callbacks.current = { onMudar, onFim }
  })

  const setMenu = useCallback((m: EstadoMenu | null) => {
    menuRef.current = m
    setMenuState(m)
  }, [])

  const definir = useCallback((s: PlayerState) => {
    estadoRef.current = s
    setEstado(s)
    callbacks.current.onMudar(s)
  }, [])

  const ctxRef = useRef<Ctx | null>(null)
  ctxRef.current ??= {
    say: dlg.say,
    ask: dlg.ask,
    estado: () => estadoRef.current,
    definir,
    async cracha(id) {
      const s = estadoRef.current
      if (s.crachas.includes(id)) return
      const c = CRACHAS.find((x) => x.id === id)!
      definir({ ...s, crachas: [...s.crachas, id] })
      setCracha(id)
      await dlg.say(`${s.name} ganhou o ${c.nome.toUpperCase()}!`)
      await dlg.say(c.licao, 'Mestre Moedas')
      setCracha(null)
    },
    async dormir() {
      const m = motorRef.current!
      m.limparTeclas()
      await m.fadeTo(1, 500)
      await dlg.say('Zzz... Zzz... Zzz...')
      const antes = estadoRef.current
      const { estado: depois, evento } = avancarSemana(antes)
      definir(depois)
      m.carregar('casa', 7, 3, 'down')
      await m.fadeTo(0, 500)
      await manha(ctxRef.current!, antes, depois, evento)
      if (estadoRef.current.gameOver) {
        await resumoFinal(ctxRef.current!)
        callbacks.current.onFim(estadoRef.current)
      }
    },
  }

  const correr = useCallback(async (fn: (c: Ctx) => Promise<void>) => {
    if (scriptAtivo.current) return
    scriptAtivo.current = true
    try {
      await fn(ctxRef.current!)
    } finally {
      scriptAtivo.current = false
    }
  }, [])

  useEffect(() => {
    motorRef.current ??= new Motor(estadoRef.current.avatar, 'casa', 7, 3, 'down')
    const m = motorRef.current
    m.onEntrarMapa = (def) => setBanner({ nome: def.nome, k: Date.now() })
    m.onInteragir = (i) => void correr((c) => executarInteracao(i, c))
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    let ultimo = performance.now()
    let raf = 0
    const ciclo = (t: number) => {
      const dt = Math.max(0, Math.min(50, t - ultimo))
      ultimo = t
      m.bloqueado = scriptAtivo.current || menuRef.current !== null
      m.update(dt)
      m.render(ctx)
      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    if (!iniciado.current) {
      iniciado.current = true
      setBanner({ nome: m.mapa.def.nome, k: Date.now() })
      if (!estadoRef.current.flags.includes('tutorial')) void correr(tutorial)
    }
    return () => cancelAnimationFrame(raf)
  }, [correr])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 1800)
    return () => clearTimeout(t)
  }, [banner])

  const escolherMenu = (i: number) => {
    const opcao = OPCOES_MENU[i]
    if (opcao === 'FECHAR') setMenu(null)
    else setMenu({ indice: i, aba: opcao })
  }

  const premir = (t: Tecla) => {
    const m = motorRef.current
    if (!m) return
    const dir = DIRS[t]
    if (dir) m.premir(dir)
    if (dlg.aberto()) return dlg.tecla(t)
    const mn = menuRef.current
    if (mn) {
      if (mn.aba) {
        if (t === 'A' || t === 'B' || t === 'START') setMenu({ ...mn, aba: null })
        return
      }
      const n = OPCOES_MENU.length
      if (t === 'UP' || t === 'DOWN') setMenu({ ...mn, indice: (mn.indice + (t === 'UP' ? -1 : 1) + n) % n })
      else if (t === 'A') escolherMenu(mn.indice)
      else if (t === 'B' || t === 'START') setMenu(null)
      return
    }
    if (scriptAtivo.current) return
    if (t === 'A') m.botaoA()
    else if (t === 'START') {
      m.limparTeclas()
      setMenu({ indice: 0, aba: null })
    }
  }

  const soltar = (t: Tecla) => {
    const dir = DIRS[t]
    if (dir) motorRef.current?.soltar(dir)
  }

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
          <PixelImg src={iconeCracha(cracha, true)} escala={u(3)} />
        </div>
      )}

      {menu && <StartMenu estado={estado} menu={menu} onEscolher={escolherMenu} onVoltar={() => setMenu({ ...menu, aba: null })} />}

      {dlg.dialogo && <CaixaDialogo d={dlg.dialogo} onA={() => dlg.tecla('A')} onEscolher={dlg.escolher} />}
    </Consola>
  )
}
