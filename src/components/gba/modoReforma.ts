import { iconeCracha } from '../../game/pixel/cenario'
import { framesAdolescente } from '../../game/pixel/sprites'
import { CONQUISTAS_REFORMA } from '../../game/reforma/conquistas'
import type { EstadoReforma } from '../../game/reforma/economia'
import { MAPAS_REFORMA } from '../../game/reforma/mapas'
import { executarInteracaoReforma, tutorialReforma } from '../../game/reforma/scripts'
import type { ModoJogo } from './modo'
import { MenuReforma } from './MenuReforma'

/** "A Reforma": de volta à Vila Moeda, 55 anos depois. */
export const MODO_REFORMA: ModoJogo<EstadoReforma> = {
  mapas: MAPAS_REFORMA,
  inicio: { mapa: 'casa', x: 7, y: 3, dir: 'down' },
  sprites: framesAdolescente,
  conquistas: CONQUISTAS_REFORMA,
  iconeConquista: iconeCracha,
  mentor: 'Mestre Moedas',
  tutorial: tutorialReforma,
  interagir: executarInteracaoReforma,
  Menu: MenuReforma,
  musica: 'reforma',
  dinheiro: (s) => s.conta + s.deposito + s.ppr + s.investido,
}
