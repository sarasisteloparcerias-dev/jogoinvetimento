import { useEffect } from 'react'
import { jingle, musica } from '../game/som'

export interface PropsBotoesFim {
  onReiniciar: () => void
  /** Nome da fase seguinte, se houver. */
  seguinte?: string
  /** Cumpriu o objetivo da fase (pode passar à seguinte). */
  podePassar?: boolean
  /** O que era preciso, e como ficou (quando não cumpriu). */
  regra?: string
  situacao?: string
  onProximo?: () => void
  onRepetir?: () => void
}

/** Fim de uma fase: passar à seguinte (se o objetivo foi cumprido), repetir a fase ou começar de novo. */
export function BotoesFim({ onReiniciar, seguinte, podePassar, regra, situacao, onProximo, onRepetir }: PropsBotoesFim) {
  const venceu = !seguinte || !!podePassar
  useEffect(() => {
    musica(null)
    const t = setTimeout(() => jingle(venceu ? 'fanfarra' : 'triste'), 250)
    return () => clearTimeout(t)
  }, [venceu])

  return (
    <>
      {seguinte && (
        <div
          style={{
            background: podePassar ? '#e6f6ea' : '#fdf0e6',
            border: `2px solid ${podePassar ? '#48b070' : '#e8a060'}`,
            borderRadius: 6,
            padding: 10,
            marginBottom: 12,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {podePassar ? (
            <>
              <strong>Objetivo da fase cumprido!</strong> Podes passar para {seguinte}.
            </>
          ) : (
            <>
              <strong>Ainda não passas para {seguinte}.</strong> Era preciso {regra}. {situacao} Tenta outra vez!
            </>
          )}
        </div>
      )}
      {seguinte && podePassar && onProximo && (
        <button onClick={onProximo} className="botao-pixel" style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 10, background: '#2a9a5a' }}>
          Continuar para {seguinte}
        </button>
      )}
      {onRepetir && (
        <button
          onClick={onRepetir}
          className="botao-pixel"
          style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 10, background: seguinte && !podePassar ? '#2a9a5a' : '#4a7ad0' }}
        >
          Repetir esta fase
        </button>
      )}
      <button onClick={onReiniciar} className="botao-pixel" style={{ width: '100%', fontSize: 14, padding: 8, background: '#8890a8' }}>
        Começar de novo
      </button>
    </>
  )
}
