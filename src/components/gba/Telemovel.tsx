import { useEffect, useImperativeHandle, useState, type ReactNode } from 'react'
import { CONQUISTAS_CIDADE, objetivoCidade } from '../../game/cidade/conquistas'
import { ATIVO, ATIVOS, comprar, euros, META_VIAGEM, moverPoupanca, patrimonio, poupadoViagem, valorAtivo, valorCarteira, vender } from '../../game/cidade/economia'
import { verificarConquistas } from '../../game/cidade/scripts'
import type { AtivoId, EstadoCidade } from '../../game/cidade/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { GrowthChart } from '../GrowthChart'
import type { PropsMenu } from './modo'
import { Cursor, PixelImg, u } from './ui'

type Ecra = 'inicio' | 'banco' | 'pagamentos' | 'investir' | 'ativo' | 'noticias' | 'objetivo' | 'perfil' | 'grafico'

interface Opcao {
  r: ReactNode
  f: () => void
}

const APPS: { ecra: Ecra; nome: string; cor: string; simbolo: string }[] = [
  { ecra: 'banco', nome: 'BANCO', cor: '#4a7ad0', simbolo: '€' },
  { ecra: 'investir', nome: 'INVESTIR', cor: '#2a9a5a', simbolo: '%' },
  { ecra: 'noticias', nome: 'JORNAL', cor: '#e05050', simbolo: 'N' },
  { ecra: 'objetivo', nome: 'OBJETIVO', cor: '#e0a020', simbolo: '★' },
  { ecra: 'perfil', nome: 'PERFIL', cor: '#8a6ad0', simbolo: '☺' },
]

const PAI: Partial<Record<Ecra, Ecra>> = { pagamentos: 'banco', ativo: 'investir', grafico: 'perfil' }

function pct(n: number) {
  const v = Math.round(n * 1000) / 10
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-PT')}%`
}

function corVariacao(n: number) {
  return n > 0.0005 ? '#1f9a50' : n < -0.0005 ? '#d03a3a' : '#7a8298'
}

function variacaoSemana(s: EstadoCidade, id: AtivoId) {
  const h = s.historicoPrecos[id]
  return h.length > 1 ? h[h.length - 1] / h[h.length - 2] - 1 : 0
}

