import { useState } from 'react'
import { AgeGate, type Modo } from './components/AgeGate'
import { CharacterCreation } from './components/CharacterCreation'
import { Dashboard } from './components/Dashboard'
import { EventModal } from './components/EventModal'
import { FimDeJogo } from './components/FimDeJogo'
import { ModoIndisponivel } from './components/ModoIndisponivel'
import { novoJogador } from './game/data'
import { avancarSemana, executarAcao, registarLog } from './game/engine'
import type { ActionId, AvatarId, GameEvent, GameEventChoice, PlayerState } from './game/types'

type Tela = 'idade' | 'modo-indisponivel' | 'criar-personagem' | 'jogo' | 'fim'

export default function App() {
  const [tela, setTela] = useState<Tela>('idade')
  const [modo, setModo] = useState<Modo>('reino')
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [eventoPendente, setEventoPendente] = useState<GameEvent | null>(null)

  function handleEscolherModo(m: Modo) {
    setModo(m)
    setTela(m === 'reino' ? 'criar-personagem' : 'modo-indisponivel')
  }

  function handleStart(name: string, avatar: AvatarId) {
    setPlayer(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleAction(id: ActionId) {
    if (!player) return
    setPlayer(executarAcao(player, id))
  }

  function handleAvancar() {
    if (!player) return
    const { estado, evento } = avancarSemana(player)
    setPlayer(estado)
    setEventoPendente(evento)
  }

  function handleResolverEvento(choice: GameEventChoice) {
    if (!player || !eventoPendente) return
    const resultado = choice.apply(player)
    const comLog = registarLog(resultado, `${eventoPendente.title} — ${choice.resultText(player)}`, 'neutra')
    setPlayer(comLog)
    setEventoPendente(null)
    if (comLog.gameOver) {
      setTela('fim')
    }
  }

  function handleReiniciar() {
    setPlayer(null)
    setTela('idade')
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {tela === 'idade' && <AgeGate onEscolherModo={handleEscolherModo} />}
      {tela === 'modo-indisponivel' && <ModoIndisponivel modo={modo} onVoltar={() => setTela('idade')} />}
      {tela === 'criar-personagem' && <CharacterCreation onStart={handleStart} />}
      {tela === 'jogo' && player && (
        <>
          <Dashboard state={player} onAction={handleAction} onAvancar={handleAvancar} />
          {eventoPendente && <EventModal evento={eventoPendente} state={player} onResolve={handleResolverEvento} />}
        </>
      )}
      {tela === 'fim' && player && <FimDeJogo state={player} onReiniciar={handleReiniciar} />}
    </div>
  )
}
