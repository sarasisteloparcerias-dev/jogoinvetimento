import { useEffect, useState } from 'react'
import { AgeGate, type Modo } from './components/AgeGate'
import { FimDeJogo } from './components/FimDeJogo'
import { GameScreen } from './components/gba/GameScreen'
import { Intro } from './components/gba/Intro'
import { ModoIndisponivel } from './components/ModoIndisponivel'
import { novoJogador } from './game/data'
import type { AvatarConfig, PlayerState } from './game/types'

type Tela = 'idade' | 'modo-indisponivel' | 'intro' | 'jogo' | 'fim'

export default function App() {
  const [pronto, setPronto] = useState(false)
  const [tela, setTela] = useState<Tela>('idade')
  const [modo, setModo] = useState<Modo>('reino')
  const [player, setPlayer] = useState<PlayerState | null>(null)

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
    setTela(m === 'reino' ? 'intro' : 'modo-indisponivel')
  }

  function handleStart(name: string, avatar: AvatarConfig) {
    setPlayer(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleFim(s: PlayerState) {
    setPlayer(s)
    setTela('fim')
  }

  function handleReiniciar() {
    setPlayer(null)
    setTela('idade')
  }

  if (!pronto) return null

  return (
    <>
      {tela === 'idade' && <AgeGate onEscolherModo={handleEscolherModo} />}
      {tela === 'modo-indisponivel' && <ModoIndisponivel modo={modo} onVoltar={() => setTela('idade')} />}
      {tela === 'intro' && <Intro onConcluir={handleStart} />}
      {tela === 'jogo' && player && <GameScreen estadoInicial={player} onMudar={setPlayer} onFim={handleFim} />}
      {tela === 'fim' && player && <FimDeJogo state={player} onReiniciar={handleReiniciar} />}
    </>
  )
}
