import { useEffect, useRef, useState } from 'react'
import { AVATAR_PADRAO, CORES_CABELO, CORES_PELE, CORES_ROUPA } from '../../game/data'
import { MENTOR } from '../../game/mentor'
import type { AvatarConfig } from '../../game/types'
import { Consola } from './Consola'
import { CaixaDialogo, useDialogo, type Tecla } from './dialogo'
import { Cursor, SpriteView, u } from './ui'

type Fase = 'falas' | 'nome' | 'aspeto' | 'fim'
const LINHAS = ['PELE', 'CABELO', 'PENTEADO', 'ROUPA', 'PRONTO!'] as const

export function Intro({ onConcluir }: { onConcluir: (nome: string, avatar: AvatarConfig) => void }) {
  const dlg = useDialogo()
  const [fase, setFase] = useState<Fase>('falas')
  const [nome, setNome] = useState('')
  const [avatar, setAvatar] = useState<AvatarConfig>(AVATAR_PADRAO)
  const [linha, setLinhaState] = useState(0)
  const linhaRef = useRef(0)
  const iniciado = useRef(false)

  const setLinha = (l: number) => {
    linhaRef.current = l
    setLinhaState(l)
  }

  useEffect(() => {
    if (iniciado.current) return
    iniciado.current = true
    void (async () => {
      await dlg.say(
        [
          'Olá! Bem-vindo à Vila Moeda!',
          'Chamo-me Mestre Moedas. Aqui na vila, toda a gente aprende a cuidar do seu dinheiro.',
          'Com o dinheiro podes fazer três coisas: GASTAR, POUPAR e INVESTIR. Cada escolha tem consequências!',
          'Não te preocupes: ninguém nasce a saber. Aqui aprende-se a jogar, e errar também ensina.',
          'Mas primeiro, diz-me... como te chamas?',
        ],
        'Mestre Moedas',
      )
      setFase('nome')
    })()
  }, [dlg])

  function mudar(l: number, passo: number) {
    const ciclo = (lista: string[], atual: string) => lista[(lista.indexOf(atual) + passo + lista.length) % lista.length]
    if (l === 0) setAvatar((a) => ({ ...a, pele: ciclo(CORES_PELE, a.pele) }))
    if (l === 1) setAvatar((a) => ({ ...a, cabelo: ciclo(CORES_CABELO, a.cabelo) }))
    if (l === 2) setAvatar((a) => ({ ...a, cabeloComprido: !a.cabeloComprido }))
    if (l === 3) setAvatar((a) => ({ ...a, roupa: ciclo(CORES_ROUPA, a.roupa) }))
  }

  async function terminar() {
    setFase('fim')
    const n = nome.trim()
    await dlg.say(
      [
        `${n}! Que nome fantástico!`,
        'A tua aventura dura 20 semanas. Ganha os 6 crachás do dinheiro e aprende tudo sobre poupar e investir.',
        'Lembra-te: carrega em A para falar com as pessoas, e em START para abrir o menu. Até já!',
      ],
      'Mestre Moedas',
    )
    onConcluir(n, avatar)
  }

  function premir(t: Tecla) {
    if (dlg.aberto()) return dlg.tecla(t)
    if (fase !== 'aspeto') return
    const l = linhaRef.current
    if (t === 'UP') setLinha((l + LINHAS.length - 1) % LINHAS.length)
    else if (t === 'DOWN') setLinha((l + 1) % LINHAS.length)
    else if (t === 'LEFT') mudar(l, -1)
    else if (t === 'RIGHT') mudar(l, 1)
    else if (t === 'A') {
      if (l === 4) void terminar()
      else mudar(l, 1)
    }
  }

  const valor = (l: number) => {
    if (l === 2) return avatar.cabeloComprido ? 'COMPRIDO' : 'CURTO'
    const cor = l === 0 ? avatar.pele : l === 1 ? avatar.cabelo : avatar.roupa
    return <span style={{ display: 'inline-block', width: u(18), height: u(7), background: cor, border: `${u(1)} solid #3a4262` }} />
  }

  return (
    <Consola onPremir={premir} onSoltar={() => {}}>
      <div className="fundo-intro" />
      <div style={{ position: 'absolute', left: fase === 'aspeto' ? u(14) : '50%', top: u(14), transform: fase === 'aspeto' ? undefined : 'translateX(-50%)', textAlign: 'center' }}>
        <div className="plataforma" style={{ position: 'absolute', left: '50%', bottom: u(-2), width: u(70), height: u(14), transform: 'translateX(-50%)' }} />
        <div style={{ position: 'relative' }}>
          {fase === 'aspeto' ? <SpriteView avatar={avatar} escala={u(3)} girar /> : <SpriteView avatar={MENTOR.avatar} escala={u(3)} />}
        </div>
      </div>

      {fase === 'nome' && (
        <form
          className="janela"
          style={{ position: 'absolute', left: u(30), right: u(30), bottom: u(20), padding: u(8), display: 'flex', flexDirection: 'column', gap: u(5) }}
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim()) {
              setFase('aspeto')
              setLinha(0)
            }
          }}
        >
          <label htmlFor="nome" style={{ fontSize: u(10) }}>
            O teu nome:
          </label>
          <input
            id="nome"
            autoFocus
            maxLength={10}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Escreve aqui"
            className="input-pixel"
            style={{ fontSize: u(11), padding: `${u(2)} ${u(4)}` }}
          />
          <button type="submit" disabled={!nome.trim()} className="botao-pixel" style={{ fontSize: u(10), padding: u(3) }}>
            OK
          </button>
        </form>
      )}

      {fase === 'aspeto' && (
        <div className="janela" style={{ position: 'absolute', right: u(4), top: u(6), width: u(160), padding: `${u(5)} ${u(6)}` }}>
          <div style={{ fontSize: u(8), color: '#7a8298', marginBottom: u(3) }}>Como és tu, {nome.trim()}?</div>
          {LINHAS.map((l, i) => (
            <div
              key={l}
              onClick={() => {
                setLinha(i)
                if (i === 4) void terminar()
                else mudar(i, 1)
              }}
              style={{ display: 'flex', alignItems: 'center', fontSize: u(8), lineHeight: u(15), cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <Cursor visivel={linha === i} />
              <span style={{ flex: 1 }}>{l}</span>
              {i < 4 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: u(2), fontSize: u(7) }}>
                  ◀ {valor(i)} ▶
                </span>
              )}
            </div>
          ))}
          <div style={{ fontSize: u(6), color: '#8890a8', marginTop: u(2) }}>Setas: escolher · A: confirmar</div>
        </div>
      )}

      {dlg.dialogo && <CaixaDialogo d={dlg.dialogo} onA={() => dlg.tecla('A')} onEscolher={dlg.escolher} />}
    </Consola>
  )
}
