import { useEffect, useRef, useState } from 'react'
import { AVATAR_PADRAO, CORES_CABELO, CORES_PELE, CORES_ROUPA } from '../../game/data'
import { MENTOR } from '../../game/mentor'
import { framesAdolescente, framesPersonagem } from '../../game/pixel/sprites'
import type { AvatarConfig } from '../../game/types'
import { Consola } from './Consola'
import { CaixaDialogo, useDialogo, type Tecla } from './dialogo'
import { Cursor, SpriteView, u } from './ui'

type Fase = 'falas' | 'nome' | 'aspeto' | 'fim'
const LINHAS = ['PELE', 'CABELO', 'PENTEADO', 'ROUPA', 'PRONTO!'] as const

const TEXTOS = {
  reino: {
    sprites: framesPersonagem,
    boasVindas: [
      'Olá! Bem-vindo à Vila Moeda!',
      'Chamo-me Mestre Moedas. Aqui na vila, toda a gente aprende a cuidar do seu dinheiro.',
      'Com o dinheiro podes fazer três coisas: GASTAR, POUPAR e INVESTIR. Cada escolha tem consequências!',
      'Não te preocupes: ninguém nasce a saber. Aqui aprende-se a jogar, e errar também ensina.',
      'Mas primeiro, diz-me... como te chamas?',
    ],
    fim: (n: string) => [
      `${n}! Que nome fantástico!`,
      'A tua aventura dura 20 semanas. Ganha os 6 crachás do dinheiro e aprende tudo sobre poupar e investir.',
      'Lembra-te: carrega em A para falar com as pessoas, e em START para abrir o menu. Até já!',
    ],
  },
  cidade: {
    sprites: framesAdolescente,
    boasVindas: [
      'Olá! Boas-vindas à Cidade!',
      'Sou o Mestre Moedas. Talvez me conheças da Vila Moeda... agora sou consultor no Banco Ponte.',
      'Este ano vais ter o teu primeiro trabalho, a tua primeira conta no banco e os teus primeiros investimentos.',
      'Vais ouvir falar de ações, ETFs, obrigações, cripto e inflação. Eu explico tudo pelo caminho.',
      'Atenção: isto é uma simulação educativa. O dinheiro é a fingir e as empresas são inventadas. Nada aqui é um conselho para investir a sério.',
      'Agora diz-me... como te chamas?',
    ],
    fim: (n: string) => [
      `${n}, muito prazer!`,
      'O ano letivo dura 24 semanas. O objetivo: juntar 400€ para a Viagem de Finalistas, sem esquecer a escola, a saúde e os amigos.',
      'Carrega em A para falar com as pessoas. Em START abres o teu telemóvel: banco, investimentos, notícias e objetivo. Boa sorte!',
    ],
  },
  mercado: {
    sprites: framesAdolescente,
    boasVindas: [
      'Olá! Boas-vindas à vida adulta!',
      'Sou o Mestre Moedas. Agora sou planeador financeiro no Banco Ponte.',
      'Acabaste de conseguir o teu primeiro emprego a tempo inteiro. Vais receber salário, pagar renda, impostos e contas, e decidir o que fazer ao que sobra.',
      'Os termos são reais: salário bruto e líquido, IRS, TAEG, comissões, ETFs, PPR. Os valores são simplificados.',
      'Importante: isto é uma simulação educativa. As empresas e os ativos são inventados e nada aqui é um conselho para investir a sério.',
      'Como te chamas?',
    ],
    fim: (n: string) => [
      `${n}, vamos a isso!`,
      'O jogo dura 24 meses. O objetivo: juntar 8.000€ de património líquido para a entrada de uma casa, sem descuidar a saúde, as relações e a carreira.',
      'Cada noite na cama passa um mês. Em START abres o painel: banco, corretora, orçamento do mês, jornal e metas. Boa sorte!',
    ],
  },
  casa: {
    sprites: framesAdolescente,
    boasVindas: [
      'Olá! Boas-vindas ao nível A Casa!',
      'Sou o Mestre Moedas. Este é o passo seguinte da vida adulta: comprar casa.',
      'Vais escolher uma casa, pedir um crédito à habitação, decidir entre taxa fixa e variável e aprender o que custa ter casa: prestação, condomínio, seguros, IMI e obras.',
      'Como sempre: é uma simulação educativa, com valores simplificados e entidades inventadas. Nada aqui é aconselhamento financeiro.',
      'Como te chamas?',
    ],
    fim: (n: string) => [
      `${n}, vamos a isso!`,
      'O nível dura 24 meses. Objetivo: comprar casa sem apertar demasiado o orçamento e chegar a 30.000€ de património líquido.',
      'Cada noite na cama passa um mês. Em START abres o painel. Boa sorte!',
    ],
  },
}

interface PropsIntro {
  modo?: 'reino' | 'cidade' | 'mercado' | 'casa'
  /** Personagem que vem do nível anterior: não se volta a pedir nome nem aspeto. */
  existente?: { nome: string; avatar: AvatarConfig; linhas: string[] }
  onConcluir: (nome: string, avatar: AvatarConfig) => void
}

export function Intro({ modo = 'reino', existente, onConcluir }: PropsIntro) {
  const textos = TEXTOS[modo]
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
      if (existente) {
        // As boas-vindas sem a última pergunta ("como te chamas?").
        await dlg.say([...existente.linhas, ...textos.boasVindas.slice(1, -1)], 'Mestre Moedas')
        await dlg.say(textos.fim(existente.nome).slice(1), 'Mestre Moedas')
        onConcluir(existente.nome, existente.avatar)
        return
      }
      await dlg.say(textos.boasVindas, 'Mestre Moedas')
      setFase('nome')
    })()
  }, [dlg, textos, existente, onConcluir])

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
    await dlg.say(textos.fim(n), 'Mestre Moedas')
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
          {fase === 'aspeto' ? (
            <SpriteView avatar={avatar} escala={u(modo === 'reino' ? 3 : 2.5)} girar sprites={textos.sprites} />
          ) : (
            <SpriteView avatar={MENTOR.avatar} escala={u(modo === 'reino' ? 3 : 2.5)} sprites={textos.sprites} />
          )}
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
