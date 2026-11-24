import { lerPercurso } from '../game/gravar'
import { NOME_MODO } from '../game/niveis'
import { iconeCracha } from '../game/pixel/cenario'
import { framesAdolescente } from '../game/pixel/sprites'
import { CONQUISTAS_REFORMA } from '../game/reforma/conquistas'
import { ANOS_REFORMA, euros, IDADE_REFORMA, patrimonioR, poupancas, type EstadoReforma } from '../game/reforma/economia'
import { BotoesFim, type PropsBotoesFim } from './BotoesFim'
import { GrowthChart } from './GrowthChart'
import { PixelImg, SpriteView } from './gba/ui'

interface FimReformaProps extends PropsBotoesFim {
  state: EstadoReforma
}

/** O fim de tudo: a reforma e o percurso da personagem, do mealheiro da Vila Moeda até aos 85 anos. */
export function FimReforma({ state: s, ...botoes }: FimReformaProps) {
  const percurso = lerPercurso().filter((e) => e.nome === s.name)
  const mensagem = s.semDinheiro
    ? 'As poupanças acabaram antes do fim e os últimos anos foram apertados. Começar mais cedo e gastar com mais calma teria feito a diferença.'
    : poupancas(s) > s.projecao.deposito + s.projecao.investido
      ? 'Uma reforma tranquila, e ainda sobrou mais do que tinhas aos 65. Excelente!'
      : 'Uma reforma tranquila: as poupanças chegaram até ao fim.'

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 600, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={s.avatar} escala="4px" sprites={framesAdolescente} />
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>A vida de {s.name}</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, fontSize: 13 }}>
          <div className="caixa-valor">
            Idade
            <strong style={{ color: '#4a7ad0', fontSize: 15 }}>{IDADE_REFORMA + Math.min(s.ano - 1, ANOS_REFORMA)} anos</strong>
          </div>
          <div className="caixa-valor">
            Poupanças
            <strong style={{ color: s.semDinheiro ? '#d04880' : '#2a8a5a', fontSize: 15 }}>{euros(poupancas(s))}</strong>
          </div>
          <div className="caixa-valor">
            Património
            <strong style={{ color: '#c08a10', fontSize: 15 }}>{euros(patrimonioR(s))}</strong>
          </div>
        </div>

        <p style={{ marginBottom: 6 }}>
          Conquistas: {s.crachas.length} de {CONQUISTAS_REFORMA.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CONQUISTAS_REFORMA.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        <div style={{ textAlign: 'left', background: '#f4f6fb', border: '2px solid #c8cee0', borderRadius: 6, padding: 12, marginBottom: 16 }}>
          <strong style={{ display: 'block', marginBottom: 6, textAlign: 'center' }}>Uma vida inteira</strong>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.7 }}>
            {percurso.map((e) => (
              <li key={e.modo}>
                <strong>{NOME_MODO[e.modo]}</strong>: {e.resumo}
                {e.passou ? '' : ' (por passar)'}
              </li>
            ))}
            {!percurso.some((e) => e.modo === 'reforma') && (
              <li>
                <strong>A Reforma</strong>: {s.semDinheiro ? 'as poupanças acabaram antes dos 85' : `chegou aos 85 com ${euros(poupancas(s))}`}
              </li>
            )}
          </ol>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5a6280' }}>
            Aos {s.projecao.idade} anos tinhas {euros(s.projecao.inicial)}. O tempo, a poupança e o juro composto fizeram o resto.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <GrowthChart history={s.history} unidade="Idade" />
        </div>

        <p style={{ color: '#7a8298', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
          Simulação educativa: rendimentos, pensões e preços simplificados. Os mercados reais não garantem nenhum rendimento. Obrigado por jogares a Vila Moeda!
        </p>

        <BotoesFim {...botoes} />
      </div>
    </div>
  )
}
