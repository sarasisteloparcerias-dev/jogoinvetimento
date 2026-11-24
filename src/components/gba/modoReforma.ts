import { iconeCracha } from '../../game/pixel/cenario'
import { framesReforma } from '../../game/pixel/sprites'
import { CONQUISTAS_REFORMA } from '../../game/reforma/conquistas'
import type { EstadoReforma } from '../../game/reforma/economia'
import { MAPAS_REFORMA } from '../../game/reforma/mapas'
import { executarInteracaoReforma, tutorialReforma } from '../../game/reforma/scripts'
import { ambienteDe } from '../../game/world/ambiente'
import { HISTORIA_GRACA } from '../../game/historiasFases'
import type { ModoJogo } from './modo'
import { MenuReforma } from './MenuReforma'

/** "A Reforma": de volta à Vila Moeda, 55 anos depois. */
export const MODO_REFORMA: ModoJogo<EstadoReforma> = {
  mapas: MAPAS_REFORMA,
  inicio: { mapa: 'casa', x: 7, y: 3, dir: 'down' },
  sprites: framesReforma,
  conquistas: CONQUISTAS_REFORMA,
  iconeConquista: iconeCracha,
  mentor: 'Mestre Moedas',
  tutorial: tutorialReforma,
  interagir: executarInteracaoReforma,
  Menu: MenuReforma,
  musica: 'reforma',
  historias: [HISTORIA_GRACA],
  ambiente: (s) => ambienteDe((s.ano - 1) % 4, s.ano),
  dinheiro: (s) => s.conta + s.deposito + s.ppr + s.investido,
}
