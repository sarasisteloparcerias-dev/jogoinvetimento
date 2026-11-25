import { lazy, Suspense, useEffect, useState } from 'react'
import { AgeGate } from './components/AgeGate'
import { Intro } from './components/gba/Intro'
import type { AbaEscolas } from './components/Escolas'
import { carregarModo, type QualquerModo } from './components/gba/modos'
import { novoEstadoCidade } from './game/cidade/economia'
import type { EstadoCidade } from './game/cidade/tipos'
import { novoJogador } from './game/data'
import { apagarGravacao, desbloquearFase, gravar, lerGravacao, limparPercurso, registarPercurso, type Gravacao, type Modo } from './game/gravar'
import { novoEstadoCasa, novoEstadoMercado } from './game/mercado/economia'
import type { EstadoMercado } from './game/mercado/tipos'
import { NOME_MODO, passarNivel, PROXIMO, repetirNivel, requisitoNivel, resumoPercurso } from './game/niveis'
import { novoEstadoNegocio } from './game/negocio/economia'
import { novoEstadoReforma, type EstadoReforma } from './game/reforma/economia'
import { musica } from './game/som'
import type { AvatarConfig, PlayerState } from './game/types'

// o ecrã de jogo e os ecrãs finais só se descarregam quando são precisos
const GameScreen = lazy(() => import('./components/gba/GameScreen').then((m) => ({ default: m.GameScreen })))
const FimDeJogo = lazy(() => import('./components/FimDeJogo').then((m) => ({ default: m.FimDeJogo })))
const FimCidade = lazy(() => import('./components/FimCidade').then((m) => ({ default: m.FimCidade })))
const FimMercado = lazy(() => import('./components/FimMercado').then((m) => ({ default: m.FimMercado })))
const FimCasa = lazy(() => import('./components/FimCasa').then((m) => ({ default: m.FimCasa })))
const FimNegocio = lazy(() => import('./components/FimNegocio').then((m) => ({ default: m.FimNegocio })))
const FimReforma = lazy(() => import('./components/FimReforma').then((m) => ({ default: m.FimReforma })))
const Escolas = lazy(() => import('./components/Escolas').then((m) => ({ default: m.Escolas })))

/** A área das escolas abre por endereço (#escolas, #fichas, #desafio, #certificado), para se poder partilhar o link. */
const ABAS: AbaEscolas[] = ['escolas', 'fichas', 'desafio', 'certificado']
function abaDoEndereco(): AbaEscolas | null {
  const h = window.location.hash.slice(1) as AbaEscolas
  return ABAS.includes(h) ? h : null
}

function ACarregar() {
  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ padding: 24 }}>
        A carregar...
      </div>
    </div>
  )
}

type Tela = 'idade' | 'intro' | 'jogo' | 'fim'

/** A mesma personagem a passar para o nível seguinte: a introdução não volta a pedir nome e aspeto. */
interface Continuacao {
  nome: string
  avatar: AvatarConfig
  linhas: string[]
  estado: unknown
}

