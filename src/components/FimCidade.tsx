import { CONQUISTAS_CIDADE } from '../game/cidade/conquistas'
import { euros, META_VIAGEM, patrimonio, poupadoViagem, valorCarteira } from '../game/cidade/economia'
import type { EstadoCidade } from '../game/cidade/tipos'
import { iconeCracha } from '../game/pixel/cenario'
import { framesAdolescente } from '../game/pixel/sprites'
import { PixelImg, SpriteView } from './gba/ui'
import { GrowthChart } from './GrowthChart'

interface FimCidadeProps {
  state: EstadoCidade
  onReiniciar: () => void
}

export function FimCidade({ state: s, onReiniciar }: FimCidadeProps) {
  const total = patrimonio(s)
  const viagem = poupadoViagem(s) >= META_VIAGEM || s.crachas.includes('viagem')
  const media = (s.stats.relacoes + s.stats.saude + s.stats.educacao) / 3

  let mensagem = 'Um ano cheio de escolhas. Cada uma ensinou alguma coisa!'
  if (viagem && media >= 55) mensagem = 'Excelente! Juntaste o dinheiro da viagem sem esquecer a escola, a saúde e os amigos.'
  else if (viagem) mensagem = 'Conseguiste a viagem! Mas cuidado: o dinheiro não é tudo, a saúde e os amigos também contam.'
  else if (total < 100) mensagem = 'O dinheiro foi-se pelo caminho. Para o ano, experimenta guardar primeiro e gastar depois.'

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 560, width: '100%', padding: 24, textAlign: 'center' }}>
        <SpriteView avatar={s.avatar} escala="4px" sprites={framesAdolescente} />
        <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>Fim do ano letivo de {s.name}!</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{mensagem}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12, fontSize: 13 }}>
          <div className="caixa-valor">
            Património
            <strong style={{ color: '#c08a10' }}>{euros(total)}</strong>
          </div>
          <div className="caixa-valor">
            Poupança
            <strong style={{ color: '#d04880' }}>{euros(s.poupanca)}</strong>
          </div>
          <div className="caixa-valor">
            Investido
            <strong style={{ color: '#2a8a5a' }}>{euros(valorCarteira(s))}</strong>
          </div>
        </div>
        <p style={{ marginBottom: 12 }}>
          Viagem de Finalistas: <strong>{viagem ? 'CONSEGUIDA!' : `faltaram ${euros(Math.max(0, META_VIAGEM - poupadoViagem(s)))}`}</strong>
        </p>

        <p style={{ marginBottom: 6 }}>
          Conquistas: {s.crachas.length} de {CONQUISTAS_CIDADE.length}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {CONQUISTAS_CIDADE.map((c) => (
            <PixelImg key={c.id} src={iconeCracha(c.id, s.crachas.includes(c.id))} escala="3px" />
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <GrowthChart history={s.history} />
        </div>

        <p style={{ color: '#7a8298', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
          Simulação educativa: o dinheiro e as empresas são fictícios. Nada neste jogo é aconselhamento financeiro.
        </p>

        <button onClick={onReiniciar} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Jogar outra vez
        </button>
      </div>
    </div>
  )
}
