import { CONQUISTAS_MERCADO } from '../../game/mercado/conquistas'
import { MAPAS_MERCADO } from '../../game/mercado/mapas'
import { executarInteracaoMercado, TRANSITO_MERCADO_SCRIPTS, tutorialMercado } from '../../game/mercado/scripts'
import type { EstadoMercado } from '../../game/mercado/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { framesAdulto } from '../../game/pixel/sprites'
import { ambienteDe, estacaoDoMes } from '../../game/world/ambiente'
import { HISTORIA_JOANA } from '../../game/historiasFases'
import type { ModoJogo } from './modo'
import { Painel } from './Painel'

export const MODO_MERCADO: ModoJogo<EstadoMercado> = {
  mapas: MAPAS_MERCADO,
  inicio: { mapa: 'casa', x: 7, y: 3, dir: 'down' },
  sprites: framesAdulto,
  conquistas: CONQUISTAS_MERCADO,
  iconeConquista: iconeCracha,
  mentor: 'Mestre Moedas',
  tutorial: tutorialMercado,
  interagir: executarInteracaoMercado,
  Menu: Painel,
  musica: 'mercado',
  historias: [HISTORIA_JOANA],
  ambiente: (s) => ambienteDe(estacaoDoMes(s.mes), s.mes),
  // investir não é gastar: conta-se o que se pagou pelos investimentos
  dinheiro: (s) => s.conta + s.poupanca + s.ppr - s.divida + Object.values(s.custo).reduce((a, b) => a + b, 0),
  transito: TRANSITO_MERCADO_SCRIPTS,
}
