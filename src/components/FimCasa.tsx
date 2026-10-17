import { CONQUISTAS_CASA } from '../game/mercado/conquistas'
import { euros, patrimonioM } from '../game/mercado/economia'
import { META_PATRIMONIO_CASA } from '../game/mercado/habitacao'
import type { EstadoMercado } from '../game/mercado/tipos'
import { iconeCracha } from '../game/pixel/cenario'
import { framesAdolescente } from '../game/pixel/sprites'
import { PixelImg, SpriteView } from './gba/ui'
import { GrowthChart } from './GrowthChart'

interface FimCasaProps {
  state: EstadoMercado
  onReiniciar: () => void
  proximo?: string
  onProximo?: () => void
}

export function FimCasa({ state: s, onReiniciar }: FimCasaProps) {
  const total = patrimonioM(s)
  const h = s.hipoteca
  let mensagem = 'Mais dois anos de escolhas importantes.'
  if (h && total >= META_PATRIMONIO_CASA) mensagem = 'Casa comprada e contas saudáveis. Excelente!'
  else if (h) mensagem = 'Casa comprada! Agora é manter a folga no orçamento durante os próximos anos.'
  else mensagem = 'Não compraste casa. Arrendar também pode ser uma boa decisão, se as contas o justificarem.'

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 560, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={s.avatar} escala="4px" sprites={framesAdolescente} />
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>A casa de {s.name}</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, fontSize: 13 }}>
          <div className="caixa-valor">
            Património líquido
            <strong style={{ color: '#c08a10', fontSize: 15 }}>{euros(total)}</strong>
          </div>
          <div className="caixa-valor">
            Valor da casa
            <strong style={{ color: '#2a8a5a', fontSize: 15 }}>{h ? euros(h.valorCasa) : '-'}</strong>
          </div>
          <div className="caixa-valor">
            Ainda em dívida
            <strong style={{ color: '#d04880', fontSize: 15 }}>{h ? euros(h.divida) : '-'}</strong>
          </div>
        </div>
        {h && (
          <p style={{ marginBottom: 12, fontSize: 12, color: '#5a6280' }}>
            Taxa {h.taxa} · prestação de {euros(h.prestacao)} · juros pagos ao banco em 2 anos: {euros(h.jurosPagos)}
          </p>
        )}

        <p style={{ marginBottom: 6 }}>
          Conquistas: {s.crachas.length} de {CONQUISTAS_CASA.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CONQUISTAS_CASA.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <GrowthChart history={s.history} />
        </div>

        <p style={{ color: '#7a8298', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
          Simulação educativa: valores simplificados e entidades fictícias. Na vida real, compara propostas de vários bancos e pede sempre a ficha de informação normalizada (FINE).
        </p>

        <button onClick={onReiniciar} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Jogar outra vez
        </button>
      </div>
    </div>
  )
}
