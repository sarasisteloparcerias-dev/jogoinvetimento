import { CONQUISTAS_MERCADO } from '../game/mercado/conquistas'
import { carteiraM, euros, META_CASA, patrimonioM } from '../game/mercado/economia'
import type { EstadoMercado } from '../game/mercado/tipos'
import { iconeCracha } from '../game/pixel/cenario'
import { framesAdolescente } from '../game/pixel/sprites'
import { PixelImg, SpriteView } from './gba/ui'
import { GrowthChart } from './GrowthChart'

interface FimMercadoProps {
  state: EstadoMercado
  onReiniciar: () => void
  /** Nome do nível seguinte, se houver. */
  proximo?: string
  onProximo?: () => void
}

export function FimMercado({ state: s, onReiniciar, proximo, onProximo }: FimMercadoProps) {
  const total = patrimonioM(s)
  const casa = total >= META_CASA
  const media = (s.stats.relacoes + s.stats.saude + s.stats.carreira) / 3

  let mensagem = 'Dois anos de escolhas a sério. Cada uma ensinou alguma coisa.'
  if (casa && media >= 50) mensagem = 'Excelente! Juntaste a entrada da casa e não te esqueceste de viver.'
  else if (casa) mensagem = 'Tens a entrada da casa! Mas cuidado com a saúde e as relações: também são património.'
  else if (s.divida > 0) mensagem = 'Acabaste com dívidas. O primeiro passo é pagá-las: nenhum investimento rende tanto como evitar juros.'

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 560, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={s.avatar} escala="4px" sprites={framesAdolescente} />
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>Dois anos depois, {s.name}!</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, fontSize: 13 }}>
          <div className="caixa-valor">
            Património líquido
            <strong style={{ color: '#c08a10', fontSize: 15 }}>{euros(total)}</strong>
          </div>
          <div className="caixa-valor">
            Depósito + PPR
            <strong style={{ color: '#d04880', fontSize: 15 }}>{euros(s.poupanca + s.ppr)}</strong>
          </div>
          <div className="caixa-valor">
            Investido
            <strong style={{ color: '#2a8a5a', fontSize: 15 }}>{euros(carteiraM(s))}</strong>
          </div>
        </div>
        <p style={{ marginBottom: 6 }}>
          Entrada da casa: <strong>{casa ? 'CONSEGUIDA!' : `faltaram ${euros(META_CASA - total)}`}</strong>
        </p>
        <p style={{ marginBottom: 12, fontSize: 12, color: '#5a6280' }}>
          Impostos sobre investimentos e juros: {euros(s.impostoPago)} · Juros de dívidas: {euros(s.jurosPagos)}
        </p>

        <p style={{ marginBottom: 6 }}>
          Conquistas: {s.crachas.length} de {CONQUISTAS_MERCADO.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CONQUISTAS_MERCADO.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <GrowthChart history={s.history} />
        </div>

        <p style={{ color: '#7a8298', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
          Simulação educativa: ativos fictícios e valores simplificados (impostos, juros, salários). Nada neste jogo é aconselhamento financeiro.
        </p>

        {proximo && onProximo && (
          <button onClick={onProximo} className="botao-pixel" style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 10, background: '#2a9a5a' }}>
            Continuar para {proximo}
          </button>
        )}
        <button onClick={onReiniciar} className="botao-pixel" style={{ width: '100%', fontSize: proximo ? 14 : 18, padding: proximo ? 8 : 10, background: proximo ? '#8890a8' : undefined }}>
          {proximo ? 'Começar de novo' : 'Jogar outra vez'}
        </button>
      </div>
    </div>
  )
}