/** O telemóvel substitui o menu START n'A Cidade: banco, investimentos, notícias, objetivo e perfil. */
export function Telemovel({ estado: s, ctx, onFechar, ref }: PropsMenu<EstadoCidade>) {
  const [ecra, setEcra] = useState<Ecra>('inicio')
  const [ativo, setAtivo] = useState<AtivoId>('etf')
  const [indice, setIndice] = useState(0)
  const [aviso, setAviso] = useState<{ texto: string; k: number } | null>(null)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 1600)
    return () => clearTimeout(t)
  }, [aviso])

  const ir = (e: Ecra) => {
    setEcra(e)
    setIndice(0)
  }
  const avisar = (texto: string) => setAviso((a) => ({ texto, k: (a?.k ?? 0) + 1 }))
  const definir = (n: EstadoCidade, texto: string) => {
    ctx.definir(n)
    avisar(texto)
    void verificarConquistas(ctx)
  }

  const investirAberto = !!s.conta && s.flags.includes('investir')
  const voltar: Opcao = { r: 'VOLTAR', f: () => ir(PAI[ecra] ?? 'inicio') }

  let titulo = ''
  let conteudo: ReactNode = null
  let opcoes: Opcao[] = []
  let lado = false

  switch (ecra) {
    case 'inicio':
      opcoes = [...APPS.map((a) => ({ r: a.nome, f: () => ir(a.ecra) })), { r: 'FECHAR', f: onFechar }]
      break

    case 'banco':
      titulo = 'BANCO PONTE'
      if (!s.conta) {
        conteudo = <p style={{ margin: 0 }}>Ainda não tens conta bancária. Vai ao BANCO PONTE (prédio azul, ao lado da praça) e fala com a Rita.</p>
        opcoes = [voltar]
        break
      }
      conteudo = (
        <>
          <Linha nome={`CONTA ${s.conta === 'jovem' ? 'JOVEM' : 'STANDARD'}`} valor={euros(s.dinheiro)} nota={s.conta === 'jovem' ? 'Sem comissões.' : 'Comissão: 1€ por semana.'} />
          <Linha nome="POUPANÇA" valor={euros(s.poupanca)} nota="Rende 3% ao ano." />
        </>
      )
      opcoes = [
        {
          r: 'GUARDAR 10€',
          f: () => {
            const n = moverPoupanca(s, 10)
            if (n) definir(n, 'Guardaste 10€ na poupança.')
            else avisar('Não tens 10€ na conta.')
          },
        },
        {
          r: 'GUARDAR 50€',
          f: () => {
            const n = moverPoupanca(s, 50)
            if (n) definir(n, 'Guardaste 50€ na poupança.')
            else avisar('Não tens 50€ na conta.')
          },
        },
        {
          r: 'TIRAR 10€',
          f: () => {
            const n = moverPoupanca(s, -10)
            if (n) definir(n, 'Passaste 10€ para a conta.')
            else avisar('A poupança não tem 10€.')
          },
        },
        { r: `DÉBITOS (${s.pagamentos.length})`, f: () => ir('pagamentos') },
        voltar,
      ]
      lado = true
      break

    case 'pagamentos':
      titulo = 'DÉBITOS DIRETOS'
      conteudo = s.pagamentos.length ? (
        s.pagamentos.map((p) => (
          <Linha key={p.id} nome={p.nome.toUpperCase()} valor={`${euros(p.valor)}/sem.`} nota={p.restam === null ? 'Até cancelares.' : `Faltam ${p.restam} semanas. Não dá para cancelar.`} />
        ))
      ) : (
        <p style={{ margin: 0 }}>Não tens débitos diretos (pagamentos automáticos). Todo o teu dinheiro é teu!</p>
      )
      opcoes = [
        ...s.pagamentos
          .filter((p) => p.cancelavel)
          .map((p) => ({
            r: `CANCELAR ${p.nome.toUpperCase()}`,
            f: () => {
              ctx.definir({ ...s, pagamentos: s.pagamentos.filter((x) => x.id !== p.id) })
              avisar(`${p.nome} cancelado.`)
              setIndice(0)
            },
          })),
        voltar,
      ]
      break

    case 'investir': {
      titulo = 'INVESTIR'
      if (!investirAberto) {
        conteudo = (
          <p style={{ margin: 0 }}>
            {s.conta ? 'Fala primeiro com o Mestre Moedas no Banco Ponte: ele explica-te como funciona.' : 'Para investir precisas de uma conta bancária. Vai ao Banco Ponte!'}
          </p>
        )
        opcoes = [voltar]
        break
      }
      const carteira = valorCarteira(s)
      const custo = Object.values(s.custo).reduce((a, b) => a + b, 0)
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Carteira: {euros(carteira)}</span>
            {custo > 0 && <span style={{ color: corVariacao(carteira - custo) }}>{carteira - custo >= 0 ? '+' : ''}{euros(carteira - custo)}</span>}
          </div>
          <div style={{ display: 'flex', gap: u(3), fontSize: u(4.5), color: '#8890a8', marginTop: u(4), paddingLeft: u(9) }}>
            <span style={{ flex: 1 }}>ATIVO</span>
            <span style={{ width: u(38), textAlign: 'right' }}>PREÇO</span>
            <span style={{ width: u(34), textAlign: 'right' }}>SEMANA</span>
            <span style={{ width: u(40), textAlign: 'right' }}>TENS</span>
          </div>
        </>
      )
      opcoes = [
        ...ATIVOS.map((a) => {
          const v = variacaoSemana(s, a.id)
          const tens = valorAtivo(s, a.id)
          return {
            r: (
              <span style={{ display: 'flex', flex: 1, gap: u(3), fontSize: u(5.5) }}>
                <span style={{ flex: 1 }}>{a.curto}</span>
                <span style={{ width: u(38), textAlign: 'right' }}>{euros(s.precos[a.id])}</span>
                <span style={{ width: u(34), textAlign: 'right', color: corVariacao(v) }}>{pct(v)}</span>
                <span style={{ width: u(40), textAlign: 'right', color: tens >= 0.01 ? '#3a4262' : '#b0b6c4' }}>{tens >= 0.01 ? euros(tens) : '-'}</span>
              </span>
            ),
            f: () => {
              setAtivo(a.id)
              ir('ativo')
            },
          }
        }),
        voltar,
      ]
      break
    }

    case 'ativo': {
      const a = ATIVO[ativo]
      const tens = valorAtivo(s, a.id)
      const ganho = tens - s.custo[a.id]
      titulo = a.nome.toUpperCase()
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: u(5.5) }}>
            <span>{a.tipo}</span>
            <Risco n={a.risco} />
          </div>
          <div>
            {euros(s.precos[a.id])} <span style={{ color: corVariacao(variacaoSemana(s, a.id)) }}>{pct(variacaoSemana(s, a.id))}</span>
          </div>
          <Grafico valores={s.historicoPrecos[a.id]} />
          <div style={{ fontSize: u(5.5) }}>
            Tens {euros(tens)}
            {s.custo[a.id] > 0 && <span style={{ color: corVariacao(ganho) }}> ({ganho >= 0 ? '+' : ''}{euros(ganho)})</span>}
          </div>
          <div style={{ fontSize: u(5), lineHeight: u(7), color: '#5a6280', marginTop: u(2) }}>{a.descricao}</div>
        </>
      )
      const compra = (v: number) => () => {
        const n = comprar(s, a.id, v)
        if (n) definir(n, `Compraste ${euros(v)} de ${a.curto}.`)
        else avisar(`Não tens ${euros(v)} na conta.`)
      }
      opcoes = [
        { r: 'COMPRAR 10€', f: compra(10) },
        { r: 'COMPRAR 50€', f: compra(50) },
        {
          r: 'VENDER TUDO',
          f: () => {
            if (tens < 0.01) return avisar('Não tens nada para vender.')
            const { estado, valor } = vender(s, a.id)
            const crise = s.semana >= 9 && s.semana <= 12 && ['etf', 'pixel', 'brisa'].includes(a.id)
            definir(crise ? { ...estado, flags: [...estado.flags, 'vendeu_crise'] } : estado, `Vendeste por ${euros(valor)}.`)
          },
        },
        voltar,
      ]
      lado = true
      break
    }

    case 'noticias':
      titulo = 'JORNAL DA SEMANA'
      conteudo = [...s.noticias]
        .reverse()
        .slice(0, 3)
        .map((n) => (
          <div key={n.semana} style={{ marginBottom: u(4) }}>
            <div style={{ fontSize: u(5), color: '#8890a8' }}>SEMANA {n.semana}</div>
            <div style={{ fontWeight: 700, color: '#3a4262' }}>{n.titulo}</div>
            <div style={{ fontSize: u(5.5), lineHeight: u(7.5), color: '#5a6280' }}>{n.texto}</div>
          </div>
        ))
      opcoes = [voltar]
      break

    case 'objetivo': {
      titulo = 'OBJETIVO DO ANO'
      const junto = poupadoViagem(s)
      const obj = objetivoCidade(s.crachas)
      conteudo = (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VIAGEM DE FINALISTAS</span>
            <span>
              {euros(junto)} / {META_VIAGEM}€
            </span>
          </div>
          <div style={{ height: u(6), background: '#e4e9f2', border: `${u(1)} solid #3a4262`, margin: `${u(2)} 0` }}>
            <div style={{ height: '100%', width: `${Math.min(100, (junto / META_VIAGEM) * 100)}%`, background: '#30a8c8' }} />
          </div>
          <div style={{ fontSize: u(5.5), color: '#7a8298', marginBottom: u(4) }}>Conta a poupança + os investimentos.</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: u(3) }}>
            {CONQUISTAS_CIDADE.map((c) => (
              <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala={u(1.5)} style={{ opacity: s.crachas.includes(c.id) ? 1 : 0.5 }} />
            ))}
          </div>
          <div style={{ fontSize: u(6), lineHeight: u(8.5) }}>
            {obj ? (
              <>
                <b>Próxima: {obj.nome}.</b> {obj.objetivo}
              </>
            ) : (
              'Ganhaste todas as conquistas!'
            )}
          </div>
        </>
      )
      opcoes = [voltar]
      break
    }

    case 'perfil':
      titulo = s.name.toUpperCase()
      conteudo = (
        <>
          <div style={{ marginBottom: u(3) }}>
            Semana {Math.min(s.semana, 24)}/24 · {s.emprego ? 'Part-time no Café' : 'Sem emprego'}
          </div>
          <Barra nome="Relações" valor={s.stats.relacoes} cor="#f06090" />
          <Barra nome="Saúde" valor={s.stats.saude} cor="#48b870" />
          <Barra nome="Educação" valor={s.stats.educacao} cor="#4a8ad8" />
          <div>Património: {euros(patrimonio(s))}</div>
        </>
      )
      opcoes = [{ r: 'GRÁFICO', f: () => ir('grafico') }, voltar]
      lado = true
      break

    case 'grafico':
      titulo = 'O TEU DINHEIRO'
      conteudo = <GrowthChart history={s.history} />
      opcoes = [voltar]
      break
  }

  useImperativeHandle(ref, () => ({
    tecla(t) {
      const n = opcoes.length
      if (ecra === 'inicio' && (t === 'LEFT' || t === 'RIGHT')) setIndice((indice + (t === 'LEFT' ? -1 : 1) + n) % n)
      else if (t === 'UP' || t === 'DOWN') setIndice((indice + (t === 'UP' ? -1 : 1) + n) % n)
      else if (t === 'A') opcoes[Math.min(indice, n - 1)]?.f()
      else if (t === 'B') {
        if (ecra === 'inicio') onFechar()
        else voltar.f()
      } else if (t === 'START') onFechar()
    },
  }))

  const sel = Math.min(indice, opcoes.length - 1)

  return (
    <div data-testid="telemovel" style={{ position: 'absolute', inset: u(3), background: '#1c1f2b', borderRadius: u(10), padding: `${u(5)} ${u(12)}`, boxShadow: `0 0 0 ${u(1)} #000` }}>
      <span style={{ position: 'absolute', left: u(4), top: '50%', width: u(3), height: u(3), borderRadius: '50%', background: '#3a4058', transform: 'translateY(-50%)' }} />
      <div style={{ position: 'relative', height: '100%', background: '#f4f6fb', borderRadius: u(5), overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#283040' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#283040', color: '#e8ecf4', fontSize: u(5.5), padding: `${u(2)} ${u(5)}` }}>
          <span>SEMANA {Math.min(s.semana, 24)}/24</span>
          <span>{euros(s.dinheiro)}</span>
          <span style={{ display: 'inline-flex', gap: u(1), alignItems: 'flex-end' }}>
            {[2, 3, 4, 5].map((h) => (
              <span key={h} style={{ width: u(1.5), height: u(h), background: '#e8ecf4' }} />
            ))}
          </span>
        </div>

        {ecra === 'inicio' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: u(6), padding: u(4) }}>
            <div style={{ fontSize: u(7) }}>Olá, {s.name}!</div>
            <div style={{ display: 'flex', gap: u(1) }}>
              {APPS.map((a, i) => (
                <div key={a.ecra} onClick={() => ir(a.ecra)} style={{ textAlign: 'center', cursor: 'pointer', width: u(38) }}>
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
            <div style={{ fontSize: u(5.5), color: '#7a8298' }}>
              {s.conta ? `Conta ${euros(s.dinheiro)} · Poupança ${euros(s.poupanca)}` : `Na carteira: ${euros(s.dinheiro)}`}
            </div>
            <div onClick={onFechar} style={{ fontSize: u(5.5), color: sel === APPS.length ? '#e04848' : '#8890a8', cursor: 'pointer' }}>
              {sel === APPS.length ? '▶ ' : ''}FECHAR (B)
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `${u(4)} ${u(7)}` }}>
            <div style={{ fontSize: u(8), color: '#3a4262', marginBottom: u(4) }}>{titulo}</div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: lado ? 'row' : 'column', gap: u(6) }}>
              <div style={{ flex: lado ? 1 : undefined, minHeight: 0, overflow: 'auto', fontSize: u(6), lineHeight: u(9) }}>{conteudo}</div>
              <div style={{ width: lado ? u(78) : undefined, marginTop: lado || ecra === 'investir' ? 0 : 'auto' }}>
                {opcoes.map((o, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setIndice(i)
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

        {aviso && (
          <div key={aviso.k} className="janela" style={{ position: 'absolute', left: u(10), right: u(10), top: u(12), padding: u(3), fontSize: u(6), textAlign: 'center' }}>
            {aviso.texto}
          </div>
        )}
      </div>
    </div>
  )
}

function Linha({ nome, valor, nota }: { nome: string; valor: string; nota: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: u(4), padding: `${u(2)} 0`, borderBottom: `${u(1)} solid #e4e9f2` }}>
      <div>
        <div style={{ color: '#3a4262' }}>{nome}</div>
        <div style={{ fontSize: u(5), lineHeight: u(7), color: '#7a8298' }}>{nota}</div>
      </div>
      <div style={{ whiteSpace: 'nowrap' }}>{valor}</div>
    </div>
  )
}

function Barra({ nome, valor, cor }: { nome: string; valor: number; cor: string }) {
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

function Risco({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: u(1) }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: u(4), height: u(4), background: i <= n ? (n >= 4 ? '#e05050' : n >= 3 ? '#f0a030' : '#48b870') : '#d8dce6' }} />
      ))}
    </span>
  )
}

/** Gráfico simples do preço semana a semana. */
function Grafico({ valores }: { valores: number[] }) {
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
