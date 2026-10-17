import { useState } from 'react'
import { AVATAR_PADRAO } from '../game/data'
import { MENTOR } from '../game/mentor'
import type { Gravacao, Modo } from '../game/gravar'
import { resumoGravacao } from '../game/niveis'
import { framesAdolescente, framesPersonagem } from '../game/pixel/sprites'
import type { AvatarConfig } from '../game/types'
import { SpriteView } from './gba/ui'

export type { Modo }

interface AgeGateProps {
  onEscolherModo: (modo: Modo) => void
  gravacao: Gravacao | null
  onContinuar: () => void
  onApagar: () => void
}

/** 8-11: Vila Moeda · 12-14: escolhem · 15-17: A Cidade · 18+: O Mercado. */
function modoParaIdade(idade: number): Modo | 'escolher' {
  if (idade <= 11) return 'reino'
  if (idade <= 14) return 'escolher'
  if (idade <= 17) return 'cidade'
  return 'mercado'
}

export function AgeGate({ onEscolherModo, gravacao, onContinuar, onApagar }: AgeGateProps) {
  const [idade, setIdade] = useState<number | ''>('')
  const [escolher, setEscolher] = useState(false)

  if (escolher) {
    return (
      <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
        <div className="janela" style={{ maxWidth: 520, width: '100%', padding: 24, textAlign: 'center' }}>
          <h1 className="titulo-jogo" style={{ fontSize: 18 }}>ESCOLHE A AVENTURA</h1>
          <p style={{ color: '#5a6280', marginBottom: 16 }}>Com {idade} anos podes jogar qualquer uma.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <button className="cartao-modo" onClick={() => onEscolherModo('reino')}>
              <SpriteView avatar={AVATAR_PADRAO} escala="3px" />
              <strong>VILA MOEDA</strong>
              <span>Poupar, investir e ganhar crachás numa vila tranquila. Mais simples.</span>
            </button>
            <button className="cartao-modo" onClick={() => onEscolherModo('cidade')}>
              <SpriteView avatar={AVATAR_PADRAO} escala="3px" sprites={framesAdolescente} />
              <strong>A CIDADE</strong>
              <span>Primeiro emprego, conta no banco, ações, ETFs e cripto. Mais desafiante.</span>
            </button>
          </div>
          <button onClick={() => setEscolher(false)} style={{ marginTop: 16, color: '#8890a8', fontSize: 12 }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <form
        className="janela"
        style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center' }}
        onSubmit={(e) => {
          e.preventDefault()
          if (idade === '') return
          const m = modoParaIdade(idade)
          if (m === 'escolher') setEscolher(true)
          else onEscolherModo(m)
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
          <SpriteView avatar={MENTOR.avatar} escala="4px" />
          <SpriteView avatar={AVATAR_PADRAO} escala="4px" />
          <SpriteView avatar={{ ...AVATAR_PADRAO, roupa: '#0ea5e9', cabeloComprido: true }} escala="3px" sprites={framesAdolescente} />
        </div>
        <h1 className="titulo-jogo">VILA MOEDA</h1>
        <p style={{ color: '#5a6280', marginBottom: 20 }}>Uma aventura para aprender a poupar e a investir.</p>

        {gravacao && (
          <div style={{ marginBottom: 20 }}>
            <button type="button" className="cartao-modo" onClick={onContinuar} style={{ width: '100%', flexDirection: 'row', textAlign: 'left' }}>
              <SpriteView
                avatar={(gravacao.estado as { avatar: AvatarConfig }).avatar}
                escala="2px"
                sprites={gravacao.modo === 'reino' && !gravacao.fim ? framesPersonagem : framesAdolescente}
              />
              <span style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{gravacao.fim ? 'PASSAR AO NÍVEL SEGUINTE' : 'CONTINUAR'}</strong>
                {resumoGravacao(gravacao.modo, gravacao.estado, gravacao.fim)}
              </span>
            </button>
            <button type="button" onClick={onApagar} style={{ marginTop: 6, color: '#8890a8', fontSize: 11 }}>
              Apagar o jogo guardado
            </button>
          </div>
        )}

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
