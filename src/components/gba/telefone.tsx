import { useEffect, useState, type ReactNode } from 'react'
import type { Tecla } from './dialogo'
import { Cursor, u } from './ui'

/** Peças comuns ao telemóvel d'A Cidade e ao painel d'O Mercado. */

export interface Opcao {
  r: ReactNode
  f: () => void
}

export interface AppTelefone<E extends string> {
  ecra: E
  nome: string
  cor: string
  simbolo: string
}

export function pct(n: number) {
  const v = Math.round(n * 1000) / 10
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-PT')}%`
}

export function corVariacao(n: number) {
  return n > 0.0005 ? '#1f9a50' : n < -0.0005 ? '#d03a3a' : '#7a8298'
}

/** Ecrã atual, cursor e avisos curtos ("Compraste 10€..."). */
export function useTelefone<E extends string>(inicio: E, pai: Partial<Record<E, E>>) {
  const [ecra, setEcra] = useState<E>(inicio)
  const [indice, setIndice] = useState(0)
  const [aviso, setAviso] = useState<{ texto: string; k: number } | null>(null)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 1600)
    return () => clearTimeout(t)
  }, [aviso])

  const ir = (e: E) => {
    setEcra(e)
    setIndice(0)
  }
  return {
    ecra,
    ir,
    indice,
    setIndice,
    aviso,
    avisar: (texto: string) => setAviso((a) => ({ texto, k: (a?.k ?? 0) + 1 })),
    voltar: { r: 'VOLTAR', f: () => ir(pai[ecra] ?? inicio) } as Opcao,
    noInicio: ecra === inicio,
  }
}

/** Setas mexem o cursor, A escolhe, B volta atrás (ou fecha no ecrã inicial), START fecha. */
export function teclaTelefone(t: Tecla, o: { noInicio: boolean; opcoes: Opcao[]; indice: number; setIndice: (i: number) => void; voltar: Opcao; onFechar: () => void }) {
  const n = o.opcoes.length
  if (o.noInicio && (t === 'LEFT' || t === 'RIGHT')) o.setIndice((o.indice + (t === 'LEFT' ? -1 : 1) + n) % n)
  else if (t === 'UP' || t === 'DOWN') o.setIndice((o.indice + (t === 'UP' ? -1 : 1) + n) % n)
  else if (t === 'A') o.opcoes[Math.min(o.indice, n - 1)]?.f()
  else if (t === 'B') {
    if (o.noInicio) o.onFechar()
    else o.voltar.f()
  } else if (t === 'START') o.onFechar()
}

interface PropsTelefone<E extends string> {
  testid: string
  /** Barra de estado: esquerda, meio. */
  topo: [ReactNode, ReactNode]
  noInicio: boolean
  apps: AppTelefone<E>[]
  saudacao: ReactNode
  resumo: ReactNode
  titulo: string
  conteudo: ReactNode
  opcoes: Opcao[]
  /** Opções à direita do conteúdo, em vez de por baixo. */
  lado: boolean
  /** Opções logo a seguir ao conteúdo, em vez de encostadas ao fundo. */
  colado: boolean
  indice: number
  setIndice: (i: number) => void
  aviso: { texto: string; k: number } | null
  onApp: (e: E) => void
  onFechar: () => void
  /** Cor da moldura (telemóvel escuro, portátil cinzento...). */
  moldura?: string
}

