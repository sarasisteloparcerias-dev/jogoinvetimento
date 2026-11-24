import { useState } from 'react'
import { AVATAR_PADRAO } from '../game/data'
import { faseDesbloqueada, type Gravacao, type Modo } from '../game/gravar'
import { resumoGravacao, requisitoNivel } from '../game/niveis'
import { framesAdolescente, framesAdulto, framesPersonagem, framesSenior } from '../game/pixel/sprites'
import type { AvatarConfig } from '../game/types'
import { SpriteView } from './gba/ui'
import { LogoAnimado } from './LogoAnimado'

export type { Modo }

interface AgeGateProps {
  onEscolherModo: (modo: Modo) => void
  gravacao: Gravacao | null
  onContinuar: () => void
  onApagar: () => void
}

/** 8-11: Vila Moeda · 12-14: escolhem (Vila ou Cidade) · 15-17: A Cidade · 18+: escolhem qualquer fase (O Negócio só depois de passar as outras). */
function modoParaIdade(idade: number): Modo | 'escolher' | 'escolher18' {
  if (idade <= 11) return 'reino'
  if (idade <= 14) return 'escolher'
  if (idade <= 17) return 'cidade'
  return 'escolher18'
}

/** O aspeto da personagem guardada, conforme a idade da fase. */
function spritesDaGravacao(g: Gravacao) {
  const passa = g.fim && requisitoNivel(g.modo, g.estado)?.ok
  const ordem: Modo[] = ['reino', 'cidade', 'mercado', 'casa', 'negocio', 'reforma']
  const modo = passa ? ordem[Math.min(ordem.indexOf(g.modo) + 1, ordem.length - 1)] : g.modo
  if (modo === 'reino') return framesPersonagem
  if (modo === 'cidade') return framesAdolescente
  if (modo === 'reforma') return framesSenior
  return framesAdulto
}

export function AgeGate({ onEscolherModo, gravacao, onContinuar, onApagar }: AgeGateProps) {
  const [idade, setIdade] = useState<number | ''>('')
  const [escolher, setEscolher] = useState<false | 'jovem' | 'adulto'>(false)

  if (escolher === 'adulto') {
    const negocio = faseDesbloqueada('negocio')
    const reforma = faseDesbloqueada('reforma')
    return (
      <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
        <div className="janela" style={{ maxWidth: 640, width: '100%', padding: 24, textAlign: 'center' }}>
          <h1 className="titulo-jogo" style={{ fontSize: 18 }}>ESCOLHE A FASE</h1>
          <p style={{ color: '#5a6280', marginBottom: 16 }}>Com {idade} anos podes começar em qualquer fase, da Vila Moeda até A Casa.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <button className="cartao-modo" onClick={() => onEscolherModo('reino')}>
              <SpriteView avatar={AVATAR_PADRAO} escala="3px" />
              <strong>VILA MOEDA</strong>
              <span>Moedas, mealheiro e crachás. A mais simples (8-11 anos).</span>
            </button>
            <button className="cartao-modo" onClick={() => onEscolherModo('cidade')}>
              <SpriteView avatar={{ ...AVATAR_PADRAO, roupa: '#e8743a' }} escala="3px" sprites={framesAdolescente} />
              <strong>A CIDADE</strong>
              <span>Primeiro trabalho, conta no banco, ações, ETFs e cripto (12-17).</span>
            </button>
            <button className="cartao-modo" onClick={() => onEscolherModo('mercado')}>
              <SpriteView avatar={AVATAR_PADRAO} escala="3px" sprites={framesAdulto} />
              <strong>O MERCADO</strong>
              <span>Primeiro emprego a sério: salário, renda, impostos, investir e tirar a carta.</span>
            </button>
            <button className="cartao-modo" onClick={() => onEscolherModo('casa')}>
              <SpriteView avatar={{ ...AVATAR_PADRAO, roupa: '#0ea5e9' }} escala="3px" sprites={framesAdulto} />
              <strong>A CASA</strong>
              <span>Comprar casa: crédito à habitação, taxa fixa ou variável, IMI, condomínio e obras.</span>
            </button>
            <button
              className="cartao-modo"
              disabled={!negocio}
              onClick={() => negocio && onEscolherModo('negocio')}
              style={negocio ? undefined : { opacity: 0.55, cursor: 'not-allowed' }}
            >
              <SpriteView avatar={{ ...AVATAR_PADRAO, roupa: '#283040' }} escala="3px" sprites={framesAdulto} />
              <strong>{negocio ? 'O NEGÓCIO' : 'O NEGÓCIO (FECHADO)'}</strong>
              <span>
                {negocio
                  ? 'A fase final: a tua empresa, com salários, TSU, IVA e IRC.'
                  : 'A fase final abre quando passares todas as outras com a mesma personagem.'}
              </span>
            </button>
            <button
              className="cartao-modo"
              disabled={!reforma}
              onClick={() => reforma && onEscolherModo('reforma')}
              style={reforma ? undefined : { opacity: 0.55, cursor: 'not-allowed' }}
            >
              <SpriteView avatar={{ ...AVATAR_PADRAO, cabelo: '#d8d8d8', roupa: '#8a6ad0' }} escala="3px" sprites={framesSenior} />
              <strong>{reforma ? 'A REFORMA' : 'A REFORMA (FECHADA)'}</strong>
              <span>{reforma ? 'Aos 65, de volta à Vila Moeda: pensão, poupanças e 20 anos de reforma.' : 'Abre quando passares O Negócio com a mesma personagem.'}</span>
            </button>
          </div>
          <button onClick={() => setEscolher(false)} style={{ marginTop: 16, color: '#8890a8', fontSize: 12 }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (escolher === 'jovem') {
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
          if (m === 'escolher') setEscolher('jovem')
          else if (m === 'escolher18') setEscolher('adulto')
          else onEscolherModo(m)
        }}
      >
        <LogoAnimado />
        <h1 className="titulo-jogo" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          VILA MOEDA
        </h1>
        <p style={{ color: '#5a6280', marginBottom: 20 }}>Uma aventura para aprender a poupar e a investir.</p>

        {gravacao && (
          <div style={{ marginBottom: 20 }}>
            <button type="button" className="cartao-modo" onClick={onContinuar} style={{ width: '100%', flexDirection: 'row', textAlign: 'left' }}>
              <SpriteView
                avatar={(gravacao.estado as { avatar: AvatarConfig }).avatar}
                escala="2px"
                sprites={spritesDaGravacao(gravacao)}
              />
              <span style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>
                  {!gravacao.fim ? 'CONTINUAR' : requisitoNivel(gravacao.modo, gravacao.estado)?.ok ? 'PASSAR AO NÍVEL SEGUINTE' : 'REPETIR A FASE'}
                </strong>
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
