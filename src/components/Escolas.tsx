import { useMemo, useState } from 'react'
import { baralhar, lerDesafio, melhoria, NOME_NIVEL, PERGUNTAS, registarDesafio, type NivelDesafio, type Pergunta } from '../game/desafio'
import { FICHAS, TEMAS_REFERENCIAL } from '../game/escola'
import { lerGravacao, lerPercurso, type Modo } from '../game/gravar'
import { NOME_MODO } from '../game/niveis'
import { PARCEIROS } from '../game/parceiros'
import { framesAdolescente, framesAdulto, framesPersonagem, framesSenior } from '../game/pixel/sprites'
import { sfx } from '../game/som'
import type { AvatarConfig } from '../game/types'
import { SpriteView } from './gba/ui'

export type AbaEscolas = 'escolas' | 'fichas' | 'desafio' | 'certificado'
const ABAS_ESCOLAS: AbaEscolas[] = ['escolas', 'fichas', 'desafio', 'certificado']

const ORDEM: Modo[] = ['reino', 'cidade', 'mercado', 'casa', 'negocio', 'reforma']
const NOME_ABA: Record<AbaEscolas, string> = { escolas: 'COMO USAR', fichas: 'FICHAS', desafio: 'DESAFIO', certificado: 'CERTIFICADO' }
const BASE = import.meta.env.BASE_URL
const AZUL = '#4a7ad0'

/** Área para escolas e famílias: como usar o jogo numa aula, fichas por fase, desafio antes/depois e certificado. */
export function Escolas({ aba, onVoltar }: { aba: AbaEscolas; onVoltar: () => void }) {
  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2, alignItems: 'flex-start' }}>
      <div className="janela" style={{ maxWidth: 780, width: '100%', padding: 20 }}>
        <nav className="nao-imprimir" aria-label="Secções" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button type="button" onClick={onVoltar} className="botao-pixel" style={{ fontSize: 10, padding: '6px 10px', background: '#8890a8' }}>
            ◀ JOGO
          </button>
          {ABAS_ESCOLAS.map((a) => (
            <a
              key={a}
              href={`#${a}`}
              aria-current={a === aba ? 'page' : undefined}
              className="botao-pixel"
              style={{ fontSize: 10, padding: '6px 10px', textDecoration: 'none', background: a === aba ? '#e8743a' : AZUL }}
            >
              {NOME_ABA[a]}
            </a>
          ))}
        </nav>
        {aba === 'escolas' && <ComoUsar />}
        {aba === 'fichas' && <Fichas />}
        {aba === 'desafio' && <Desafio />}
        {aba === 'certificado' && <Certificado />}
      </div>
    </div>
  )
}

function Titulo({ children }: { children: string }) {
  return (
    <h1 className="titulo-jogo" style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.5 }}>
      {children}
    </h1>
  )
}

function Sub({ children }: { children: string }) {
  return <h2 style={{ fontSize: 11, color: '#283040', margin: '18px 0 8px', lineHeight: 1.6 }}>{children}</h2>
}

// ---------- como usar ----------

function apagarDadosDispositivo() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('vila-moeda:') && k !== 'vila-moeda:som') localStorage.removeItem(k)
  } catch {
    // nada a fazer
  }
}

