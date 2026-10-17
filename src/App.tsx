import { useEffect, useState } from 'react'
import { AgeGate, type Modo } from './components/AgeGate'
import { FimCidade } from './components/FimCidade'
import { FimDeJogo } from './components/FimDeJogo'
import { FimMercado } from './components/FimMercado'
import { GameScreen } from './components/gba/GameScreen'
import { Intro } from './components/gba/Intro'
import { MODO_CIDADE } from './components/gba/modoCidade'
import { MODO_MERCADO } from './components/gba/modoMercado'
import { MODO_VILA } from './components/gba/modoVila'
import { novoEstadoCidade } from './game/cidade/economia'
import type { EstadoCidade } from './game/cidade/tipos'
import { novoJogador } from './game/data'
import { novoEstadoMercado } from './game/mercado/economia'
import type { EstadoMercado } from './game/mercado/tipos'
import type { AvatarConfig, PlayerState } from './game/types'

type Tela = 'idade' | 'intro' | 'jogo' | 'fim'

export default function App() {
  const [pronto, setPronto] = useState(false)
  const [tela, setTela] = useState<Tela>('idade')
  const [modo, setModo] = useState<Modo>('reino')
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [cidade, setCidade] = useState<EstadoCidade | null>(null)
  const [mercado, setMercado] = useState<EstadoMercado | null>(null)

  useEffect(() => {
    // A caixa de diálogo mede o texto com a fonte pixel, por isso esperamos que ela carregue.
    const limite = setTimeout(() => setPronto(true), 1500)
    document.fonts.load("10px 'Press Start 2P'").finally(() => {
      clearTimeout(limite)
      setPronto(true)
    })
    return () => clearTimeout(limite)
  }, [])

  function handleEscolherModo(m: Modo) {
    setModo(m)
    setTela('intro')
  }

  function handleStart(name: string, avatar: AvatarConfig) {
    if (modo === 'cidade') setCidade(novoEstadoCidade(name, avatar))
    else if (modo === 'mercado') setMercado(novoEstadoMercado(name, avatar))
    else setPlayer(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleFim(s: PlayerState) {
    setPlayer(s)
    setTela('fim')
  }

  function handleFimCidade(s: EstadoCidade) {
    setCidade(s)
    setTela('fim')
  }

  function handleFimMercado(s: EstadoMercado) {
    setMercado(s)
    setTela('fim')
  }

  function handleReiniciar() {
    setPlayer(null)
    setCidade(null)
    setMercado(null)
    setTela('idade')
  }

  if (!pronto) return null

  return (
    <>
      {tela === 'idade' && <AgeGate onEscolherModo={handleEscolherModo} />}
      {tela === 'intro' && <Intro modo={modo} onConcluir={handleStart} />}
      {tela === 'jogo' && modo === 'reino' && player && <GameScreen modo={MODO_VILA} estadoInicial={player} onMudar={setPlayer} onFim={handleFim} />}
      {tela === 'jogo' && modo === 'cidade' && cidade && <GameScreen modo={MODO_CIDADE} estadoInicial={cidade} onMudar={setCidade} onFim={handleFimCidade} />}
      {tela === 'jogo' && modo === 'mercado' && mercado && <GameScreen modo={MODO_MERCADO} estadoInicial={mercado} onMudar={setMercado} onFim={handleFimMercado} />}
      {tela === 'fim' && modo === 'reino' && player && <FimDeJogo state={player} onReiniciar={handleReiniciar} />}
      {tela === 'fim' && modo === 'cidade' && cidade && <FimCidade state={cidade} onReiniciar={handleReiniciar} />}
      {tela === 'fim' && modo === 'mercado' && mercado && <FimMercado state={mercado} onReiniciar={handleReiniciar} />}
    </>
  )
}
