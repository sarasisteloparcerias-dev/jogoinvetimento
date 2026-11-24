import { lerPercurso } from '../game/gravar'
import { euros, patrimonioM } from '../game/mercado/economia'
import type { EstadoMercado } from '../game/mercado/tipos'
import { CONQUISTAS_NEGOCIO } from '../game/negocio/conquistas'
import { NEGOCIOS } from '../game/negocio/economia'
import { NOME_MODO } from '../game/niveis'
import { iconeCracha } from '../game/pixel/cenario'
import { framesAdolescente } from '../game/pixel/sprites'
import { BotoesFim, type PropsBotoesFim } from './BotoesFim'
import { GrowthChart } from './GrowthChart'
import { PixelImg, SpriteView } from './gba/ui'

interface FimNegocioProps extends PropsBotoesFim {
  state: EstadoMercado
}

/** Fim da última fase: as contas da empresa e o percurso todo, da Vila Moeda até aqui. */
export function FimNegocio({ state: s, ...botoes }: FimNegocioProps) {
  const n = s.negocio
  const percurso = lerPercurso().filter((e) => e.nome === s.name)
  let mensagem = 'A empresa não chegou a abrir.'
  if (n && !n.aberto) mensagem = 'A empresa fechou por falta de caixa. Acontece a muitas empresas: o importante é aprender com isso.'
  else if (n && n.lucroAno > 0 && n.mesesEmAtraso === 0) mensagem = 'Um ano com lucro e salários sempre em dia. Tens uma empresa saudável!'
  else if (n && n.lucroAno > 0) mensagem = 'O ano deu lucro, mas houve salários em atraso. Falta folga na caixa.'
  else if (n) mensagem = 'O primeiro ano deu prejuízo. É comum, mas convém perceber porquê: equipa, preços ou custos fixos?'

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 580, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={s.avatar} escala="4px" sprites={framesAdolescente} />
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>
          {n ? `${NEGOCIOS[n.tipo].nome} de ${s.name}` : `A empresa de ${s.name}`}
        </h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        {n && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, fontSize: 13 }}>
            <div className="caixa-valor">
              {n.lucroAno >= 0 ? 'Lucro do ano' : 'Prejuízo do ano'}
              <strong style={{ color: n.lucroAno >= 0 ? '#2a8a5a' : '#d04880', fontSize: 15 }}>{euros(Math.abs(n.lucroAno))}</strong>
            </div>
            <div className="caixa-valor">
              Caixa da empresa
              <strong style={{ color: n.caixa < 0 ? '#d04880' : '#c08a10', fontSize: 15 }}>{euros(n.caixa)}</strong>
            </div>
            <div className="caixa-valor">
              Empregos criados
              <strong style={{ color: '#4a7ad0', fontSize: 15 }}>{n.funcionarios.length}</strong>
            </div>
          </div>
        )}
        <p style={{ marginBottom: 12, fontSize: 12, color: '#5a6280' }}>
          Património pessoal (com a empresa): {euros(patrimonioM(s))}
          {n?.emprestimo ? ` · empréstimo da empresa por pagar: ${euros(n.emprestimo.divida)}` : ''}
        </p>

        <p style={{ marginBottom: 6 }}>
          Conquistas: {s.crachas.length} de {CONQUISTAS_NEGOCIO.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CONQUISTAS_NEGOCIO.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        {percurso.length > 0 && (
          <div style={{ textAlign: 'left', background: '#f4f6fb', border: '2px solid #c8cee0', borderRadius: 6, padding: 12, marginBottom: 16 }}>
            <strong style={{ display: 'block', marginBottom: 6, textAlign: 'center' }}>O teu percurso</strong>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.7 }}>
              {percurso.map((e) => (
                <li key={e.modo}>
                  <strong>{NOME_MODO[e.modo]}</strong>: {e.resumo}
                  {e.passou ? '' : ' (por passar)'}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <GrowthChart history={s.history} />
        </div>

        <p style={{ color: '#7a8298', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
          Simulação educativa: valores simplificados e entidades fictícias. Antes de abrir uma empresa a sério, fala com um contabilista certificado e informa-te sobre os apoios à criação de emprego.
        </p>

        <BotoesFim {...botoes} />
      </div>
    </div>
  )
}
