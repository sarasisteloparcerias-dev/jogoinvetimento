import { useState } from 'react'
import { AVATAR_PADRAO } from '../game/data'
import { MENTOR } from '../game/mentor'
import { SpriteView } from './gba/ui'

export type Modo = 'reino' | 'cidade' | 'mercado'

interface AgeGateProps {
  onEscolherModo: (modo: Modo) => void
}

function modoParaIdade(idade: number): Modo {
  if (idade <= 14) return 'reino'
  if (idade <= 17) return 'cidade'
  return 'mercado'
}

export function AgeGate({ onEscolherModo }: AgeGateProps) {
  const [idade, setIdade] = useState<number | ''>('')

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <form
        className="janela"
        style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center' }}
        onSubmit={(e) => {
          e.preventDefault()
          if (idade !== '') onEscolherModo(modoParaIdade(idade))
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
          <SpriteView avatar={MENTOR.avatar} escala="4px" />
          <SpriteView avatar={AVATAR_PADRAO} escala="4px" />
        </div>
        <h1 className="titulo-jogo">VILA MOEDA</h1>
        <p style={{ color: '#5a6280', marginBottom: 20 }}>Uma aventura para aprender a poupar e a investir.</p>

        <label htmlFor="idade" style={{ display: 'block', marginBottom: 6 }}>
          Quantos anos tens?
        </label>
        <input
          id="idade"
          type="number"
          min={6}
          max={99}
          value={idade}
          onChange={(e) => setIdade(e.target.value === '' ? '' : Number(e.target.value))}
          className="input-pixel"
          style={{ width: '100%', textAlign: 'center', fontSize: 20, padding: 6, marginBottom: 16 }}
          placeholder="ex: 11"
        />

        <button type="submit" disabled={idade === ''} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Começar
        </button>
      </form>
    </div>
  )
}
