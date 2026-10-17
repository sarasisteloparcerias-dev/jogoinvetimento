import { useImperativeHandle, useState, type ReactNode } from 'react'
import { CONQUISTAS_CIDADE, objetivoCidade } from '../../game/cidade/conquistas'
import { ATIVO, ATIVOS, comprar, euros, META_VIAGEM, moverPoupanca, patrimonio, poupadoViagem, valorAtivo, valorCarteira, vender } from '../../game/cidade/economia'
import { verificarConquistas } from '../../game/cidade/scripts'
import type { AtivoId, EstadoCidade } from '../../game/cidade/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { GrowthChart } from '../GrowthChart'
import type { PropsMenu } from './modo'
import { Barra, CabecalhoAtivos, corVariacao, Grafico, Linha, LinhaAtivo, pct, Risco, teclaTelefone, Telefone, useTelefone, type AppTelefone, type Opcao } from './telefone'
import { PixelImg, u } from './ui'

type Ecra = 'inicio' | 'banco' | 'pagamentos' | 'investir' | 'ativo' | 'noticias' | 'objetivo' | 'perfil' | 'grafico'

const APPS: AppTelefone<Ecra>[] = [
  { ecra: 'banco', nome: 'BANCO', cor: '#4a7ad0', simbolo: '€' },
  { ecra: 'investir', nome: 'INVESTIR', cor: '#2a9a5a', simbolo: '%' },
  { ecra: 'noticias', nome: 'JORNAL', cor: '#e05050', simbolo: 'N' },
  { ecra: 'objetivo', nome: 'OBJETIVO', cor: '#e0a020', simbolo: '★' },
  { ecra: 'perfil', nome: 'PERFIL', cor: '#8a6ad0', simbolo: '☺' },
]

const PAI: Partial<Record<Ecra, Ecra>> = { pagamentos: 'banco', ativo: 'investir', grafico: 'perfil' }

function variacaoSemana(s: EstadoCidade, id: AtivoId) {
  const h = s.historicoPrecos[id]
  return h.length > 1 ? h[h.length - 1] / h[h.length - 2] - 1 : 0
}

/** O telemóvel substitui o menu START n'A Cidade: banco, investimentos, notícias, objetivo e perfil. */
export function Telemovel({ estado: s, ctx, onFechar, ref }: PropsMenu<EstadoCidade>) {
  const tel = useTelefone<Ecra>('inicio', PAI)
  const { ecra, ir, indice, setIndice, avisar, voltar } = tel
  const [ativo, setAtivo] = useState<AtivoId>('etf')
  const definir = (n: EstadoCidade, texto: string) => {
    ctx.definir(n)
    avisar(texto)
    void verificarConquistas(ctx)
  }

  const investirAberto = !!s.conta && s.flags.includes('investir')

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
          <CabecalhoAtivos periodo="SEMANA" />
        </>
      )
      opcoes = [
        ...ATIVOS.map((a) => {
          const tens = valorAtivo(s, a.id)
          return {
            r: <LinhaAtivo nome={a.curto} preco={euros(s.precos[a.id])} variacao={variacaoSemana(s, a.id)} tens={tens >= 0.01 ? euros(tens) : null} />,
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
    tecla: (t) => teclaTelefone(t, { noInicio: tel.noInicio, opcoes, indice, setIndice, voltar, onFechar }),
  }))

  return (
    <Telefone
      testid="telemovel"
      topo={[`SEMANA ${Math.min(s.semana, 24)}/24`, euros(s.dinheiro)]}
      noInicio={tel.noInicio}
      apps={APPS}
      saudacao={`Olá, ${s.name}!`}
      resumo={s.conta ? `Conta ${euros(s.dinheiro)} · Poupança ${euros(s.poupanca)}` : `Na carteira: ${euros(s.dinheiro)}`}
      titulo={titulo}
      conteudo={conteudo}
      opcoes={opcoes}
      lado={lado}
      colado={ecra === 'investir'}
      indice={indice}
      setIndice={setIndice}
      aviso={tel.aviso}
      onApp={ir}
      onFechar={onFechar}
    />
  )
}