function ComoUsar() {
  const [apagado, setApagado] = useState(false)
  return (
    <div className="texto-legivel">
      <Titulo>PARA ESCOLAS E FAMÍLIAS</Titulo>
      <p>
        O <strong>Vila Moeda</strong> é um jogo de literacia financeira ao estilo Game Boy, em português de Portugal. Acompanha a mesma personagem em seis fases, dos 8 anos até à
        reforma: mesada e mealheiro, primeiro trabalho e conta no banco, salário e impostos, crédito à habitação, criar uma empresa e fazer as poupanças durar.
      </p>

      <Sub>PORQUE PODE SER USADO NA ESCOLA</Sub>
      <ul>
        <li>
          <strong>Grátis e sem anúncios.</strong> Não há compras nem publicidade dentro do jogo.
        </li>
        <li>
          <strong>Não recolhe dados.</strong> Não há contas nem registos; nada é enviado para fora do dispositivo. O jogo grava só no próprio browser.
        </li>
        <li>
          <strong>Funciona sem internet</strong> depois da primeira visita, e instala-se como app no computador, tablet ou telemóvel.
        </li>
        <li>
          <strong>Alinhado com o Referencial de Educação Financeira</strong> usado nas escolas (tabela abaixo), com fichas de aula para cada fase.
        </li>
        <li>
          <strong>Mede o que se aprendeu:</strong> um desafio de 10 perguntas antes e depois de jogar, e um certificado para imprimir.
        </li>
      </ul>

      <Sub>COMO USAR NUMA AULA</Sub>
      <ol>
        <li>
          <strong>Antes de jogar:</strong> cada estudante faz o <a href="#desafio">desafio</a> (cerca de 5 minutos).
        </li>
        <li>
          <strong>Abrir a conversa</strong> com a pergunta inicial da <a href="#fichas">ficha da fase</a>.
        </li>
        <li>
          <strong>Jogar.</strong> O jogo grava sozinho: no mesmo dispositivo, continua-se na aula seguinte. Cada fase tem um objetivo claro para passar à seguinte.
        </li>
        <li>
          <strong>Debater</strong> com as perguntas da ficha. No fim de cada fase o jogo mostra um resumo para docentes, que se pode imprimir.
        </li>
        <li>
          <strong>Depois:</strong> repetir o desafio, comparar os resultados e imprimir o <a href="#certificado">certificado</a>.
        </li>
      </ol>

      <Sub>FASES E REFERENCIAL DE EDUCAÇÃO FINANCEIRA</Sub>
      <div style={{ overflowX: 'auto' }}>
        <table className="tabela-referencial">
          <thead>
            <tr>
              <th scope="col">Fase</th>
              <th scope="col">Idade</th>
              {TEMAS_REFERENCIAL.map((t) => (
                <th key={t} scope="col">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDEM.map((m) => (
              <tr key={m}>
                <th scope="row">{NOME_MODO[m]}</th>
                <td className="idade">{FICHAS[m].idade}</td>
                {TEMAS_REFERENCIAL.map((t) => (
                  <td key={t} style={{ textAlign: 'center' }} aria-label={FICHAS[m].referencial.includes(t) ? 'sim' : 'não'}>
                    {FICHAS[m].referencial.includes(t) ? '✔' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: '#5a6280' }}>Temas do Referencial de Educação Financeira (Direção-Geral da Educação, ANQEP e Conselho Nacional de Supervisores Financeiros).</p>

      <Sub>COM O APOIO DE</Sub>
      {PARCEIROS.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          {PARCEIROS.map((p) => (p.logo ? <img key={p.nome} src={`${BASE}${p.logo}`} alt={p.nome} style={{ height: 40 }} /> : <strong key={p.nome}>{p.nome}</strong>))}
        </div>
      ) : (
        <p>
          O Vila Moeda procura escolas, fundações e entidades que queiram apoiar a literacia financeira dos mais novos. <a href={`${BASE}parceiros.html`}>Saber como apoiar</a>.
        </p>
      )}

      <Sub>PRIVACIDADE E DISPOSITIVOS PARTILHADOS</Sub>
      <p>
        Tudo o que o jogo guarda (o jogo gravado, as fases desbloqueadas e os resultados do desafio) fica neste browser. Em computadores partilhados, apague os dados no fim da aula.{' '}
        <a href={`${BASE}privacidade.html`}>Política de privacidade</a>.
      </p>
      <button
        type="button"
        className="botao-pixel nao-imprimir"
        style={{ fontSize: 10, padding: '8px 12px', background: '#c04848', marginTop: 4 }}
        onClick={() => {
          if (!window.confirm('Apagar o jogo gravado e os resultados do desafio deste dispositivo?')) return
          apagarDadosDispositivo()
          setApagado(true)
        }}
      >
        APAGAR DADOS DESTE DISPOSITIVO
      </button>
      {apagado && (
        <p role="status" style={{ color: '#2a8a5a' }}>
          Dados apagados. O próximo estudante começa do zero.
        </p>
      )}
    </div>
  )
}

// ---------- fichas ----------

function Fichas() {
  const [modo, setModo] = useState<Modo>('reino')
  const f = FICHAS[modo]
  return (
    <div className="texto-legivel">
      <Titulo>FICHAS PARA A AULA</Titulo>
      <div className="nao-imprimir" role="tablist" aria-label="Fase" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {ORDEM.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === modo}
            onClick={() => setModo(m)}
            className="botao-pixel"
            style={{ fontSize: 9, padding: '6px 8px', background: m === modo ? '#e8743a' : AZUL }}
          >
            {NOME_MODO[m].toUpperCase()}
          </button>
        ))}
      </div>
      <article className="ficha">
        <h2 style={{ fontSize: 13, color: '#e8743a', margin: '4px 0 8px', lineHeight: 1.5 }}>{NOME_MODO[modo].toUpperCase()}</h2>
        <p>
          <strong>Idade:</strong> {f.idade} · <strong>Níveis:</strong> {f.niveis}
        </p>
        <p style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {f.referencial.map((t) => (
            <span key={t} className="chip-tema">
              {t}
            </span>
          ))}
        </p>
        <Sub>OBJETIVOS</Sub>
        <ul>
          {f.objetivos.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <Sub>1. ANTES DE JOGAR</Sub>
        <p>
          Desafio inicial e a pergunta: <em>«{f.antes}»</em>
        </p>
        <Sub>2. DURANTE O JOGO</Sub>
        <ul>
          {f.missoes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <Sub>3. DEPOIS DE JOGAR</Sub>
        <ul>
          {f.conversa.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <Sub>ATIVIDADE FORA DO ECRÃ</Sub>
        <p>{f.atividade}</p>
        <Sub>TEMAS NO JOGO</Sub>
        <p>{f.temas.join(' · ')}.</p>
      </article>
      <button type="button" className="botao-pixel nao-imprimir" style={{ fontSize: 10, padding: '8px 12px', marginTop: 8 }} onClick={() => window.print()}>
        IMPRIMIR ESTA FICHA
      </button>
    </div>
  )
}

// ---------- desafio ----------

interface PerguntaBaralhada extends Pergunta {
  /** Ordem em que as opções aparecem (índices das originais). */
  ordem: number[]
}

function Desafio() {
  const [nivel, setNivel] = useState<NivelDesafio | null>(null)
  const [registo, setRegisto] = useState(lerDesafio)
  const [i, setI] = useState(0)
  const [escolha, setEscolha] = useState<number | null>(null)
  const [acertos, setAcertos] = useState(0)
  const [fim, setFim] = useState<'antes' | 'depois' | null>(null)
  const perguntas = useMemo<PerguntaBaralhada[]>(
    () => (nivel ? baralhar(PERGUNTAS[nivel]).map((p) => ({ ...p, ordem: baralhar([0, 1, 2]) })) : []),
    [nivel],
  )

  function comecar(n: NivelDesafio) {
    setNivel(n)
    setI(0)
    setEscolha(null)
    setAcertos(0)
    setFim(null)
  }

  if (!nivel) {
    return (
      <div className="texto-legivel">
        <Titulo>DESAFIO DO DINHEIRO</Titulo>
        <p>10 perguntas para ver quanto sabes. Faz o desafio antes de jogar e outra vez depois: vais ver quanto aprendeste!</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
          {(['jovem', 'maior'] as NivelDesafio[]).map((n) => {
            const r = registo[n]
            return (
              <button key={n} type="button" className="cartao-modo" onClick={() => comecar(n)}>
                <strong>{NOME_NIVEL[n].toUpperCase()}</strong>
                <span>
                  {!r?.antes
                    ? 'Primeira vez: conta como "antes de jogar".'
                    : !r.depois
                      ? `Antes: ${r.antes.acertos}/${r.antes.total}. Agora conta como "depois de jogar".`
                      : `Antes: ${r.antes.acertos}/${r.antes.total} · Depois: ${r.depois.acertos}/${r.depois.total}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (fim) {
    const r = registo[nivel]
    const m = melhoria(r)
    return (
      <div className="texto-legivel" style={{ textAlign: 'center' }}>
        <Titulo>{fim === 'antes' ? 'PONTO DE PARTIDA' : 'RESULTADO'}</Titulo>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#e8743a', fontFamily: "'Press Start 2P', monospace", margin: '16px 0' }}>
          {acertos}/{perguntas.length}
        </p>
        {fim === 'antes' ? (
          <p>Agora joga o Vila Moeda. Quando acabares uma fase, volta aqui e faz o desafio outra vez para veres quanto aprendeste.</p>
        ) : (
          <p>
            Antes de jogar: <strong>{r?.antes?.acertos}/{r?.antes?.total}</strong>. Agora: <strong>{acertos}/{perguntas.length}</strong>.{' '}
            {m !== null && m > 0 && <strong style={{ color: '#2a8a5a' }}>Melhoraste {m} pontos percentuais!</strong>}
            {m !== null && m === 0 && 'Igual ao início: joga mais uma fase e tenta outra vez.'}
            {m !== null && m < 0 && 'Desta vez correu pior: lê as explicações e tenta outra vez.'}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <a href="#certificado" className="botao-pixel" style={{ fontSize: 10, padding: '8px 12px', textDecoration: 'none' }}>
            VER CERTIFICADO
          </a>
          <button type="button" className="botao-pixel" style={{ fontSize: 10, padding: '8px 12px', background: AZUL }} onClick={() => setNivel(null)}>
            VOLTAR
          </button>
        </div>
      </div>
    )
  }

  const p = perguntas[i]
  const respondeu = escolha !== null
  return (
    <div className="texto-legivel">
      <p style={{ fontSize: 12, color: '#5a6280', display: 'flex', justifyContent: 'space-between' }}>
        <span>
          Pergunta {i + 1} de {perguntas.length}
        </span>
        <span>Certas: {acertos}</span>
      </p>
      <div style={{ height: 6, background: '#e4e8f2', borderRadius: 3, margin: '4px 0 12px' }}>
        <div style={{ height: 6, width: `${(i / perguntas.length) * 100}%`, background: '#e8743a', borderRadius: 3 }} />
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, margin: '8px 0 14px' }} data-testid="pergunta">
        {p.pergunta}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {p.ordem.map((o) => {
          const certa = o === p.certa
          const fundo = !respondeu ? '#f4f7fc' : certa ? '#d8f2e0' : o === escolha ? '#f8dcdc' : '#f4f7fc'
          return (
            <button
              key={o}
              type="button"
              disabled={respondeu}
              data-certa={certa ? '1' : undefined}
              className="opcao-desafio"
              style={{ background: fundo }}
              onClick={() => {
                setEscolha(o)
                if (certa) setAcertos((a) => a + 1)
                sfx(certa ? 'moeda' : 'erro')
              }}
            >
              {respondeu && certa ? '✔ ' : respondeu && o === escolha ? '✘ ' : ''}
              {p.opcoes[o]}
            </button>
          )
        })}
      </div>
      {respondeu && (
        <div role="status" style={{ marginTop: 12, padding: 10, borderRadius: 6, background: escolha === p.certa ? '#e6f6ea' : '#fdf0e6' }}>
          <strong>{escolha === p.certa ? 'Certo!' : 'Não é bem assim.'}</strong> {p.explicacao}
        </div>
      )}
      {respondeu && (
        <button
          type="button"
          className="botao-pixel"
          style={{ fontSize: 12, padding: '10px 14px', marginTop: 12, width: '100%' }}
          onClick={() => {
            if (i + 1 < perguntas.length) {
              setI(i + 1)
              setEscolha(null)
              return
            }
            const total = perguntas.length
            const quando = registarDesafio(nivel, { acertos, total, data: new Date().toISOString().slice(0, 10) })
            setRegisto(lerDesafio())
            setFim(quando)
          }}
        >
          {i + 1 < perguntas.length ? 'SEGUINTE ▶' : 'VER RESULTADO'}
        </button>
      )}
      <p style={{ fontSize: 11, color: '#8890a8', marginTop: 12 }}>Tema: {p.tema}</p>
    </div>
  )
}

// ---------- certificado ----------

function spritesDe(m: Modo | undefined) {
  if (m === 'reino' || !m) return framesPersonagem
  if (m === 'cidade') return framesAdolescente
  if (m === 'reforma') return framesSenior
  return framesAdulto
}

function Certificado() {
  const [percurso] = useState(lerPercurso)
  const [gravacao] = useState(lerGravacao)
  const [desafio] = useState(lerDesafio)
  const base = gravacao?.estado as { name?: string; avatar?: AvatarConfig } | undefined
  const [nome, setNome] = useState(percurso[0]?.nome ?? base?.name ?? '')
  const passadas = ORDEM.filter((m) => percurso.some((e) => e.modo === m && e.passou))
  const ultima = passadas[passadas.length - 1] ?? gravacao?.modo
  const data = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="texto-legivel">
      <label className="nao-imprimir" style={{ display: 'block', marginBottom: 12 }}>
        Nome para o certificado:{' '}
        <input className="input-pixel" value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} style={{ padding: 6, fontSize: 12, width: 260, maxWidth: '100%' }} />
      </label>
      <section className="certificado" aria-label="Certificado">
        <p style={{ fontSize: 10, letterSpacing: 2, color: '#5a6280', fontFamily: "'Press Start 2P', monospace" }}>VILA MOEDA</p>
        <h1 className="titulo-jogo" style={{ fontSize: 20, margin: '10px 0', lineHeight: 1.4 }}>
          CERTIFICADO
        </h1>
        <p>de participação em literacia financeira, atribuído a</p>
        <p style={{ fontSize: 24, fontWeight: 700, margin: '10px 0', borderBottom: '2px dotted #c8cee0', paddingBottom: 6 }}>{nome || ' '}</p>
        {base?.avatar && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <SpriteView avatar={base.avatar} escala="4px" sprites={spritesDe(ultima)} />
          </div>
        )}
        {passadas.length ? (
          <>
            <p>que concluiu as fases:</p>
            <ul className="lista-fases">
              {ORDEM.map((m) => (
                <li key={m} style={{ color: passadas.includes(m) ? '#2a8a5a' : '#b0b6c6' }}>
                  {passadas.includes(m) ? '★' : '☆'} {NOME_MODO[m]}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>que começou a aventura do Vila Moeda.</p>
        )}
        {(['jovem', 'maior'] as NivelDesafio[]).map((n) => {
          const r = desafio[n]
          if (!r?.antes) return null
          const m = melhoria(r)
          return (
            <p key={n}>
              Desafio do dinheiro: <strong>{r.antes.acertos}/{r.antes.total}</strong> antes de jogar
              {r.depois && (
                <>
                  {' '}
                  e <strong>{r.depois.acertos}/{r.depois.total}</strong> depois
                  {m !== null && m > 0 ? ` (+${m} pontos percentuais)` : ''}
                </>
              )}
              .
            </p>
          )
        })}
        <p style={{ marginTop: 16, fontSize: 12, color: '#5a6280' }}>{data}</p>
        {PARCEIROS.length > 0 && <p style={{ fontSize: 11, color: '#5a6280' }}>Com o apoio de {PARCEIROS.map((p) => p.nome).join(', ')}</p>}
      </section>
      <button
        type="button"
        className="botao-pixel nao-imprimir"
        style={{ fontSize: 10, padding: '8px 12px', marginTop: 12 }}
        onClick={() => {
          document.body.classList.add('imprimir-certificado')
          window.print()
          document.body.classList.remove('imprimir-certificado')
        }}
      >
        IMPRIMIR CERTIFICADO
      </button>
    </div>
  )
}