export default function App() {
  const [pronto, setPronto] = useState(false)
  const [tela, setTela] = useState<Tela>('idade')
  const [modo, setModo] = useState<Modo>('reino')
  const [estado, setEstado] = useState<unknown>(null)
  const [continuacao, setContinuacao] = useState<Continuacao | null>(null)
  const [gravacao, setGravacao] = useState<Gravacao | null>(() => lerGravacao())
  const [modos, setModos] = useState<Partial<Record<Modo, QualquerModo>>>({})
  const [aba, setAba] = useState<AbaEscolas | null>(abaDoEndereco)

  useEffect(() => {
    const mudou = () => setAba(abaDoEndereco())
    window.addEventListener('hashchange', mudou)
    return () => window.removeEventListener('hashchange', mudou)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [aba])

  // carrega a fase quando é precisa (e a seguinte, em segundo plano, quando se chega ao fim)
  useEffect(() => {
    const precisa: Modo[] = []
    if (tela === 'intro' || tela === 'jogo') precisa.push(modo)
    if (tela === 'fim' && PROXIMO[modo]) precisa.push(PROXIMO[modo]!)
    for (const m of precisa) if (!modos[m]) void carregarModo(m).then((def) => setModos((x) => ({ ...x, [m]: def })))
  }, [tela, modo, modos])

  // música do título no ecrã da idade e na introdução (o jogo e o fim escolhem a sua)
  useEffect(() => {
    if (tela === 'idade' || tela === 'intro') musica('titulo')
  }, [tela])

  useEffect(() => {
    // A caixa de diálogo mede o texto com a fonte pixel, por isso esperamos que ela carregue.
    const limite = setTimeout(() => setPronto(true), 1500)
    document.fonts.load("10px 'Press Start 2P'").finally(() => {
      clearTimeout(limite)
      setPronto(true)
    })
    return () => clearTimeout(limite)
  }, [])

  useEffect(() => {
    if (estado && (tela === 'jogo' || tela === 'fim')) gravar({ modo, estado, fim: tela === 'fim' })
  }, [estado, modo, tela])

  function handleEscolherModo(m: Modo) {
    // personagem nova: começa um percurso novo
    limparPercurso()
    setModo(m)
    setContinuacao(null)
    setTela('intro')
  }

  function handleStart(name: string, avatar: AvatarConfig) {
    if (continuacao) setEstado(continuacao.estado)
    else if (modo === 'cidade') setEstado(novoEstadoCidade(name, avatar))
    else if (modo === 'mercado') setEstado(novoEstadoMercado(name, avatar))
    else if (modo === 'casa') setEstado(novoEstadoCasa(name, avatar))
    else if (modo === 'negocio') setEstado(novoEstadoNegocio(name, avatar))
    else if (modo === 'reforma') setEstado(novoEstadoReforma(name, avatar))
    else setEstado(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleFim(s: unknown) {
    const req = requisitoNivel(modo, s)
    registarPercurso({ modo, nome: (s as { name: string }).name, resumo: resumoPercurso(modo, s), passou: req ? req.ok : true })
    setEstado(s)
    setTela('fim')
  }

  function proximoNivel(de: Modo, s: unknown) {
    const n = passarNivel(de, s)
    if (!n) return
    const base = s as { name: string; avatar: AvatarConfig }
    desbloquearFase(n.modo)
    setModo(n.modo)
    setContinuacao({ nome: base.name, avatar: base.avatar, linhas: n.linhas, estado: n.estado })
    setTela('intro')
  }

  function repetir(m: Modo, s: unknown) {
    setModo(m)
    setContinuacao(null)
    setEstado(repetirNivel(m, s))
    setTela('jogo')
  }

  function handleContinuar() {
    if (!gravacao) return
    setModo(gravacao.modo)
    setEstado(gravacao.estado)
    if (!gravacao.fim) return setTela('jogo')
    // fase acabada: passa à seguinte se cumpriu o objetivo; senão repete-a
    if (requisitoNivel(gravacao.modo, gravacao.estado)?.ok) proximoNivel(gravacao.modo, gravacao.estado)
    else repetir(gravacao.modo, gravacao.estado)
  }

  function handleApagar() {
    apagarGravacao()
    setGravacao(null)
  }

  function handleReiniciar() {
    apagarGravacao()
    setGravacao(null)
    setEstado(null)
    setContinuacao(null)
    setTela('idade')
  }

  if (!pronto) return null

  const proximo = PROXIMO[modo]
  const requisito = tela === 'fim' ? requisitoNivel(modo, estado) : null
  const fimProps = {
    onReiniciar: handleReiniciar,
    seguinte: proximo ? NOME_MODO[proximo] : undefined,
    podePassar: !!requisito?.ok,
    regra: requisito?.regra,
    situacao: requisito?.situacao,
    onProximo: () => proximoNivel(modo, estado),
    onRepetir: () => repetir(modo, estado),
    modo,
    estado,
  }

  // durante o jogo e a introdução, a área das escolas não se sobrepõe
  const escolas = aba && tela !== 'jogo' && tela !== 'intro' ? aba : null
  function sairEscolas() {
    window.history.pushState(null, '', window.location.pathname + window.location.search)
    setAba(null)
    // os dados podem ter sido apagados na área das escolas
    setGravacao(lerGravacao())
  }

  return (
    <>
      {escolas && (
        <Suspense fallback={<ACarregar />}>
          <Escolas aba={escolas} onVoltar={sairEscolas} />
        </Suspense>
      )}
      <div style={escolas ? { display: 'none' } : undefined}>
        {tela === 'idade' && <AgeGate onEscolherModo={handleEscolherModo} gravacao={gravacao} onContinuar={handleContinuar} onApagar={handleApagar} />}
        {tela === 'intro' && <Intro key={modo} modo={modo} existente={continuacao ?? undefined} onConcluir={handleStart} />}
        <Suspense fallback={<ACarregar />}>
          {tela === 'jogo' && (modos[modo] ? <GameScreen key={modo} modo={modos[modo]!} estadoInicial={estado as PlayerState} onMudar={setEstado} onFim={handleFim} /> : <ACarregar />)}
          {tela === 'fim' && modo === 'reino' && <FimDeJogo state={estado as PlayerState} {...fimProps} />}
          {tela === 'fim' && modo === 'cidade' && <FimCidade state={estado as EstadoCidade} {...fimProps} />}
          {tela === 'fim' && modo === 'mercado' && <FimMercado state={estado as EstadoMercado} {...fimProps} />}
          {tela === 'fim' && modo === 'casa' && <FimCasa state={estado as EstadoMercado} {...fimProps} />}
          {tela === 'fim' && modo === 'negocio' && <FimNegocio state={estado as EstadoMercado} {...fimProps} />}
          {tela === 'fim' && modo === 'reforma' && <FimReforma state={estado as EstadoReforma} {...fimProps} />}
        </Suspense>
      </div>
    </>
  )
}