export function Telefone<E extends string>(p: PropsTelefone<E>) {
  const sel = Math.min(p.indice, p.opcoes.length - 1)
  const moldura = p.moldura ?? '#1c1f2b'
  const n = p.apps.length
  const larguraApp = n > 5 ? 32 : 38
  return (
    <div data-testid={p.testid} style={{ position: 'absolute', inset: u(3), background: moldura, borderRadius: u(10), padding: `${u(5)} ${u(12)}`, boxShadow: `0 0 0 ${u(1)} #000` }}>
      <span style={{ position: 'absolute', left: u(4), top: '50%', width: u(3), height: u(3), borderRadius: '50%', background: '#3a4058', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'relative', height: '100%', background: '#f4f6fb', borderRadius: u(5), overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#283040' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#283040', color: '#e8ecf4', fontSize: u(5.5), padding: `${u(2)} ${u(5)}` }}>
          <span>{p.topo[0]}</span>
          <span>{p.topo[1]}</span>
          <span style={{ display: 'inline-flex', gap: u(1), alignItems: 'flex-end' }}>
            {[2, 3, 4, 5].map((h) => (
              <span key={h} style={{ width: u(1.5), height: u(h), background: '#e8ecf4' }} />
            ))}
          </span>
        </div>

        {p.noInicio ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: u(6), padding: u(4) }}>
            <div style={{ fontSize: u(7) }}>{p.saudacao}</div>
            <div style={{ display: 'flex', gap: u(1) }}>
              {p.apps.map((a, i) => (
                <div key={a.ecra} onClick={() => p.onApp(a.ecra)} style={{ textAlign: 'center', cursor: 'pointer', width: u(larguraApp) }}>
                  <div
                    style={{
                      width: u(24),
                      height: u(24),
                      margin: '0 auto',
                      borderRadius: u(5),
                      background: a.cor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: u(11),
                      outline: i === sel ? `${u(2)} solid #e04848` : 'none',
                      outlineOffset: u(1),
                    }}
                  >
                    {a.simbolo}
                  </div>
                  <div style={{ fontSize: u(4.5), marginTop: u(3), color: i === sel ? '#e04848' : '#3a4262' }}>{a.nome}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: u(5.5), color: '#7a8298' }}>{p.resumo}</div>
            <div onClick={p.onFechar} style={{ fontSize: u(5.5), color: sel === n ? '#e04848' : '#8890a8', cursor: 'pointer' }}>
              {sel === n ? '▶ ' : ''}FECHAR (B)
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `${u(4)} ${u(7)}` }}>
            <div style={{ fontSize: u(8), color: '#3a4262', marginBottom: u(4) }}>{p.titulo}</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: p.lado ? 'row' : 'column', gap: u(6) }}>
              <div style={{ flex: p.lado ? 1 : undefined, minHeight: 0, overflow: 'auto', fontSize: u(6), lineHeight: u(9) }}>{p.conteudo}</div>
              <div style={{ width: p.lado ? u(78) : undefined, marginTop: p.lado || p.colado ? 0 : 'auto' }}>
                {p.opcoes.map((o, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      p.setIndice(i)
                      o.f()
                    }}
                    style={{ display: 'flex', alignItems: 'center', fontSize: u(6), lineHeight: u(10), cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <Cursor visivel={i === sel} />
                    {o.r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {p.aviso && (
          <div key={p.aviso.k} className="janela" style={{ position: 'absolute', left: u(10), right: u(10), top: u(12), padding: u(3), fontSize: u(6), textAlign: 'center' }}>
            {p.aviso.texto}
          </div>
        )}
      </div>
    </div>
  )
}

export function Linha({ nome, valor, nota, cor }: { nome: string; valor: string; nota: string; cor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: u(4), padding: `${u(2)} 0`, borderBottom: `${u(1)} solid #e4e9f2` }}>
      <div>
        <div style={{ color: '#3a4262' }}>{nome}</div>
        <div style={{ fontSize: u(5), lineHeight: u(7), color: '#7a8298' }}>{nota}</div>
      </div>
      <div style={{ whiteSpace: 'nowrap', color: cor }}>{valor}</div>
    </div>
  )
}

export function Barra({ nome, valor, cor }: { nome: string; valor: number; cor: string }) {
  return (
    <div style={{ marginBottom: u(3) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: u(5.5) }}>
        <span>{nome}</span>
        <span>{Math.round(valor)}/100</span>
      </div>
      <div style={{ height: u(4), background: '#e4e9f2', border: `${u(1)} solid #3a4262` }}>
        <div style={{ height: '100%', width: `${valor}%`, background: cor }} />
      </div>
    </div>
  )
}

export function Risco({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: u(1) }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: u(4), height: u(4), background: i <= n ? (n >= 4 ? '#e05050' : n >= 3 ? '#f0a030' : '#48b870') : '#d8dce6' }} />
      ))}
    </span>
  )
}

/** Gráfico simples de um preço ao longo do tempo. */
export function Grafico({ valores }: { valores: number[] }) {
  const w = 100
  const h = 24
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const serie = valores.length === 1 ? [valores[0], valores[0]] : valores
  const pts = serie.map((v, i) => `${(i / (serie.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(' ')
  const cor = valores.length === 1 ? '#7a8298' : valores[valores.length - 1] >= valores[0] ? '#1f9a50' : '#d03a3a'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: u(22), background: '#ffffff', border: `${u(1)} solid #e4e9f2`, margin: `${u(1)} 0` }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Lista de ativos (nome, preço, variação, quanto tens) — cabeçalho e linhas alinhados. */
export function CabecalhoAtivos({ periodo }: { periodo: string }) {
  return (
    <div style={{ display: 'flex', gap: u(3), fontSize: u(4.5), color: '#8890a8', marginTop: u(4), paddingLeft: u(9) }}>
      <span style={{ flex: 1 }}>ATIVO</span>
      <span style={{ width: u(38), textAlign: 'right' }}>PREÇO</span>
      <span style={{ width: u(34), textAlign: 'right' }}>{periodo}</span>
      <span style={{ width: u(40), textAlign: 'right' }}>TENS</span>
    </div>
  )
}

export function LinhaAtivo({ nome, preco, variacao, tens }: { nome: string; preco: string; variacao: number; tens: string | null }) {
  return (
    <span style={{ display: 'flex', flex: 1, gap: u(3), fontSize: u(5.5) }}>
      <span style={{ flex: 1 }}>{nome}</span>
      <span style={{ width: u(38), textAlign: 'right' }}>{preco}</span>
      <span style={{ width: u(34), textAlign: 'right', color: corVariacao(variacao) }}>{pct(variacao)}</span>
      <span style={{ width: u(40), textAlign: 'right', color: tens ? '#3a4262' : '#b0b6c4' }}>{tens ?? '-'}</span>
    </span>
  )
}
