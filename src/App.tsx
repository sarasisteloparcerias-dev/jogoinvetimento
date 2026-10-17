import { useEffect, useState } from 'react'
import { AgeGate } from './components/AgeGate'
import { FimCidade } from './components/FimCidade'
import { FimDeJogo } from './components/FimDeJogo'
import { FimCasa } from './components/FimCasa'
import { FimMercado } from './components/FimMercado'
import { GameScreen } from './components/gba/GameScreen'
import { Intro } from './components/gba/Intro'
import { MODO_CASA } from './components/gba/modoCasa'
import { MODO_CIDADE } from './components/gba/modoCidade'
import { MODO_MERCADO } from './components/gba/modoMercado'
import { MODO_VILA } from './components/gba/modoVila'
import { novoEstadoCidade } from './game/cidade/economia'
import type { EstadoCidade } from './game/cidade/tipos'
import { novoJogador } from './game/data'
import { apagarGravacao, gravar, lerGravacao, type Gravacao, type Modo } from './game/gravar'
import { novoEstadoCasa, novoEstadoMercado } from './game/mercado/economia'
import type { EstadoMercado } from './game/mercado/tipos'
import { NOME_MODO, passarNivel, PROXIMO } from './game/niveis'
import type { AvatarConfig, PlayerState } from './game/types'

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
    setModo(m)
    setContinuacao(null)
    setTela('intro')
  }

  function handleStart(name: string, avatar: AvatarConfig) {
    if (continuacao) setEstado(continuacao.estado)
    else if (modo === 'cidade') setEstado(novoEstadoCidade(name, avatar))
    else if (modo === 'mercado') setEstado(novoEstadoMercado(name, avatar))
    else if (modo === 'casa') setEstado(novoEstadoCasa(name, avatar))
    else setEstado(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleFim(s: unknown) {
    setEstado(s)
    setTela('fim')
  }

  function proximoNivel(de: Modo, s: unknown) {
    const n = passarNivel(de, s)
    if (!n) return
    const base = s as { name: string; avatar: AvatarConfig }
    setModo(n.modo)
    setContinuacao({ nome: base.name, avatar: base.avatar, linhas: n.linhas, estado: n.estado })
    setTela('intro')
  }

  function handleContinuar() {
    if (!gravacao) return
    setModo(gravacao.modo)
    setEstado(gravacao.estado)
    if (gravacao.fim) proximoNivel(gravacao.modo, gravacao.estado)
    else setTela('jogo')
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
  const fimProps = {
    onReiniciar: handleReiniciar,
    proximo: proximo ? NOME_MODO[proximo] : undefined,
    onProximo: () => proximoNivel(modo, estado),
  }

  return (
    <>
      {tela === 'idade' && <AgeGate onEscolherModo={handleEscolherModo} gravacao={gravacao} onContinuar={handleContinuar} onApagar={handleApagar} />}
      {tela === 'intro' && <Intro key={modo} modo={modo} existente={continuacao ?? undefined} onConcluir={handleStart} />}
      {tela === 'jogo' && modo === 'reino' && <GameScreen modo={MODO_VILA} estadoInicial={estado as PlayerState} onMudar={setEstado} onFim={handleFim} />}
      {tela === 'jogo' && modo === 'cidade' && <GameScreen modo={MODO_CIDADE} estadoInicial={estado as EstadoCidade} onMudar={setEstado} onFim={handleFim} />}
      {tela === 'jogo' && modo === 'mercado' && <GameScreen modo={MODO_MERCADO} estadoInicial={estado as EstadoMercado} onMudar={setEstado} onFim={handleFim} />}
      {tela === 'jogo' && modo === 'casa' && <GameScreen modo={MODO_CASA} estadoInicial={estado as EstadoMercado} onMudar={setEstado} onFim={handleFim} />}
      {tela === 'fim' && modo === 'reino' && <FimDeJogo state={estado as PlayerState} {...fimProps} />}
      {tela === 'fim' && modo === 'cidade' && <FimCidade state={estado as EstadoCidade} {...fimProps} />}
      {tela === 'fim' && modo === 'mercado' && <FimMercado state={estado as EstadoMercado} {...fimProps} />}
      {tela === 'fim' && modo === 'casa' && <FimCasa state={estado as EstadoMercado} {...fimProps} />}
    </>
  )
}
