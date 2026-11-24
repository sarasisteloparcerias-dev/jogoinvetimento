import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ResultadoMiniJogo, TipoMiniJogo } from '../../game/minijogos/tipos'
import type { Dir } from '../../game/pixel/sprites'
import { jingle, musica, sfx } from '../../game/som'
import { ECRA_H, ECRA_W, Motor } from '../../game/world/motor'
import type { MapaDef } from '../../game/world/tipos'
import { Consola } from './Consola'
import { CaixaDialogo, useDialogo, type Tecla } from './dialogo'
import { MiniJogoView, type ControloMiniJogo } from './MiniJogoView'
import type { ControloMenu, CtxJogo, EstadoBase, ModoJogo } from './modo'
import { PixelImg, u } from './ui'

const DIRS: Partial<Record<Tecla, Dir>> = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' }

function calcularSeta(mapas: Record<string, MapaDef>, mapaId: string, alvo: string | null) {
  if (!alvo || mapaId === alvo || !mapas[alvo]) return null
  const def = mapas[mapaId]
  const texto = mapas[alvo].nome
  if (def.tipo === 'interior') return def.saida ? { x: def.saida.x, y: def.saida.y, texto } : null
  const e = def.edificios?.find((x) => x.interior === alvo)
  return e ? { x: e.x + e.porta, y: e.y + e.h - 1, texto } : null
}

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
  const [mapaId, setMapaId] = useState(modo.inicio.mapa)
  const interior = modo.mapas[mapaId]?.tipo === 'interior'
  const modoRef = useRef(modo)
  const destinoRef = useRef<string | null>(null)
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
    const contar = modoRef.current.dinheiro
    if (contar) {
      const antes = contar(estadoRef.current)
      const depois = contar(s)
      if (depois > antes + 0.004) sfx('moeda')
      else if (depois < antes - 0.004) sfx('gastar')
    }
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
      const c = modo.conquistas.find((x) => x.id === id)
      // cada nível tem as suas conquistas: as dos outros níveis ignoram-se
      if (!c) return
      definir({ ...s, crachas: [...s.crachas, id] })
      setCracha(id)
      jingle('cracha')
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
    som: sfx,
    jingle,
    mapa() {
      const m = motorRef.current!
      const atual = m.mapa.def
      const destino = destinoRef.current
      if (atual.tipo === 'exterior') return { mapas: modo.mapas, exterior: atual.id, x: m.jogador.x, y: m.jogador.y, destino }
      // dentro de um edifício: mostra a rua, com o "estás aqui" na porta
      for (const def of Object.values(modo.mapas)) {
        const e = def.edificios?.find((x) => x.interior === atual.id)
        if (e) return { mapas: modo.mapas, exterior: def.id, x: e.x + e.porta, y: e.y + e.h, destino }
      }
      const fora = Object.values(modo.mapas).find((d) => d.tipo === 'exterior')!
      return { mapas: modo.mapas, exterior: fora.id, x: -5, y: -5, destino }
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
    m.onEntrarMapa = (def) => {
      setBanner({ nome: def.nome, k: Date.now() })
      setMapaId(def.id)
      sfx('porta')
    }
    m.onInteragir = (i) => void correr((c) => modo.interagir(i, c))
    m.onAtropelado = () => {
      const t = modo.transito
      if (!t) return
      sfx('travagem')
      void correr((c) => t.atropelado(c))
    }
    m.onForaPassadeira = () => {
      const t = modo.transito
      if (t) void correr((c) => t.foraPassadeira(c))
    }
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

  // seta de destino: aponta para o edifício da próxima conquista (ou para a saída, se estiver noutro interior)
  const alvo = modo.destino ? modo.destino(estado) : (modo.conquistas.find((c) => !estado.crachas.includes(c.id) && c.onde)?.onde ?? null)
  const seta = calcularSeta(modo.mapas, mapaId, alvo)
  useLayoutEffect(() => {
    destinoRef.current = alvo
  })
  useEffect(() => {
    const m = motorRef.current
    if (!m) return
    m.destino = calcularSeta(modo.mapas, mapaId, alvo)
  }, [alvo, mapaId, modo.mapas])

  // música: a da fase lá fora, uma mais calma dentro de casa e outra nos mini-jogos
  const musicaAgora = mini ? 'minijogo' : interior ? 'interior' : modo.musica
  useEffect(() => {
    musica(musicaAgora)
  }, [musicaAgora])

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
    if (menuAbertoRef.current) {
      sfx(t === 'A' ? 'confirmar' : t === 'B' ? 'cancelar' : 'cursor')
      return menuRef.current?.tecla(t)
    }
    if (scriptAtivo.current) return
    if (t === 'A') m.botaoA()
    else if (t === 'START') {
      sfx('confirmar')
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

      {seta && !dlg.dialogo && !menuAberto && !mini && (
        <div
          className="janela"
          data-testid="destino"
          style={{ position: 'absolute', right: u(4), top: u(4), padding: `${u(1.5)} ${u(4)}`, fontSize: u(6), color: '#3a4262', opacity: 0.92 }}
        >
          <span style={{ color: '#d0a010' }}>▶</span> DESTINO: {seta.texto}
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
