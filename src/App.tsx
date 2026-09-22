import { useState } from 'react'
import { AgeGate, type Modo } from './components/AgeGate'
import { CharacterCreation } from './components/CharacterCreation'
import { Dashboard } from './components/Dashboard'
import { EventModal } from './components/EventModal'
import { FimDeJogo } from './components/FimDeJogo'
import { ModoIndisponivel } from './components/ModoIndisponivel'
import type { ActionFeedback } from './components/RoomScene'
import { novoJogador } from './game/data'
import { avancarSemana, executarAcao, registarLog } from './game/engine'
import type { ActionId, AvatarConfig, GameEvent, GameEventChoice, PlayerState } from './game/types'

type Tela = 'idade' | 'modo-indisponivel' | 'criar-personagem' | 'jogo' | 'fim'

function calcularDeltas(antes: PlayerState, depois: PlayerState): ActionFeedback['deltas'] {
  const deltas: ActionFeedback['deltas'] = {}
  if (depois.saldo !== antes.saldo) deltas.saldo = depois.saldo - antes.saldo
  if (depois.poupanca !== antes.poupanca) deltas.poupanca = depois.poupanca - antes.poupanca
  if (depois.investimento.amount !== antes.investimento.amount) {
    deltas.investimento = depois.investimento.amount - antes.investimento.amount
  }
  if (depois.stats.relacoes !== antes.stats.relacoes) deltas.relacoes = depois.stats.relacoes - antes.stats.relacoes
  if (depois.stats.saude !== antes.stats.saude) deltas.saude = depois.stats.saude - antes.stats.saude
  if (depois.stats.educacao !== antes.stats.educacao) deltas.educacao = depois.stats.educacao - antes.stats.educacao
  return deltas
}

export default function App() {
  const [tela, setTela] = useState<Tela>('idade')
  const [modo, setModo] = useState<Modo>('reino')
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [eventoPendente, setEventoPendente] = useState<GameEvent | null>(null)
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null)

  function handleEscolherModo(m: Modo) {
    setModo(m)
    setTela(m === 'reino' ? 'criar-personagem' : 'modo-indisponivel')
  }

  function handleStart(name: string, avatar: AvatarConfig) {
    setPlayer(novoJogador(name, avatar))
    setTela('jogo')
  }

  function handleAction(id: ActionId) {
    if (!player) return
    const resultado = executarAcao(player, id)
    if (resultado === player) return
    setFeedback({ key: Date.now(), deltas: calcularDeltas(player, resultado) })
    setPlayer(resultado)
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
          <Dashboard state={player} onAction={handleAction} onAvancar={handleAvancar} feedback={feedback} />
          {eventoPendente && <EventModal evento={eventoPendente} state={player} onResolve={handleResolverEvento} />}
        </>
      )}
      {tela === 'fim' && player && <FimDeJogo state={player} onReiniciar={handleReiniciar} />}
    </div>
  )
}
